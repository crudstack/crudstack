# @crudstack/storage-local

## 0.0.1

### Patch Changes

- Initial release of the local file system storage adapter.
- Implements the `StorageAdapter` contract from `@crudstack/core`.
- Uses a centralized `storage.json` index file for fast metadata lookups and clean directory structure.
- Supports `Buffer`, `Blob`, and `File` inputs for cross-environment compatibility.
- Provides full CRUD operations: `upload`, `findById`, `find`, `delete`, and `getSignedUrl`.
- Includes comprehensive Vitest test suite using isolated temporary directories.
