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

    for (const [field, condition] of Object.entries(query)) {
        if (condition === undefined) continue;

        const isOperatorObject =
            typeof condition === "object" &&
            condition !== null &&
            !Array.isArray(condition) &&
            Object.keys(condition).some((k) => k.startsWith("$"));

        if (isOperatorObject) {
            for (const [op, val] of Object.entries(
                condition as FilterOperator<unknown>,
            )) {
                if (val !== undefined) {
                    conditions.push({ field, operator: op, value: val });
                }
            }
        } else {
            // Implicit $eq for direct values
            conditions.push({ field, operator: "$eq", value: condition });
        }
    }

    return conditions;
}
