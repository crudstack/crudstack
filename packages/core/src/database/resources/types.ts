import type { Query } from "@/database/modifiers/query";
import type { Entity } from "@/types/entity";

/**
 * The public, type-safe API returned by the CrudStack resource factory.
 * This is the interface developers interact with in their application code.
 */
export interface Resource<T extends Entity> {
    getOne(query: Query<T>): Promise<T>;
    getList(query?: Query<T>): Promise<T[]>;
    create(data: Omit<T, "id">): Promise<T>;
    update(query: Query<T>, data: Partial<Omit<T, "id">>): Promise<T[]>;
    delete(query: Query<T>): Promise<void>;
}
