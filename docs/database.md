# Database

The app uses **SQLite** via **Prisma ORM**. The database file lives at `data/dev.db` (development) and `data/prod.db` (production).

---

## Prisma CLI Commands

```bash
# Apply pending migrations to your local dev DB
yarn db:migrate

# Seed the DB with sample household data (see "Seed Data" section)
yarn db:seed

# Wipe + re-seed (destructive — deletes all data)
yarn db:reset

# Open Prisma Studio — visual GUI for browsing/editing data
yarn db:studio

# Create a backup snapshot of the production database
yarn db:backup

# Deploy migrations in production (no prompts)
yarn db:deploy
```

### Creating a new migration

When you change `prisma/schema.prisma`:

```bash
yarn db:migrate
# Prisma prompts you to name the migration, e.g. "add_vault_description"
# It creates prisma/migrations/TIMESTAMP_add_vault_description/migration.sql
# and applies it to your dev DB
```

Never edit migration files manually after they are created.

---

## Schema Overview

```
Household
  ├── Member[]
  ├── Review[]
  │     ├── ReviewStep[]
  │     ├── IncomeEntry[]
  │     ├── ExpenseEntry[]
  │     ├── SavingsSnapshot[]        (one per SavingsAccount per review)
  │     ├── LoanSnapshot[]           (one per Loan per review)
  │     ├── HoldingSnapshot[]        (one per Purchase per review)
  │     ├── RetirementSnapshot[]     (one per InvestmentAccount per review)
  │     └── VaultSnapshot[]          (one per Vault per review)
  ├── ExpenseCategory[]
  ├── InvestmentCategory[]
  ├── SavingsAccount[]
  ├── Loan[]
  ├── InvestmentAccount[]
  │     └── Purchase[]
  └── Vault[]
```

---

## Models

### Household
The top-level aggregate. One household per installation.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | Primary key |
| name | String | e.g. "Beals-Gibson" |
| pinHash | String | bcryptjs hash of the shared PIN |
| createdAt | DateTime | |

### Member
A household member who can log in and be associated with entries.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | FK → Household |
| name | String | Display name |
| email | String? | Optional |
| color | String | Hex color for UI chips, e.g. "#3B82F6" |
| createdAt | DateTime | |

### Review
One financial review period. Either monthly or quarterly.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | FK → Household |
| periodYear | Int | e.g. 2026 |
| periodMonth | Int | 1–12 |
| type | ReviewType | MONTHLY or QUARTERLY |
| status | ReviewStatus | IN_PROGRESS, COMPLETE, SKIPPED |
| currentStep | String | stepKey of the current wizard step |
| lastEditorId | Int? | FK → Member who last edited |
| lockedForEdit | Boolean | Prevents concurrent edits |
| createdAt | DateTime | |
| completedAt | DateTime? | Set when finalized |

### ReviewStep
Tracks completion status of each wizard step within a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| reviewId | Int | FK → Review |
| stepKey | String | e.g. "expense", "savings", "finalize" |
| status | StepStatus | PENDING, COMPLETE, SKIPPED |
| data | String? | JSON blob for step-specific data |

Unique constraint: **(reviewId, stepKey)**

### IncomeEntry
One income line item in a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| reviewId | Int | |
| memberId | Int | |
| name | String | e.g. "Salary", "Bonus" |
| notes | String? | |
| amount | Int | **Cents** |

### ExpenseEntry
One expense line item in a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| reviewId | Int | |
| categoryId | Int | FK → ExpenseCategory |
| memberId | Int? | |
| name | String | e.g. "Whole Foods", "Netflix" |
| notes | String? | |
| amount | Int | **Cents** |
| date | DateTime | |

### ExpenseCategory
Configurable expense buckets (Housing, Groceries, etc.).

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | |
| icon | String? | Emoji or icon name |
| color | String? | Hex color |
| sortOrder | Int | Display order |

### SavingsAccount
A bank account tracked across reviews.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | e.g. "Marcus HYSA" |
| type | SavingsAccountType | HYSA, CHECKING, SAVINGS |
| institution | String? | e.g. "Goldman Sachs" |
| rate | Float? | APY as decimal, e.g. 0.0450 = 4.50% |
| goal | Int? | Target balance in **cents** |

### SavingsSnapshot
Balance snapshot for a savings account within a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| accountId | Int | FK → SavingsAccount |
| reviewId | Int | FK → Review |
| startingBalance | Int | **Cents** |
| deposits | Int | **Cents** |
| interest | Int | **Cents** |
| endingBalance | Int | **Cents** |

Unique constraint: **(accountId, reviewId)**

### Loan
A mortgage or school loan tracked across reviews.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | e.g. "Mortgage", "Fed Loan A" |
| category | String? | "mortgage" or "school" |
| principal | Int | Original principal in **cents** |
| rate | Float | Annual interest rate as decimal |
| termMonths | Int | Original loan term in months |
| startDate | DateTime | |
| paidOff | Boolean | |
| mortgageInsurance | Int? | Monthly PMI in **cents** |
| otherFees | Int? | Monthly fees in **cents** |
| propertyTax | Int? | Monthly property tax in **cents** |
| hoa | Int? | Monthly HOA in **cents** |
| homeownersInsurance | Int? | Monthly HO insurance in **cents** |
| homeValue | Int? | Current home value in **cents** |
| pmiDropBalance | Int? | Balance at which PMI drops in **cents** |

### LoanSnapshot
Snapshot of a loan's state within a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| loanId | Int | |
| reviewId | Int | |
| balance | Int | **Cents** |
| paymentsMade | Int | Count of payments |
| interestPaid | Int | **Cents** |
| extraPayment | Int | **Cents** |
| paymentAmount | Int | **Cents** |
| principalAmount | Int | **Cents** |

Unique constraint: **(loanId, reviewId)**

### InvestmentCategory
Tags for grouping investment holdings (e.g. "Index Fund", "Technology").

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | |
| color | String | Hex color |
| sortOrder | Int | |

### InvestmentAccount
A brokerage or retirement account.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | e.g. "Fidelity 401(k)" |
| type | InvestmentAccountType | TAXABLE, TRADITIONAL_401K, ROTH_401K, TRADITIONAL_IRA, ROTH_IRA, HSA, OTHER |
| institution | String? | |
| ownerMemberId | Int? | FK → Member (null = shared) |

### Purchase
A stock/fund purchase lot within an investment account.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| accountId | Int | FK → InvestmentAccount |
| ticker | String | e.g. "VTI" |
| name | String | e.g. "Vanguard Total Market" |
| category | String? | Matches InvestmentCategory.name |
| purchaseDate | DateTime | |
| pricePerShare | Int | **Cents** |
| shares | Float | Number of shares |

### RetirementSnapshot
Balance snapshot for a non-TAXABLE investment account per review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| accountId | Int | FK → InvestmentAccount |
| reviewId | Int | |
| balance | Int | **Cents** |

Unique constraint: **(accountId, reviewId)**

### HoldingSnapshot
Market value snapshot for a purchase lot per review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| purchaseId | Int | FK → Purchase |
| reviewId | Int | |
| price | Int | Market price per share in **cents** |
| value | Int | Total value in **cents** |
| gainLoss | Int | **Cents** |

Unique constraint: **(purchaseId, reviewId)**

### Vault
A budget allocation bucket (e.g. "Car Insurance", "Emergency Fund").

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| householdId | Int | |
| name | String | |
| type | VaultType | FIXED, VARIABLE, GOAL |
| category | String? | "Bills", "Personal", "Pre-Pay", "Replenish", "Investments" |
| ownerMemberId | Int? | null = shared |
| target | Int | Target amount in **cents** |
| allocation | Int | Monthly allocation in **cents** |
| frequency | String? | "MONTHLY", "3-MONTH", "6-MONTH", "1-YEAR", etc. |
| rateMonths | Int? | Frequency divisor (1, 3, 6, 12) |
| currentBalance | Int | Current balance in **cents** |
| sortOrder | Int | |
| description | String? | |
| dueMonths | String? | Months when bills are due (JSON array) |

### VaultSnapshot
Snapshot of vault contribution for a review.

| Field | Type | Notes |
|-------|------|-------|
| id | Int | |
| vaultId | Int | |
| reviewId | Int | |
| amount | Int | Contribution in **cents** |

Unique constraint: **(vaultId, reviewId)**

---

## Enums

```prisma
enum ReviewType        { MONTHLY QUARTERLY }
enum ReviewStatus      { IN_PROGRESS COMPLETE SKIPPED }
enum StepStatus        { PENDING COMPLETE SKIPPED }
enum SavingsAccountType { HYSA CHECKING SAVINGS }
enum InvestmentAccountType {
  TAXABLE TRADITIONAL_401K ROTH_401K TRADITIONAL_IRA ROTH_IRA HSA OTHER
}
enum VaultType         { FIXED VARIABLE GOAL }
```

---

## Seed Data

The seed script (`prisma/seed.ts`) populates the database with realistic sample data for development and testing.

**What it creates:**
- 1 household: "Beals-Gibson"
- 2 members: Allan (blue #3B82F6), Malia (pink #EC4899)
- PIN: **1234** (shared household PIN)
- 12 expense categories (Housing, Groceries, Transportation, etc.)
- 10 investment categories (Index Fund, Technology, Bonds, etc.)
- 2 savings accounts (Marcus HYSA, Joint Checking)
- 1 mortgage + 8 school loans
- 5 investment accounts (401k, Roth IRA, 403b, HSA, Taxable Brokerage)
- ~10 stock purchase lots (VTI, VOO, AAPL, AMZN, etc.)
- 5 vaults (Bills, Personal, Pre-Pay, Replenish, Investments)
- 4 completed reviews (Jan–Mar 2026) + 1 in-progress (Apr 2026)
- Expense/income entries, savings snapshots, loan snapshots for each review

```bash
# Run seed (additive — won't duplicate if already seeded)
yarn db:seed

# Wipe everything first, then seed fresh
yarn db:reset
```

---

## Working with Prisma Studio

Prisma Studio is a visual database browser — useful for inspecting data without writing SQL.

```bash
yarn db:studio
# Opens http://localhost:5555
```

You can view, edit, add, and delete records directly. Useful for:
- Changing a PIN hash
- Inspecting snapshots
- Debugging unexpected data

---

## Common Database Tasks

### Change the household PIN

The PIN is stored as a bcryptjs hash on the `Household` record. To change it:

```bash
yarn db:studio
# Navigate to Household → select the record → edit pinHash field
```

Or with a one-liner (replace `NEW_PIN` with e.g. `5678`):

```bash
node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('NEW_PIN', 10);
console.log(hash);
"
```

Then paste the resulting hash into Prisma Studio's `pinHash` field.

### Inspect a specific review

```bash
yarn db:studio
# Navigate to Review → filter by id or periodMonth
```

### Reset the test database

```bash
# The test DB is at data/test.db
# Vitest automatically uses it (DATABASE_URL=file:../data/test.db in vitest.config.ts)
# To reset:
rm data/test.db
yarn db:migrate   # re-applies all migrations to dev.db (test.db is created by tests)
```
