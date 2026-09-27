import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import type {
    StorageAdapter,
    StorageFile,
    StorageUploadOptions,
    StorageQuery,
} from "@crudstack/core";

const INDEX_FILE = "storage.json";

export class LocalStorageAdapter implements StorageAdapter {
    private readonly indexPath: string;

    constructor(private readonly baseDirectory: string) {
        this.indexPath = join(this.baseDirectory, INDEX_FILE);
    }

    /**
     * Ensures the base directory exists before any operation.
     */
    private async ensureDirectory(): Promise<void> {
        await mkdir(this.baseDirectory, { recursive: true });
    }

    /**
     * Reads the central metadata index file.
     */
    private async readIndex(): Promise<Record<string, StorageFile>> {
        await this.ensureDirectory();
        try {
            const data = await readFile(this.indexPath, "utf-8");
            return JSON.parse(data);
        } catch {
            // If the file doesn't exist or is corrupted, start with an empty index
            return {};
        }
    }

    /**
     * Writes the central metadata index file.
     */
    private async writeIndex(
        index: Record<string, StorageFile>,
    ): Promise<void> {
        await this.ensureDirectory();
        await writeFile(
            this.indexPath,
            JSON.stringify(index, null, 2),
            "utf-8",
        );
    }

    public async upload(
        file: Buffer | Blob | File | NodeJS.ReadableStream,
        options?: StorageUploadOptions,
    ): Promise<StorageFile> {
        await this.ensureDirectory();

        const fileId = randomUUID();
        const originalName = options?.fileName || "upload.bin";
        const ext = extname(originalName) || ".bin";
        const fileName = options?.fileName || `${fileId}${ext}`;

        const relativePath = options?.folder
            ? `${options.folder}/${fileName}`
            : fileName;

        const fullPath = join(this.baseDirectory, relativePath);

        // Ensure the specific folder for this file exists
        await mkdir(dirname(fullPath), { recursive: true });

        let buffer: Buffer;
        if (file instanceof Buffer) {
            buffer = file;
        } else if (
            file instanceof Blob ||
            (typeof File !== "undefined" && file instanceof File)
        ) {
            buffer = Buffer.from(await (file as Blob).arrayBuffer());
        } else {
            throw new Error(
                "Unsupported file type. Please provide a Buffer, Blob, or File.",
            );
        }

        // Write the actual file to disk
        await writeFile(fullPath, buffer);

        const metadata: StorageFile = {
            id: relativePath,
            name: fileName,
            url: `file://${fullPath}`,
            size: buffer.length,
            mimeType:
                (options?.metadata?.mimeType as string) ||
                this.getMimeType(ext),
            createdAt: new Date().toISOString(),
            metadata: options?.metadata,
        };

        // Update the central index
        const index = await this.readIndex();
        index[relativePath] = metadata;
        await this.writeIndex(index);

        return metadata;
    }

    public async findById(id: string): Promise<StorageFile | null> {
        const index = await this.readIndex();
        return index[id] || null;
    }

    public async find(query?: StorageQuery): Promise<StorageFile[]> {
        const index = await this.readIndex();
        let results = Object.values(index);

        // Filter by folder (checks if the relative path starts with the folder)
        if (query?.folder) {
            results = results.filter(
                (f) =>
                    f.id.startsWith(`${query.folder}/`) ||
                    dirname(f.id) === query.folder,
            );
        }

        // Filter by prefix (checks the file name)
        if (query?.prefix) {
            results = results.filter((f) => f.name.startsWith(query.prefix!));
        }

        // Filter by MIME type
        if (query?.mimeType) {
            results = results.filter((f) => f.mimeType === query.mimeType);
        }

        // Apply limit
        if (query?.limit) {
            results = results.slice(0, query.limit);
        }

        return results;
    }

    public async delete(id: string): Promise<void> {
        const index = await this.readIndex();
        const metadata = index[id];

        if (metadata) {
            const fullPath = join(this.baseDirectory, id);

            // Delete the actual file
            try {
                await unlink(fullPath);
            } catch {
                // File might already be deleted manually, ignore
            }

            // Remove from the central index
            delete index[id];
            await this.writeIndex(index);
        }
    }

    public async getSignedUrl(
        id: string,
        _expiresIn?: number,
    ): Promise<string> {
        const fullPath = join(this.baseDirectory, id);
        return `file://${fullPath}`;
    }

    private getMimeType(ext: string): string {
        const mimeTypes: Record<string, string> = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
            ".pdf": "application/pdf",
            ".txt": "text/plain",
            ".json": "application/json",
            ".csv": "text/csv",
            ".zip": "application/zip",
        };
        return mimeTypes[ext.toLowerCase()] || "application/octet-stream";
    }
}
