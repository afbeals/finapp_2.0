# Setup Guide — New Computer

This guide covers everything needed to get the Financial Review app running from scratch on a new machine, including first-time production database initialization and ongoing configuration tasks like changing the PIN or adding members.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | >= 22.12 | `node --version` |
| Yarn | 1.x | `yarn --version` |

Install Node if needed:
```bash
# Using nvm:
nvm install 22 && nvm use 22

# Using fnm:
fnm install 22 && fnm use 22
```

---

## Step 1 — Install dependencies

```bash
yarn install
```

---

## Step 2 — Create your environment file

The app ships with `.env.production` pre-configured to point at the production database. Before running for the first time, replace the placeholder session secret with a real random value.

**Generate a secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Edit `.env.production`:**
```bash
DATABASE_URL="file:../data/prod.db"
SESSION_SECRET="paste-your-generated-secret-here"
```

> `.env.production` is gitignored and never committed. It lives only on your machine.

---

## Step 3 — Initialize the production database

Run the import script **once** to create `data/prod.db` with all historical financial data:

```bash
DATABASE_URL="file:../data/prod.db" yarn db:import-prod
```

The script will:
1. Back up any existing `prod.db` to `data/backups/`
2. Apply all database migrations
3. Ask a few setup questions (household name, PIN, member emails, etc.)
4. Import all historical data (Jan–Mar 2026 reviews, savings, loans, investments, vaults)

All data is baked into the script — no internet connection required.

**Default answers for each prompt** (press Enter to accept):
| Prompt | Default |
|--------|---------|
| Household name | Beals-Gibson |
| PIN | 1234 |
| Allan's email | *(blank)* |
| Malia's email | *(blank)* |
| School loan start date | 2015-09-01 |
| Taxable brokerage name | Taxable Brokerage |
| Taxable brokerage institution | Robinhood |
| Taxable brokerage owner | shared |

> **Choose a strong PIN** — you can always change it later (see [Changing the PIN](#changing-the-pin)).

---

## Step 4 — Start the app

```bash
DATABASE_URL="file:../data/prod.db" yarn dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

Select your name and enter the PIN you chose during setup.

---

## Running in production mode

After building once:

```bash
yarn build
DATABASE_URL="file:../data/prod.db" yarn start
```

`yarn start` serves the optimized build. `yarn dev` is fine for personal home use — it's slightly slower to start but otherwise identical.

---

## Changing the PIN

The PIN is stored as a bcrypt hash in the database. To change it:

**Step 1 — Generate a new hash:**
```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync('YOUR_NEW_PIN', 10))"
```

**Step 2 — Update the database:**
```bash
DATABASE_URL="file:../data/prod.db" yarn db:studio
```
Open Prisma Studio in the browser → navigate to **Household** → click the record → paste the new hash into the `pinHash` field → click **Save**.

Alternatively, use SQLite directly:
```bash
# Generate hash first (step 1 above), then:
sqlite3 data/prod.db "UPDATE Household SET pinHash = '\$2a\$10\$...' WHERE id = 1;"
```

---

## Adding or editing members

**Via the app UI (recommended):**

1. Log in and go to `/config` (Settings)
2. Under the **Members** section, click **+ Add Member**
3. Set a name and pick a color

**Via Prisma Studio:**
```bash
DATABASE_URL="file:../data/prod.db" yarn db:studio
```
Navigate to **Member** → **Add record** → set `householdId = 1`, `name`, `color` (hex).

**To change a member's display name or color:**

Same path — open Prisma Studio, navigate to **Member**, click the record, edit the field, save.

---

## Backing up your data

```bash
yarn db:backup
# Creates: data/backups/prod-YYYY-MM-DD-HHMM.db
```

Run this before any major changes. Backups are just plain SQLite files — copy them anywhere for safekeeping.

---

## Re-importing from scratch

If you need to fully rebuild the production database (e.g. after a schema migration or data corruption):

```bash
DATABASE_URL="file:../data/prod.db" yarn db:import-prod
```

The script automatically backs up the existing `prod.db` before wiping it.

> The import is self-contained — all 2026 historical data is baked in and no Google Sheet access is required.

---

## Environment variables reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Path to SQLite database file | `file:../data/prod.db` |
| `SESSION_SECRET` | Signs the session cookie — keep this secret | 64-char hex string |

Both variables live in `.env.production` for production use and `.env` for local dev/demo use.

---

## Switching between demo and real data

| Purpose | Command |
|---------|---------|
| Real data (production) | `DATABASE_URL="file:../data/prod.db" yarn dev` |
| Demo data (seed) | `yarn dev` (uses `.env` which points at `dev.db`) |

The two databases are completely independent. Switching is just a matter of which `DATABASE_URL` you use.

---

## Troubleshooting

### Login fails with correct PIN
The PIN is stored hashed in the database. If you changed the PIN hash manually, make sure you copied the full bcrypt string (starts with `$2a$10$...`, ~60 characters).

### "Cannot find module" on first run
TypeScript server may need a restart. In VS Code: `Cmd+Shift+P → TypeScript: Restart TS Server`.

### Database errors after a code update
New code may require a schema migration:
```bash
DATABASE_URL="file:../data/prod.db" yarn db:deploy
```

### Session expired / stuck on login
Delete the `fr_session` cookie: Chrome DevTools → Application → Cookies → delete `fr_session` → reload.

### App won't start — port in use
```bash
# Kill whatever is on port 3000
lsof -ti:3000 | xargs kill
yarn dev
```
