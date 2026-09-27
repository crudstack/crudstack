import type { ParsedCondition } from "./types";

/**
 * The strict contract that EVERY database adapter must implement.
 * It forces the adapter to define how to translate every core operator
 * into its native query language (e.g., SQL, GROQ, Firestore rules).
 *
 * If an adapter misses an operator, TypeScript will throw a compilation error.
 */
export interface QueryOperatorResolver<TNativeCondition = unknown> {
    $eq: (field: string, value: unknown) => TNativeCondition;
    $ne: (field: string, value: unknown) => TNativeCondition;
    $gt: (field: string, value: unknown) => TNativeCondition;
    $gte: (field: string, value: unknown) => TNativeCondition;
    $lt: (field: string, value: unknown) => TNativeCondition;
    $lte: (field: string, value: unknown) => TNativeCondition;
    $in: (field: string, value: unknown) => TNativeCondition;
    $nin: (field: string, value: unknown) => TNativeCondition;
}

/**
 * Converts an array of ParsedConditions into native database conditions
 * using the adapter's specific QueryOperatorResolver.
 */
export function buildNativeConditions<TNative>(
    conditions: ParsedCondition[],
    resolver: QueryOperatorResolver<TNative>,
): TNative[] {
    return conditions.map((cond) => {
        const handler =
            resolver[cond.operator as keyof QueryOperatorResolver<TNative>];

        if (!handler) {
            throw new Error(
                `Unsupported query operator: "${cond.operator}". The adapter resolver must implement this operator.`,
            );
        }

        return handler(cond.field, cond.value);
    });
}
