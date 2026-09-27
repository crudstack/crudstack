import type { DatabaseAdapter } from "@/database";
import type { Query } from "@/database/modifiers/query";
import type { Entity } from "@/types/entity";

import type { Resource } from "./types";

/**
 * Internal implementation of the Resource interface.
 * Delegates all CRUD operations to the underlying DatabaseAdapter,
 * passing along the resource name and optional schema.
 */
export class ResourceImpl<T extends Entity> implements Resource<T> {
    constructor(
        private readonly resourceName: string,
        private readonly adapter: DatabaseAdapter,
        private readonly schema?: unknown,
    ) {}

    public getOne(query: Query<T>): Promise<T> {
        return this.adapter.getOne<T>(this.resourceName, query, this.schema);
    }

    public getList(query?: Query<T>): Promise<T[]> {
        return this.adapter.getList<T>(this.resourceName, query, this.schema);
    }

    public create(data: Omit<T, "id">): Promise<T> {
        return this.adapter.create<T>(this.resourceName, data, this.schema);
    }

    public update(query: Query<T>, data: Partial<Omit<T, "id">>): Promise<T[]> {
        return this.adapter.update<T>(
            this.resourceName,
            query,
            data,
            this.schema,
        );
    }

    public delete(query: Query<T>): Promise<void> {
        return this.adapter.delete(this.resourceName, query, this.schema);
    }
}
