/**
 * One-shot production baseline import script.
 * Wipes data/prod.db, backs up any existing version, and imports
 * historical 2026 financial data from the Google Sheet constants.
 *
 * Run: yarn db:import-prod
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

import {
  MONTHLY_ENTRIES,
  EXPENSE_CATEGORIES,
  CATEGORY_LABEL_MAP,
  SAVINGS_ACCOUNTS,
  MORTGAGE,
  SCHOOL_LOANS,
  RETIREMENT_ACCOUNTS,
  TAXABLE_LOTS,
  RETIREMENT_LOTS,
  CURRENT_PRICES,
  VAULTS,
} from "./lib/sheet-data.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cents = (dollars: number) => Math.round(dollars * 100);
const d = (iso: string) => new Date(iso);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const prompt = (q: string): Promise<string> =>
  new Promise((res) => rl.question(q, (a) => res(a.trim())));

async function ask(question: string, defaultValue: string): Promise<string> {
  const ans = await prompt(`${question} [${defaultValue}]: `);
  return ans || defaultValue;
}

// ─── Backup ───────────────────────────────────────────────────────────────────

function backupIfExists(dbPath: string) {
  if (!fs.existsSync(dbPath)) return;
  const backupsDir = path.join(path.dirname(dbPath), "backups");
  fs.mkdirSync(backupsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const dest = path.join(backupsDir, `prod-${ts}.db`);
  fs.copyFileSync(dbPath, dest);
  console.log(`  ✓ Backed up existing prod.db → ${dest}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱 Production baseline import\n");

  // ── Prompts ────────────────────────────────────────────────────────────────
  const householdName = await ask("Household name", "Beals-Gibson");
  const pin = await ask("PIN (4 digits)", "1234");
  const allanEmail = await ask("Allan email", "");
  const maliaEmail = await ask("Malia email", "");

  const hysaNewHouseInstitution = await ask(
    "Institution for HYSA New House",
    "",
  );
  const child1Institution = await ask("Institution for Child 1 account", "");
  const child2Institution = await ask("Institution for Child 2 account", "");

  const schoolLoanStartDate = await ask(
    "School loan start date (YYYY-MM-DD)",
    "2015-10-01",
  );
  const brokerageAccountName = await ask(
    "Taxable brokerage account name",
    "Brokerage",
  );
  const brokerageInstitution = await ask(
    "Taxable brokerage institution",
    "Robinhood",
  );

  const collapseSchoolLoans = await ask(
    "Collapse 8 school loan tranches into one loan? (y/n)",
    "n",
  );
  const singleLoan = collapseSchoolLoans.toLowerCase() === "y";

  rl.close();
  console.log("\nImporting...\n");

  // ── DB path ────────────────────────────────────────────────────────────────
  const dbUrl = process.env.DATABASE_URL ?? "file:../data/prod.db";
  const filePath = dbUrl.replace(/^file:/, "");
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  backupIfExists(absPath);

  // ── Apply migrations to ensure schema exists ───────────────────────────────
  console.log("  Applying migrations...");
  const { execFileSync } = await import("child_process");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  console.log("  ✓ Migrations applied");

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  // ── Wipe ───────────────────────────────────────────────────────────────────
  await prisma.session.deleteMany();
  await prisma.vaultSnapshot.deleteMany();
  await prisma.holdingSnapshot.deleteMany();
  await prisma.retirementSnapshot.deleteMany();
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
  console.log("  ✓ Wiped existing data");

  // ── Household ──────────────────────────────────────────────────────────────
  const pinHash = await bcrypt.hash(pin, 10);
  const household = await prisma.household.create({
    data: { name: householdName, pinHash },
  });

  // ── Members ────────────────────────────────────────────────────────────────
  const allan = await prisma.member.create({
    data: {
      householdId: household.id,
      name: "Allan",
      email: allanEmail,
      color: "#3B82F6",
    },
  });
  const malia = await prisma.member.create({
    data: {
      householdId: household.id,
      name: "Malia",
      email: maliaEmail,
      color: "#EC4899",
    },
  });
  const memberByPrefix: Record<string, typeof allan> = {
    "Allan: ": allan,
    "Malia: ": malia,
  };
  console.log("  ✓ Household + members");

  // ── Expense Categories ─────────────────────────────────────────────────────
  const expenseCategoryMap = new Map<string, number>(); // canonical name → id
  for (const cat of EXPENSE_CATEGORIES) {
    const created = await prisma.expenseCategory.create({
      data: {
        householdId: household.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        sortOrder: cat.sortOrder,
      },
    });
    expenseCategoryMap.set(cat.name, created.id);
  }
  console.log(`  ✓ ${EXPENSE_CATEGORIES.length} expense categories`);

  // ── Investment Categories ──────────────────────────────────────────────────
  const invCatColors: Record<string, string> = {
    Technology: "#2563EB",
    Social: "#7C3AED",
    Transportation: "#D97706",
    Entertainment: "#EC4899",
    Consumer: "#16A34A",
    Utilities: "#15803D",
    "Index Fund": "#4F46E5",
    Bonds: "#4338CA",
    Finance: "#C2410C",
  };
  let invCatOrder = 1;
  for (const [name, color] of Object.entries(invCatColors)) {
    await prisma.investmentCategory.create({
      data: {
        householdId: household.id,
        name,
        color,
        sortOrder: invCatOrder++,
      },
    });
  }
  console.log(`  ✓ ${invCatOrder - 1} investment categories`);

  // ── Savings Accounts ───────────────────────────────────────────────────────
  const institutionOverrides: Record<string, string> = {
    "HYSA New House": hysaNewHouseInstitution,
    "Child 1": child1Institution,
    "Child 2": child2Institution,
  };
  const savingsAccountIds: number[] = [];
  for (const acc of SAVINGS_ACCOUNTS) {
    const institution = institutionOverrides[acc.name] ?? acc.institution;
    const created = await prisma.savingsAccount.create({
      data: {
        householdId: household.id,
        name: acc.name,
        type: acc.type,
        institution,
        rate: acc.rate,
        goal: acc.goalCents,
      },
    });
    savingsAccountIds.push(created.id);
  }
  console.log(`  ✓ ${SAVINGS_ACCOUNTS.length} savings accounts`);

  // ── Loans ──────────────────────────────────────────────────────────────────
  const mortgageLoan = await prisma.loan.create({
    data: {
      householdId: household.id,
      name: MORTGAGE.name,
      category: "MORTGAGE",
      principal: cents(MORTGAGE.principal),
      rate: MORTGAGE.rate,
      termMonths: MORTGAGE.termMonths,
      startDate: d(MORTGAGE.startDate),
    },
  });

  const schoolLoanRecords: Array<{ id: number; name: string }> = [];
  if (singleLoan) {
    const totalBalance = SCHOOL_LOANS.reduce((s, l) => s + l.balance, 0);
    const avgRate =
      SCHOOL_LOANS.reduce((s, l) => s + l.rate, 0) / SCHOOL_LOANS.length;
    const created = await prisma.loan.create({
      data: {
        householdId: household.id,
        name: "School Loans (consolidated)",
        category: "SCHOOL",
        principal: cents(totalBalance),
        rate: avgRate,
        termMonths: 150,
        startDate: d(schoolLoanStartDate),
      },
    });
    schoolLoanRecords.push({ id: created.id, name: created.name });
  } else {
    for (const sl of SCHOOL_LOANS) {
      const created = await prisma.loan.create({
        data: {
          householdId: household.id,
          name: sl.name,
          category: "SCHOOL",
          principal: cents(sl.balance),
          rate: sl.rate,
          termMonths: sl.termMonths,
          startDate: d(schoolLoanStartDate),
        },
      });
      schoolLoanRecords.push({ id: created.id, name: created.name });
    }
  }
  console.log(`  ✓ Mortgage + ${schoolLoanRecords.length} school loan(s)`);

  // ── Investment Accounts ────────────────────────────────────────────────────
  const taxableAccount = await prisma.investmentAccount.create({
    data: {
      householdId: household.id,
      name: brokerageAccountName,
      type: "TAXABLE",
      institution: brokerageInstitution,
      ownerMemberId: null, // shared
    },
  });

  // Map retirement account name → prisma record
  const retirementAccountMap = new Map<string, number>();
  for (const acc of RETIREMENT_ACCOUNTS) {
    if (acc.marBalance === 0 && acc.name === "Airbnb 401k") {
      // Airbnb 401k is folded under Uber 401k for balance purposes but needs its own account for lot routing
    }
    const owner = acc.owner === "Allan" ? allan : malia;
    const created = await prisma.investmentAccount.create({
      data: {
        householdId: household.id,
        name: acc.name,
        type: acc.type,
        institution: acc.institution,
        ownerMemberId: owner.id,
      },
    });
    retirementAccountMap.set(acc.name, created.id);
  }
  // BSD 403b used 'BSD 403b' but sheet note is 'BSD - 403b' — alias it
  const bsdId = retirementAccountMap.get("BSD 403b");
  if (bsdId) retirementAccountMap.set("BSD - 403b", bsdId);

  console.log(`  ✓ ${1 + RETIREMENT_ACCOUNTS.length} investment accounts`);

  // ── Vaults ─────────────────────────────────────────────────────────────────
  const vaultRecords: Array<{ id: number; vault: (typeof VAULTS)[0] }> = [];
  for (const v of VAULTS) {
    let ownerMemberId: number | null = null;
    if (v.who === "ABG") ownerMemberId = allan.id;
    if (v.who === "Mal") ownerMemberId = malia.id;

    const created = await prisma.vault.create({
      data: {
        householdId: household.id,
        name: v.description,
        type: v.type,
        category: v.category,
        ownerMemberId,
        target: cents(v.goalDollars),
        frequency: v.frequency,
        rateMonths: v.rateMonths,
        dueMonths: v.dueMonths,
        sortOrder: v.sortOrder,
        description: v.description,
        currentBalance: v.currentDollars != null ? cents(v.currentDollars) : 0,
      },
    });
    vaultRecords.push({ id: created.id, vault: v });
  }
  console.log(`  ✓ ${VAULTS.length} vaults`);

  // ── Vault Category Order ───────────────────────────────────────────────────
  const seenCategories = new Set<string>();
  for (const v of VAULTS) {
    if (!seenCategories.has(v.category)) {
      seenCategories.add(v.category);
      await prisma.vaultCategoryOrder.create({
        data: {
          householdId: household.id,
          category: v.category,
          groupOrder: v.groupOrder,
        },
      });
    }
  }
  console.log(`  ✓ ${seenCategories.size} vault category orders`);

  // ── Reviews ────────────────────────────────────────────────────────────────
  const reviewMonths = [
    { month: 1, completedAt: "2026-02-01", lastDay: "2026-01-31" },
    { month: 2, completedAt: "2026-03-01", lastDay: "2026-02-28" },
    { month: 3, completedAt: "2026-04-01", lastDay: "2026-03-31" },
  ];

  const monthlySteps = [
    "expense",
    "monthly",
    "savings",
    "investments",
    "vaults",
    "finalize",
  ];

  // Build category id lookup: sheet label → db id
  const categoryIdByLabel = (label: string): number | null => {
    const name = CATEGORY_LABEL_MAP[label];
    if (!name) return null;
    return expenseCategoryMap.get(name) ?? null;
  };

  for (const rm of reviewMonths) {
    const review = await prisma.review.create({
      data: {
        householdId: household.id,
        periodYear: 2026,
        periodMonth: rm.month,
        type: "MONTHLY",
        status: "COMPLETE",
        currentStep: "finalize",
        lastEditorId: allan.id,
        completedAt: d(rm.completedAt),
      },
    });

    // Review steps
    for (const stepKey of monthlySteps) {
      await prisma.reviewStep.create({
        data: { reviewId: review.id, stepKey, status: "COMPLETE", data: "{}" },
      });
    }

    // Income entries
    const incomeEntries = MONTHLY_ENTRIES.filter(
      (e) => e.month === rm.month && e.type === "Income" && e.amount > 0,
    );
    for (const entry of incomeEntries) {
      let memberId: number | null = null;
      for (const [prefix, member] of Object.entries(memberByPrefix)) {
        if (entry.title.startsWith(prefix)) {
          memberId = member.id;
          break;
        }
      }
      const name = entry.title.replace(/^(Allan|Malia): /, "");
      await prisma.incomeEntry.create({
        data: {
          reviewId: review.id,
          memberId: memberId ?? allan.id,
          name,
          notes: entry.notes ?? null,
          amount: cents(entry.amount),
        },
      });
    }

    // Expense entries
    const expenseEntries = MONTHLY_ENTRIES.filter(
      (e) => e.month === rm.month && e.type === "Expense" && e.amount > 0,
    );
    for (const entry of expenseEntries) {
      const categoryId = categoryIdByLabel(entry.category);
      if (!categoryId) {
        console.warn(
          `    ⚠ Unknown category "${entry.category}" for "${entry.title}", skipping`,
        );
        continue;
      }
      let memberId: number | null = null;
      for (const [prefix, member] of Object.entries(memberByPrefix)) {
        if (entry.title.startsWith(prefix)) {
          memberId = member.id;
          break;
        }
      }
      const name = entry.title.replace(/^(Allan|Malia): /, "");
      await prisma.expenseEntry.create({
        data: {
          reviewId: review.id,
          categoryId,
          memberId, // null = shared
          name,
          notes: entry.notes ?? null,
          amount: cents(entry.amount),
          date: d(`${rm.lastDay}T12:00:00Z`),
        },
      });
    }

    // Savings snapshots
    for (let i = 0; i < SAVINGS_ACCOUNTS.length; i++) {
      const acc = SAVINGS_ACCOUNTS[i];
      const monthKey = rm.month === 1 ? "jan" : rm.month === 2 ? "feb" : "mar";

      // Running total from starting balance up to (but not including) this month
      let runningBalance = acc.inputByMonth.starting;
      for (const mk of ["jan", "feb", "mar"] as const) {
        if (mk === monthKey) break;
        runningBalance += acc.inputByMonth[mk] + acc.interestByMonth[mk];
      }
      const deposits =
        acc.inputByMonth[monthKey as keyof typeof acc.inputByMonth];
      const interest =
        acc.interestByMonth[monthKey as keyof typeof acc.interestByMonth];
      const ending = runningBalance + deposits + interest;

      await prisma.savingsSnapshot.create({
        data: {
          accountId: savingsAccountIds[i],
          reviewId: review.id,
          startingBalance: cents(runningBalance),
          deposits: cents(deposits),
          interest: cents(interest),
          endingBalance: cents(ending),
        },
      });
    }

    // Loan snapshots (March only — quarterly cadence)
    if (rm.month === 3) {
      // Mortgage
      await prisma.loanSnapshot.create({
        data: {
          loanId: mortgageLoan.id,
          reviewId: review.id,
          balance: cents(MORTGAGE.marBalance),
          paymentsMade: MORTGAGE.marPaymentNum,
          interestPaid: cents(MORTGAGE.marInterestPaid),
          paymentAmount: cents(1337.5),
          principalAmount: cents(1337.5 - MORTGAGE.marInterestPaid),
          extraPayment: 0,
        },
      });

      // School loans
      if (singleLoan && schoolLoanRecords[0]) {
        const totalBalance = SCHOOL_LOANS.reduce((s, l) => s + l.balance, 0);
        await prisma.loanSnapshot.create({
          data: {
            loanId: schoolLoanRecords[0].id,
            reviewId: review.id,
            balance: cents(totalBalance),
            paymentsMade: 0,
            interestPaid: cents(
              SCHOOL_LOANS.reduce((s, l) => s + (l.balance * l.rate) / 12, 0),
            ),
            extraPayment: 0,
          },
        });
      } else {
        for (let i = 0; i < schoolLoanRecords.length; i++) {
          const sl = SCHOOL_LOANS[i];
          if (!sl) continue;
          const monthlyInterest = (sl.balance * sl.rate) / 12;
          await prisma.loanSnapshot.create({
            data: {
              loanId: schoolLoanRecords[i].id,
              reviewId: review.id,
              balance: cents(sl.balance),
              paymentsMade: 150 - sl.termMonths,
              interestPaid: cents(monthlyInterest),
              extraPayment: 0,
            },
          });
        }
      }
    }

    // Purchase lots + holding snapshots (only on March review)
    if (rm.month === 3) {
      // Insert taxable purchase lots
      const taxablePurchaseIds: Array<{
        id: number;
        ticker: string;
        shares: number;
        pricePerShare: number;
      }> = [];
      for (const lot of TAXABLE_LOTS) {
        const p = await prisma.purchase.create({
          data: {
            accountId: taxableAccount.id,
            ticker: lot.ticker,
            name: lot.name,
            category: lot.category,
            purchaseDate: d(lot.purchaseDate),
            pricePerShare: cents(lot.pricePerShare),
            shares: lot.shares,
          },
        });
        taxablePurchaseIds.push({
          id: p.id,
          ticker: lot.ticker,
          shares: lot.shares,
          pricePerShare: p.pricePerShare,
        });
      }

      // Insert retirement purchase lots
      for (const lot of RETIREMENT_LOTS) {
        const accId = retirementAccountMap.get(lot.account);
        if (!accId) {
          console.warn(
            `    ⚠ No account found for "${lot.account}", skipping lot ${lot.ticker}`,
          );
          continue;
        }
        await prisma.purchase.create({
          data: {
            accountId: accId,
            ticker: lot.ticker,
            name: lot.name,
            category: lot.category,
            purchaseDate: d(lot.purchaseDate),
            pricePerShare: cents(lot.pricePerShare),
            shares: lot.shares,
          },
        });
      }

      // Holding snapshots for taxable lots
      for (const p of taxablePurchaseIds) {
        const currentPrice = CURRENT_PRICES[p.ticker];
        if (!currentPrice) {
          console.warn(
            `    ⚠ No current price for ${p.ticker}, skipping holding snapshot`,
          );
          continue;
        }
        const priceInCents = cents(currentPrice);
        const value = Math.round(p.shares * priceInCents);
        const costBasis = Math.round(p.shares * p.pricePerShare);
        await prisma.holdingSnapshot.create({
          data: {
            purchaseId: p.id,
            reviewId: review.id,
            price: priceInCents,
            value,
            gainLoss: value - costBasis,
          },
        });
      }

      // Retirement snapshots per account
      for (const acc of RETIREMENT_ACCOUNTS) {
        if (acc.marBalance <= 0) continue;
        const accId = retirementAccountMap.get(acc.name);
        if (!accId) continue;
        await prisma.retirementSnapshot.create({
          data: {
            accountId: accId,
            reviewId: review.id,
            balance: cents(acc.marBalance),
          },
        });
      }

      // Vault snapshots (March only)
      for (const { id, vault } of vaultRecords) {
        let amount: number;
        if (vault.type === "FIXED") {
          amount = Math.round(cents(vault.goalDollars) / vault.rateMonths);
        } else {
          amount = cents(vault.currentDollars ?? 0);
        }
        await prisma.vaultSnapshot.create({
          data: { vaultId: id, reviewId: review.id, amount },
        });
      }
    }

    const incomeCount = incomeEntries.length;
    const expenseCount = expenseEntries.filter((e) => e.amount > 0).length;
    console.log(
      `  ✓ Review ${rm.month}/2026 — ${incomeCount} income, ${expenseCount} expense entries`,
    );
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n✅ Import complete!");
  console.log(`   Household: ${householdName} (PIN: ${pin})`);
  console.log(`   Members: Allan, Malia`);
  console.log(`   Reviews: January, February, March 2026 (all COMPLETE)`);
  console.log(`   Loan snapshots: March review only (quarterly cadence)`);
  console.log(`   Holdings/investments: March review only`);
  console.log(`\nVerify with: DATABASE_URL="${dbUrl}" yarn db:studio`);
  console.log(`       or:   DATABASE_URL="${dbUrl}" yarn dev\n`);
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
