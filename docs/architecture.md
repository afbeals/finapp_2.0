# Architecture

## What this app does

A private, household-level financial review tool. Once a month (or quarter), household members log in with a PIN and walk through a multi-step wizard: entering expenses, recording income, updating savings balances, tracking loans, logging investment holdings, allocating to budget vaults, and finalizing the review. Completed reviews become a historical record.

---

## Directory Structure

```
pineapple-worktrees/temp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Dev/test seed data
│   └── migrations/            # Auto-generated migration history
│
├── data/
│   ├── dev.db                 # SQLite dev database
│   ├── test.db                # SQLite test database (auto-created)
│   └── backups/               # Manual snapshots (yarn db:backup)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root HTML shell, global styles
│   │   ├── page.tsx                       # Redirect → /dashboard
│   │   │
│   │   ├── (app)/                         # PROTECTED routes (require session)
│   │   │   ├── layout.tsx                 # Checks session → /login, mounts Navbar
│   │   │   ├── dashboard/                 # Home screen: active review + history
│   │   │   ├── config/                    # Settings: members, categories, accounts
│   │   │   ├── history/[id]/              # Read-only view of a completed review
│   │   │   └── review/[id]/               # Multi-step review wizard
│   │   │       ├── layout.tsx             # StepIndicator + ReviewModeBanner
│   │   │       ├── expense/               # Step 1: log expenses
│   │   │       ├── monthly/               # Step 2: income + category summary
│   │   │       ├── savings/               # Step 3: savings account snapshots
│   │   │       ├── loans/                 # Step 4 (quarterly): loan snapshots
│   │   │       ├── investments/           # Step 5 (quarterly): holdings + retirement
│   │   │       ├── portfolio/             # Step 6 (quarterly): FIRE projections
│   │   │       ├── vaults/                # Step 7: vault allocations
│   │   │       └── finalize/              # Final step: mark complete
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/                     # PIN login screen
│   │   │
│   │   └── api/                           # 28 Next.js API Route handlers
│   │       ├── auth/                      # login, logout, session
│   │       ├── config/                    # categories, members, accounts CRUD
│   │       ├── households/                # members (public endpoint for login)
│   │       ├── reviews/                   # review CRUD + per-step data
│   │       ├── vaults/                    # vault CRUD
│   │       ├── loans/                     # loan updates
│   │       ├── savings-accounts/          # account settings updates
│   │       ├── holdings/                  # purchase creation
│   │       ├── retirement-snapshots/      # balance upsert
│   │       └── market-prices/             # live price fetch (Yahoo Finance)
│   │
│   ├── components/
│   │   ├── ui/                            # Primitives: Button, Card, Input, Modal, Table, Badge...
│   │   ├── shared/                        # Reusable app components: KpiGrid, InlineEdit, AmortizationModal...
│   │   ├── review/                        # Review-specific: StepIndicator, StepShell, ReviewModeBanner
│   │   └── layout/                        # Navbar
│   │
│   ├── lib/
│   │   ├── api.ts                         # Typed fetch wrappers for every endpoint
│   │   ├── auth.ts                        # Session create/read/destroy
│   │   ├── db.ts                          # Prisma client singleton
│   │   ├── apiGuards.ts                   # requireAuth(), requireReviewAccess()
│   │   ├── fire.ts                        # FIRE math (amortization, compound growth)
│   │   ├── money.ts                       # Cents ↔ dollars, formatDollars()
│   │   ├── reviewProgress.ts              # Step ordering constants + progress calc
│   │   ├── useStepNav.ts                  # Review wizard step navigation hook
│   │   ├── store/                         # Zustand state slices
│   │   └── hooks/
│   │       ├── useAsyncData.ts            # Generic loading/error state hook
│   │       ├── useInvestmentsData.ts      # Investments page data + mutations (useReducer)
│   │       ├── investmentsReducer.ts      # Discriminated-union reducer for investments state
│   │       └── usePortfolioData.ts        # Portfolio page derived data hook
│   │
│   ├── styles/
│   │   ├── tokens.ts                      # Design tokens (colors, spacing, font, radius...)
│   │   └── GlobalStyles.tsx               # CSS reset + base styles
│   │
│   └── types/
│       ├── entities.ts                    # Domain types (Member, Loan, Vault, Purchase...)
│       └── api.ts                         # API response shapes
│
├── tests/
│   └── integration/                       # API-level integration tests
│
├── docs/                                  # ← You are here
├── .env.example
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Data Flow

### Request lifecycle

```
Browser
  │
  ▼
Next.js App Router
  │  Route group (app) layout checks GET /api/auth/session
  │  → No session? Redirect to /login
  │  → Valid session? Hydrate Zustand store, render page
  │
  ▼
Page Component
  │  Fetches domain data via lib/api.ts helpers
  │  e.g. getReviewExpenses(reviewId)
  │
  ▼
lib/api.ts  (typed fetch wrappers)
  │  apiGet('/api/reviews/[id]/expenses')
  │
  ▼
API Route Handler  src/app/api/reviews/[id]/expenses/route.ts
  │  1. requireAuth()       — checks session cookie
  │  2. requireReviewAccess — checks household ownership
  │  3. Validates input     — Zod schema
  │  4. prisma.expenseEntry.findMany(...)
  │  5. Returns JSON
  │
  ▼
Prisma ORM
  │
  ▼
SQLite  (data/dev.db)
```

### State update lifecycle

```
User action (form submit, inline edit, toggle)
  │
  ▼
Handler function in page component (or custom hook)
  │  Calls lib/api.ts mutation (apiPost / apiPatch / apiDelete)
  │
  ▼
API route (validates, writes DB)
  │
  ▼
Response comes back
  │
  ▼
Local React state updated
  │  Simple pages: useState / setXxx
  │  Complex pages (investments): useReducer + dispatch({ type: 'ACTION', ... })
  │  Zustand store holds cross-page session + active review info
  │
  ▼
React re-renders affected components
```

---

## Key Architectural Decisions

### Money is always stored as integer cents
Every monetary value in the database and in API responses is an **integer number of cents** (e.g. `$12.50 = 1250`). Conversion to/from dollars happens only at the UI boundary via `toCents()` / `toDollars()` / `formatDollars()` in `src/lib/money.ts`.

This eliminates floating-point rounding errors in financial math.

### SQLite for storage
The app uses a local SQLite file (`data/dev.db`). There is no network database — this is an intentionally self-hosted, single-household tool. Backups are manual (`yarn db:backup`).

### Route Groups for auth
Next.js route groups (`(app)` and `(auth)`) apply different layouts:
- `(app)/layout.tsx` — checks session on every render, redirects to `/login` if missing
- `(auth)/layout.tsx` — no auth check, accessible to logged-out users

### Styled-components co-location
Every component with > 20 lines of styled components has a sibling `[Component].styles.ts` file. The `.tsx` file contains only logic and JSX; the `.styles.ts` file contains all styled-component definitions.

```
Button.tsx           ← logic + JSX
Button.styles.ts     ← all styled.* definitions (if > 20 lines)
```

### API guards centralized
All authentication and authorization logic lives in `src/lib/apiGuards.ts`. Route handlers call `requireAuth()` or `requireReviewAccess()` at the top — no route handler ever directly checks the session cookie.

### Step ordering is canonical
`src/lib/reviewProgress.ts` exports `MONTHLY_STEP_ORDER` and `QUARTERLY_STEP_ORDER` as the single source of truth for step sequences. Both the API route that seeds steps on review creation and the `StepIndicator` component read from these arrays — step order is never hardcoded in more than one place.

### Shared error state component
All page components use `<ErrorState>` from `src/components/shared/ErrorState.tsx` when a data fetch fails. Every page has a `loadError` state that renders this component instead of the page content, so users always get a visible error rather than a blank screen.
