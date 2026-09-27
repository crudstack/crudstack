import type { DatabaseAdapter } from "@/database";
import type { StorageAdapter } from "@/storage";
import { Resource, ResourceImpl } from "@/database/resources";
import type { Entity } from "@/types/entity";

/**
 * Configuration required to initialize a CrudStack instance.
 */
export interface CrudStackConfig {
    database?: DatabaseAdapter;
    storage?: StorageAdapter;
}

/**
 * The main entry point for the Crudstack library.
 * Acts as an orchestrator, holding the database and/or storage adapters and providing
 * a factory for creating type-safe resource instances.
 */
export class CrudStack {
    private readonly db?: DatabaseAdapter;
    private readonly storage?: StorageAdapter;

    constructor(config: CrudStackConfig) {
        this.db = config.database;
        this.storage = config.storage;
    }

    /**
     * Creates a type-safe resource instance for CRUD operations.
     */
    public createResource<T extends Entity>(
        name: string,
        schema?: unknown,
    ): Resource<T> {
        if (!this.db) {
            throw new Error("Database adapter is not configured in CrudStack.");
        }
        return new ResourceImpl<T>(name, this.db, schema);
    }

    /**
     * Alias for `createResource` to provide a cleaner, more concise API.
     */
    public resource<T extends Entity>(
        name: string,
        schema?: unknown,
    ): Resource<T> {
        return this.createResource<T>(name, schema);
    }

    /**
     * Access the storage adapter for file operations.
     */
    public getStorage(): StorageAdapter {
        if (!this.storage) {
            throw new Error("Storage adapter is not configured in CrudStack.");
        }
        return this.storage;
    }
}
