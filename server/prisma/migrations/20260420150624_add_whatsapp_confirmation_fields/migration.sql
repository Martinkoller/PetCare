-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "professionalId" TEXT,
    "serviceType" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "serviceItems" TEXT,
    "returnDate" DATETIME,
    "startedAt" DATETIME,
    "currentStageStartedAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "appointmentType" TEXT NOT NULL DEFAULT 'scheduled',
    "tutorNotified" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConfirmationStatus" TEXT,
    "whatsappConfirmationSentAt" DATETIME,
    "whatsappConfirmationReplyAt" DATETIME,
    "awaitingWhatsappReply" BOOLEAN NOT NULL DEFAULT false,
    "whatsappLastMessageId" TEXT,
    "whatsappReplyText" TEXT,
    "confirmedVia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "appointments_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_appointments" ("appointmentType", "createdAt", "currentStageStartedAt", "date", "duration", "id", "notes", "petId", "price", "priority", "professionalId", "returnDate", "serviceItems", "serviceType", "startedAt", "status", "tutorNotified", "updatedAt") SELECT "appointmentType", "createdAt", "currentStageStartedAt", "date", "duration", "id", "notes", "petId", "price", "priority", "professionalId", "returnDate", "serviceItems", "serviceType", "startedAt", "status", "tutorNotified", "updatedAt" FROM "appointments";
DROP TABLE "appointments";
ALTER TABLE "new_appointments" RENAME TO "appointments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
