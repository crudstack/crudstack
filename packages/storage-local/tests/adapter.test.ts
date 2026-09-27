import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { LocalStorageAdapter } from "../src/adapter";

describe("LocalStorageAdapter", () => {
    let adapter: LocalStorageAdapter;
    let testDir: string;

    beforeEach(async () => {
        // Create a unique temporary directory for each test run to ensure isolation
        testDir = join(tmpdir(), `crudstack-local-test-${randomUUID()}`);
        adapter = new LocalStorageAdapter(testDir);
    });

    afterEach(async () => {
        // Clean up the temporary directory and all its contents after each test
        await rm(testDir, { recursive: true, force: true });
    });

    describe("upload", () => {
        it("should upload a Buffer and create metadata in storage.json with a UUID filename", async () => {
            const fileBuffer = Buffer.from("test content");
            const result = await adapter.upload(fileBuffer, {
                folder: "docs",
                fileName: "test.txt", // Adapter will ignore "test.txt" and use UUID
            });

            // Verify ID and Name use UUID
            expect(result.id).toMatch(
                /^docs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/,
            );
            expect(result.name).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/,
            );
            expect(result.size).toBe(12);
            expect(result.mimeType).toBe("text/plain");
            expect(result.url).toMatch(/^\/uploads\/docs\/[0-9a-f]{8}-/);

            // Verify file exists on disk (we use result.id to find the actual UUID filename)
            const fileContent = await readFile(
                join(testDir, result.id),
                "utf-8",
            );
            expect(fileContent).toBe("test content");

            // Verify central index exists and contains the record
            const indexContent = await readFile(
                join(testDir, "storage.json"),
                "utf-8",
            );
            const index = JSON.parse(indexContent);
            expect(index[result.id]).toBeDefined();
        });

        it("should generate a UUID filename if not provided", async () => {
            const fileBuffer = Buffer.from("test content");
            const result = await adapter.upload(fileBuffer);

            expect(result.id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.bin$/,
            );
            expect(result.name).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.bin$/,
            );
            expect(result.mimeType).toBe("application/octet-stream");
        });

        it("should upload a Blob successfully", async () => {
            const blob = new Blob(["blob content"], { type: "text/html" });
            const result = await adapter.upload(blob, { fileName: "test.txt" });

            expect(result.name).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.txt$/,
            );
            expect(result.size).toBe(12);
            expect(result.mimeType).toBe("text/plain");
        });

        it("should throw an error for unsupported file types", async () => {
            await expect(
                adapter.upload("invalid string" as any),
            ).rejects.toThrow(
                "Unsupported file type. Please provide a Buffer, Blob, or File.",
            );
        });
    });

    describe("findById", () => {
        it("should return the file metadata if it exists", async () => {
            // Capture the dynamically generated ID
            const uploadResult = await adapter.upload(Buffer.from("data"), {
                fileName: "find-me.txt",
            });

            const result = await adapter.findById(uploadResult.id);

            expect(result).not.toBeNull();
            expect(result?.name).toBe(uploadResult.name);
        });

        it("should return null if the file does not exist", async () => {
            const result = await adapter.findById("non-existent.txt");
            expect(result).toBeNull();
        });
    });

    describe("find", () => {
        let pngId: string;
        let jpgId: string;
        let pdfId: string;

        beforeEach(async () => {
            // Seed test data and capture the generated UUID IDs
            const res1 = await adapter.upload(Buffer.from("data1"), {
                folder: "images",
                fileName: "a.png",
            });
            pngId = res1.id;

            const res2 = await adapter.upload(Buffer.from("data2"), {
                folder: "images",
                fileName: "b.jpg",
            });
            jpgId = res2.id;

            const res3 = await adapter.upload(Buffer.from("data3"), {
                folder: "docs",
                fileName: "c.pdf",
            });
            pdfId = res3.id;
        });

        it("should return all files when no query is provided", async () => {
            const results = await adapter.find();
            expect(results).toHaveLength(3);
        });

        it("should filter by folder", async () => {
            const results = await adapter.find({ folder: "images" });
            expect(results).toHaveLength(2);
            expect(results.every((f) => f.id.startsWith("images/"))).toBe(true);
        });

        it("should filter by mimeType", async () => {
            const results = await adapter.find({ mimeType: "image/png" });
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe(pngId);
        });

        it("should apply limit", async () => {
            const results = await adapter.find({ limit: 2 });
            expect(results).toHaveLength(2);
        });
    });

    describe("delete", () => {
        it("should delete the file and remove it from the index", async () => {
            const uploadResult = await adapter.upload(Buffer.from("data"), {
                fileName: "to-delete.txt",
            });

            await adapter.delete(uploadResult.id);

            // Verify it's gone from the index
            const result = await adapter.findById(uploadResult.id);
            expect(result).toBeNull();

            // Verify file is actually deleted from disk
            await expect(
                readFile(join(testDir, uploadResult.id)),
            ).rejects.toThrow();
        });

        it("should silently succeed if the file does not exist", async () => {
            await expect(
                adapter.delete("non-existent.txt"),
            ).resolves.not.toThrow();
        });
    });

    describe("getSignedUrl", () => {
        it("should return a web-accessible /uploads/ URL", async () => {
            const uploadResult = await adapter.upload(Buffer.from("data"), {
                fileName: "signed.txt",
            });

            const url = await adapter.getSignedUrl(uploadResult.id);

            // Updated to expect the new Next.js public folder URL format
            expect(url).toMatch(/^\/uploads\//);
            expect(url).toContain(uploadResult.id.replace(/\\/g, "/"));
        });
    });
});
