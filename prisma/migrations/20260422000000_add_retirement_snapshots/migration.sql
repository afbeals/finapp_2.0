-- Create RetirementSnapshot table
CREATE TABLE "RetirementSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    CONSTRAINT "RetirementSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "InvestmentAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetirementSnapshot_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RetirementSnapshot_accountId_reviewId_key" ON "RetirementSnapshot"("accountId", "reviewId");

-- Backfill: for each non-TAXABLE account, seed one RetirementSnapshot on the most
-- recent review that has any holding snapshot for one of its purchases, using the
-- summed latest-per-purchase value. Purchases without any HoldingSnapshot fall
-- back to shares * pricePerShare (cost basis) as the initial balance.
INSERT INTO "RetirementSnapshot" ("accountId", "reviewId", "balance")
SELECT
  a.id AS accountId,
  COALESCE(
    (SELECT MAX(hs.reviewId)
       FROM "HoldingSnapshot" hs
       JOIN "Purchase" p ON p.id = hs.purchaseId
       WHERE p.accountId = a.id),
    (SELECT MAX(r.id) FROM "Review" r WHERE r.householdId = a.householdId)
  ) AS reviewId,
  COALESCE(
    (SELECT SUM(
        COALESCE(
          (SELECT hs2.value FROM "HoldingSnapshot" hs2
            WHERE hs2.purchaseId = p2.id
            ORDER BY hs2.reviewId DESC LIMIT 1),
          CAST(ROUND(p2.pricePerShare * p2.shares) AS INTEGER)
        )
      )
      FROM "Purchase" p2
      WHERE p2.accountId = a.id),
    0
  ) AS balance
FROM "InvestmentAccount" a
WHERE a.type != 'TAXABLE'
  AND (SELECT MAX(r.id) FROM "Review" r WHERE r.householdId = a.householdId) IS NOT NULL;
