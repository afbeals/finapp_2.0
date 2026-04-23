# Testing

The app uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end tests.

---

## Running Tests

```bash
# Run all tests (watch mode)
yarn test

# Run all tests once (CI mode, no watch)
yarn test:ci

# Run a specific file
yarn vitest src/lib/__tests__/money.test.ts

# Run with UI (browser-based test runner)
yarn test:ui

# End-to-end tests (Playwright)
yarn test:e2e

# End-to-end tests with Playwright UI
yarn test:e2e:ui
```

---

## Test Environments

Vitest is configured with **two separate environments** in `vitest.config.ts`:

### 1. Node environment (server-side tests)

Used for: API logic, utility functions, DB helpers.

Matches:
- `tests/integration/**/*.test.ts`
- `src/lib/__tests__/**/*.test.ts`
- `src/app/**/config/__tests__/configHelpers.test.ts`

Uses a real SQLite test database at `data/test.db` (separate from `data/dev.db`).

### 2. jsdom environment (component tests)

Used for: React component smoke tests.

Matches:
- `src/app/**/config/__tests__/*Section.test.tsx`
- `src/app/**/review/**/__tests__/**/*.test.tsx`

Uses `@testing-library/react` for rendering.

---

## Test File Locations

Test files live in `__tests__/` directories next to the code they test:

```
src/lib/
  ├── fire.ts
  ├── money.ts
  └── __tests__/
      ├── fire.test.ts
      └── money.test.ts

src/app/(app)/config/
  ├── configHelpers.ts
  ├── MembersSection.tsx
  └── __tests__/
      ├── configHelpers.test.ts
      └── MembersSection.test.tsx
```

---

## Existing Tests

| File | What it tests |
|------|--------------|
| `src/lib/__tests__/money.test.ts` | `toCents`, `toDollars`, `formatDollars`, `parseDollarsToCents` |
| `src/lib/__tests__/fire.test.ts` | `monthlyPayment`, `amortizationSchedule`, `futureValue`, `yearsToFire`, `fireNumber` |
| `src/app/(app)/config/__tests__/configHelpers.test.ts` | `accountTypeLabel`, `badgeColors` |
| `tests/integration/` | API route integration tests |

---

## Writing a New Unit Test

```typescript
// src/lib/__tests__/myUtil.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myUtil';

describe('myFunction', () => {
  it('returns the correct value', () => {
    expect(myFunction(100)).toBe(200);
  });

  it('handles zero', () => {
    expect(myFunction(0)).toBe(0);
  });
});
```

### Money test pattern

All monetary values in tests are **cents**:

```typescript
import { formatDollars, toCents, toDollars } from '@/lib/money';

it('formats cents as dollars', () => {
  expect(formatDollars(1250)).toBe('$12.50');
  expect(formatDollars(0)).toBe('$0.00');
  expect(formatDollars(-500)).toBe('-$5.00');
});
```

---

## Writing a Component Test

```typescript
// src/components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

it('calls onClick when clicked', async () => {
  const handler = vi.fn();
  render(<Button onClick={handler}>Click me</Button>);
  await userEvent.click(screen.getByRole('button'));
  expect(handler).toHaveBeenCalledOnce();
});
```

---

## Integration Tests (API routes)

Integration tests in `tests/integration/` test the full request/response cycle against a real SQLite test database.

```typescript
// tests/integration/expenses.test.ts
import { describe, it, expect, beforeAll } from 'vitest';

describe('POST /api/reviews/[id]/expenses', () => {
  it('creates an expense entry', async () => {
    const res = await fetch(`http://localhost:3000/api/reviews/${reviewId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: `fr_session=${token}` },
      body: JSON.stringify({ name: 'Test', categoryId: 1, amount: 1000, date: '2026-04-01' }),
    });
    expect(res.status).toBe(200);
    const { entry } = await res.json();
    expect(entry.amount).toBe(1000);
  });
});
```

---

## End-to-End Tests (Playwright)

Playwright tests live in the `tests/` directory and run against a live dev server.

```bash
# Start dev server first (in one terminal)
yarn dev

# Run e2e tests (in another terminal)
yarn test:e2e
```

The Playwright config is at `playwright.config.ts`.

---

## TypeScript Type Checking

TypeScript type checking is not part of the test suite — run it separately:

```bash
yarn typecheck
# or
npx tsc --noEmit
```

This checks all `.ts` and `.tsx` files for type errors without producing output files.
