import type { StorageFile, StorageUploadOptions, StorageQuery } from "./types";

/**
 * The strict contract that ALL storage adapters must implement.
 * Adapters are responsible for translating core storage operations into
 * native provider commands (e.g., AWS S3, Cloudinary, Local File System).
 */
export interface StorageAdapter {
    /**
     * Uploads a file to the storage provider.
     * @param file The file data (Buffer, Blob, File, or ReadableStream).
     * @param options Optional upload configurations.
     */
    upload(
        file: Buffer | Blob | File | NodeJS.ReadableStream,
        options?: StorageUploadOptions,
    ): Promise<StorageFile>;

    /**
     * Retrieves a single file by its unique identifier.
     */
    findById(id: string): Promise<StorageFile | null>;

    /**
     * Retrieves a list of files, optionally filtered by query criteria.
     */
    find(query?: StorageQuery): Promise<StorageFile[]>;

    /**
     * Deletes a file by its unique identifier.
     */
    delete(id: string): Promise<void>;

    /**
     * Generates a signed or presigned URL for secure, temporary access to a private file.
     * @param id The unique identifier of the file.
     * @param expiresIn Time in seconds until the URL expires.
     */
    getSignedUrl(id: string, expiresIn?: number): Promise<string>;
}
