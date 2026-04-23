# Financial Review App — Developer Documentation

Welcome! This directory contains everything you need to understand and contribute to the Beals-Gibson household financial review application.

## Documents

| File | What it covers |
|------|---------------|
| [architecture.md](./architecture.md) | System overview, directory structure, data flow diagrams |
| [database.md](./database.md) | Prisma schema, all models, relationships, Prisma CLI commands |
| [auth.md](./auth.md) | PIN login, sessions, how to reset a PIN |
| [api.md](./api.md) | All 28 API endpoints, request/response shapes, guards |
| [state.md](./state.md) | Zustand store slices, how to read/write state in components |
| [review-workflow.md](./review-workflow.md) | Multi-step review wizard, step lifecycle |
| [styling.md](./styling.md) | Styled-components, theme tokens, co-located styles pattern |
| [testing.md](./testing.md) | Running tests, test environments, writing new tests |
| [development.md](./development.md) | Local setup, environment variables, scripts, common tasks |

## Quick Start (< 5 minutes)

```bash
# 1. Ensure Node >= 22.12
node --version

# 2. Install dependencies
yarn install

# 3. Create .env
cp .env.example .env

# 4. Apply DB migrations + seed sample data
yarn db:migrate
yarn db:seed

# 5. Start dev server
yarn dev
```

Open http://localhost:3000 — you will be redirected to `/login`.
Select **Allan** or **Malia** and enter PIN **1234**.

## Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Styled-components 6 |
| Charts | Recharts |
| Database | SQLite (file-based, via Prisma) |
| ORM | Prisma 6 |
| Auth | bcryptjs PIN hash + iron-session cookies |
| State | Zustand 5 + Immer |
| Testing | Vitest, Testing Library, Playwright |
| Node | >= 22.12 |
