# API Reference

All routes are under `/api/`. Every route except `GET /api/households/members` requires a valid session cookie.

Request bodies are JSON. Responses are JSON. All monetary values are **integer cents**.

---

## Auth

### `POST /api/auth/login`
Verify PIN and create a session.

**Body**: `{ memberId: number, pin: string }`

**Response**: `{ memberId, memberName, householdId, householdName, members[] }`

**Errors**: `401` invalid PIN, `404` member not found

---

### `GET /api/auth/logout`
Destroy the current session and redirect to `/login`.

---

### `GET /api/auth/session`
Verify the current session and return session info.

**Response**: `{ memberId, memberName, memberColor, householdId, householdName, members[] }`

**Errors**: `401` no/expired session

---

## Households

### `GET /api/households/members`
**Public** — no auth required. Returns all members for the login screen.

**Response**: `{ members: Member[] }`

---

## Reviews

### `GET /api/reviews`
List all reviews for the household.

**Response**: `{ reviews: Review[] }`

---

### `POST /api/reviews`
Create a new review.

**Body**: `{ periodYear: number, periodMonth: number, type: 'MONTHLY' | 'QUARTERLY' }`

**Response**: `{ review: Review }`

**Errors**: `409` a review already exists for that month/year

---

### `GET /api/reviews/[id]`
Get a single review with its steps.

**Response**: `{ review: Review & { steps: ReviewStep[] } }`

---

### `GET /api/reviews/[id]/expenses`
Get all expense entries for a review.

**Response**: `{ entries: ExpenseEntry[], categories: ExpenseCategory[] }`

---

### `POST /api/reviews/[id]/expenses`
Add an expense entry.

**Body**: `{ name, categoryId, amount (cents), date (ISO string), memberId?, notes? }`

**Response**: `{ entry: ExpenseEntry }`

---

### `DELETE /api/reviews/[id]/expenses/[entryId]`
Delete an expense entry.

**Response**: `{ ok: true }`

---

### `GET /api/reviews/[id]/income`
Get all income entries for a review.

**Response**: `{ entries: IncomeEntry[] }`

---

### `POST /api/reviews/[id]/income`
Add an income entry.

**Body**: `{ name, amount (cents), memberId?, notes? }`

**Response**: `{ entry: IncomeEntry }`

---

### `DELETE /api/reviews/[id]/income/[entryId]`
Delete an income entry.

**Response**: `{ ok: true }`

---

### `GET /api/reviews/[id]/savings`
Get savings snapshots for a review, plus historical data for each account.

**Response**:
```typescript
{
  snapshots: SavingsSnapshot[],   // current review
  accounts: SavingsAccount[],
  history: {
    [accountId: number]: SavingsSnapshot[]   // all historical snapshots for charts
  }
}
```

---

### `POST /api/reviews/[id]/savings`
Upsert (create or update) a savings snapshot for one account.

**Body**: `{ accountId, startingBalance, deposits, interest, endingBalance }` (all cents)

**Response**: `{ snapshot: SavingsSnapshot }`

---

### `GET /api/reviews/[id]/loans`
Get loan snapshots for a review.

**Response**: `{ loans: Loan[], snapshots: LoanSnapshot[] }`

---

### `POST /api/reviews/[id]/loans`
Upsert a loan snapshot.

**Body**: `{ loanId, balance, paymentsMade, interestPaid, extraPayment, paymentAmount, principalAmount }` (all cents)

**Response**: `{ snapshot: LoanSnapshot }`

---

### `GET /api/reviews/[id]/investments`
Get all investment data for a review (retirement accounts + taxable holdings).

**Response**:
```typescript
{
  accounts: InvestmentAccount[],
  purchases: Purchase[],
  snapshots: {
    [purchaseId: number]: HoldingSnapshot
  },
  retirementSnapshots: {
    [accountId: number]: RetirementSnapshot
  }
}
```

---

### `GET /api/reviews/[id]/vaults`
Get vault data for a review.

**Response**: `{ vaults: Vault[], snapshots: VaultSnapshot[] }`

---

### `POST /api/reviews/[id]/vaults`
Upsert a vault snapshot.

**Body**: `{ vaultId, amount (cents) }`

**Response**: `{ snapshot: VaultSnapshot }`

---

### `PATCH /api/reviews/[id]/steps/[stepKey]`
Update the status or data of a review step.

**Body**: `{ status: 'PENDING' | 'COMPLETE' | 'SKIPPED', data?: object }`

**Response**: `{ step: ReviewStep }`

---

### `GET /api/reviews/category-totals`
Get expense totals grouped by category across all completed reviews.

**Response**: `{ totals: { categoryId, categoryName, total }[] }`

---

## Configuration

### `GET /api/config/categories`
List all expense categories.

**Response**: `{ categories: ExpenseCategory[] }`

---

### `POST /api/config/categories`
Create an expense category.

**Body**: `{ name, icon?, color?, sortOrder? }`

**Response**: `{ category: ExpenseCategory }`

---

### `PATCH /api/config/categories/[id]`
Update an expense category.

**Body**: `{ name?, icon?, color?, sortOrder? }`

**Response**: `{ category: ExpenseCategory }`

---

### `DELETE /api/config/categories/[id]`
Delete an expense category. If it's in use, returns `{ inUse: true, entryCount }`.

---

### `GET /api/config/members`
List all members.

**Response**: `{ members: Member[] }`

---

### `POST /api/config/members`
Create a member.

**Body**: `{ name, color, email? }`

**Response**: `{ member: Member }`

---

### `PATCH /api/config/members/[id]`
Update a member.

**Body**: `{ name?, color?, email? }`

**Response**: `{ member: Member }`

---

### `GET /api/config/investment-categories`
List investment categories.

**Response**: `{ categories: InvestmentCategory[] }`

---

### `POST /api/config/investment-categories`
Create an investment category.

**Body**: `{ name, color }`

**Response**: `{ category: InvestmentCategory }`

---

### `PATCH /api/config/investment-categories/[id]`
Update an investment category.

---

### `DELETE /api/config/investment-categories/[id]`
Delete. If in use: `{ inUse: true, purchaseCount }`.
Accepts optional body `{ transferToName: string }` to re-assign purchases.

---

### `GET /api/config/investment-accounts`
List investment accounts with owner member data.

**Response**: `{ accounts: (InvestmentAccount & { owner: Member | null })[] }`

---

### `POST /api/config/investment-accounts`
Create an investment account.

**Body**: `{ name, type, institution?, ownerMemberId? }`

**Response**: `{ account: InvestmentAccount }`

---

### `PATCH /api/config/investment-accounts/[id]`
Update an investment account.

---

### `DELETE /api/config/investment-accounts/[id]`
Delete an investment account (cascades to purchases).

---

### `GET /api/config/export`
Download all household data as JSON.

---

## Masters (standalone entities)

### `PATCH /api/loans/[id]`
Update loan fields (rate, principal, paidOff, extra fees, etc.).

---

### `PATCH /api/savings-accounts/[id]`
Update savings account settings (name, type, institution, rate, goal).

---

### `GET /api/vaults`
List all vaults for the household.

---

### `POST /api/vaults`
Create a vault.

**Body**: `{ name, type, category?, target, allocation, frequency?, rateMonths?, ownerMemberId?, description?, dueMonths? }`

---

### `PATCH /api/vaults/[id]`
Update a vault.

---

### `DELETE /api/vaults/[id]`
Delete a vault.

---

### `POST /api/holdings`
Add a purchase lot to an investment account.

**Body**: `{ accountId, ticker, name, category?, purchaseDate, pricePerShare (cents), shares }`

**Response**: `{ purchase: Purchase }`

---

### `PUT /api/retirement-snapshots`
Upsert a retirement account balance for a review.

**Body**: `{ accountId, reviewId, balance (cents) }`

**Response**: `{ snapshot: RetirementSnapshot }`

---

### `GET /api/market-prices?tickers=VTI,VOO`
Fetch live market prices for a list of tickers.

**Response**: `{ prices: { [ticker]: number (cents) }, names: { [ticker]: string } }`

---

## Error Format

All API errors return:
```json
{ "error": "Human-readable message" }
```

Common status codes:
- `400` — validation error
- `401` — not authenticated
- `403` — authenticated but not authorized
- `404` — resource not found
- `409` — conflict (e.g. duplicate review period)
- `500` — server error

---

## API Client (lib/api.ts)

You should never call `fetch` directly in components. Use the typed wrappers in `src/lib/api.ts`:

```typescript
import { getReviewExpenses, createExpenseEntry, deleteExpenseEntry } from '@/lib/api';

// Fetch
const { entries, categories } = await getReviewExpenses(reviewId);

// Mutate
const { entry } = await createExpenseEntry(reviewId, {
  name: 'Whole Foods',
  categoryId: 3,
  amount: 8750,   // $87.50 in cents
  date: '2026-04-15',
});

// Delete
await deleteExpenseEntry(reviewId, entry.id);
```

All wrappers throw `ApiError` on non-2xx responses. Components should catch errors if they need to display them.
