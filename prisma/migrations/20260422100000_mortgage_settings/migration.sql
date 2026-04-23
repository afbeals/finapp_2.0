-- AlterTable: add mortgage settings fields to Loan
ALTER TABLE "Loan" ADD COLUMN "propertyTax" INTEGER;
ALTER TABLE "Loan" ADD COLUMN "hoa" INTEGER;
ALTER TABLE "Loan" ADD COLUMN "homeownersInsurance" INTEGER;
ALTER TABLE "Loan" ADD COLUMN "homeValue" INTEGER;
ALTER TABLE "Loan" ADD COLUMN "pmiDropBalance" INTEGER;
