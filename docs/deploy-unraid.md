# Deploying to Unraid with Docker

This guide covers running the Financial Review app as a Docker container on an Unraid
server, with the SQLite database persisted on the array/cache and a URL you can reach
from your home network (optionally a real domain via a reverse proxy).

The repo ships a `Dockerfile` and `docker-compose.yml` at the project root — this guide
just walks through using them on Unraid.

---

## Prerequisites

| Requirement | Notes |
|--------------|-------|
| Unraid 6.9+ | Anything with Docker support |
| [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/) plugin | Install via **Apps** (Community Applications) if not already present |
| SSH access to Unraid | To clone the repo and create folders |

---

## Step 1 — Get the code onto Unraid

SSH into Unraid and clone the repo somewhere on the array (this is the checkout Compose
will build the image from; it's separate from where the database lives):

```bash
mkdir -p /mnt/user/appdata/financial-review
cd /mnt/user/appdata/financial-review
git clone https://github.com/afbeals/finapp_2.0.git app
cd app
```

## Step 2 — Create the persistent data folder

```bash
mkdir -p /mnt/user/appdata/financial-review/data
```

This is mounted into the container at `/app/data` and holds `prod.db` and
`data/backups/`. Keeping it outside the `app/` checkout means pulling new code never
touches your data.

## Step 3 — Configure the session secret

`docker-compose.yml` reads `SESSION_SECRET` from a `.env` file next to it (Docker
Compose loads `.env` automatically for variable substitution — this is unrelated to the
app's own `.env`/`.env.production` files, and Compose Manager doesn't need it to be
copied anywhere else).

```bash
cd /mnt/user/appdata/financial-review/app
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

> If you're serving this behind a reverse proxy with HTTPS (see [Step 6](#step-6---optional-a-real-domain-over-https)),
> also add `COOKIE_SECURE=true` to `.env` and remove/override the line in
> `docker-compose.yml` — see [auth.md](./auth.md) and the note in `.env.example` for why
> this matters (a `Secure` cookie is silently dropped by browsers over plain HTTP, which
> makes every login look successful but bounce straight back to `/login`).

## Step 4 — Add the stack in Docker Compose Manager

In the Unraid web UI: **Docker → Compose → Add New Stack**.

- Name: `financial-review`
- Path: `/mnt/user/appdata/financial-review/app`
- Click **Compose Up**

This builds the image from the `Dockerfile` and starts the container. First build takes
a few minutes (installing dependencies + `next build`); watch progress in the Compose
Manager log view or with `docker logs -f financial-review`.

## Step 5 — Initialize the production database

The container's entrypoint runs `prisma migrate deploy` on every start, which creates
the schema but doesn't seed any data. The **first time** the stack comes up, run the
same import script the [setup guide](./setup.md#step-4--initialize-the-production-database)
uses, but inside the running container:

```bash
docker exec -it financial-review yarn db:import-prod
```

Answer the prompts (household name, PIN, member emails, etc. — see
[setup.md](./setup.md#step-4--initialize-the-production-database) for the default
answers). This writes to `data/prod.db`, which is the volume you created in Step 2, so
it survives container rebuilds.

## Step 6 — Get a URL

- **On your home network:** `http://<unraid-ip>:3000/`
- **A friendlier local name:** point a DNS entry (e.g. via Unraid's own `mDNS`/router)
  at the Unraid IP, or add it to your router's local DNS / `/etc/hosts` on client
  devices.
- **From outside your network / a real domain:** put a reverse proxy in front (e.g.
  [SWAG](https://forums.unraid.net/topic/104556-support-linuxserverio-swag-secure-web-app-gateway/)
  or Nginx Proxy Manager, both common Unraid Community Apps) terminating HTTPS and
  forwarding to `financial-review:3000`. If you do this, set `COOKIE_SECURE=true` (see
  Step 3) — otherwise logins will silently fail.

Optionally, add a `WebUI` label so the app gets a clickable icon on the Unraid
dashboard, by adding this under the service in `docker-compose.yml`:

```yaml
    labels:
      net.unraid.docker.webui: "http://[IP]:[PORT:3000]/"
```

## Step 7 — Updating after code changes

```bash
cd /mnt/user/appdata/financial-review/app
git pull
docker compose up -d --build
```

Migrations run automatically on every container start (`prisma migrate deploy` is
non-destructive — it only applies pending migrations), so a normal `git pull` +
rebuild is enough for schema changes too.

---

## Environment variables reference

| Variable | Purpose | Set where |
|----------|---------|-----------|
| `SESSION_SECRET` | Signs the session cookie | `.env` next to `docker-compose.yml` (Step 3) |
| `DATABASE_URL` | Path to the SQLite file | Already set in `docker-compose.yml` — leave as-is unless you change the volume mount |
| `COOKIE_SECURE` | Whether the session cookie requires HTTPS | `docker-compose.yml` — `false` for plain HTTP, `true` behind a reverse proxy |

---

## Backing up

The `data/` volume (`/mnt/user/appdata/financial-review/data` on the host) is exactly
what needs to be backed up — it's plain SQLite files. Either back it up as part of your
normal Unraid appdata backup (e.g. the CA Backup / Restore Appdata plugin), or run the
app's own backup script from inside the container:

```bash
docker exec -it financial-review yarn db:backup
# Creates data/backups/prod-YYYY-MM-DD-HHMM.db on the mounted volume
```

---

## Troubleshooting

### Build fails installing `better-sqlite3`

The `Dockerfile` uses `node:22-bookworm-slim` (glibc), not Alpine, specifically so
`better-sqlite3`'s prebuilt binary and Prisma's default engine binaries work without
extra `binaryTargets` config in `prisma/schema.prisma`. If you've modified the
Dockerfile to use an Alpine base, this is almost certainly why the build breaks.

### Login flashes back to the login page

This is the `Secure`-cookie-over-HTTP issue described in Step 3 — make sure
`COOKIE_SECURE` is `false` unless you've actually put HTTPS in front of the app.

### Container exits immediately / migration errors on start

Check `docker logs financial-review` — the entrypoint runs `prisma migrate deploy`
before starting the server, so a failed migration will show up there before any
Next.js output.

### Port 3000 already in use on Unraid

Change the host side of the port mapping in `docker-compose.yml`, e.g. `"3001:3000"`,
then `docker compose up -d`.

### Need a shell inside the container

```bash
docker exec -it financial-review sh
```
