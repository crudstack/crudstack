import type { DatabaseAdapter, Entity, Query } from "@crudstack/core";
import { buildNativeConditions, resolveQuery } from "@crudstack/core";
import { and } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

import { createSQLiteResolver } from "@/modifiers/query/resolver";

export class SQLiteDatabaseAdapter implements DatabaseAdapter {
    // NOTE: We must use 'any' here solely to bypass a known Drizzle ORM TypeScript bug
    // where 'BetterSQLite3Database' has a private property ('resultKind') that makes
    // its generic type invariant. This does NOT compromise data safety, which is
    // strictly enforced below using Drizzle's `$inferInsert`.
    private readonly db: any;

    constructor(db: any) {
        this.db = db;
    }

    private buildWhere<T extends Entity>(table: SQLiteTable, query?: Query<T>) {
        const resolver = createSQLiteResolver(table);
        const parsedConditions = resolveQuery(query);
        const nativeConditions = buildNativeConditions(
            parsedConditions,
            resolver,
        );

        return nativeConditions.length > 0
            ? and(...nativeConditions)
            : undefined;
    }

    async getOne<T extends Entity>(
        _resource: string,
        query: Query<T>,
        schema?: unknown,
    ): Promise<T> {
        const table = schema as SQLiteTable;
        const where = this.buildWhere(table, query);

        const result = await this.db.select().from(table).where(where).limit(1);
        if (!result[0]) throw new Error(`Record not found`);
        return result[0] as unknown as T;
    }

    async getList<T extends Entity>(
        _resource: string,
        query?: Query<T>,
        schema?: unknown,
    ): Promise<T[]> {
        const table = schema as SQLiteTable;
        const where = this.buildWhere(table, query);

        const result = await this.db.select().from(table).where(where);
        return result as unknown as T[];
    }

    async create<T extends Entity>(
        _resource: string,
        data: Omit<T, "id">,
        schema?: unknown,
    ): Promise<T> {
        const table = schema as SQLiteTable;

        // STRICT TYPING: Use Drizzle's $inferInsert to completely avoid 'any'
        type InsertType = typeof table.$inferInsert;

        const result = await this.db
            .insert(table)
            .values(data as InsertType)
            .returning();
        return result[0] as unknown as T;
    }

    async update<T extends Entity>(
        _resource: string,
        query: Query<T>,
        data: Partial<Omit<T, "id">>,
        schema?: unknown,
    ): Promise<T[]> {
        const table = schema as SQLiteTable;
        const where = this.buildWhere(table, query);

        // STRICT TYPING: Use Drizzle's $inferInsert to completely avoid 'any'
        type InsertType = typeof table.$inferInsert;

        const result = await this.db
            .update(table)
            .set(data as Partial<InsertType>)
            .where(where)
            .returning();
        return result as unknown as T[];
    }

    async delete<T extends Entity>(
        _resource: string,
        query: Query<T>,
        schema?: unknown,
    ): Promise<void> {
        const table = schema as SQLiteTable;
        const where = this.buildWhere(table, query);

        await this.db.delete(table).where(where);
    }
}
