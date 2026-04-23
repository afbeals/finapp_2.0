/**
 * Seed script — Jan–Apr 2026 Allan & Malia household data
 * Run: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cents = (dollars: number) => Math.round(dollars * 100);
const d = (iso: string) => new Date(iso);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // Wipe everything (respects cascade deletes)
  await prisma.session.deleteMany();
  await prisma.vaultSnapshot.deleteMany();
  await prisma.holdingSnapshot.deleteMany();
  await prisma.loanSnapshot.deleteMany();
  await prisma.savingsSnapshot.deleteMany();
  await prisma.expenseEntry.deleteMany();
  await prisma.incomeEntry.deleteMany();
  await prisma.reviewStep.deleteMany();
  await prisma.review.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.investmentAccount.deleteMany();
  await prisma.investmentCategory.deleteMany();
  await prisma.vaultCategoryOrder.deleteMany();
  await prisma.vault.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.savingsAccount.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.member.deleteMany();
  await prisma.household.deleteMany();

  // ─── Household ───────────────────────────────────────────────────────────
  const pinHash = await bcrypt.hash('1234', 10);
  const household = await prisma.household.create({
    data: { name: 'Beals-Gibson', pinHash },
  });

  // ─── Members ─────────────────────────────────────────────────────────────
  const allan = await prisma.member.create({
    data: {
      householdId: household.id,
      name: 'Allan',
      email: 'allan@example.com',
      color: '#3B82F6',
    },
  });
  const malia = await prisma.member.create({
    data: {
      householdId: household.id,
      name: 'Malia',
      email: 'malia@example.com',
      color: '#EC4899',
    },
  });

  // ─── Expense Categories ──────────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Housing', icon: '🏠', color: '#6366F1', sortOrder: 1 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Groceries', icon: '🛒', color: '#22C55E', sortOrder: 2 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Dining Out', icon: '🍽️', color: '#F59E0B', sortOrder: 3 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Transportation', icon: '🚗', color: '#3B82F6', sortOrder: 4 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Utilities', icon: '💡', color: '#8B5CF6', sortOrder: 5 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Healthcare', icon: '🏥', color: '#EF4444', sortOrder: 6 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Entertainment', icon: '🎬', color: '#EC4899', sortOrder: 7 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Shopping', icon: '🛍️', color: '#14B8A6', sortOrder: 8 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Travel', icon: '✈️', color: '#0EA5E9', sortOrder: 9 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Subscriptions', icon: '📱', color: '#64748B', sortOrder: 10 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Personal Care', icon: '✂️', color: '#A78BFA', sortOrder: 11 } }),
    prisma.expenseCategory.create({ data: { householdId: household.id, name: 'Miscellaneous', icon: '📦', color: '#94A3B8', sortOrder: 12 } }),
  ]);

  const [housing, groceries, dining, transportation, utilities, healthcare, entertainment, shopping, travel, subscriptions, personalCare, misc] = categories;

  // ─── Investment Categories ───────────────────────────────────────────────
  await Promise.all([
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Index Fund',     color: '#7C3AED', sortOrder: 1 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Technology',     color: '#2563EB', sortOrder: 2 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Consumer',       color: '#16A34A', sortOrder: 3 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Healthcare',     color: '#DC2626', sortOrder: 4 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Finance',        color: '#C2410C', sortOrder: 5 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Transportation', color: '#D97706', sortOrder: 6 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Energy',         color: '#059669', sortOrder: 7 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Bonds',          color: '#4338CA', sortOrder: 8 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Real Estate',    color: '#9D174D', sortOrder: 9 } }),
    prisma.investmentCategory.create({ data: { householdId: household.id, name: 'Utilities',      color: '#15803D', sortOrder: 10 } }),
  ]);

  // ─── Savings Accounts ────────────────────────────────────────────────────
  const hysa = await prisma.savingsAccount.create({
    data: { householdId: household.id, name: 'Marcus HYSA', type: 'HYSA', institution: 'Marcus by Goldman Sachs' },
  });
  const checking = await prisma.savingsAccount.create({
    data: { householdId: household.id, name: 'Joint Checking', type: 'CHECKING', institution: 'Chase' },
  });

  // ─── Loans ───────────────────────────────────────────────────────────────
  const mortgageLoan = await prisma.loan.create({
    data: {
      householdId: household.id,
      name: 'New American Funding',
      category: 'MORTGAGE',
      principal: cents(333000),
      rate: 0.02625,
      termMonths: 360,
      startDate: d('2020-09-01'),
    },
  });

  // School loans — 8 federal loans matching wireframe data
  const schoolLoan01 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Sub 01', category: 'SCHOOL', principal: cents(5500), rate: 0.045, termMonths: 139, startDate: d('2015-10-01') } });
  const schoolLoan02 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Sub 02', category: 'SCHOOL', principal: cents(6500), rate: 0.034, termMonths: 135, startDate: d('2016-01-01') } });
  const schoolLoan03 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Sub 03', category: 'SCHOOL', principal: cents(5700), rate: 0.034, termMonths: 135, startDate: d('2016-07-01') } });
  const schoolLoan04 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Sub 04', category: 'SCHOOL', principal: cents(5800), rate: 0.034, termMonths: 135, startDate: d('2017-01-01') } });
  const schoolLoan05 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Unsub 05', category: 'SCHOOL', principal: cents(6000), rate: 0.049, termMonths: 140, startDate: d('2015-10-01') } });
  const schoolLoan06 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Unsub 06', category: 'SCHOOL', principal: cents(6500), rate: 0.049, termMonths: 140, startDate: d('2016-07-01') } });
  const schoolLoan07 = await prisma.loan.create({ data: { householdId: household.id, name: 'Direct Unsub 07', category: 'SCHOOL', principal: cents(20000), rate: 0.06, termMonths: 148, startDate: d('2017-07-01') } });
  const schoolLoan08 = await prisma.loan.create({ data: { householdId: household.id, name: 'Stafford Sub 08', category: 'SCHOOL', principal: cents(5000), rate: 0.06, termMonths: 147, startDate: d('2017-01-01') } });
  const schoolLoans = [schoolLoan01, schoolLoan02, schoolLoan03, schoolLoan04, schoolLoan05, schoolLoan06, schoolLoan07, schoolLoan08];

  // ─── Investment Accounts ─────────────────────────────────────────────────
  const allanFidelity401k = await prisma.investmentAccount.create({
    data: {
      householdId: household.id,
      name: "Allan's 401(k)",
      type: 'TRADITIONAL_401K',
      institution: 'Fidelity',
      ownerMemberId: allan.id,
    },
  });
  const allanRothIra = await prisma.investmentAccount.create({
    data: {
      householdId: household.id,
      name: "Allan's Roth IRA",
      type: 'ROTH_IRA',
      institution: 'Fidelity',
      ownerMemberId: allan.id,
    },
  });
  const maliaVanguard403b = await prisma.investmentAccount.create({
    data: {
      householdId: household.id,
      name: "Malia's 403(b)",
      type: 'TRADITIONAL_401K',
      institution: 'Vanguard',
      ownerMemberId: malia.id,
    },
  });
  const jointBrokerage = await prisma.investmentAccount.create({
    data: {
      householdId: household.id,
      name: 'Joint Brokerage',
      type: 'TAXABLE',
      institution: 'Fidelity',
    },
  });

  // ─── Purchases (per-lot) ─────────────────────────────────────────────────
  // Allan's 401(k) — multiple contribution lots over time
  const allanPurchases = await Promise.all([
    prisma.purchase.create({ data: { accountId: allanFidelity401k.id, ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', category: 'Index Fund', purchaseDate: d('2021-03-15'), pricePerShare: cents(134.22), shares: 50.00 } }),
    prisma.purchase.create({ data: { accountId: allanFidelity401k.id, ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', category: 'Index Fund', purchaseDate: d('2022-06-10'), pricePerShare: cents(148.50), shares: 48.10 } }),
    prisma.purchase.create({ data: { accountId: allanFidelity401k.id, ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', category: 'Index Fund', purchaseDate: d('2023-09-20'), pricePerShare: cents(166.88), shares: 44.25 } }),
    prisma.purchase.create({ data: { accountId: allanFidelity401k.id, ticker: 'FSKAX', name: 'Fidelity Total Market Index', category: 'Index Fund', purchaseDate: d('2021-03-15'), pricePerShare: cents(112.40), shares: 42.10 } }),
    prisma.purchase.create({ data: { accountId: allanFidelity401k.id, ticker: 'FSKAX', name: 'Fidelity Total Market Index', category: 'Index Fund', purchaseDate: d('2022-11-08'), pricePerShare: cents(107.20), shares: 44.10 } }),
    // Allan's Roth IRA
    prisma.purchase.create({ data: { accountId: allanRothIra.id, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Index Fund', purchaseDate: d('2020-04-15'), pricePerShare: cents(142.80), shares: 20.00 } }),
    prisma.purchase.create({ data: { accountId: allanRothIra.id, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Index Fund', purchaseDate: d('2021-07-12'), pricePerShare: cents(220.50), shares: 15.00 } }),
    prisma.purchase.create({ data: { accountId: allanRothIra.id, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Index Fund', purchaseDate: d('2023-01-10'), pricePerShare: cents(188.40), shares: 13.10 } }),
    prisma.purchase.create({ data: { accountId: allanRothIra.id, ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', category: 'Index Fund', purchaseDate: d('2020-04-15'), pricePerShare: cents(48.22), shares: 20.00 } }),
    prisma.purchase.create({ data: { accountId: allanRothIra.id, ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', category: 'Index Fund', purchaseDate: d('2022-08-22'), pricePerShare: cents(52.10), shares: 12.50 } }),
  ]);

  // Malia's 403(b) — contribution lots
  const maliaPurchases = await Promise.all([
    prisma.purchase.create({ data: { accountId: maliaVanguard403b.id, ticker: 'VTSAX', name: 'Vanguard Total Stock Market Admiral', category: 'Index Fund', purchaseDate: d('2019-06-01'), pricePerShare: cents(75.40), shares: 60.00 } }),
    prisma.purchase.create({ data: { accountId: maliaVanguard403b.id, ticker: 'VTSAX', name: 'Vanguard Total Stock Market Admiral', category: 'Index Fund', purchaseDate: d('2021-01-15'), pricePerShare: cents(98.60), shares: 37.20 } }),
    prisma.purchase.create({ data: { accountId: maliaVanguard403b.id, ticker: 'VTSAX', name: 'Vanguard Total Stock Market Admiral', category: 'Index Fund', purchaseDate: d('2023-04-10'), pricePerShare: cents(110.22), shares: 27.60 } }),
    prisma.purchase.create({ data: { accountId: maliaVanguard403b.id, ticker: 'VTIAX', name: 'Vanguard Total Intl Stock Admiral', category: 'Index Fund', purchaseDate: d('2019-06-01'), pricePerShare: cents(28.14), shares: 30.00 } }),
    prisma.purchase.create({ data: { accountId: maliaVanguard403b.id, ticker: 'VTIAX', name: 'Vanguard Total Intl Stock Admiral', category: 'Index Fund', purchaseDate: d('2022-03-18'), pricePerShare: cents(32.80), shares: 25.40 } }),
  ]);

  // Joint Brokerage — individual stock purchases with multiple lots
  const jointPurchases = await Promise.all([
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Index Fund', purchaseDate: d('2021-08-05'), pricePerShare: cents(224.10), shares: 15.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', category: 'Index Fund', purchaseDate: d('2023-06-20'), pricePerShare: cents(210.40), shares: 10.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'AAPL', name: 'Apple Inc.', category: 'Technology', purchaseDate: d('2020-09-14'), pricePerShare: cents(112.00), shares: 5.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'AAPL', name: 'Apple Inc.', category: 'Technology', purchaseDate: d('2022-01-18'), pricePerShare: cents(172.19), shares: 4.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'AAPL', name: 'Apple Inc.', category: 'Technology', purchaseDate: d('2023-10-02'), pricePerShare: cents(174.91), shares: 3.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'MSFT', name: 'Microsoft Corp.', category: 'Technology', purchaseDate: d('2021-02-10'), pricePerShare: cents(244.30), shares: 4.00 } }),
    prisma.purchase.create({ data: { accountId: jointBrokerage.id, ticker: 'MSFT', name: 'Microsoft Corp.', category: 'Technology', purchaseDate: d('2023-03-15'), pricePerShare: cents(278.80), shares: 4.00 } }),
  ]);

  const allPurchases = [...allanPurchases, ...maliaPurchases, ...jointPurchases];

  // ─── Vaults ──────────────────────────────────────────────────────────────
  // FIXED — Bills
  const generalBills = await prisma.vault.create({
    data: { householdId: household.id, name: 'General Bills', type: 'FIXED', category: 'Bills', target: cents(7000), frequency: 'MONTHLY', rateMonths: 1, currentBalance: 0 },
  });
  const carInsuranceABG = await prisma.vault.create({
    data: { householdId: household.id, name: 'Car Insurance', type: 'FIXED', category: 'Bills', ownerMemberId: allan.id, target: cents(755), frequency: 'SEMI-ANN', rateMonths: 6, currentBalance: 0 },
  });
  const vpn = await prisma.vault.create({
    data: { householdId: household.id, name: 'VPN', type: 'FIXED', category: 'Bills', ownerMemberId: allan.id, target: cents(80), frequency: '3-YEAR', rateMonths: 36, currentBalance: 0 },
  });
  const generalAnnual = await prisma.vault.create({
    data: { householdId: household.id, name: 'General Annual', type: 'FIXED', category: 'Bills', ownerMemberId: allan.id, target: cents(140), frequency: '1-YEAR', rateMonths: 12, currentBalance: 0 },
  });
  const carInsuranceMalia = await prisma.vault.create({
    data: { householdId: household.id, name: 'Car Insurance', type: 'FIXED', category: 'Bills', ownerMemberId: malia.id, target: cents(655), frequency: 'SEMI-ANN', rateMonths: 6, currentBalance: 0 },
  });
  // FIXED — Personal
  const personalABG = await prisma.vault.create({
    data: { householdId: household.id, name: 'Personal Spending', type: 'FIXED', category: 'Personal', ownerMemberId: allan.id, target: cents(100), frequency: '3-MONTH', rateMonths: 3, currentBalance: 0 },
  });
  const personalMalia = await prisma.vault.create({
    data: { householdId: household.id, name: 'Personal Spending', type: 'FIXED', category: 'Personal', ownerMemberId: malia.id, target: cents(90), frequency: '3-MONTH', rateMonths: 3, currentBalance: 0 },
  });
  // FIXED — Pre-Pay
  const taxes = await prisma.vault.create({
    data: { householdId: household.id, name: 'Taxes', type: 'FIXED', category: 'Pre-Pay', target: cents(4500), frequency: '1-YEAR', rateMonths: 12, currentBalance: 0 },
  });
  const maintenance = await prisma.vault.create({
    data: { householdId: household.id, name: 'Maintenance', type: 'FIXED', category: 'Pre-Pay', target: cents(15000), frequency: '1-YEAR', rateMonths: 12, currentBalance: 0 },
  });
  // FIXED — Replenish
  const schoolLoanFund = await prisma.vault.create({
    data: { householdId: household.id, name: 'School Loan Fund', type: 'FIXED', category: 'Replenish', target: cents(17432), frequency: '2-YEAR', rateMonths: 24, currentBalance: 0 },
  });
  // FIXED — Investments
  const monthlyContribution = await prisma.vault.create({
    data: { householdId: household.id, name: 'Monthly Contribution', type: 'FIXED', category: 'Investments', target: cents(1100), frequency: 'MONTHLY', rateMonths: 1, currentBalance: 0 },
  });
  // VARIABLE — Treasury distribution
  const vTravel = await prisma.vault.create({
    data: { householdId: household.id, name: 'Travel', type: 'VARIABLE', category: 'Treasury', target: cents(12000), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(10210), treasuryPct: 27 },
  });
  const vCamping = await prisma.vault.create({
    data: { householdId: household.id, name: 'Camping', type: 'VARIABLE', category: 'Treasury', target: cents(2000), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(2021), treasuryPct: 0 },
  });
  const vCabin = await prisma.vault.create({
    data: { householdId: household.id, name: 'Cabin', type: 'VARIABLE', category: 'Treasury', target: cents(4400), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(4447), treasuryPct: 0 },
  });
  const vHouseDownPayment = await prisma.vault.create({
    data: { householdId: household.id, name: 'House Down Payment', type: 'VARIABLE', category: 'Treasury', target: cents(150000), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(14843), treasuryPct: 13 },
  });
  const vChild1Fund = await prisma.vault.create({
    data: { householdId: household.id, name: 'Child 1 Fund', type: 'VARIABLE', category: 'Treasury', target: cents(75000), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(20776), treasuryPct: 50 },
  });
  const vChild2Fund = await prisma.vault.create({
    data: { householdId: household.id, name: 'Child 2 Fund', type: 'VARIABLE', category: 'Treasury', target: cents(75000), frequency: 'GOAL', rateMonths: 1, currentBalance: cents(6401), treasuryPct: 0 },
  });
  const vKickbackABG = await prisma.vault.create({
    data: { householdId: household.id, name: 'Kickback', type: 'VARIABLE', category: 'Treasury', ownerMemberId: allan.id, frequency: 'GOAL', rateMonths: 1, currentBalance: cents(5), treasuryPct: 7 },
  });
  const vKickbackMalia = await prisma.vault.create({
    data: { householdId: household.id, name: 'Kickback', type: 'VARIABLE', category: 'Treasury', ownerMemberId: malia.id, frequency: 'GOAL', rateMonths: 1, currentBalance: cents(2042), treasuryPct: 3 },
  });
  const vHoldTemp = await prisma.vault.create({
    data: { householdId: household.id, name: 'Hold / Temp', type: 'VARIABLE', category: 'Treasury', frequency: 'GOAL', rateMonths: 1, currentBalance: 0, treasuryPct: 0 },
  });

  const fixedVaults = [generalBills, carInsuranceABG, vpn, generalAnnual, carInsuranceMalia, personalABG, personalMalia, taxes, maintenance, schoolLoanFund, monthlyContribution];
  const variableVaults = [vTravel, vCamping, vCabin, vHouseDownPayment, vChild1Fund, vChild2Fund, vKickbackABG, vKickbackMalia, vHoldTemp];

  // ─── Vault Category Order ─────────────────────────────────────────────────
  const categoryOrderEntries = [
    { category: 'Bills',       groupOrder: 1 },
    { category: 'Personal',    groupOrder: 2 },
    { category: 'Pre-Pay',     groupOrder: 3 },
    { category: 'Replenish',   groupOrder: 4 },
    { category: 'Investments', groupOrder: 5 },
    { category: 'Treasury',    groupOrder: 6 },
  ];
  for (const entry of categoryOrderEntries) {
    await prisma.vaultCategoryOrder.create({
      data: { householdId: household.id, ...entry },
    });
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────

  type ReviewMonth = {
    year: number;
    month: number;
    type: 'MONTHLY' | 'QUARTERLY';
    status: 'IN_PROGRESS' | 'COMPLETE';
    completedAt?: Date;
  };

  const reviewMonths: ReviewMonth[] = [
    { year: 2026, month: 1, type: 'QUARTERLY', status: 'COMPLETE', completedAt: d('2026-02-03') },
    { year: 2026, month: 2, type: 'MONTHLY',   status: 'COMPLETE', completedAt: d('2026-03-02') },
    { year: 2026, month: 3, type: 'MONTHLY',   status: 'COMPLETE', completedAt: d('2026-04-01') },
    { year: 2026, month: 4, type: 'MONTHLY',   status: 'IN_PROGRESS' },
  ];

  for (const rm of reviewMonths) {
    const review = await prisma.review.create({
      data: {
        householdId: household.id,
        periodYear: rm.year,
        periodMonth: rm.month,
        type: rm.type,
        status: rm.status,
        currentStep: rm.status === 'COMPLETE' ? 'finalize' : 'expense',
        lastEditorId: allan.id,
        completedAt: rm.completedAt ?? null,
      },
    });

    // Month-specific income data
    const incomeData: Record<number, { allanBase: number; allanBonus?: number; maliaBase: number }> = {
      1: { allanBase: 8542, allanBonus: 3200, maliaBase: 5833 },
      2: { allanBase: 8542, maliaBase: 5833 },
      3: { allanBase: 8542, maliaBase: 5833 },
      4: { allanBase: 8542, maliaBase: 5833 },
    };
    const income = incomeData[rm.month];

    await prisma.incomeEntry.create({ data: { reviewId: review.id, memberId: allan.id, name: 'Airbnb Salary', amount: cents(income.allanBase) } });
    if (income.allanBonus) {
      await prisma.incomeEntry.create({ data: { reviewId: review.id, memberId: allan.id, name: 'Q4 Bonus', amount: cents(income.allanBonus) } });
    }
    await prisma.incomeEntry.create({ data: { reviewId: review.id, memberId: malia.id, name: 'UCSF Salary', amount: cents(income.maliaBase) } });

    // Month-specific expense data
    type ExpenseData = { categoryId: number; memberId?: number; name: string; amount: number; date: string };
    const expensesByMonth: Record<number, ExpenseData[]> = {
      1: [
        { categoryId: housing.id, name: 'Mortgage Payment', amount: 3187, date: '2026-01-01', memberId: allan.id },
        { categoryId: housing.id, name: 'HOA Dues', amount: 285, date: '2026-01-01', memberId: allan.id },
        { categoryId: groceries.id, name: 'Whole Foods', amount: 312, date: '2026-01-08', memberId: malia.id },
        { categoryId: groceries.id, name: "Trader Joe's", amount: 187, date: '2026-01-15', memberId: malia.id },
        { categoryId: groceries.id, name: 'Safeway', amount: 94, date: '2026-01-22', memberId: allan.id },
        { categoryId: dining.id, name: 'Date Night - Nopa', amount: 145, date: '2026-01-10', memberId: allan.id },
        { categoryId: dining.id, name: 'Lunch with coworkers', amount: 67, date: '2026-01-14', memberId: allan.id },
        { categoryId: dining.id, name: 'New Year dinner', amount: 220, date: '2026-01-01', memberId: malia.id },
        { categoryId: transportation.id, name: 'Gas', amount: 78, date: '2026-01-12', memberId: allan.id },
        { categoryId: transportation.id, name: 'Car Insurance', amount: 186, date: '2026-01-01', memberId: allan.id },
        { categoryId: transportation.id, name: 'Parking', amount: 45, date: '2026-01-20', memberId: allan.id },
        { categoryId: utilities.id, name: 'PG&E', amount: 124, date: '2026-01-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Comcast Internet', amount: 75, date: '2026-01-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Water & Sewer', amount: 62, date: '2026-01-05', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Netflix', amount: 23, date: '2026-01-12', memberId: malia.id },
        { categoryId: subscriptions.id, name: 'Spotify', amount: 18, date: '2026-01-12', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Adobe CC', amount: 55, date: '2026-01-15', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Apple One', amount: 32, date: '2026-01-20', memberId: malia.id },
        { categoryId: healthcare.id, name: 'Dentist', amount: 180, date: '2026-01-22', memberId: malia.id },
        { categoryId: entertainment.id, name: 'Concert tickets', amount: 165, date: '2026-01-18', memberId: allan.id },
        { categoryId: shopping.id, name: 'Amazon misc', amount: 89, date: '2026-01-25', memberId: malia.id },
        { categoryId: personalCare.id, name: 'Haircut', amount: 55, date: '2026-01-28', memberId: malia.id },
        { categoryId: misc.id, name: 'Post office', amount: 18, date: '2026-01-30', memberId: allan.id },
      ],
      2: [
        { categoryId: housing.id, name: 'Mortgage Payment', amount: 3187, date: '2026-02-01', memberId: allan.id },
        { categoryId: housing.id, name: 'HOA Dues', amount: 285, date: '2026-02-01', memberId: allan.id },
        { categoryId: groceries.id, name: 'Whole Foods', amount: 298, date: '2026-02-07', memberId: malia.id },
        { categoryId: groceries.id, name: "Trader Joe's", amount: 156, date: '2026-02-14', memberId: malia.id },
        { categoryId: dining.id, name: "Valentine's Dinner", amount: 280, date: '2026-02-14', memberId: allan.id },
        { categoryId: dining.id, name: 'Coffee & lunch', amount: 82, date: '2026-02-20', memberId: malia.id },
        { categoryId: transportation.id, name: 'Gas', amount: 65, date: '2026-02-10', memberId: allan.id },
        { categoryId: transportation.id, name: 'Car Insurance', amount: 186, date: '2026-02-01', memberId: allan.id },
        { categoryId: utilities.id, name: 'PG&E', amount: 138, date: '2026-02-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Comcast Internet', amount: 75, date: '2026-02-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Water & Sewer', amount: 62, date: '2026-02-05', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Netflix', amount: 23, date: '2026-02-12', memberId: malia.id },
        { categoryId: subscriptions.id, name: 'Spotify', amount: 18, date: '2026-02-12', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Adobe CC', amount: 55, date: '2026-02-15', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Apple One', amount: 32, date: '2026-02-20', memberId: malia.id },
        { categoryId: shopping.id, name: 'Amazon - office supplies', amount: 112, date: '2026-02-18', memberId: allan.id },
        { categoryId: shopping.id, name: "Valentine's gift", amount: 95, date: '2026-02-12', memberId: allan.id },
        { categoryId: healthcare.id, name: 'Gym membership', amount: 80, date: '2026-02-01', memberId: malia.id },
        { categoryId: entertainment.id, name: 'Movie & popcorn', amount: 45, date: '2026-02-22', memberId: malia.id },
        { categoryId: personalCare.id, name: 'Haircut', amount: 75, date: '2026-02-25', memberId: malia.id },
        { categoryId: misc.id, name: 'House cleaning service', amount: 150, date: '2026-02-28', memberId: malia.id },
      ],
      3: [
        { categoryId: housing.id, name: 'Mortgage Payment', amount: 3187, date: '2026-03-01', memberId: allan.id },
        { categoryId: housing.id, name: 'HOA Dues', amount: 285, date: '2026-03-01', memberId: allan.id },
        { categoryId: groceries.id, name: 'Whole Foods', amount: 322, date: '2026-03-06', memberId: malia.id },
        { categoryId: groceries.id, name: 'Costco run', amount: 245, date: '2026-03-13', memberId: allan.id },
        { categoryId: groceries.id, name: "Trader Joe's", amount: 143, date: '2026-03-20', memberId: malia.id },
        { categoryId: dining.id, name: 'Birthday dinner', amount: 195, date: '2026-03-15', memberId: malia.id },
        { categoryId: dining.id, name: 'Work happy hour', amount: 78, date: '2026-03-19', memberId: allan.id },
        { categoryId: dining.id, name: 'Brunch', amount: 62, date: '2026-03-22', memberId: malia.id },
        { categoryId: transportation.id, name: 'Gas', amount: 72, date: '2026-03-09', memberId: allan.id },
        { categoryId: transportation.id, name: 'Car Insurance', amount: 186, date: '2026-03-01', memberId: allan.id },
        { categoryId: transportation.id, name: 'BART monthly', amount: 98, date: '2026-03-01', memberId: malia.id },
        { categoryId: utilities.id, name: 'PG&E', amount: 108, date: '2026-03-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Comcast Internet', amount: 75, date: '2026-03-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Water & Sewer', amount: 62, date: '2026-03-05', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Netflix', amount: 23, date: '2026-03-12', memberId: malia.id },
        { categoryId: subscriptions.id, name: 'Spotify', amount: 18, date: '2026-03-12', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Adobe CC', amount: 55, date: '2026-03-15', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Apple One', amount: 32, date: '2026-03-20', memberId: malia.id },
        { categoryId: healthcare.id, name: 'Gym membership', amount: 80, date: '2026-03-01', memberId: malia.id },
        { categoryId: healthcare.id, name: 'Prescription', amount: 45, date: '2026-03-18', memberId: malia.id },
        { categoryId: travel.id, name: 'Spring break flights', amount: 742, date: '2026-03-25', memberId: allan.id },
        { categoryId: shopping.id, name: 'Clothes - spring', amount: 235, date: '2026-03-14', memberId: malia.id },
        { categoryId: misc.id, name: 'Plumber', amount: 385, date: '2026-03-10', memberId: allan.id },
        { categoryId: entertainment.id, name: 'Baseball tickets', amount: 112, date: '2026-03-28', memberId: allan.id },
        { categoryId: misc.id, name: 'House cleaning service', amount: 150, date: '2026-03-31', memberId: malia.id },
      ],
      4: [
        { categoryId: housing.id, name: 'Mortgage Payment', amount: 3187, date: '2026-04-01', memberId: allan.id },
        { categoryId: housing.id, name: 'HOA Dues', amount: 285, date: '2026-04-01', memberId: allan.id },
        { categoryId: groceries.id, name: 'Whole Foods', amount: 287, date: '2026-04-05', memberId: malia.id },
        { categoryId: groceries.id, name: "Trader Joe's", amount: 168, date: '2026-04-12', memberId: malia.id },
        { categoryId: dining.id, name: 'Dinner out', amount: 124, date: '2026-04-08', memberId: allan.id },
        { categoryId: dining.id, name: 'Coffee runs', amount: 48, date: '2026-04-15', memberId: malia.id },
        { categoryId: transportation.id, name: 'Gas', amount: 68, date: '2026-04-10', memberId: allan.id },
        { categoryId: transportation.id, name: 'Car Insurance', amount: 186, date: '2026-04-01', memberId: allan.id },
        { categoryId: utilities.id, name: 'PG&E', amount: 95, date: '2026-04-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Comcast Internet', amount: 75, date: '2026-04-05', memberId: allan.id },
        { categoryId: utilities.id, name: 'Water & Sewer', amount: 62, date: '2026-04-05', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Netflix', amount: 23, date: '2026-04-12', memberId: malia.id },
        { categoryId: subscriptions.id, name: 'Spotify', amount: 18, date: '2026-04-12', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Adobe CC', amount: 55, date: '2026-04-15', memberId: allan.id },
        { categoryId: subscriptions.id, name: 'Apple One', amount: 32, date: '2026-04-20', memberId: malia.id },
        { categoryId: healthcare.id, name: 'Gym membership', amount: 80, date: '2026-04-01', memberId: malia.id },
        { categoryId: shopping.id, name: 'Amazon', amount: 76, date: '2026-04-18', memberId: allan.id },
      ],
    };

    for (const exp of expensesByMonth[rm.month] ?? []) {
      await prisma.expenseEntry.create({
        data: {
          reviewId: review.id,
          categoryId: exp.categoryId,
          memberId: exp.memberId ?? null,
          name: exp.name,
          amount: cents(exp.amount),
          date: d(`${exp.date}T12:00:00Z`),
        },
      });
    }

    // Savings snapshots
    const savingsData: Record<number, { hysaStart: number; hysaDeposits: number; hysaInterest: number; checkStart: number; checkDeposits: number }> = {
      1: { hysaStart: 22400, hysaDeposits: 2000, hysaInterest: 108, checkStart: 8200, checkDeposits: 0 },
      2: { hysaStart: 24508, hysaDeposits: 2000, hysaInterest: 112, checkStart: 8200, checkDeposits: 0 },
      3: { hysaStart: 26620, hysaDeposits: 1000, hysaInterest: 118, checkStart: 8400, checkDeposits: 200 },
      4: { hysaStart: 27738, hysaDeposits: 2000, hysaInterest: 122, checkStart: 8200, checkDeposits: 0 },
    };
    const sd = savingsData[rm.month];
    await prisma.savingsSnapshot.create({
      data: {
        accountId: hysa.id, reviewId: review.id,
        startingBalance: cents(sd.hysaStart),
        deposits: cents(sd.hysaDeposits),
        interest: cents(sd.hysaInterest),
        endingBalance: cents(sd.hysaStart + sd.hysaDeposits + sd.hysaInterest),
      },
    });
    await prisma.savingsSnapshot.create({
      data: {
        accountId: checking.id, reviewId: review.id,
        startingBalance: cents(sd.checkStart),
        deposits: cents(sd.checkDeposits),
        interest: 0,
        endingBalance: cents(sd.checkStart + sd.checkDeposits),
      },
    });

    // Loan snapshots — approximate amortization
    // Mortgage: $333k @ 2.625% 30yr, started Sep 2020; by Jan 2026 = payment ~65
    const mortgageBalances: Record<number, number> = { 1: 286020, 2: 285310, 3: 284598, 4: 283884 };
    const mortgagePaymentsMade: Record<number, number> = { 1: 65, 2: 66, 3: 67, 4: 68 };
    await prisma.loanSnapshot.create({
      data: {
        loanId: mortgageLoan.id, reviewId: review.id,
        balance: cents(mortgageBalances[rm.month]),
        paymentsMade: mortgagePaymentsMade[rm.month],
        interestPaid: cents(626),
        extraPayment: 0,
      },
    });

    // School loans: balance, paymentsMade per month
    type LoanMonthData = { bal: number; pmts: number; interest: number; extra: number };
    const schoolData: Record<number, LoanMonthData[]> = {
      // [jan, feb, mar, apr] for each school loan (idx 0–7)
      0: [{ bal: 4970, pmts: 101, interest: 19, extra: 0 }, { bal: 4924, pmts: 102, interest: 19, extra: 0 }, { bal: 4878, pmts: 103, interest: 18, extra: 0 }, { bal: 4832, pmts: 104, interest: 18, extra: 0 }],
      1: [{ bal: 5844, pmts: 97, interest: 17, extra: 0 }, { bal: 5792, pmts: 98, interest: 16, extra: 0 }, { bal: 5740, pmts: 99, interest: 16, extra: 0 }, { bal: 5688, pmts: 100, interest: 16, extra: 0 }],
      2: [{ bal: 5117, pmts: 97, interest: 14, extra: 0 }, { bal: 5072, pmts: 98, interest: 14, extra: 0 }, { bal: 5027, pmts: 99, interest: 14, extra: 0 }, { bal: 4982, pmts: 100, interest: 14, extra: 0 }],
      3: [{ bal: 5310, pmts: 91, interest: 15, extra: 0 }, { bal: 5264, pmts: 92, interest: 15, extra: 0 }, { bal: 5218, pmts: 93, interest: 15, extra: 0 }, { bal: 5172, pmts: 94, interest: 15, extra: 0 }],
      4: [{ bal: 4620, pmts: 100, interest: 19, extra: 0 }, { bal: 4564, pmts: 101, interest: 19, extra: 0 }, { bal: 4508, pmts: 102, interest: 18, extra: 0 }, { bal: 4452, pmts: 103, interest: 18, extra: 0 }],
      5: [{ bal: 5282, pmts: 97, interest: 22, extra: 0 }, { bal: 5220, pmts: 98, interest: 21, extra: 0 }, { bal: 5158, pmts: 99, interest: 21, extra: 0 }, { bal: 5096, pmts: 100, interest: 21, extra: 0 }],
      6: [{ bal: 17626, pmts: 98, interest: 88, extra: 5000 }, { bal: 17470, pmts: 99, interest: 87, extra: 5000 }, { bal: 17312, pmts: 100, interest: 87, extra: 5000 }, { bal: 17152, pmts: 101, interest: 86, extra: 5000 }],
      7: [{ bal: 4088, pmts: 97, interest: 20, extra: 0 }, { bal: 4049, pmts: 98, interest: 20, extra: 0 }, { bal: 4010, pmts: 99, interest: 20, extra: 0 }, { bal: 3971, pmts: 100, interest: 20, extra: 0 }],
    };
    for (let i = 0; i < schoolLoans.length; i++) {
      const d = schoolData[i][rm.month - 1];
      await prisma.loanSnapshot.create({
        data: {
          loanId: schoolLoans[i].id, reviewId: review.id,
          balance: cents(d.bal),
          paymentsMade: d.pmts,
          interestPaid: cents(d.interest),
          extraPayment: d.extra,
        },
      });
    }

    // Holding snapshots — per purchase lot, realistic monthly prices
    type PriceMap = Record<string, number>;
    const pricesByMonth: Record<number, PriceMap> = {
      1: { FXAIX: 198.42, FSKAX: 132.15, VTI: 248.80, VXUS: 62.14, VTSAX: 132.15, VTIAX: 39.82, AAPL: 232.15, MSFT: 418.50 },
      2: { FXAIX: 195.12, FSKAX: 129.88, VTI: 244.20, VXUS: 61.45, VTSAX: 129.88, VTIAX: 39.12, AAPL: 228.40, MSFT: 408.20 },
      3: { FXAIX: 201.55, FSKAX: 134.22, VTI: 252.40, VXUS: 63.20, VTSAX: 134.22, VTIAX: 40.55, AAPL: 235.60, MSFT: 425.80 },
      4: { FXAIX: 204.18, FSKAX: 136.44, VTI: 255.85, VXUS: 64.10, VTSAX: 136.44, VTIAX: 41.20, AAPL: 238.90, MSFT: 432.10 },
    };
    const prices = pricesByMonth[rm.month];

    for (const purchase of allPurchases) {
      const price = prices[purchase.ticker];
      if (!price) continue;
      const priceInCents = cents(price);
      const value = Math.round(purchase.shares * priceInCents);
      const lotCostBasis = Math.round(purchase.shares * purchase.pricePerShare);
      await prisma.holdingSnapshot.create({
        data: {
          purchaseId: purchase.id,
          reviewId: review.id,
          price: priceInCents,
          value,
          gainLoss: value - lotCostBasis,
        },
      });
    }

    // Vault snapshots — monthly amounts from fixed allocations
    for (const v of fixedVaults) {
      const monthly = v.target != null ? Math.round(v.target / v.rateMonths) : 0;
      await prisma.vaultSnapshot.create({ data: { vaultId: v.id, reviewId: review.id, amount: monthly } });
    }
    // Treasury distribution snapshot (amount = treasuryPct% of a sample treasury pool)
    const sampleTreasury = cents(3746.04);
    for (const v of variableVaults) {
      const amount = Math.round(sampleTreasury * (v.treasuryPct / 100));
      await prisma.vaultSnapshot.create({ data: { vaultId: v.id, reviewId: review.id, amount } });
    }

    // Review steps — mark all COMPLETE for completed reviews
    const monthlySteps = ['expense', 'monthly', 'savings', 'investments', 'vaults', 'finalize'];
    const quarterlySteps = ['expense', 'monthly', 'savings', 'loans', 'investments', 'portfolio', 'vaults', 'finalize'];
    const steps = rm.type === 'QUARTERLY' ? quarterlySteps : monthlySteps;

    for (const stepKey of steps) {
      await prisma.reviewStep.create({
        data: {
          reviewId: review.id,
          stepKey,
          status: rm.status === 'COMPLETE' ? 'COMPLETE' : 'PENDING',
          data: '{}',
        },
      });
    }
  }

  console.log('✅ Seed complete!');
  console.log(`   Household: Beals-Gibson (PIN: 1234)`);
  console.log(`   Members: Allan, Malia`);
  console.log(`   Reviews: Jan–Apr 2026 (Jan is quarterly, Feb–Apr monthly)`);
  console.log(`   April 2026 is IN_PROGRESS (active review)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
