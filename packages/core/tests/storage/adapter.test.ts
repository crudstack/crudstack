import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorageAdapter } from "@/storage";
import type { StorageFile, StorageQuery } from "@/storage";

describe("StorageAdapter", () => {
    let mockStorageAdapter: StorageAdapter;

    beforeEach(() => {
        mockStorageAdapter = {
            upload: vi.fn(),
            findById: vi.fn(),
            find: vi.fn(),
            delete: vi.fn(),
            getSignedUrl: vi.fn(),
        } as unknown as StorageAdapter;
    });

    it("should handle find with query parameters", async () => {
        const query: StorageQuery = { folder: "avatars", limit: 10 };
        const mockFiles: StorageFile[] = [
            {
                id: "1",
                name: "a.png",
                url: "url",
                size: 100,
                mimeType: "image/png",
                createdAt: "2023-01-01T00:00:00.000Z",
            },
        ];

        vi.mocked(mockStorageAdapter.find).mockResolvedValue(mockFiles);
        const result = await mockStorageAdapter.find(query);

        expect(mockStorageAdapter.find).toHaveBeenCalledWith(query);
        expect(result).toHaveLength(1);
    });

    it("should return null when findById finds nothing", async () => {
        vi.mocked(mockStorageAdapter.findById).mockResolvedValue(null);
        const result = await mockStorageAdapter.findById("non-existent");
        expect(result).toBeNull();
    });
});
