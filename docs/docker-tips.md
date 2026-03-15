# Docker Best Practices & Tips

> Common issues, fixes, and best practices encountered while developing Japtap Samagams.

---

## Table of Contents

1. [Build Cache Corruption — "parent snapshot does not exist"](#build-cache-corruption--parent-snapshot-does-not-exist)
2. [npm ci Requires package-lock.json](#npm-ci-requires-package-lockjson)
3. [General Docker Tips](#general-docker-tips)

---

## Build Cache Corruption — "parent snapshot does not exist"

### Symptom

```
failed to prepare extraction snapshot "extract-..." :
parent snapshot sha256:... does not exist: not found
```

### Cause

Docker's BuildKit cached intermediate layers from a previous build. One of those cached layer snapshots was deleted or corrupted (e.g., from a prior `docker image prune` or disk cleanup), but the build cache still references it.

### Fix

```bash
# Stop running containers
docker compose --env-file .env -f <your-compose-file> down

# Prune the build cache
docker builder prune -f

# Rebuild from scratch (no cache)
docker compose --env-file .env -f <your-compose-file> build --no-cache

docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml build --no-cache
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml build
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml down
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml up -d
```

If that still fails, do a deeper clean:

```bash
# Nuclear option — removes all unused images, containers, build cache
docker system prune -a -f
docker builder prune -a -f

# Then rebui{}ld
docker compose --env-file .env -f <your-compose-file> build --no-cache
```

> ⚠️ `docker system prune -a` removes **all** unused images. If you have other projects, you'll need to rebuild those images too.

---

## npm ci Requires package-lock.json

### Symptom

```
npm error code EUSAGE
npm error
npm error The `npm ci` command can only install with an existing package-lock.json or
npm error npm-shrinkwrap.json with lockfileVersion >= 1.
```

### Cause

The Dockerfile uses `npm ci` (clean install) for faster, deterministic builds. But `npm ci` **requires** a `package-lock.json` file to exist. If you've only created `package.json` without running `npm install`, the lockfile won't exist.

### Fix

```bash
# Generate package-lock.json by running install locally
cd <project-directory>
npm install

# Verify the lockfile was created
ls -la package-lock.json

# Now the Docker build will work
docker compose --env-file .env -f <your-compose-file> build
```

### Best Practice

- **Always commit `package-lock.json`** to version control — it ensures reproducible builds.
- **Never add `package-lock.json` to `.gitignore`** — it must be available during Docker builds.
- **`node_modules/`** should be in `.gitignore` — only the lockfile is needed.

---

## General Docker Tips

### Useful Commands

```bash
# Check running containers
docker compose -f <compose-file> ps

# View logs (all services)
docker compose -f <compose-file> logs -f

# View logs (specific service)
docker compose -f <compose-file> logs -f <service-name>

# Rebuild a single service without affecting others
docker compose -f <compose-file> build <service-name>
docker compose -f <compose-file> up -d <service-name>

# Enter a running container
docker compose -f <compose-file> exec <service-name> sh

# Check disk usage
docker system df

# Clean up dangling images (safe — only removes untagged images)
docker image prune -f

# Clean up everything unused (aggressive)
docker system prune -a -f
```

### Multi-Stage Build Tips

- Use `npm ci` instead of `npm install` in Dockerfiles — it's faster and respects the lockfile exactly.
- Use `--ignore-scripts` with `npm ci` to skip postinstall scripts that may not be needed in the build.
- Use `output: 'standalone'` in Next.js config to produce a self-contained build (no `node_modules` needed at runtime).
- Use non-root users in the final stage (`USER nextjs`) for security.

### Docker Compose Tips

- Use `--env-file .env` when your `.env` is not in the same directory as the compose file.
- Use `${VAR:-default}` syntax for optional env vars with fallbacks.
- Use `${VAR:?error message}` syntax to fail fast if a required env var is missing.
- Use fixed subnets in custom networks when your app needs IP-based trust (e.g., `ND_REVERSEPROXYWHITELIST`).
- Use named volumes for persistent data, and suffix with `-local` for dev volumes to avoid mixing with production.
