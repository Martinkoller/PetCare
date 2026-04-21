-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_clients" ("address", "cpf", "createdAt", "email", "id", "name", "notes", "phone", "updatedAt") SELECT "address", "cpf", "createdAt", "email", "id", "name", "notes", "phone", "updatedAt" FROM "clients";
DROP TABLE "clients";
ALTER TABLE "new_clients" RENAME TO "clients";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
