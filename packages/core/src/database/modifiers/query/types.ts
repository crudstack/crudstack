import type { Entity } from "@/types/entity";

/**
 * Supported filter operators for querying records.
 */
export type FilterOperator<T> = {
    $eq?: T;
    $ne?: T;
    $gt?: T;
    $gte?: T;
    $lt?: T;
    $lte?: T;
    $in?: T[];
    $nin?: T[];
};

/**
 * A type-safe where clause. Allows both direct values (implicit $eq)
 * and explicit operator objects (e.g., { age: { $gt: 18 } }).
 */
export type WhereClause<T extends Entity> = {
    [K in keyof T]?: T[K] | FilterOperator<T[K]>;
};

/**
 * The core Query type used across all adapters.
 */
export type Query<T extends Entity> = WhereClause<T>;

/**
 * A flattened, standardized representation of a single query condition.
 * This is the intermediate representation used by adapters to build native queries.
 */
export interface ParsedCondition {
    field: string;
    operator: string;
    value: unknown;
}
