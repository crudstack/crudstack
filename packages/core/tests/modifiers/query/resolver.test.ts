import { describe, expect, it } from "vitest";

import { resolveQuery } from "@/database/modifiers/query";

describe("resolveQuery", () => {
    it("should return empty array for undefined query", () => {
        const result = resolveQuery(undefined);
        expect(result).toEqual([]);
    });

    it("should resolve implicit $eq for simple values", () => {
        const query = { name: "John", age: 25 };
        const result = resolveQuery(query as any);

        expect(result).toEqual([
            { field: "name", operator: "$eq", value: "John" },
            { field: "age", operator: "$eq", value: 25 },
        ]);
    });

    it("should resolve explicit operators", () => {
        const query = { age: { $gt: 18, $lt: 65 } };
        const result = resolveQuery(query as any);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
            field: "age",
            operator: "$gt",
            value: 18,
        });
        expect(result).toContainEqual({
            field: "age",
            operator: "$lt",
            value: 65,
        });
    });

    it("should handle mixed implicit and explicit operators", () => {
        const query = { name: "John", age: { $gte: 18 } };
        const result = resolveQuery(query as any);

        expect(result).toHaveLength(2);
        expect(result).toContainEqual({
            field: "name",
            operator: "$eq",
            value: "John",
        });
        expect(result).toContainEqual({
            field: "age",
            operator: "$gte",
            value: 18,
        });
    });

    it("should ignore undefined values", () => {
        const query = { name: "John", email: undefined };
        const result = resolveQuery(query as any);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            field: "name",
            operator: "$eq",
            value: "John",
        });
    });

    it("should handle $in operator", () => {
        const query = { status: { $in: ["active", "pending"] } };
        const result = resolveQuery(query as any);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            field: "status",
            operator: "$in",
            value: ["active", "pending"],
        });
    });

    it("should handle multiple fields with multiple operators", () => {
        const query = {
            age: { $gt: 18, $lt: 65 },
            status: { $in: ["active"] },
            name: "John",
        };
        const result = resolveQuery(query as any);

        expect(result).toHaveLength(4);
    });
});
