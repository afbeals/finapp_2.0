-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavingsAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'HYSA',
    "institution" TEXT NOT NULL DEFAULT '',
    "rate" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SavingsAccount_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SavingsAccount" ("householdId", "id", "institution", "name", "type") SELECT "householdId", "id", "institution", "name", "type" FROM "SavingsAccount";
DROP TABLE "SavingsAccount";
ALTER TABLE "new_SavingsAccount" RENAME TO "SavingsAccount";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
