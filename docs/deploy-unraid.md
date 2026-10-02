# Deploying to Unraid with Docker

This guide covers running the Financial Review app as a Docker container on an Unraid
server, with the SQLite database persisted on the array/cache and a URL you can reach
from your home network (optionally a real domain via a reverse proxy).

The repo ships a `Dockerfile` and `docker-compose.yml` at the project root — this guide
just walks through using them on Unraid.

---

## Prerequisites

| Requirement                                                                                            | Notes                                                                |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Unraid 6.9+                                                                                            | Anything with Docker support                                         |
| [Docker Compose Manager](https://forums.unraid.net/topic/114415-plugin-docker-compose-manager/) plugin | Install via **Apps** (Community Applications) if not already present |
| SSH access to Unraid                                                                                   | To clone the repo and create folders                                 |

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

- **On your home network:** `http://<unraid-ip>:8775/`
- **A friendlier local name:** point a DNS entry (e.g. via Unraid's own `mDNS`/router)
  at the Unraid IP, or add it to your router's local DNS / `/etc/hosts` on client
  devices.
- **From outside your network / a real domain:** put a reverse proxy in front (e.g.
  [SWAG](https://forums.unraid.net/topic/104556-support-linuxserverio-swag-secure-web-app-gateway/)
  or Nginx Proxy Manager, both common Unraid Community Apps) terminating HTTPS and
  forwarding to `financial-review:8775`. If you do this, set `COOKIE_SECURE=true` (see
  Step 3) — otherwise logins will silently fail.

Optionally, add a `WebUI` label so the app gets a clickable icon on the Unraid
dashboard, by adding this under the service in `docker-compose.yml`:

```yaml
labels:
  net.unraid.docker.webui: "http://[IP]:[PORT:8775]/"
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

| Variable         | Purpose                                   | Set where                                                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `SESSION_SECRET` | Signs the session cookie                  | `.env` next to `docker-compose.yml` (Step 3)                                         |
| `DATABASE_URL`   | Path to the SQLite file                   | Already set in `docker-compose.yml` — leave as-is unless you change the volume mount |
| `COOKIE_SECURE`  | Whether the session cookie requires HTTPS | `docker-compose.yml` — `false` for plain HTTP, `true` behind a reverse proxy         |

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

---

---

---

# Updated Financial Review Docker Deployment

This document describes the Docker workflow for the Financial Review app.

The deployment model is:

1. Develop and test on the Windows PC using Docker Desktop.
2. Build the complete application image locally.
3. Test the image locally.
4. Tag the image with the application version.
5. Tag the same image as `latest`.
6. Push both tags to Docker Hub.
7. Run `afbeals/finapp:latest` on Unraid.
8. Keep the persistent SQLite data outside the container.

## Architecture

```text
Windows PC
    |
    | Docker Desktop
    v
Docker image
    |
    | docker push
    v
Docker Hub
    |
    | pull
    v
Unraid
    |
    +-- afbeals/finapp:latest
    |
    +-- /mnt/user/appdata/financial-review/data
            |
            +-- prod.db
            +-- backups/
```

The application code, Node dependencies, Next.js build, Prisma client, and runtime files are contained in the Docker image.

The production SQLite database is stored on Unraid:

```text
/mnt/user/appdata/financial-review/data/prod.db
```

and mounted into the container as:

```text
/app/data/prod.db
```

This means replacing or recreating the Docker container does not delete the production database.

---

## Docker Hub

Docker Hub repository:

```text
afbeals/finapp
```

The application uses two types of tags.

### Versioned tags

```text
afbeals/finapp:2.0.0
afbeals/finapp:2.1.0
```

These are permanent release tags and can be used for rollback.

### Latest tag

```text
afbeals/finapp:latest
```

This points to the current release and is the tag used by the Unraid container.

---

## Prerequisites

The development machine should have:

- Docker Desktop
- Node.js
- Yarn
- Git
- Access to the `afbeals/finapp` Docker Hub repository

Log into Docker Hub:

```powershell
docker login
```

---

## Package Version

The Docker scripts use the `version` field from `package.json`.

For example:

```json
{
  "version": "2.0.0"
}
```

produces:

```text
afbeals/finapp:2.0.0
afbeals/finapp:latest
```

When creating a new release, update the version:

```powershell
yarn version --new-version 2.1.0
```

The Docker scripts automatically use the new version.

---

## Docker Scripts

The repository contains:

```text
scripts/docker.js
```

The script handles:

- Building the Docker image
- Tagging the version
- Tagging the image as `latest`
- Running the image locally
- Pushing images to Docker Hub
- Releasing a new version

### Build

```powershell
yarn docker:build
```

Builds:

```text
afbeals/finapp:<package.json version>
```

For example:

```text
afbeals/finapp:2.0.0
```

### Tag

```powershell
yarn docker:tag
```

Tags the current version as `latest`.

For example:

```powershell
docker tag afbeals/finapp:2.0.0 afbeals/finapp:latest
```

The script automatically gets the version from `package.json`.

### Local Test

```powershell
yarn docker:test
```

Runs:

```text
afbeals/finapp:latest
```

at:

```text
http://localhost:8775
```

The local test database is stored in:

```text
./docker-data/prod.db
```

The test container uses:

```text
SESSION_SECRET=temporary-test-secret
DATABASE_URL=file:/app/data/prod.db
```

This database is completely separate from the production database on Unraid.

Press `Ctrl+C` to stop the container.

### Push

```powershell
yarn docker:push
```

Pushes both:

```text
afbeals/finapp:<version>
afbeals/finapp:latest
```

to Docker Hub.

### Release

```powershell
yarn docker:release
```

This performs:

```text
docker build
    ↓
docker tag <version> latest
    ↓
docker push <version>
    ↓
docker push latest
```

For example:

```text
afbeals/finapp:2.1.0
afbeals/finapp:latest
```

---

## Recommended Release Workflow

### 1. Update the version

```powershell
yarn version --new-version 2.1.0
```

### 2. Build

```powershell
yarn docker:build
```

### 3. Tag as latest

```powershell
yarn docker:tag
```

### 4. Test locally

```powershell
yarn docker:test
```

Open:

```text
http://localhost:8775
```

Verify the application works.

Press `Ctrl+C` when finished testing.

### 5. Push to Docker Hub

```powershell
yarn docker:push
```

Alternatively, after testing you can use:

```powershell
yarn docker:release
```

However, `docker:release` builds and pushes immediately, so the separate build/test/push workflow is preferred when you want to verify the image before publishing it.

---

## Dockerfile

The builder stage requires a temporary `DATABASE_URL` because Prisma requires the environment variable during `prisma generate`.

The builder should contain:

```dockerfile
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma config requires DATABASE_URL during build.
# This is only a temporary build-time value.
ENV DATABASE_URL="file:/tmp/build.db"

RUN npx prisma generate
RUN yarn build
```

The production database URL is supplied at runtime by Unraid:

```text
DATABASE_URL=file:/app/data/prod.db
```

The production database URL and `SESSION_SECRET` should not be placed directly in the Dockerfile.

---

## Unraid Configuration

Create the persistent data directory:

```text
/mnt/user/appdata/finapp/data
```

### Repository

```text
afbeals/finapp:latest
```

### Port

Map:

```text
Host:      8775
Container: 8775
```

### Volume

Map:

```text
Host:
/mnt/user/appdata/finapp/data

Container:
/app/data
```

Set the access mode to:

```text
Read/Write
```

### Environment Variables

Set:

```text
SESSION_SECRET=<your production secret>
DATABASE_URL=file:/app/data/prod.db
COOKIE_SECURE=false
```

Use a strong, private value for `SESSION_SECRET`.

Do not commit the production secret to Git.

If the application is later placed behind HTTPS using a reverse proxy, change:

```text
COOKIE_SECURE=true
```

---

## Starting the Unraid Container

Start the container from the Unraid Docker interface.

The application should be available at:

```text
http://<UNRAID-IP>:8775
```

The container's entrypoint runs Prisma migrations during startup.

The runtime database URL must be:

```text
DATABASE_URL=file:/app/data/prod.db
```

---

## Production Database

The production database is stored at:

```text
/mnt/user/appdata/financial-review/data/prod.db
```

Inside the container, the same database is:

```text
/app/data/prod.db
```

Do not store the production database inside the Docker image.

Do not commit the production database to Git.

---

## First Production Database Import

If the application has an existing production database that needs to be imported, run:

```bash
docker exec -it financial-review yarn db:import-prod
```

Replace `financial-review` with the actual container name if necessary.

Do not run an import against an existing production database unless the import command is intended to modify that database.

---

## Updating the Application

Application updates are built on the Windows PC.

Example:

```powershell
yarn version --new-version 2.1.0
yarn docker:build
yarn docker:tag
yarn docker:test
```

After testing:

```powershell
yarn docker:push
```

Then update/recreate the Unraid container using:

```text
afbeals/finapp:latest
```

The existing database remains at:

```text
/mnt/user/appdata/financial-review/data/prod.db
```

The database is not replaced when the Docker image is updated.

---

## Rollback

Every release has a versioned tag.

For example:

```text
afbeals/finapp:2.0.0
afbeals/finapp:2.1.0
afbeals/finapp:latest
```

To roll back, change the Unraid image from:

```text
afbeals/finapp:latest
```

to a specific version:

```text
afbeals/finapp:2.0.0
```

Then recreate/restart the container.

The production database remains mounted from:

```text
/mnt/user/appdata/financial-review/data
```

---

## Database Backups

The application provides a database backup command:

```bash
docker exec -it financial-review yarn db:backup
```

Backups are stored at:

```text
/app/data/backups
```

Because `/app/data` is mounted to Unraid, they are stored on the host at:

```text
/mnt/user/appdata/financial-review/data/backups
```

These backups should also be included in the normal Unraid backup strategy.

---

## Image vs. Persistent Data

### Docker image

The Docker image contains:

- Application runtime
- Node dependencies
- Next.js build
- Prisma client
- Prisma schema
- Public assets
- Entrypoint script
- Other application files required at runtime

### Unraid volume

The Unraid volume contains:

```text
/mnt/user/appdata/financial-review/data/
```

including:

```text
prod.db
backups/
```

Application code changes require a new Docker image.

Database changes do not require rebuilding the Docker image.

---

## Useful Docker Commands

View local images:

```powershell
docker images afbeals/finapp
```

View running containers:

```powershell
docker ps
```

View all containers:

```powershell
docker ps -a
```

View container logs:

```powershell
docker logs -f <container-name>
```

Stop a container:

```powershell
docker stop <container-name>
```

Remove a container:

```powershell
docker rm <container-name>
```

---

## Quick Reference

### Build

```powershell
yarn docker:build
```

### Tag

```powershell
yarn docker:tag
```

### Test

```powershell
yarn docker:test
```

### Push

```powershell
yarn docker:push
```

### Full release

```powershell
yarn docker:release
```

### Version

```powershell
yarn version --new-version 2.1.0
```

### Docker tags

```text
afbeals/finapp:<version>
afbeals/finapp:latest
```

### Production database

```text
Unraid:
/mnt/user/appdata/financial-review/data/prod.db

Container:
/app/data/prod.db
```

### Production application

```text
Docker Hub:
afbeals/finapp:latest

Unraid:
Host port 8775 → Container port 8775
```
