# @crudstack/core

## 0.4.0

### Minor Changes

- Introduce `StorageAdapter` interface and storage types (`StorageFile`, `StorageUploadOptions`, `StorageQuery`) for unified file operations (upload, findById, find, delete, getSignedUrl).
- Update `CrudStack` orchestrator to support an optional `storage` adapter alongside the `database` adapter, accessible via the new `getStorage()` method.
- Restructure internal modules for better domain separation: moved database adapter and resources into the `database/` directory and created a dedicated `storage/` directory.
- Add comprehensive test cases for the new `StorageAdapter` workflow and update existing tests to reflect the new directory structure.

## 0.3.0

### Minor Changes

enable query-based bulk deletes on any entity field

- Updated the `DatabaseAdapter` interface to make the `delete` method generic (`<T extends Entity>`).
- This allows adapters to delete records using queries on any field of the entity, not just the `id`.

## 0.2.0

### Minor Changes

refactor architecture into modular domains and introduce strict adapter contracts

- Reorganized source code into distinct domains: types, core, resources, adapters, and modifiers.
- Introduced a strict `QueryOperatorResolver` contract and `buildNativeConditions` utility to enforce and simplify adapter implementation.
- Moved test files into a dedicated `tests/` directory for cleaner separation of concerns.
- Added `vitest.config.ts` to support path aliases in tests.

## 0.1.0

### Minor Changes

- Changed `update` and `delete` methods to accept a `Query` object instead of a raw `id` string, enabling powerful bulk operations. Restructured the SQLite adapter to separate database logic and query modifiers into dedicated modular folders.

## 0.0.2

### Patch Changes

- Added optional `schema?: unknown` parameter to all `DatabaseAdapter` methods to support schema-aware adapters (like Drizzle ORM).
- Updated `ResourceImpl` to pass the schema down to the underlying database adapter.

## 0.0.1

### Patch Changes

- Initial release of the core package.
- Added `CrudStack` main entry point and factory methods (`createResource`, `resource`).
- Defined type-safe `DatabaseAdapter`, `Resource`, `Entity`, and `Query<T>` interfaces.
