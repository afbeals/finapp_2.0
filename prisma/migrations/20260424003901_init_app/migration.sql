/*
  Warnings:

  - You are about to alter the column `paidOff` on the `Loan` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "principal" INTEGER NOT NULL,
    "rate" REAL NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "paidOff" BOOLEAN NOT NULL DEFAULT false,
    "mortgageInsurance" INTEGER NOT NULL DEFAULT 0,
    "otherFees" INTEGER NOT NULL DEFAULT 0,
    "propertyTax" INTEGER,
    "hoa" INTEGER,
    "homeownersInsurance" INTEGER,
    "homeValue" INTEGER,
    "pmiDropBalance" INTEGER,
    CONSTRAINT "Loan_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Loan" ("category", "hoa", "homeValue", "homeownersInsurance", "householdId", "id", "mortgageInsurance", "name", "otherFees", "paidOff", "pmiDropBalance", "principal", "propertyTax", "rate", "startDate", "termMonths") SELECT "category", "hoa", "homeValue", "homeownersInsurance", "householdId", "id", "mortgageInsurance", "name", "otherFees", "paidOff", "pmiDropBalance", "principal", "propertyTax", "rate", "startDate", "termMonths" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
CREATE TABLE "new_Vault" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "householdId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "ownerMemberId" INTEGER,
    "target" INTEGER,
    "allocation" REAL NOT NULL DEFAULT 0,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "rateMonths" INTEGER NOT NULL DEFAULT 1,
    "currentBalance" INTEGER NOT NULL DEFAULT 0,
    "treasuryPct" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "dueMonths" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Vault_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Vault_ownerMemberId_fkey" FOREIGN KEY ("ownerMemberId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Vault" ("allocation", "category", "currentBalance", "description", "dueMonths", "frequency", "householdId", "id", "name", "ownerMemberId", "rateMonths", "sortOrder", "target", "treasuryPct", "type") SELECT "allocation", "category", "currentBalance", "description", "dueMonths", "frequency", "householdId", "id", "name", "ownerMemberId", "rateMonths", "sortOrder", "target", "treasuryPct", "type" FROM "Vault";
DROP TABLE "Vault";
ALTER TABLE "new_Vault" RENAME TO "Vault";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
