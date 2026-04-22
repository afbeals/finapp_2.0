-- Vault redesign: add category, owner, frequency, rateMonths, currentBalance, treasuryPct

ALTER TABLE "Vault" ADD COLUMN "category"        TEXT    NOT NULL DEFAULT '';
ALTER TABLE "Vault" ADD COLUMN "ownerMemberId"   INTEGER;
ALTER TABLE "Vault" ADD COLUMN "frequency"       TEXT    NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Vault" ADD COLUMN "rateMonths"      INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Vault" ADD COLUMN "currentBalance"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Vault" ADD COLUMN "treasuryPct"     REAL    NOT NULL DEFAULT 0;
