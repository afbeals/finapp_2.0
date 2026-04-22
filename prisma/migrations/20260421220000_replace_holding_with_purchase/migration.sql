-- Drop old HoldingSnapshot (references Holding)
DROP TABLE IF EXISTS "HoldingSnapshot";

-- Drop old Holding table
DROP TABLE IF EXISTS "Holding";

-- Create Purchase table (per-lot purchases)
CREATE TABLE "Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "purchaseDate" DATETIME NOT NULL,
    "pricePerShare" INTEGER NOT NULL,
    "shares" REAL NOT NULL,
    CONSTRAINT "Purchase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create new HoldingSnapshot keyed on purchaseId
CREATE TABLE "HoldingSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseId" INTEGER NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "value" INTEGER NOT NULL,
    "gainLoss" INTEGER NOT NULL,
    CONSTRAINT "HoldingSnapshot_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HoldingSnapshot_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "HoldingSnapshot_purchaseId_reviewId_key" ON "HoldingSnapshot"("purchaseId", "reviewId");

-- Update InvestmentAccount relation (no SQL change needed, handled by Prisma relations)
