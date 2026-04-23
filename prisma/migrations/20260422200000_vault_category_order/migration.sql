-- CreateTable
CREATE TABLE "VaultCategoryOrder" (
    "householdId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL,

    PRIMARY KEY ("householdId", "category"),
    CONSTRAINT "VaultCategoryOrder_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
