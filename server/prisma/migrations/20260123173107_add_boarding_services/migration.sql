-- CreateTable
CREATE TABLE "boarding_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardingId" TEXT NOT NULL,
    "serviceId" TEXT,
    "productId" TEXT,
    "batchId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "boarding_services_boardingId_fkey" FOREIGN KEY ("boardingId") REFERENCES "boarding_stays" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
