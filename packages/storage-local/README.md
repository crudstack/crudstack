# @crudstack/storage-local

> Local File System storage adapter for [Crudstack](../../README.md).

This package provides a `StorageAdapter` implementation that saves files directly to your local disk. It is ideal for development, testing, or simple deployments where a dedicated cloud storage provider is not required.

## 📦 Installation

```bash
pnpm add @crudstack/storage-local
```

## 🚀 Usage

### 1. Initialize with CrudStack

Pass the `LocalStorageAdapter` to your `CrudStack` instance, providing a base directory where files will be stored.

```ts
import { CrudStack } from "@crudstack/core";
import { LocalStorageAdapter } from "@crudstack/local";
import path from "node:path";

const storageDir = path.resolve(process.cwd(), "uploads");

const crudstack = new CrudStack({
    storage: new LocalStorageAdapter(storageDir),
});
```

### 2. Upload a File

```ts
import fs from "node:fs/promises";

const storage = crudstack.getStorage();

const fileBuffer = await fs.readFile("./my-document.pdf");
const uploadedFile = await storage.upload(fileBuffer, {
    folder: "documents",
    fileName: "report.pdf",
    metadata: { uploadedBy: "admin" },
});

console.log(uploadedFile.id); // e.g., "documents/report.pdf"
console.log(uploadedFile.url); // e.g., "file:///path/to/uploads/documents/report.pdf"
```

### 3. Find and Delete Files

```ts
// Find all files in a specific folder
const files = await storage.find({ folder: "documents" });

// Find a specific file by its relative path ID
const file = await storage.findById("documents/report.pdf");

// Delete the file
await storage.delete("documents/report.pdf");
```

### ⚙️ How It Works

- **Centralized Index:** Instead of creating scattered metadata files, the adapter maintains a single `storage.json` file in the base directory. This acts as a lightweight local database, making file lookups (`findById`) and directory listings (`find`) exponentially faster and keeping your folders clean.
- **ID Format:** The id of a stored file is its relative path from the `baseDirectory` (e.g., `folder/filename.ext`).
- **Signed URLs:** Since this is a local adapter, `getSignedUrl` returns a `file://` URL pointing to the absolute path on your machine.

> **Note**: Because metadata is centralized, if a file is manually deleted from the OS file explorer outside of this adapter, its metadata will remain in `storage.json` until explicitly removed via the adapter's `delete` method.
