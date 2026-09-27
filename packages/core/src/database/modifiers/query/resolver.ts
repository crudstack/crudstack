import type { Entity } from "@/types/entity";
import type { FilterOperator, ParsedCondition, Query } from "./types";

/**
 * Resolves a complex, nested core Query object into a flat array of ParsedConditions.
 * This standardizes the query format, allowing adapters to iterate over a simple
 * list of conditions rather than parsing nested objects themselves.
 */
export function resolveQuery<T extends Entity>(
    query?: Query<T>,
): ParsedCondition[] {
    if (!query) return [];

    const conditions: ParsedCondition[] = [];

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;

        // 1. Handle top-level operators like { $eq: { userId: "123" } }
        if (key.startsWith("$")) {
            const operator = key as keyof FilterOperator<unknown>;
            const fieldsObj = value as Record<string, unknown>;

            for (const [field, fieldValue] of Object.entries(fieldsObj)) {
                if (fieldValue !== undefined) {
                    conditions.push({ field, operator, value: fieldValue });
                }
            }
        }
        // 2. Handle field-level conditions like { userId: "123" } or { userId: { $eq: "123" } }
        else {
            const field = key;
            const isOperatorObject =
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value) &&
                Object.keys(value).some((k) => k.startsWith("$"));

            if (isOperatorObject) {
                for (const [op, val] of Object.entries(
                    value as FilterOperator<unknown>,
                )) {
                    if (val !== undefined) {
                        conditions.push({ field, operator: op, value: val });
                    }
                }
            } else {
                // Implicit $eq for direct values
                conditions.push({ field, operator: "$eq", value });
            }
        }
    }

    return conditions;
}
