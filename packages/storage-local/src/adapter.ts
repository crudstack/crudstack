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

    private async ensureDirectory(): Promise<void> {
        await mkdir(this.baseDirectory, { recursive: true });
    }

    private async readIndex(): Promise<Record<string, StorageFile>> {
        await this.ensureDirectory();
        try {
            const data = await readFile(this.indexPath, "utf-8");
            return JSON.parse(data);
        } catch {
            return {};
        }
    }

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

        // 1. FORCE UUID FILENAME: Prevents spaces, special characters, and collisions
        const fileName = `${fileId}${ext}`;

        const relativePath = options?.folder
            ? `${options.folder}/${fileName}`
            : fileName;

        const fullPath = join(this.baseDirectory, relativePath);
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

        await writeFile(fullPath, buffer);

        // 2. GENERATE CLEAN WEB URL: Always starts with /uploads/ and uses forward slashes
        const webUrl = `/uploads/${relativePath.replace(/\\/g, "/")}`;

        const metadata: StorageFile = {
            id: relativePath,
            name: fileName,
            url: webUrl, // This will now be like: /uploads/projects/123/uuid.png
            size: buffer.length,
            mimeType:
                (options?.metadata?.mimeType as string) ||
                this.getMimeType(ext),
            createdAt: new Date().toISOString(),
            metadata: options?.metadata,
        };

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

        if (query?.folder) {
            results = results.filter(
                (f) =>
                    f.id.startsWith(`${query.folder}/`) ||
                    dirname(f.id) === query.folder,
            );
        }
        if (query?.prefix) {
            results = results.filter((f) => f.name.startsWith(query.prefix!));
        }
        if (query?.mimeType) {
            results = results.filter((f) => f.mimeType === query.mimeType);
        }
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
            try {
                await unlink(fullPath);
            } catch {
                // Ignore if already deleted
            }
            delete index[id];
            await this.writeIndex(index);
        }
    }

    public async getSignedUrl(
        id: string,
        _expiresIn?: number,
    ): Promise<string> {
        // For local public files, the signed URL is just the public web path
        return `/uploads/${id.replace(/\\/g, "/")}`;
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
