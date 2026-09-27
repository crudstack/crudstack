import type { Entity } from "@/types/entity";

/**
 * Base type for a stored file entity.
 * Extends the core Entity type to ensure a consistent string identifier.
 */
export interface StorageFile extends Entity {
    name: string;
    url: string;
    size: number;
    mimeType: string;
    createdAt: string; // ISO 8601 string for safe serialization across boundaries
    metadata?: Record<string, unknown>;
}

/**
 * Options for uploading a file.
 */
export interface StorageUploadOptions {
    folder?: string;
    fileName?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Query options for finding files.
 * Adapts to common storage listing capabilities such as prefixes and pagination.
 */
export interface StorageQuery {
    folder?: string;
    prefix?: string;
    mimeType?: string;
    limit?: number;
    cursor?: string; // For pagination (e.g., S3 ContinuationToken)
    [key: string]: unknown;
}
