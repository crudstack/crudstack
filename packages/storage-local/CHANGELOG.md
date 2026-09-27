# @crudstack/storage-local

## 0.1.0

### Minor Changes

- Enforce UUID filenames on upload to prevent issues with spaces and special characters in file names.
- Updated `url` generation to return clean, web-accessible `/uploads/...` paths, ensuring seamless integration with Next.js public directory serving.
- Updated test suite to align with the new UUID filename generation and URL assertions.

## 0.0.1

## 0.0.1

### Patch Changes

- Initial release of the local file system storage adapter.
- Implements the `StorageAdapter` contract from `@crudstack/core`.
- Uses a centralized `storage.json` index file for fast metadata lookups and clean directory structure.
- Supports `Buffer`, `Blob`, and `File` inputs for cross-environment compatibility.
- Provides full CRUD operations: `upload`, `findById`, `find`, `delete`, and `getSignedUrl`.
- Includes comprehensive Vitest test suite using isolated temporary directories.
