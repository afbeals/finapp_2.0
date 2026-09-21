/**
 * SQLite / Prisma layer tests
 * Runs against data/test.db (isolated from dev.db)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import path from 'path';

const TEST_DB_PATH = path.resolve(__dirname, '../../data/test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

let prisma: PrismaClient;

beforeAll(async () => {
  // Remove stale test DB so we start from a clean schema
  if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);

  // Apply migrations to the fresh file (non-destructive, no user consent required)
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'pipe',
  });

  prisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function createHousehold(name = 'Test Family') {
  const pinHash = await bcrypt.hash('test123', 10);
  const household = await prisma.household.create({ data: { name, pinHash } });
  const member = await prisma.member.create({
    data: { householdId: household.id, name: 'Alice', color: '#3B82F6' },
  });
  return { household, member };
}

// ─── Household ──────────────────────────────────────────────────────────────

describe('Household', () => {
  it('creates a household with a hashed PIN', async () => {
    const pinHash = await bcrypt.hash('9999', 10);
    const hh = await prisma.household.create({ data: { name: 'Smith Family', pinHash } });

    expect(hh.id).toBeGreaterThan(0);
    expect(hh.name).toBe('Smith Family');
    expect(await bcrypt.compare('9999', hh.pinHash)).toBe(true);
    expect(await bcrypt.compare('wrong', hh.pinHash)).toBe(false);
  });

  it('cascades delete to members', async () => {
    const pinHash = await bcrypt.hash('0000', 10);
    const hh = await prisma.household.create({ data: { name: 'Temp HH', pinHash } });
    await prisma.member.create({ data: { householdId: hh.id, name: 'Bob' } });

    await prisma.household.delete({ where: { id: hh.id } });

    const members = await prisma.member.findMany({ where: { householdId: hh.id } });
    expect(members).toHaveLength(0);
  });
});

// ─── Review ─────────────────────────────────────────────────────────────────

describe('Review', () => {
  it('creates a review with default status IN_PROGRESS', async () => {
    const { household } = await createHousehold();
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 5, type: 'MONTHLY' },
    });

    expect(review.status).toBe('IN_PROGRESS');
    expect(review.currentStep).toBe('expense');
    expect(review.lockedForEdit).toBe(false);
    expect(review.completedAt).toBeNull();
  });

  it('cascades delete review → steps, income, expenses', async () => {
    const { household, member } = await createHousehold();
    const category = await prisma.expenseCategory.create({
      data: { householdId: household.id, name: 'Food' },
    });
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 7, type: 'MONTHLY' },
    });
    await prisma.reviewStep.create({ data: { reviewId: review.id, stepKey: 'expense' } });
    await prisma.incomeEntry.create({
      data: { reviewId: review.id, memberId: member.id, name: 'Salary', amount: 500000 },
    });
    await prisma.expenseEntry.create({
      data: { reviewId: review.id, categoryId: category.id, name: 'Groceries', amount: 10000, date: new Date() },
    });

    await prisma.review.delete({ where: { id: review.id } });

    expect(await prisma.reviewStep.findMany({ where: { reviewId: review.id } })).toHaveLength(0);
    expect(await prisma.incomeEntry.findMany({ where: { reviewId: review.id } })).toHaveLength(0);
    expect(await prisma.expenseEntry.findMany({ where: { reviewId: review.id } })).toHaveLength(0);
  });
});

// ─── ReviewStep ─────────────────────────────────────────────────────────────

describe('ReviewStep', () => {
  it('enforces unique (reviewId, stepKey)', async () => {
    const { household } = await createHousehold();
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 8, type: 'MONTHLY' },
    });
    await prisma.reviewStep.create({ data: { reviewId: review.id, stepKey: 'expense' } });

    await expect(
      prisma.reviewStep.create({ data: { reviewId: review.id, stepKey: 'expense' } })
    ).rejects.toThrow();
  });

  it('stores and retrieves JSON data as text', async () => {
    const { household } = await createHousehold();
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 9, type: 'MONTHLY' },
    });
    const payload = JSON.stringify({ notes: 'Good month', total: 425000 });
    const step = await prisma.reviewStep.create({
      data: { reviewId: review.id, stepKey: 'finalize', data: payload },
    });

    expect(JSON.parse(step.data)).toEqual({ notes: 'Good month', total: 425000 });
  });
});

// ─── SavingsSnapshot unique constraint ──────────────────────────────────────

describe('SavingsSnapshot', () => {
  it('enforces unique (accountId, reviewId)', async () => {
    const { household } = await createHousehold();
    const account = await prisma.savingsAccount.create({
      data: { householdId: household.id, name: 'Test HYSA', type: 'HYSA', institution: 'Marcus' },
    });
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 10, type: 'MONTHLY' },
    });
    await prisma.savingsSnapshot.create({
      data: { accountId: account.id, reviewId: review.id, startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 },
    });

    await expect(
      prisma.savingsSnapshot.create({
        data: { accountId: account.id, reviewId: review.id, startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 },
      })
    ).rejects.toThrow();
  });
});

// ─── Loan ───────────────────────────────────────────────────────────────────

describe('Loan', () => {
  it('cascades delete loan → loan snapshots', async () => {
    const { household } = await createHousehold();
    const loan = await prisma.loan.create({
      data: {
        householdId: household.id,
        name: 'Test Student Loan',
        category: 'SCHOOL',
        principal: 1000000,
        rate: 0.05,
        termMonths: 120,
        startDate: new Date('2024-01-01'),
      },
    });
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 6, type: 'MONTHLY' },
    });
    await prisma.loanSnapshot.create({
      data: { loanId: loan.id, reviewId: review.id, balance: 950000, paymentsMade: 3, interestPaid: 12000 },
    });

    await prisma.loan.delete({ where: { id: loan.id } });

    expect(await prisma.loanSnapshot.findMany({ where: { loanId: loan.id } })).toHaveLength(0);
  });

  it('accepts ROBO_ADVISOR as a valid investment account type', async () => {
    const { household } = await createHousehold();
    const account = await prisma.investmentAccount.create({
      data: { householdId: household.id, name: 'Test Robo', type: 'ROBO_ADVISOR', institution: 'Betterment' },
    });

    expect(account.type).toBe('ROBO_ADVISOR');
  });
});

// ─── SavingsAccount ───────────────────────────────────────────────────────────

describe('SavingsAccount', () => {
  it('cascades delete account → savings snapshots', async () => {
    const { household } = await createHousehold();
    const account = await prisma.savingsAccount.create({
      data: { householdId: household.id, name: 'Test HYSA to Delete', type: 'HYSA' },
    });
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 2, type: 'MONTHLY' },
    });
    await prisma.savingsSnapshot.create({
      data: { accountId: account.id, reviewId: review.id, startingBalance: 10000, deposits: 5000, interest: 100, endingBalance: 15100 },
    });

    await prisma.savingsAccount.delete({ where: { id: account.id } });

    expect(await prisma.savingsSnapshot.findMany({ where: { accountId: account.id } })).toHaveLength(0);
  });
});

// ─── HoldingSnapshot unique constraint ──────────────────────────────────────

describe('HoldingSnapshot', () => {
  it('enforces unique (purchaseId, reviewId)', async () => {
    const { household } = await createHousehold();
    const account = await prisma.investmentAccount.create({
      data: { householdId: household.id, name: 'Test 401k', type: 'TRADITIONAL_401K', institution: 'Fidelity' },
    });
    const purchase = await prisma.purchase.create({
      data: { accountId: account.id, ticker: 'VTI', name: 'VTI', shares: 10, pricePerShare: 20000, purchaseDate: new Date('2023-01-01') },
    });
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 11, type: 'MONTHLY' },
    });
    await prisma.holdingSnapshot.create({
      data: { purchaseId: purchase.id, reviewId: review.id, price: 25000, value: 250000, gainLoss: 50000 },
    });

    await expect(
      prisma.holdingSnapshot.create({
        data: { purchaseId: purchase.id, reviewId: review.id, price: 25000, value: 250000, gainLoss: 50000 },
      })
    ).rejects.toThrow();
  });
});

// ─── Money: cents integrity ──────────────────────────────────────────────────

describe('Money stored as integer cents', () => {
  it('stores and retrieves exact cent values without floating point drift', async () => {
    const { household, member } = await createHousehold();
    const review = await prisma.review.create({
      data: { householdId: household.id, periodYear: 2026, periodMonth: 12, type: 'MONTHLY' },
    });

    // $1,234.56 = 123456 cents
    const entry = await prisma.incomeEntry.create({
      data: { reviewId: review.id, memberId: member.id, name: 'Test', amount: 123456 },
    });
    expect(entry.amount).toBe(123456);

    // $99.99 = 9999 cents
    const category = await prisma.expenseCategory.create({
      data: { householdId: household.id, name: 'Test Cat' },
    });
    const expense = await prisma.expenseEntry.create({
      data: { reviewId: review.id, categoryId: category.id, name: 'Test', amount: 9999, date: new Date() },
    });
    expect(expense.amount).toBe(9999);
  });
});

// ─── Seed integrity (runs seed against test.db — never reads dev.db) ─────────

describe('Seed data integrity', () => {
  // Reuse the same test.db that was migrated in the outer beforeAll.
  // Run the seed against it so tests are always deterministic and isolated
  // from whatever state dev.db happens to be in.

  beforeAll(() => {
    execSync('npx prisma db seed', {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'pipe',
    });
  });

  it('seed produces the Beals-Gibson household', async () => {
    const hh = await prisma.household.findFirst({ where: { name: 'Beals-Gibson' } });
    expect(hh).not.toBeNull();
  });

  it('seed produces exactly 2 members', async () => {
    const hh = await prisma.household.findFirstOrThrow({ where: { name: 'Beals-Gibson' } });
    const members = await prisma.member.findMany({ where: { householdId: hh.id } });
    expect(members).toHaveLength(2);
    expect(members.map(m => m.name).sort()).toEqual(['Allan', 'Malia']);
  });

  it('seed produces exactly 4 reviews (Jan–Apr 2026)', async () => {
    const hh = await prisma.household.findFirstOrThrow({ where: { name: 'Beals-Gibson' } });
    const reviews = await prisma.review.findMany({ where: { householdId: hh.id } });
    expect(reviews).toHaveLength(4);
  });

  it('January 2026 review is QUARTERLY and COMPLETE', async () => {
    const hh = await prisma.household.findFirstOrThrow({ where: { name: 'Beals-Gibson' } });
    const jan = await prisma.review.findFirst({
      where: { householdId: hh.id, periodYear: 2026, periodMonth: 1 },
    });
    expect(jan?.type).toBe('QUARTERLY');
    expect(jan?.status).toBe('COMPLETE');
    expect(jan?.completedAt).not.toBeNull();
  });

  it('April 2026 review is MONTHLY and IN_PROGRESS', async () => {
    const hh = await prisma.household.findFirstOrThrow({ where: { name: 'Beals-Gibson' } });
    const apr = await prisma.review.findFirst({
      where: { householdId: hh.id, periodYear: 2026, periodMonth: 4 },
    });
    expect(apr?.type).toBe('MONTHLY');
    expect(apr?.status).toBe('IN_PROGRESS');
    expect(apr?.completedAt).toBeNull();
  });

  it('income amounts are stored as cents', async () => {
    const hh = await prisma.household.findFirstOrThrow({ where: { name: 'Beals-Gibson' } });
    const janReview = await prisma.review.findFirstOrThrow({
      where: { householdId: hh.id, periodYear: 2026, periodMonth: 1 },
    });
    const income = await prisma.incomeEntry.findMany({ where: { reviewId: janReview.id } });
    for (const entry of income) {
      expect(Number.isInteger(entry.amount)).toBe(true);
      expect(entry.amount).toBeGreaterThan(0);
    }
    // Allan base salary = $8,542 = 854200 cents
    const allanSalary = income.find(e => e.name === 'Airbnb Salary');
    expect(allanSalary?.amount).toBe(854200);
  });
});
