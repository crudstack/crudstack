import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DatabaseAdapter } from "@/database";
import { ResourceImpl } from "@/database/resources";
import type { Entity } from "@/types/entity";

type User = Entity & { name: string; age: number };

describe("ResourceImpl", () => {
    let mockAdapter: DatabaseAdapter;
    let resource: ResourceImpl<User>;

    beforeEach(() => {
        mockAdapter = {
            getOne: vi.fn(),
            getList: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        };
        resource = new ResourceImpl<User>("users", mockAdapter);
    });

    describe("getOne", () => {
        it("should delegate to adapter with correct arguments", async () => {
            const query = { name: "John" };
            const mockUser = { id: "1", name: "John", age: 25 };
            vi.mocked(mockAdapter.getOne).mockResolvedValue(mockUser);

            const result = await resource.getOne(query);

            expect(mockAdapter.getOne).toHaveBeenCalledWith(
                "users",
                query,
                undefined,
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe("getList", () => {
        it("should delegate to adapter with query", async () => {
            const query = { age: { $gt: 18 } };
            const mockUsers = [{ id: "1", name: "John", age: 25 }];
            vi.mocked(mockAdapter.getList).mockResolvedValue(mockUsers);

            const result = await resource.getList(query);

            expect(mockAdapter.getList).toHaveBeenCalledWith(
                "users",
                query,
                undefined,
            );
            expect(result).toEqual(mockUsers);
        });

        it("should delegate to adapter without query", async () => {
            const mockUsers = [{ id: "1", name: "John", age: 25 }];
            vi.mocked(mockAdapter.getList).mockResolvedValue(mockUsers);

            const result = await resource.getList();

            expect(mockAdapter.getList).toHaveBeenCalledWith(
                "users",
                undefined,
                undefined,
            );
            expect(result).toEqual(mockUsers);
        });
    });

    describe("create", () => {
        it("should delegate to adapter with correct arguments", async () => {
            const data = { name: "John", age: 25 };
            const mockUser = { id: "1", ...data };
            vi.mocked(mockAdapter.create).mockResolvedValue(mockUser);

            const result = await resource.create(data);

            expect(mockAdapter.create).toHaveBeenCalledWith(
                "users",
                data,
                undefined,
            );
            expect(result).toEqual(mockUser);
        });
    });

    describe("update", () => {
        it("should delegate to adapter with query and data", async () => {
            const query = { name: "John" };
            const data = { age: 26 };
            const mockUsers = [{ id: "1", name: "John", age: 26 }];
            vi.mocked(mockAdapter.update).mockResolvedValue(mockUsers);

            const result = await resource.update(query, data);

            expect(mockAdapter.update).toHaveBeenCalledWith(
                "users",
                query,
                data,
                undefined,
            );
            expect(result).toEqual(mockUsers);
        });
    });

    describe("delete", () => {
        it("should delegate to adapter with query", async () => {
            const query = { name: "John" };
            vi.mocked(mockAdapter.delete).mockResolvedValue(undefined);

            await resource.delete(query);

            expect(mockAdapter.delete).toHaveBeenCalledWith(
                "users",
                query,
                undefined,
            );
        });
    });

    describe("with schema", () => {
        it("should pass schema to all adapter methods", async () => {
            const mockSchema = { type: "users" };
            const resourceWithSchema = new ResourceImpl<User>(
                "users",
                mockAdapter,
                mockSchema,
            );

            await resourceWithSchema.getOne({ name: "John" });
            await resourceWithSchema.getList();
            await resourceWithSchema.create({ name: "John", age: 25 });
            await resourceWithSchema.update({ name: "John" }, { age: 26 });
            await resourceWithSchema.delete({ name: "John" });

            expect(mockAdapter.getOne).toHaveBeenCalledWith(
                "users",
                { name: "John" },
                mockSchema,
            );
            expect(mockAdapter.getList).toHaveBeenCalledWith(
                "users",
                undefined,
                mockSchema,
            );
            expect(mockAdapter.create).toHaveBeenCalledWith(
                "users",
                { name: "John", age: 25 },
                mockSchema,
            );
            expect(mockAdapter.update).toHaveBeenCalledWith(
                "users",
                { name: "John" },
                { age: 26 },
                mockSchema,
            );
            expect(mockAdapter.delete).toHaveBeenCalledWith(
                "users",
                { name: "John" },
                mockSchema,
            );
        });
    });
});
