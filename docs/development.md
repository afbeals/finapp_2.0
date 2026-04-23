# Development Guide

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | >= 22.12 | `node --version` |
| Yarn | 1.x | `yarn --version` |

If you're on the wrong Node version:
```bash
# Using nvm:
nvm install 22 && nvm use 22

# Using fnm:
fnm install 22 && fnm use 22
```

---

## Initial Setup

```bash
# 1. Install dependencies
yarn install

# 2. Create your local .env file
cp .env.example .env

# 3. Run database migrations (creates data/dev.db)
yarn db:migrate

# 4. Seed sample data (household, members, PIN 1234, reviews, etc.)
yarn db:seed

# 5. Start the dev server
yarn dev
```

Open http://localhost:3000 → redirects to `/login`.

Select **Allan** or **Malia**, enter PIN **1234**.

---

## Environment Variables

```bash
# .env
DATABASE_URL="file:../data/dev.db"
SESSION_SECRET="replace-with-secure-random-32-char-string"
```

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Path to SQLite database | `file:../data/dev.db` |
| `SESSION_SECRET` | Secret for signing session cookies | 32+ character random string |

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Scripts Reference

```bash
yarn dev             # Start Next.js dev server (http://localhost:3000)
yarn build           # Production build
yarn start           # Start production server (after build)
yarn lint            # Run ESLint
yarn typecheck       # TypeScript type checking (no emit)

yarn test            # Run Vitest in watch mode
yarn test:ci         # Run Vitest once (CI)
yarn test:ui         # Vitest with browser UI
yarn test:e2e        # Playwright end-to-end tests
yarn test:e2e:ui     # Playwright with interactive UI

yarn db:migrate      # Apply pending Prisma migrations
yarn db:seed         # Seed sample data
yarn db:reset        # Wipe DB and re-seed (destructive!)
yarn db:studio       # Open Prisma Studio (visual DB browser)
yarn db:deploy       # Deploy migrations without prompts (production)
yarn db:backup       # Copy prod.db to data/backups/ with timestamp
```

---

## Working with Money

All monetary values in the database and API responses are **integer cents**. Convert at the UI boundary only.

```typescript
import { toCents, toDollars, formatDollars, parseDollarsToCents } from '@/lib/money';

toCents(12.50)          // → 1250
toDollars(1250)         // → 12.5
formatDollars(1250)     // → "$12.50"
formatDollars(-500)     // → "-$5.00"
parseDollarsToCents("12.50")   // → 1250

// Common pattern: user types "87.50", you store 8750
const amount = parseDollarsToCents(inputValue);
await createExpenseEntry(reviewId, { amount, ... });
```

---

## Adding a New Feature: Step-by-Step

Here's a complete example of how to add a new feature (e.g., adding a "notes" field to vaults).

### 1. Update the database schema

Edit `prisma/schema.prisma`:
```prisma
model Vault {
  // ... existing fields
  notes  String?   // ← add this
}
```

Create and apply the migration:
```bash
yarn db:migrate
# Name it: "add_vault_notes"
```

### 2. Update types

Edit `src/types/entities.ts`:
```typescript
export interface Vault {
  // ... existing fields
  notes: string | null;
}
```

### 3. Update the API route

Edit `src/app/api/vaults/[id]/route.ts` to accept `notes` in the PATCH body:
```typescript
const { name, notes, ... } = await req.json();
await prisma.vault.update({ where: { id }, data: { name, notes } });
```

### 4. Update the API client

Edit `src/lib/api.ts` to include `notes` in the patch function's type:
```typescript
export async function patchVault(id: number, data: { name?: string; notes?: string; ... }) {
  return apiPatch(`/api/vaults/${id}`, data);
}
```

### 5. Update the UI

Add an input to the vault edit form. Import `patchVault` and call it on save.

### 6. Type check
```bash
yarn typecheck
```

### 7. Test
```bash
yarn test:ci
```

---

## Common Tasks

### View the database

```bash
yarn db:studio
# Opens visual browser at http://localhost:5555
```

### Add a member

Via UI: go to `/config` → Members section → "+ Add Member"

Via Prisma Studio: Household table → Members → Add record

### Change the PIN

See [auth.md](./auth.md#how-to-reset-the-pin)

### Inspect API responses

All API routes are at `/api/...`. You can test them with curl or any HTTP client:

```bash
# Get all reviews (need session cookie)
curl http://localhost:3000/api/reviews \
  -H "Cookie: fr_session=YOUR_TOKEN"

# Get members (public, no auth needed)
curl http://localhost:3000/api/households/members
```

To get your session token: open Chrome DevTools → Application → Cookies → `fr_session`.

### Back up production data

```bash
yarn db:backup
# Creates: data/backups/prod-2026-04-22-1530.db
```

---

## Project Conventions

### File naming
- Components: `PascalCase.tsx`
- Styles: `PascalCase.styles.ts` (co-located with component)
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Types: `camelCase.ts` (in `src/types/`)
- API routes: always `route.ts` (Next.js convention)

### TypeScript
- Use `interface` over `type` for object shapes
- Use `Foo[]` not `Array<Foo>`
- Use `undefined` not `null` for missing values (Prisma returns `null` from DB — convert at the boundary)
- No `any`. No `!` non-null assertions.
- `import type` for type-only imports

### Components
- Named exports — no default exports for components (exception: Next.js page/layout files require default exports)
- Prop types named `ComponentNameProps`
- Event handlers prefixed with `handle`: `handleSubmit`, `handleClose`
- Keep logic and JSX in `.tsx`, styled-components in `.styles.ts`

### API routes
- Always call `requireAuth()` at the top (or `requireReviewAccess()` for review-scoped routes)
- Validate input with Zod schemas
- All monetary values in/out as integer cents
- Return `{ ok: true }` for successful deletes with no meaningful response body

---

## Troubleshooting

### "Cannot find module" errors after adding a new file
TypeScript may need a restart. In VS Code: `Cmd+Shift+P → TypeScript: Restart TS Server`.

### Database is out of sync
```bash
yarn db:migrate   # apply any pending migrations
```

### Want to start completely fresh
```bash
yarn db:reset     # wipes and re-seeds (loses all data)
```

### Styled-components "unknown prop" warning
Use transient props (`$propName`) or `withConfig({ shouldForwardProp })`. See [styling.md](./styling.md).

### Session expired / stuck on login screen
Delete the `fr_session` cookie in browser DevTools → Application → Cookies, then reload and log in again.
