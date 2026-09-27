import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DatabaseAdapter } from "@/database";
import type { StorageAdapter } from "@/storage";
import { CrudStack } from "@/crudstack";
import type { Entity } from "@/types/entity";

type User = Entity & { name: string; age: number };

describe("CrudStack", () => {
    let mockDbAdapter: DatabaseAdapter;
    let mockStorageAdapter: StorageAdapter;
    let crudstack: CrudStack;

    beforeEach(() => {
        mockDbAdapter = {
            getOne: vi.fn(),
            getList: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        } as unknown as DatabaseAdapter;

        mockStorageAdapter = {
            upload: vi.fn(),
            findById: vi.fn(),
            find: vi.fn(),
            delete: vi.fn(),
            getSignedUrl: vi.fn(),
        } as unknown as StorageAdapter;

        crudstack = new CrudStack({
            database: mockDbAdapter,
            storage: mockStorageAdapter,
        });
    });

    describe("Initialization", () => {
        it("should throw an error if database adapter is missing", () => {
            const stackWithoutDb = new CrudStack({
                storage: mockStorageAdapter,
            });
            expect(() => stackWithoutDb.createResource<User>("users")).toThrow(
                "Database adapter is not configured in CrudStack.",
            );
        });

        it("should throw an error if storage adapter is missing", () => {
            const stackWithoutStorage = new CrudStack({
                database: mockDbAdapter,
            });
            expect(() => stackWithoutStorage.getStorage()).toThrow(
                "Storage adapter is not configured in CrudStack.",
            );
        });
    });

    describe("Integration", () => {
        it("should allow full CRUD workflow", async () => {
            const users = crudstack.createResource<User>("users");

            const newUser = { name: "John", age: 25 };
            vi.mocked(mockDbAdapter.create).mockResolvedValue({
                id: "1",
                ...newUser,
            } as User);
            const created = await users.create(newUser);
            expect(created.id).toBe("1");

            vi.mocked(mockDbAdapter.getOne).mockResolvedValue(created);
            const found = await users.getOne({ name: "John" });
            expect(found.name).toBe("John");

            vi.mocked(mockDbAdapter.update).mockResolvedValue([
                { ...created, age: 26 },
            ] as User[]);
            const updated = await users.update({ name: "John" }, { age: 26 });
            expect(updated[0].age).toBe(26);

            vi.mocked(mockDbAdapter.delete).mockResolvedValue(undefined);
            await users.delete({ name: "John" });
            expect(mockDbAdapter.delete).toHaveBeenCalledWith(
                "users",
                { name: "John" },
                undefined,
            );
        });

        it("should allow full Storage workflow", async () => {
            const storage = crudstack.getStorage();
            const mockFile = new Blob(["test"], {
                type: "text/plain",
            }) as unknown as File;

            const mockStorageFile = {
                id: "file-1",
                name: "test.txt",
                url: "http://example.com/test.txt",
                size: 100,
                mimeType: "text/plain",
                createdAt: "2023-01-01T00:00:00.000Z",
            };

            vi.mocked(mockStorageAdapter.upload).mockResolvedValue(
                mockStorageFile,
            );
            const uploaded = await storage.upload(mockFile, { folder: "docs" });
            expect(uploaded.id).toBe("file-1");

            vi.mocked(mockStorageAdapter.findById).mockResolvedValue(
                mockStorageFile,
            );
            const found = await storage.findById("file-1");
            expect(found?.name).toBe("test.txt");

            vi.mocked(mockStorageAdapter.getSignedUrl).mockResolvedValue(
                "http://signed.url",
            );
            const signedUrl = await storage.getSignedUrl("file-1", 3600);
            expect(signedUrl).toBe("http://signed.url");

            vi.mocked(mockStorageAdapter.delete).mockResolvedValue(undefined);
            await storage.delete("file-1");
            expect(mockStorageAdapter.delete).toHaveBeenCalledWith("file-1");
        });
    });
});
