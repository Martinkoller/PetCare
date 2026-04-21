-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "duration" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "observations" TEXT,
    "alerts" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_catalog_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "service_catalog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_catalog" ("active", "alerts", "category", "createdAt", "description", "duration", "id", "name", "observations", "price", "updatedAt") SELECT "active", "alerts", "category", "createdAt", "description", "duration", "id", "name", "observations", "price", "updatedAt" FROM "service_catalog";
DROP TABLE "service_catalog";
ALTER TABLE "new_service_catalog" RENAME TO "service_catalog";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
