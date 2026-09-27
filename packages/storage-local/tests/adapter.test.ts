import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { LocalStorageAdapter } from "@/adapter";

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
        it("should upload a Buffer and create metadata in storage.json", async () => {
            const fileBuffer = Buffer.from("test content");
            const result = await adapter.upload(fileBuffer, {
                folder: "docs",
                fileName: "test.txt",
            });

            expect(result.id).toBe("docs/test.txt");
            expect(result.name).toBe("test.txt");
            expect(result.size).toBe(12);
            expect(result.mimeType).toBe("text/plain");
            expect(result.url).toContain("test.txt");

            // Verify file exists on disk
            const fileContent = await readFile(
                join(testDir, "docs/test.txt"),
                "utf-8",
            );
            expect(fileContent).toBe("test content");

            // Verify central index exists and contains the record
            const indexContent = await readFile(
                join(testDir, "storage.json"),
                "utf-8",
            );
            const index = JSON.parse(indexContent);
            expect(index["docs/test.txt"]).toBeDefined();
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

            expect(result.name).toBe("test.txt");
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
            await adapter.upload(Buffer.from("data"), {
                fileName: "find-me.txt",
            });
            const result = await adapter.findById("find-me.txt");

            expect(result).not.toBeNull();
            expect(result?.name).toBe("find-me.txt");
        });

        it("should return null if the file does not exist", async () => {
            const result = await adapter.findById("non-existent.txt");
            expect(result).toBeNull();
        });
    });

    describe("find", () => {
        beforeEach(async () => {
            // Seed test data
            await adapter.upload(Buffer.from("data1"), {
                folder: "images",
                fileName: "a.png",
            });
            await adapter.upload(Buffer.from("data2"), {
                folder: "images",
                fileName: "b.jpg",
            });
            await adapter.upload(Buffer.from("data3"), {
                folder: "docs",
                fileName: "c.pdf",
            });
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

        it("should filter by prefix", async () => {
            const results = await adapter.find({ prefix: "a" });
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("a.png");
        });

        it("should filter by mimeType", async () => {
            const results = await adapter.find({ mimeType: "image/png" });
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe("a.png");
        });

        it("should apply limit", async () => {
            const results = await adapter.find({ limit: 2 });
            expect(results).toHaveLength(2);
        });
    });

    describe("delete", () => {
        it("should delete the file and remove it from the index", async () => {
            await adapter.upload(Buffer.from("data"), {
                fileName: "to-delete.txt",
            });

            await adapter.delete("to-delete.txt");

            // Verify it's gone from the index
            const result = await adapter.findById("to-delete.txt");
            expect(result).toBeNull();

            // Verify file is actually deleted from disk
            await expect(
                readFile(join(testDir, "to-delete.txt")),
            ).rejects.toThrow();
        });

        it("should silently succeed if the file does not exist", async () => {
            await expect(
                adapter.delete("non-existent.txt"),
            ).resolves.not.toThrow();
        });
    });

    describe("getSignedUrl", () => {
        it("should return a file:// URL", async () => {
            await adapter.upload(Buffer.from("data"), {
                fileName: "signed.txt",
            });
            const url = await adapter.getSignedUrl("signed.txt");

            expect(url).toMatch(/^file:\/\//);
            expect(url).toContain("signed.txt");
        });
    });
});
