# Authentication

## How it works

Authentication is PIN-based. There is **one PIN per household** (not per member). All members share the same PIN. When logging in, a member selects who they are and then enters the shared household PIN.

```
Login Screen
  │
  ├── GET /api/households/members    ← public, no auth required
  │   Returns all members of the first household
  │
  ▼
User selects member + enters 4-digit PIN
  │
  ▼
POST /api/auth/login
  { memberId: 1, pin: "1234" }
  │
  ├── Load member from DB → get householdId
  ├── Load household → get pinHash
  ├── bcrypt.compare(pin, pinHash)
  ├── If match:
  │     createSession(memberId, householdId)
  │       → Creates Session record in DB
  │       → Sets httpOnly cookie "fr_session" with session token
  │     Return { memberId, memberName, householdId, householdName, members[] }
  └── If no match: 401 { error: "Invalid PIN" }
```

---

## Session Lifecycle

Sessions are stored in the database as `Session` records and as an httpOnly cookie in the browser.

| Property | Value |
|----------|-------|
| Cookie name | `fr_session` |
| Expiry | 7 days |
| httpOnly | Yes (JS cannot read it) |
| Secure | Yes in production |
| SameSite | Lax |

### Checking a session (protected routes)

The `(app)` layout calls `GET /api/auth/session` on mount:

```typescript
// src/app/(app)/layout.tsx
const res = await fetch('/api/auth/session');
if (!res.ok) router.push('/login');
else { /* hydrate Zustand store */ }
```

### Destroying a session (logout)

```
GET /api/auth/logout
  → Deletes Session record from DB
  → Clears the cookie
  → Redirects to /login
```

---

## How to Reset the PIN

### Production database (`prod.db`)

**Step 1 — Generate a new hash:**
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YOUR_NEW_PIN', 10))"
```

**Step 2 — Open Prisma Studio pointed at prod.db:**
```bash
DATABASE_URL="file:../data/prod.db" yarn db:studio
```
Navigate to **Household** → click the record → paste the new hash into `pinHash` → **Save**.

### Development database (`dev.db`)

**Option 1 — Prisma Studio**

```bash
yarn db:studio
# Household → select record → edit pinHash → Save
# Generate hash with:
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YOUR_NEW_PIN', 10))"
```

**Option 2 — Seed script** (wipes all demo data)

Edit `prisma/seed.ts` and change the PIN constant at the top:

```typescript
const HOUSEHOLD_PIN = '1234'; // ← change this
```

Then re-seed:

```bash
yarn db:reset
```

**Option 3 — Direct SQL**

```bash
# Generate hash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('5678',10))"
# Then update the DB:
sqlite3 data/dev.db "UPDATE Household SET pinHash = '\$2a\$10\$...' WHERE id = 1;"
```

---

## Adding a New Member

New members can be added through the Settings page (`/config`) in the UI, or directly via Prisma Studio:

```bash
yarn db:studio
# Member table → Add record
# Set: householdId=1, name="...", color="#HEX", email (optional)
```

Members created through the UI are automatically associated with the first household.

---

## Session Guard in API Routes

Every protected API route calls a guard at the top of the handler:

```typescript
// src/lib/apiGuards.ts
import { requireAuth } from '@/lib/apiGuards';

export async function GET(req: Request) {
  const session = await requireAuth();   // throws RouteError(401) if no session
  // session.memberId, session.householdId are now available
}
```

The `withGuards()` wrapper catches `RouteError` and converts it to an HTTP response:

```typescript
export const GET = withGuards(async (req) => {
  const session = await requireAuth();
  // ...
});
```

---

## Security Notes

- PINs are hashed with bcryptjs (cost factor 10) — they are never stored in plaintext
- Session tokens are random UUIDs stored server-side; the cookie contains only the token
- The `households/members` endpoint is intentionally public (needed to render the login screen before authentication)
- All other `/api/*` routes require a valid session
