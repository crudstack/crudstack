import { describe, expect, it } from "vitest";

import {
    buildNativeConditions,
    QueryOperatorResolver,
    resolveQuery,
} from "@/database/modifiers/query";

describe("buildNativeConditions", () => {
    const mockResolver: QueryOperatorResolver<string> = {
        $eq: (field, val) => `${field} = ${val}`,
        $ne: (field, val) => `${field} != ${val}`,
        $gt: (field, val) => `${field} > ${val}`,
        $gte: (field, val) => `${field} >= ${val}`,
        $lt: (field, val) => `${field} < ${val}`,
        $lte: (field, val) => `${field} <= ${val}`,
        $in: (field, val) => `${field} IN (${(val as string[]).join(",")})`,
        $nin: (field, val) =>
            `${field} NOT IN (${(val as string[]).join(",")})`,
    };

    it("should build native conditions from parsed conditions", () => {
        const conditions = resolveQuery({
            age: { $gt: 18 },
            name: "John",
        } as any);
        const result = buildNativeConditions(conditions, mockResolver);

        expect(result).toEqual(["age > 18", "name = John"]);
    });

    it("should handle all operators", () => {
        const query = {
            age: { $gte: 18, $lte: 65 },
            status: { $in: ["active", "pending"] },
            role: { $nin: ["admin"] },
            name: { $ne: "John" },
        };
        const conditions = resolveQuery(query as any);
        const result = buildNativeConditions(conditions, mockResolver);

        expect(result).toContain("age >= 18");
        expect(result).toContain("age <= 65");
        expect(result).toContain("status IN (active,pending)");
        expect(result).toContain("role NOT IN (admin)");
        expect(result).toContain("name != John");
    });

    it("should throw error for unsupported operator", () => {
        const conditions = [{ field: "age", operator: "$unknown", value: 18 }];
        const incompleteResolver: any = { $eq: () => "eq" };

        expect(() =>
            buildNativeConditions(conditions, incompleteResolver),
        ).toThrow('Unsupported query operator: "$unknown"');
    });

    it("should return empty array for empty conditions", () => {
        const result = buildNativeConditions([], mockResolver);
        expect(result).toEqual([]);
    });
});
