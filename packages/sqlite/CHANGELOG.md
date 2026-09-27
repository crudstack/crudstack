# @crudstack/sqlite

## 0.2.2

### Patch Changes

- Improved type safety in `create` and `update` operations by strictly using Drizzle ORM's `$inferInsert` type, eliminating the need for `any` in data payloads.

## 0.2.0

### Minor Changes

refactor architecture and align with core 0.3.0 query system

- Reorganizes source code into distinct domains: adapters, modifiers, and a dedicated tests/ directory.
- Updates SQLiteDatabaseAdapter to use core's resolveQuery and buildNativeConditions for strict operator enforcement.
- Refactors QueryBuilder to match the new core Query<T> structure.
- Adds full support for all query operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin).
- Updates Drizzle ORM types to use the modern BetterSQLite3Database interface.

## 0.1.0

### Minor Changes

- Changed `update` and `delete` methods to accept a `Query` object instead of a raw `id` string, enabling powerful bulk operations. Restructured the SQLite adapter to separate database logic and query modifiers into dedicated modular folders.

## 0.0.1

### Patch Changes

- Initial release of the SQLite adapter with Drizzle ORM support.
- Implemented `DatabaseAdapter` interface using `drizzle-orm` and `better-sqlite3`.
- Added dynamic query translation from core `Query<T>` to Drizzle `WHERE` clauses.
- Added automatic `id` column resolution for `update` and `delete` operations.
