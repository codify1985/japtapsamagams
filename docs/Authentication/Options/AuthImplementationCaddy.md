# Auth Implementation Option 1: Caddy + Authentik

> **Status:** Implementation Guide — Hybrid custom flow required (not vanilla Option A)
>
> **Target user flow:**
> 1. First visit → home loads automatically as default user `japtaptest` (no login required)
> 2. Clicking Login (top-right) → redirects to Authentik OAuth page (Google / Facebook choice)
> 3. OAuth success → user returns to the exact page they clicked Login from
> 4. Logged-in user sees Logout in top-right
> 5. Clicking Logout → Authentik session cleared, redirected home as `japtaptest`

---

## Table of Contents

1. [Feasibility Analysis](#1-feasibility-analysis)
2. [Architecture](#2-architecture)
3. [Request Flow Sequences](#3-request-flow-sequences)
4. [Infrastructure — docker-compose.yml](#4-infrastructure--docker-composeyml)
5. [Caddyfile](#5-caddyfile)
6. [Authentik Setup](#6-authentik-setup)
7. [Navidrome Config Changes](#7-navidrome-config-changes)
8. [Backend Code Changes](#8-backend-code-changes)
9. [Frontend Code Changes](#9-frontend-code-changes)
10. [URL Design](#10-url-design)
11. [Pre-flight Steps](#11-pre-flight-steps)
12. [Test Plan](#12-test-plan)
13. [Risk & Rollback](#13-risk--rollback)
14. [Final Checklist](#14-final-checklist)

---

## 1. Feasibility Analysis

### Short answer: Yes — but requires 5 targeted customisations

The original Option A doc in `AuthImplementationOptions.md` describes a vanilla Caddy + Authentik stack. That stack **cannot** implement the required flow without modifications. The table below documents each gap found by reading the actual source files, and the fix for each.

| # | Gap | Evidence in code | Fix |
|---|---|---|---|
| 1 | **Wrong config keys** — Option A doc uses `ND_EXTAUTH_TRUSTEDSOURCES` / `ND_EXTAUTH_USERHEADER`, which do not exist in this codebase | `conf/configuration.go:90-91` defines `ReverseProxyUserHeader` and `ReverseProxyWhitelist`; no `ExtAuth` struct exists | Use `ND_REVERSEPROXYWHITELIST` + `ND_REVERSEPROXYUSERHEADER` |
| 2 | **`DevAutoLoginUsername` overrides all proxy auth** — Current setting forces every request to `japtaptest` regardless of `Remote-User` header | `server/auth.go:230-240` — `UsernameFromConfigPreferringToken` returns `"japtaptest"` unless a valid JWT for a *different* user already exists; `navidrome.toml:44` has `DevAutoLoginUsername = "japtaptest"` | Remove this key from `navidrome.toml` |
| 3 | **Standard `forward_auth` blocks unauthenticated requests** — Authentik returns HTTP 302 → Caddy's `forward_auth` follows it → first-time visitors land on Authentik login page, not Navidrome | Authentik embedded outpost behaviour; standard `forward_auth` Caddyfile snippet in Option A doc | Replace `forward_auth` with a custom `reverse_proxy` + two `handle_response` blocks: on 2xx forward `X-Authentik-Username`; on anything else inject `Remote-User: japtaptest` and proxy to Navidrome |
| 4 | **Login button navigates to internal `/login`** | `ui/src/layout/Logout.jsx:41-44` — `redirect('/login')` | Change to a hard `window.location.href` redirect to the Authentik outpost start URL with `rd=<current page>` |
| 5 | **Logout only clears localStorage** — Authentik session is not invalidated | `ui/src/authProvider.js:90-93` — `removeItems()` only; no external call | After clearing localStorage, do `window.location.href` to Authentik's outpost sign_out endpoint with `rd=<home>` |
| — | **`DefaultUser = "japtaptest"` in TOML is inert** | `conf/configuration.go` has no such field; `serve_index.go:43-79` does not inject it | Safe to remove — frontend `defaultUser` is hardcoded at `ui/src/config.js:43` |
| — | **Whitelist too narrow** — Current `127.0.0.1/32,::1/128` only trusts localhost | `navidrome.toml:47` | Update to the Docker network CIDR (`172.18.0.0/16`) |
| — | **Hardcoded japtaptest credentials in `config.js:48-55`** | Dev-only fallback; production server always overrides via `serve_index.go:83-86` | No change needed — safe to leave as dev fallback |

### Authentication chain (confirmed from code)

`server/auth.go:268-280` — The `Authenticator` middleware calls these in order:

```
1. UsernameFromConfigPreferringToken  ← reads DevAutoLoginUsername (MUST BE REMOVED)
2. UsernameFromToken                  ← reads JWT from X-ND-Authorization header
3. UsernameFromReverseProxyHeader     ← reads Remote-User header from trusted proxy IP
```

Once `DevAutoLoginUsername` is removed from config, step 1 returns `""` and the chain correctly falls through to JWT then to the `Remote-User` proxy header. **No Go code changes are required.**

---

## 2. Architecture

```
Internet
    │
    ▼
┌──────────────────────────────────────────────────────┐
│  Caddy  (ports 80 / 443, TLS auto via Let's Encrypt) │
│                                                       │
│  For every non-bypass request:                        │
│    1. Sub-request → Authentik outpost (auth check)    │
│       ├─ HTTP 2xx  →  set Remote-User: <oauth-email>  │
│       └─ non-2xx  →  set Remote-User: japtaptest      │
│                                                       │
│  Bypass (no auth check):                              │
│    /rest/*   — Subsonic API clients                   │
│    /share/*  — Public share links                     │
│                                                       │
│  Forward Authentik outpost paths:                     │
│    /outpost.goauthentik.io/*                          │
└───────────┬──────────────────────────┬────────────────┘
            │ Remote-User header        │
            ▼                           ▼
┌─────────────────────┐   ┌──────────────────────────────┐
│  Navidrome :4633    │   │  Authentik server :9000       │
│                     │   │  (embedded outpost included)  │
│  Reads Remote-User  │   │                               │
│  Trusts 172.18.0/16 │   │  Google / Facebook OAuth      │
│  Auto-creates users │   │  sources configured           │
└─────────────────────┘   └──────────────────────────────┘
```

**Key design decision — why not `forward_auth`:**
Caddy's `forward_auth` shorthand automatically redirects users to Authentik when there is no session. We want the **opposite** for unauthenticated visitors: serve them Navidrome as `japtaptest`, not block them at a login wall. The full `reverse_proxy` directive with `handle_response` blocks gives us precise control over what happens for each HTTP status from the Authentik outpost.

---

## 3. Request Flow Sequences

### 3.1 — First visit (anonymous user)

```
Browser                    Caddy               Authentik outpost      Navidrome
   │                         │                        │                    │
   │  GET music.example.com/ │                        │                    │
   │────────────────────────►│                        │                    │
   │                         │  GET /outpost.goauthentik.io/auth/caddy    │
   │                         │  X-Original-URL: https://music.example.com/│
   │                         │───────────────────────►│                    │
   │                         │                        │                    │
   │                         │   HTTP 302 (no session)│                    │
   │                         │◄───────────────────────│                    │
   │                         │                        │                    │
   │                         │  [handle_response catch-all]               │
   │                         │  Remote-User: japtaptest                   │
   │                         │  GET /                                     │
   │                         │───────────────────────────────────────────►│
   │                         │                        │                    │
   │                         │          HTML (appConfig includes japtaptest auth)
   │                         │◄───────────────────────────────────────────│
   │  200 OK + HTML          │                        │                    │
   │◄────────────────────────│                        │                    │
   │                         │                        │                    │
   [Browser parses appConfig — authProvider.js stores japtaptest credentials]
   [Logout.jsx sees currentUser === config.defaultUser → shows Login button]
```

**What `serve_index.go` does on this request (line 83):**
`handleLoginFromHeaders()` sees `Remote-User: japtaptest` from a trusted IP, looks up (or creates) the `japtaptest` user, builds an auth payload, and injects it into `window.__APP_CONFIG__`. `authProvider.js:31-38` stores it in localStorage. The user is "logged in" as `japtaptest` transparently.

---

### 3.2 — Explicit Login (OAuth flow)

```
Browser                    Caddy               Authentik               Google/Facebook
   │                         │                     │                          │
   [User clicks Login in Logout.jsx]                │                          │
   │  GET /outpost.goauthentik.io/start             │                          │
   │  ?rd=https://music.example.com/album/xyz       │                          │
   │────────────────────────►│                      │                          │
   │                         │  Proxy to Authentik  │                          │
   │                         │─────────────────────►│                          │
   │                         │                      │                          │
   │  302 → Authentik login page (/if/flow/...)     │                          │
   │◄────────────────────────────────────────────────                          │
   │                         │                      │                          │
   │  GET /if/flow/default-authentication-flow/      │                          │
   │────────────────────────────────────────────────►                          │
   │                         │                      │  302 → Google OAuth      │
   │◄────────────────────────────────────────────────                          │
   │                                                                            │
   │  [User authenticates with Google/Facebook]                                 │
   │                                                                            │
   │  GET /source/oauth/callback/google/             │                          │
   │────────────────────────────────────────────────►                          │
   │                         │                      │                          │
   │  302 → rd URL (https://music.example.com/album/xyz)                       │
   │◄────────────────────────────────────────────────                          │
   │                         │                      │                          │
   │  GET /album/xyz         │                      │                          │
   │────────────────────────►│                      │                          │
   │                         │  GET /outpost.goauthentik.io/auth/caddy         │
   │                         │─────────────────────►│                          │
   │                         │  HTTP 200            │                          │
   │                         │  X-Authentik-Username: user@gmail.com           │
   │                         │◄─────────────────────│                          │
   │                         │                      │                          │
   │                         │  [handle_response @authed]                      │
   │                         │  Remote-User: user@gmail.com                   │
   │                         │  GET /album/xyz                                 │
   │                         │──────────────────────────────────────────────►  │
   │                         │                      │  HTML (auth: user@gmail) │
   │  200 OK — album page    │◄──────────────────────────────────────────────  │
   │◄────────────────────────│                      │                          │
   │                         │                      │                          │
   [authProvider.js:31 detects new user in appConfig, stores in localStorage]
   [Logout.jsx: currentUser !== config.defaultUser → shows Logout button]
```

---

### 3.3 — Logout

```
Browser                    Caddy              Authentik outpost      Navidrome
   │                         │                     │                     │
   [User clicks Logout — RALogout → authProvider.logout()]
   │                         │                     │                     │
   [localStorage cleared by removeItems()]
   │                         │                     │                     │
   │  GET /outpost.goauthentik.io/sign_out          │                     │
   │  ?rd=https://music.example.com/               │                     │
   │────────────────────────►│                     │                     │
   │                         │  Proxy to Authentik │                     │
   │                         │────────────────────►│                     │
   │                         │                     │  Clears session     │
   │  302 → https://music.example.com/             │                     │
   │◄────────────────────────────────────────────────                    │
   │                         │                     │                     │
   │  GET /                  │                     │                     │
   │────────────────────────►│                     │                     │
   │                         │  GET /outpost.goauthentik.io/auth/caddy  │
   │                         │────────────────────►│                     │
   │                         │  HTTP 302 (no session)                   │
   │                         │◄────────────────────│                     │
   │                         │  [catch-all] Remote-User: japtaptest     │
   │                         │──────────────────────────────────────────►
   │  200 OK (japtaptest)    │◄──────────────────────────────────────────
   │◄────────────────────────│                     │                     │
   [User is back on home as japtaptest — Login button visible again]
```

---

## 4. Infrastructure — docker-compose.yml

**File location:** `deploy/docker-compose-caddy.yml` ✅ created

```
deploy/
├── docker-compose-caddy.yml
└── caddy/
    └── Caddyfile
```

The `Caddyfile` lives at `deploy/caddy/Caddyfile` (mounted as `./caddy/Caddyfile` from the compose file's perspective). All `docker compose` commands are run from the **project root** with `-f deploy/docker-compose-caddy.yml`.

Full content for reference:

```yaml
services:

  # ─────────────────────────────────────────────────
  # Authentik — PostgreSQL backend
  # ─────────────────────────────────────────────────
  authentik-db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: authentik
      POSTGRES_USER: authentik
      POSTGRES_PASSWORD: ${AUTHENTIK_DB_PASSWORD}
    volumes:
      - authentik-db:/var/lib/postgresql/data
    networks:
      - internal

  # ─────────────────────────────────────────────────
  # Authentik — Redis cache
  # ─────────────────────────────────────────────────
  authentik-redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - internal

  # ─────────────────────────────────────────────────
  # Authentik — Server (web UI + embedded outpost)
  # ─────────────────────────────────────────────────
  authentik-server:
    image: ghcr.io/goauthentik/server:2024.12.3
    restart: unless-stopped
    command: server
    environment:
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
      AUTHENTIK_REDIS__HOST: authentik-redis
      AUTHENTIK_POSTGRESQL__HOST: authentik-db
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_DB_PASSWORD}
      # Required for correct redirect URI generation
      AUTHENTIK_ERROR_REPORTING__ENABLED: "false"
    depends_on:
      - authentik-db
      - authentik-redis
    networks:
      - internal
    # DO NOT expose port 9000 directly in production.
    # Access Authentik admin UI through Caddy at auth.yourdomain.com.

  # ─────────────────────────────────────────────────
  # Authentik — Worker (background tasks)
  # ─────────────────────────────────────────────────
  authentik-worker:
    image: ghcr.io/goauthentik/server:2024.12.3
    restart: unless-stopped
    command: worker
    environment:
      AUTHENTIK_SECRET_KEY: ${AUTHENTIK_SECRET_KEY}
      AUTHENTIK_REDIS__HOST: authentik-redis
      AUTHENTIK_POSTGRESQL__HOST: authentik-db
      AUTHENTIK_POSTGRESQL__USER: authentik
      AUTHENTIK_POSTGRESQL__NAME: authentik
      AUTHENTIK_POSTGRESQL__PASSWORD: ${AUTHENTIK_DB_PASSWORD}
    depends_on:
      - authentik-db
      - authentik-redis
    networks:
      - internal

  # ─────────────────────────────────────────────────
  # Navidrome — music server
  # ─────────────────────────────────────────────────

  navidrome:
    container_name: "japtapsamagams"
    build:
      context: ../       # project root — one level up from deploy/
      dockerfile: Dockerfile
    image: navidrome-local:latest
    restart: unless-stopped
    # WARNING: Do NOT expose this port in production — all traffic must go through Caddy.
    # Uncomment only for local pre-flight / debugging (§17 Step 8), then remove again.
    # ports:
    #   - "4633:4633"
    volumes:
      - /Users/gagan/MyCodebae/japtapsamagams/data:/data
      - /Users/gagan/MyCodebae/japtapsamagams/music:/music:ro
      - /Users/gagan/MyCodebae/japtapsamagams/logs:/logs
    environment:
      ND_MUSICFOLDER: /music
      ND_DATAFOLDER: /data
      ND_PORT: 4633
      ND_LOGFILE: /logs/log.txt
      ND_FFMPEGPATH: /usr/bin/ffmpeg
      # Correct keys for this codebase (conf/configuration.go:90-91).
      # NOT ND_EXTAUTH_* — those keys do not exist in this fork.
      ND_REVERSEPROXYWHITELIST: "172.18.0.0/16"
      ND_REVERSEPROXYUSERHEADER: "Remote-User"
      ND_ENABLEUSEREDITING: "false"
      ND_ENABLEUSERSELFSIGNUP: "false"
    networks:
      - internal

  # ─────────────────────────────────────────────────
  # Caddy — reverse proxy + automatic TLS
  # ─────────────────────────────────────────────────
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"    # HTTP/3
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro   # deploy/caddy/Caddyfile
      - caddy-data:/data
      - caddy-config:/config
    networks:
      - internal
    depends_on:
      - navidrome
      - authentik-server

networks:
  internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.18.0.0/16   # Fixed — matches ND_REVERSEPROXYWHITELIST

volumes:
  authentik-db:
  caddy-data:
  caddy-config:
```

Create `.env` (never commit to version control):

```bash
# Generate with: openssl rand -hex 32
AUTHENTIK_SECRET_KEY=replace-with-64-char-random-string

# Generate with: openssl rand -hex 16
AUTHENTIK_DB_PASSWORD=replace-with-strong-password
```

---

## 5. Caddyfile

**File location:** `deploy/caddy/Caddyfile` ✅ created

This is the most important deviation from the original Option A doc. We use the **full `reverse_proxy` directive with two `handle_response` blocks** instead of the `forward_auth` shorthand. This is necessary because `forward_auth` automatically redirects unauthenticated users to Authentik, which conflicts with the "default `japtaptest` user on first visit" requirement.

**How it works:**
- Every non-bypass request triggers a sub-request to the Authentik embedded outpost at `/outpost.goauthentik.io/auth/caddy`
- If Authentik responds 2xx (valid session): `X-Authentik-Username` is forwarded as `Remote-User` to Navidrome
- If Authentik responds anything else (302 redirect = no session, 401, 403): inject `Remote-User: japtaptest` and proxy directly to Navidrome — **no redirect to login**
- `/outpost.goauthentik.io/*` paths are proxied directly to Authentik so the Login click and callback work

```caddyfile
# Global options
{
    email admin@yourdomain.com
}

# ─────────────────────────────────────────────────
# Navidrome — music player
# ─────────────────────────────────────────────────
music.yourdomain.com {

    # ── 1. Authentik outpost endpoints ──────────────
    # These must be handled FIRST.
    # /outpost.goauthentik.io/start  — Login entry point (Login button redirects here)
    # /outpost.goauthentik.io/sign_out — Logout entry point
    # /source/oauth/callback/*       — OAuth provider callbacks
    handle /outpost.goauthentik.io/* {
        reverse_proxy authentik-server:9000 {
            header_up Host             {upstream_hostport}
            header_up X-Real-IP        {remote_host}
            header_up X-Forwarded-For  {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # ── 2. Subsonic API — bypass auth entirely ──────
    # Subsonic clients (DSub, Symfonium, etc.) use password/token auth.
    # They cannot do OAuth. Navidrome validates their credentials natively.
    handle /rest/* {
        reverse_proxy navidrome:4633 {
            header_up Host             {upstream_hostport}
            header_up X-Real-IP        {remote_host}
            header_up X-Forwarded-For  {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # ── 3. Public share links — bypass auth ─────────
    handle /share/* {
        reverse_proxy navidrome:4633 {
            header_up Host             {upstream_hostport}
            header_up X-Real-IP        {remote_host}
            header_up X-Forwarded-For  {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # ── 4. All other requests — optional Authentik auth ──
    handle {
        reverse_proxy authentik-server:9000 {
            # Method and path for the forward-auth sub-request
            method GET
            rewrite /outpost.goauthentik.io/auth/caddy

            # Tell Authentik the original URL (needed for redirect-after-login)
            header_up X-Original-URL    {scheme}://{host}{uri}
            header_up X-Real-IP         {remote_host}
            header_up X-Forwarded-For   {remote_host}
            header_up X-Forwarded-Proto {scheme}
            # Do not forward Accept-Encoding — Authentik response must be readable
            header_up Accept-Encoding   ""

            # ── Branch A: Authentik says "authenticated" (HTTP 2xx) ──
            # Forward the authenticated user's identity to Navidrome.
            @authed status 2xx
            handle_response @authed {
                # Copy the username Authentik verified into the Remote-User request header.
                # Navidrome reads this via ReverseProxyUserHeader = "Remote-User"
                # and ReverseProxyWhitelist = "172.18.0.0/16" (server/auth.go:196-215)
                request_header +Remote-User {http.reverse_proxy.header.X-Authentik-Username}

                reverse_proxy navidrome:4633 {
                    header_up Host             {upstream_hostport}
                    header_up X-Real-IP        {remote_host}
                    header_up X-Forwarded-For  {remote_host}
                    header_up X-Forwarded-Proto {scheme}
                    # WebSocket support (Navidrome uses SSE / WS for real-time updates)
                    header_up Upgrade    {>Upgrade}
                    header_up Connection {>Connection}
                }
            }

            # ── Branch B: No Authentik session (HTTP 302 redirect, 401, or 403) ──
            # Instead of redirecting the user to the Authentik login page,
            # inject the default user and proxy to Navidrome transparently.
            # This is what makes "first visit as japtaptest" work.
            handle_response {
                request_header +Remote-User japtaptest

                reverse_proxy navidrome:4633 {
                    header_up Host             {upstream_hostport}
                    header_up X-Real-IP        {remote_host}
                    header_up X-Forwarded-For  {remote_host}
                    header_up X-Forwarded-Proto {scheme}
                    header_up Upgrade    {>Upgrade}
                    header_up Connection {>Connection}
                }
            }
        }
    }
}

# ─────────────────────────────────────────────────
# Authentik admin portal
# ─────────────────────────────────────────────────
auth.yourdomain.com {
    reverse_proxy authentik-server:9000 {
        header_up Host             {upstream_hostport}
        header_up X-Real-IP        {remote_host}
        header_up X-Forwarded-For  {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

> **Important:** Replace `music.yourdomain.com` and `auth.yourdomain.com` with your actual domain names. Caddy obtains TLS certificates from Let's Encrypt automatically.

---

## 6. Authentik Setup

### 6.1 Initial setup

1. Start the stack: `docker compose up -d authentik-server authentik-worker authentik-db authentik-redis`
2. Open `http://your-server:9000/if/flow/initial-setup/` (temporarily expose port 9000 or use `docker compose exec`)
3. Create the initial admin account. Save the credentials securely.
4. After setup, remove any direct port exposure for `authentik-server` — all access goes through Caddy at `auth.yourdomain.com`.

### 6.2 Add Google as an OAuth source

1. Navigate to **Directory → Federation & Social Login → Create**
2. Select type: **OAuth2/OpenID Connect**
3. Fill in:
   - **Name:** Google
   - **Slug:** google
   - **Consumer Key:** your `GOOGLE_CLIENT_ID`
   - **Consumer Secret:** your `GOOGLE_CLIENT_SECRET`
   - **Authorization URL:** `https://accounts.google.com/o/oauth2/v2/auth`
   - **Access token URL:** `https://oauth2.googleapis.com/token`
   - **Profile URL:** `https://www.googleapis.com/oauth2/v3/userinfo`
   - **OIDC well-known URL:** `https://accounts.google.com/.well-known/openid-configuration`
4. Note the **Callback URL** shown (e.g., `https://auth.yourdomain.com/source/oauth/callback/google/`). Register this exact URL in Google Cloud Console under **Authorized redirect URIs**.
5. Save.

### 6.3 Add Facebook as an OAuth source

1. Navigate to **Directory → Federation & Social Login → Create**
2. Select type: **Facebook**
3. Fill in:
   - **Name:** Facebook
   - **Consumer Key:** your Facebook App ID
   - **Consumer Secret:** your Facebook App Secret
4. Note the **Callback URL** (e.g., `https://auth.yourdomain.com/source/oauth/callback/facebook/`). Register it in Facebook Developers → Facebook Login → Settings → Valid OAuth Redirect URIs.
5. Save.

### 6.4 Create a Proxy Provider for Navidrome

1. Navigate to **Applications → Providers → Create**
2. Select type: **Proxy Provider**
3. Configure:
   - **Name:** `navidrome-proxy`
   - **Authentication flow:** `default-authentication-flow`
   - **Authorization flow:** `default-provider-authorization-implicit-consent`
   - **Mode:** Forward auth (single application)
   - **External host:** `https://music.yourdomain.com`
4. Under **Advanced protocol settings**, verify:
   - **Token validity:** `hours=24` (or your preference)
5. Save.

### 6.5 Create an Application

1. Navigate to **Applications → Applications → Create**
2. Configure:
   - **Name:** Navidrome
   - **Slug:** `navidrome`
   - **Provider:** select `navidrome-proxy` (created above)
   - **Launch URL:** `https://music.yourdomain.com`
3. Save.

### 6.6 Create an Outpost (embedded type)

1. Navigate to **Applications → Outposts → Create**
2. Configure:
   - **Name:** `navidrome-embedded-outpost`
   - **Type:** Proxy
   - **Integration:** (leave empty for embedded outpost — Authentik server handles it directly)
   - **Applications:** select `navidrome`
3. Save.

> **Embedded outpost vs. separate outpost container:**
> The embedded outpost runs inside `authentik-server` itself. Authentik automatically exposes `/outpost.goauthentik.io/*` paths on its own port 9000. No additional container is needed. This is the recommended approach for single-host Docker deployments.

### 6.7 Verify the forward-auth endpoint

From inside the Docker network (or via `docker compose exec caddy`):
```bash
curl -v http://authentik-server:9000/outpost.goauthentik.io/auth/caddy \
  -H "X-Original-URL: https://music.yourdomain.com/"
```
- **Expected without session:** `HTTP/1.1 302` with `Location:` pointing to Authentik login
- **Expected with valid session cookie:** `HTTP/1.1 200` with `X-Authentik-Username: user@example.com`

---

## 7. Navidrome Config Changes

File: `navidrome.toml`

### Lines to change

**Line 44 — REMOVE `DevAutoLoginUsername`:**

```toml
# BEFORE (must remove — this overrides all proxy auth, server/auth.go:230-240):
DevAutoLoginUsername = "japtaptest"

# AFTER — comment out or delete entirely:
# DevAutoLoginUsername = "japtaptest"   # Dev only — disabled in production
```

**Line 47 — UPDATE `ReverseProxyWhitelist`:**

```toml
# BEFORE (only trusts localhost — Caddy container IP will be rejected):
ReverseProxyWhitelist = "127.0.0.1/32,::1/128"

# AFTER (trusts the fixed Docker network subnet from docker-compose.yml):
ReverseProxyWhitelist = "172.18.0.0/16"
```

**Line 49 — REMOVE `DefaultUser` (inert key):**

```toml
# BEFORE (has no effect — no such field in conf/configuration.go):
DefaultUser = "japtaptest"

# AFTER — comment out or delete:
# DefaultUser = "japtaptest"   # Not a valid Navidrome config key
```

**Lines 46, 50-51 — Keep as-is (correct):**

```toml
ReverseProxyUserHeader = "Remote-User"   # line 46 — correct
EnableUserSelfSignup = false             # line 50 — correct
EnableUserEditing = false                # line 51 — correct
```

### Complete modified section (lines 44-51 after changes):

```toml
# Removed: DevAutoLoginUsername = "japtaptest"  — dev-only, overrides proxy auth

# Enable reverse proxy authentication
ReverseProxyUserHeader = "Remote-User"
ReverseProxyWhitelist = "172.18.0.0/16"   # Updated: Docker internal network

# Removed: DefaultUser = "japtaptest"  — not a valid config key

EnableUserSelfSignup = false
EnableUserEditing = false
```

---

## 8. Backend Code Changes

**No Go source code changes are required.**

Here is why the existing code already implements the correct behaviour once the config is fixed:

### `server/auth.go:268-280` — `Authenticator` middleware

```go
func Authenticator(ds model.DataStore) func(next http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            ctx, err := authenticateRequest(ds, r,
                UsernameFromConfigPreferringToken,  // ← returns "" once DevAutoLoginUsername removed
                UsernameFromToken,                  // ← reads JWT from X-ND-Authorization header
                UsernameFromReverseProxyHeader,     // ← reads Remote-User from trusted IP
            )
```

With `DevAutoLoginUsername` removed from config:
1. `UsernameFromConfigPreferringToken` → returns `""` (step 1 skipped)
2. `UsernameFromToken` → reads JWT for logged-in users making API calls
3. `UsernameFromReverseProxyHeader` → reads `Remote-User` injected by Caddy

### `server/auth.go:196-215` — Reverse proxy validation

```go
func UsernameFromReverseProxyHeader(r *http.Request) string {
    if conf.Server.ReverseProxyWhitelist == "" {
        return ""
    }
    // Validates that the request came from a trusted proxy IP (172.18.0.0/16)
    if !validateIPAgainstList(reverseProxyIp, conf.Server.ReverseProxyWhitelist) {
        return ""
    }
    // Reads the username from the configured header ("Remote-User")
    username := r.Header.Get(conf.Server.ReverseProxyUserHeader)
    ...
```

### `server/serve_index.go:83-86` — Auto-inject auth on page load

```go
auth := handleLoginFromHeaders(ds, r)
if auth != nil {
    appConfig["auth"] = auth
}
```

`handleLoginFromHeaders` (auth.go:303-347) looks up (or auto-creates) the user identified by `Remote-User` and returns a full auth payload (id, name, username, subsonic salt/token, isAdmin). This payload is injected into `window.__APP_CONFIG__` and the frontend (`authProvider.js:31-37`) stores it in localStorage.

### `server/auth.go:314-338` — Auto-create users from proxy header

When an OAuth user (e.g., `user@gmail.com`) logs in for the first time, Navidrome will not find them in the DB. `handleLoginFromHeaders` auto-creates the user:

```go
count, _ := userRepo.CountAll()
isFirstUser := count == 0

newUser := model.User{
    ID:          id.NewRandom(),
    UserName:    username,
    Name:        username,
    Email:       "",
    NewPassword: consts.PasswordAutogenPrefix + id.NewRandom(),  // random, user never sees it
    IsAdmin:     isFirstUser,  // first user = admin
}
```

**Implication:** Do the pre-flight steps (§11) to ensure `japtaptest` and your admin account exist before enabling this setup. This prevents an anonymous japtaptest visit from accidentally claiming the admin slot.

---

## 9. Frontend Code Changes

### 9.1 `ui/src/layout/Logout.jsx`

**Affected lines: 30, 41-44**

The Login button currently does a react-admin client-side redirect to `/login`. This must become a full-page redirect to Authentik's outpost start URL, preserving the current page URL in the `rd` parameter.

**Before (lines 29-44):**
```javascript
const redirect = useRedirect()
const translate = useTranslate()
// ...
const handleLoginClick = useCallback(() => {
    handleClearQueue()
    redirect('/login')
}, [handleClearQueue, redirect])
```

**After:**
```javascript
// Remove: const redirect = useRedirect()
const translate = useTranslate()
// ...
const handleLoginClick = useCallback(() => {
    handleClearQueue()
    // Hard redirect to Authentik outpost start URL.
    // The 'rd' parameter tells Authentik where to send the user after OAuth success.
    // This is served by Caddy → proxied to authentik-server:9000 (§5 Caddyfile, block 1)
    window.location.href =
        '/outpost.goauthentik.io/start?rd=' + encodeURIComponent(window.location.href)
}, [handleClearQueue])
```

**Import line change (top of file, line 7):**
```javascript
// Before:
import { Logout as RALogout, useGetIdentity, useRedirect, useTranslate } from 'react-admin'

// After (remove useRedirect):
import { Logout as RALogout, useGetIdentity, useTranslate } from 'react-admin'
```

**Full diff:**

```diff
--- a/ui/src/layout/Logout.jsx
+++ b/ui/src/layout/Logout.jsx
@@ -4,13 +4,12 @@ import {
   Logout as RALogout,
   useGetIdentity,
-  useRedirect,
   useTranslate,
 } from 'react-admin'

@@ -27,11 +26,10 @@ const Logout = (props) => {
   const { className, icon, ...rest } = props
   const dispatch = useDispatch()
   const { identity } = useGetIdentity()
-  const redirect = useRedirect()
   const translate = useTranslate()

@@ -39,8 +38,9 @@ const Logout = (props) => {
   const handleLoginClick = useCallback(() => {
     handleClearQueue()
-    redirect('/login')
-  }, [handleClearQueue, redirect])
+    window.location.href =
+      '/outpost.goauthentik.io/start?rd=' + encodeURIComponent(window.location.href)
+  }, [handleClearQueue])
```

---

### 9.2 `ui/src/authProvider.js`

**Affected lines: 90-93**

The logout handler must clear the Authentik session by redirecting to the outpost sign_out URL, in addition to clearing localStorage. The `rd` parameter tells Authentik where to redirect after signing out (back to home, which will auto-load as `japtaptest`).

**Before (lines 90-93):**
```javascript
logout: () => {
    removeItems()
    return Promise.resolve()
},
```

**After:**
```javascript
logout: () => {
    removeItems()
    // Redirect to Authentik outpost sign_out.
    // Authentik clears its session cookie, then redirects to 'rd' (home page).
    // On return to home, Caddy injects Remote-User: japtaptest (no Authentik session).
    // serve_index.go:83 re-injects japtaptest auth into window.__APP_CONFIG__.
    window.location.href =
        '/outpost.goauthentik.io/sign_out?rd=' + encodeURIComponent(window.location.origin + '/')
    return Promise.resolve()
},
```

**Full diff:**

```diff
--- a/ui/src/authProvider.js
+++ b/ui/src/authProvider.js
@@ -90,6 +90,10 @@ const authProvider = {
   logout: () => {
     removeItems()
-    return Promise.resolve()
+    // Redirect to Authentik to clear server-side session, then back to home.
+    window.location.href =
+      '/outpost.goauthentik.io/sign_out?rd=' + encodeURIComponent(window.location.origin + '/')
+    return Promise.resolve()
   },
```

> **Note on timing:** `removeItems()` is synchronous (localStorage). The `window.location.href` assignment schedules a navigation. React-admin's post-logout redirect to `/login` is preempted by the browser navigating to Authentik's sign_out endpoint. This is the expected behaviour.

---

## 10. URL Design

| Action | URL | Handler |
|---|---|---|
| Login (user clicks Login button) | `https://music.yourdomain.com/outpost.goauthentik.io/start?rd=<current_url>` | Caddy → Authentik outpost → OAuth flow |
| OAuth callback (Google) | `https://auth.yourdomain.com/source/oauth/callback/google/` | Caddy → Authentik server |
| OAuth callback (Facebook) | `https://auth.yourdomain.com/source/oauth/callback/facebook/` | Caddy → Authentik server |
| Post-login redirect | The value of `rd` parameter | Authentik → browser |
| Forward-auth check | `/outpost.goauthentik.io/auth/caddy` (internal, never seen by browser) | Caddy sub-request to Authentik |
| Logout (user clicks Logout) | `/outpost.goauthentik.io/sign_out?rd=https://music.yourdomain.com/` | Caddy → Authentik outpost |
| Authentik admin UI | `https://auth.yourdomain.com/` | Caddy → Authentik server |

### `rd` parameter contract

- Set by the UI when triggering login: `window.location.href` (full URL including path and query)
- Authentik validates that `rd` points to a registered **Application** domain (`https://music.yourdomain.com`)
- After successful OAuth, Authentik redirects to `rd` — user lands back on the exact page

**Register the allowed redirect domain in Authentik:**
In the Proxy Provider settings (§6.4), Authentik automatically validates that `rd` matches the **External host** setting (`https://music.yourdomain.com`). No additional configuration needed.

---

## 11. Pre-flight Steps

Do these in order **before** switching to Caddy+Authentik.

### Step 1 — Ensure `japtaptest` exists and is non-admin

With the current `DevAutoLoginUsername = "japtaptest"` still active, `japtaptest` is almost certainly already in the DB. Verify and demote if needed:

1. Log into Navidrome as admin
2. Go to **Users** admin panel
3. Confirm `japtaptest` user exists
4. Confirm `japtaptest` is **not** admin (if it is, change it — your real account should be admin)

If `japtaptest` does not exist yet, it will be auto-created on the first anonymous request after Caddy is deployed (via `handleLoginFromHeaders` in `serve_index.go:83`). In that case, ensure a real admin user is created **before** deploying Caddy so that `japtaptest` is not the first user (which would make it admin).

### Step 2 — Create your admin OAuth user in Navidrome (optional but recommended)

Before enabling Caddy, you can pre-create your OAuth email as a Navidrome admin user so it's not auto-created as a plain user on first login:

1. In Navidrome admin panel, create a user with username = your Google/Facebook email address
2. Set `IsAdmin = true`
3. Set any password (it won't be used for OAuth login — the password is only for Subsonic clients)

### Step 3 — Test Authentik without Caddy

Before switching DNS, test that Authentik is reachable and OAuth works:

1. Start the stack without Caddy, with Authentik's port 9000 temporarily exposed
2. Complete §6 (Authentik setup)
3. Verify Google/Facebook OAuth sources are working (test login flow in Authentik admin)
4. Verify the forward-auth endpoint returns 302 (no session) and 200 (with session)

### Step 4 — Switch DNS and deploy Caddy

1. Point `music.yourdomain.com` and `auth.yourdomain.com` DNS to your server
2. Apply the `navidrome.toml` changes from §7 (remove `DevAutoLoginUsername`, update whitelist)
3. Apply the frontend code changes from §9
4. Rebuild the Navidrome Docker image: `docker compose build navidrome`
5. Start the full stack: `docker compose up -d`
6. Run through the test plan in §12

---

## 12. Test Plan

Run these tests in order. Each test must pass before proceeding to the next.

### TC-1: First visit as default user

1. Open `https://music.yourdomain.com/` in an **incognito** / private browser window (no cookies, no localStorage)
2. **Expected:** Page loads without any redirect to Authentik
3. **Expected:** Top-right shows a **Login** button (not Logout)
4. **Expected:** Music library is visible and browsable
5. **Expected:** Browser DevTools → Application → Local Storage → `username` = `"japtaptest"`
6. **Debug if fails:**
   - Check Caddy logs: `docker compose logs caddy` — look for the auth sub-request to Authentik returning 302
   - Check Navidrome logs: look for `"Found username in ReverseProxyUserHeader" username=japtaptest`
   - Verify `Remote-User` header arrives: `docker compose exec navidrome curl -v http://localhost:4633/ -H "Remote-User: japtaptest"` (should return 200, not redirect)

### TC-2: Login redirects to Authentik with `rd` param

1. From the same incognito window, navigate to any album page, e.g., `https://music.yourdomain.com/album/abc`
2. Click the **Login** button (top-right)
3. **Expected:** Browser address bar changes to `https://music.yourdomain.com/outpost.goauthentik.io/start?rd=https%3A%2F%2Fmusic.yourdomain.com%2Falbum%2Fabc`
4. **Expected:** Authentik login page loads with Google and Facebook buttons
5. **Debug if fails:**
   - Check that `Logout.jsx` change was applied — the Login click should set `window.location.href`, not call `redirect('/login')`
   - If you land on Navidrome's own `/login` page, the Logout.jsx change was not applied or the build was not updated

### TC-3: OAuth completes and returns to original page

1. Continuing from TC-2, click **Sign in with Google**
2. Complete Google OAuth with a test account
3. **Expected:** After OAuth, browser redirects to `https://music.yourdomain.com/album/abc` (the `rd` page)
4. **Expected:** Top-right now shows **Logout** (not Login)
5. **Expected:** Local Storage → `username` = your Google email address
6. **Expected:** The album page content is visible and usable
7. **Debug if fails:**
   - Check Authentik logs for the OAuth callback: `docker compose logs authentik-server`
   - Check that the redirect URI registered in Google Console matches `https://auth.yourdomain.com/source/oauth/callback/google/`
   - Check Caddy logs for the forward-auth check after return — Authentik should now return 200 with `X-Authentik-Username`

### TC-4: Refresh stays logged in

1. Hard-refresh the page (Ctrl+Shift+R / Cmd+Shift+R) while logged in as OAuth user
2. **Expected:** Still logged in as OAuth user (Logout button visible)
3. **Expected:** Local Storage → `username` = your OAuth email

### TC-5: Logout returns to `japtaptest`

1. Click **Logout**
2. **Expected:** Brief redirect through `https://music.yourdomain.com/outpost.goauthentik.io/sign_out?rd=https://music.yourdomain.com/`
3. **Expected:** Authentik signs out, redirects to `https://music.yourdomain.com/`
4. **Expected:** Home page loads showing **Login** button (not Logout)
5. **Expected:** Local Storage → `username` = `"japtaptest"`
6. **Debug if fails:**
   - Check that `authProvider.js` change was applied — logout should redirect to sign_out URL
   - Check Caddy logs — after sign_out redirect, the next request should hit Authentik auth check → 302 (no session) → Caddy injects `Remote-User: japtaptest`

### TC-6: Subsonic API client bypass

1. Configure a Subsonic client (e.g., DSub) with `https://music.yourdomain.com` and a user's credentials
2. **Expected:** Client connects successfully without OAuth intervention
3. **Expected:** Playback works

### TC-7: Multiple users in the same browser

1. Log in as user A
2. Open a new tab (same browser, not incognito)
3. **Expected:** Already logged in as user A (Authentik session persists)
4. Log out from user A
5. **Expected:** Both tabs return to `japtaptest`

---

## 13. Risk & Rollback

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Caddy's `handle_response` with nested `reverse_proxy` not working as expected in specific Caddy versions | Low | High | Test with Caddy 2.8+; pin `image: caddy:2.8-alpine` in docker-compose; verify TC-1 locally before production DNS switch |
| Authentik `X-Authentik-Username` header name changes in future versions | Low | Medium | Pin Authentik version (`2024.12.3`) in docker-compose; check Authentik changelog before upgrading |
| `japtaptest` auto-created as admin if first user | Medium (if pre-flight skipped) | High | Always follow §11 pre-flight — create real admin first |
| Caddy can't reach Authentik at `authentik-server:9000` | Low | High | Verify Docker network connectivity before switching DNS |
| Forward-auth sub-request latency affects page load | Low | Low | Authentik responds in <10ms on the same Docker host |
| Authentik outpost endpoint path changes | Low | High | Check Authentik release notes; the `/outpost.goauthentik.io/*` prefix has been stable since 2021.9 |

### Rollback procedure

Rollback is straightforward and takes under 2 minutes:

1. **Revert `navidrome.toml`** — Restore the removed lines:
   ```toml
   DevAutoLoginUsername = "japtaptest"
   ReverseProxyWhitelist = "127.0.0.1/32,::1/128"
   DefaultUser = "japtaptest"
   ```
2. **Stop Caddy:** `docker compose stop caddy`
3. **Restart Navidrome directly** on its native port (4633), or restore the previous reverse proxy setup
4. **Revert frontend changes** (git checkout the two JS files)
5. Rebuild and redeploy: `docker compose up -d navidrome`

The Authentik containers and DB can remain running — they don't affect Navidrome when Caddy is not in front.

**No data is lost on rollback.** Any OAuth users auto-created in Navidrome's DB during testing remain. Their auto-generated passwords can be changed by an admin if needed.

---

## 14. Final Checklist

### Infrastructure
- [ ] Docker Compose uses fixed subnet `172.18.0.0/16`
- [ ] `AUTHENTIK_SECRET_KEY` is a 64-char random string (not the example value)
- [ ] `AUTHENTIK_DB_PASSWORD` is a strong unique password
- [ ] `.env` file is in `.gitignore`
- [ ] `authentik-server` port 9000 is NOT exposed directly in production compose
- [ ] `navidrome` port 4633 is NOT exposed directly in production compose

### DNS
- [ ] `music.yourdomain.com` → server IP
- [ ] `auth.yourdomain.com` → server IP (or same IP, different vhost in Caddy)

### Navidrome config (`navidrome.toml`)
- [ ] `DevAutoLoginUsername` removed / commented out
- [ ] `DefaultUser` removed / commented out (inert key)
- [ ] `ReverseProxyWhitelist = "172.18.0.0/16"`
- [ ] `ReverseProxyUserHeader = "Remote-User"`
- [ ] `EnableUserEditing = false`
- [ ] `EnableUserSelfSignup = false`

### Caddyfile
- [ ] `music.yourdomain.com` and `auth.yourdomain.com` replaced with actual domains
- [ ] `/outpost.goauthentik.io/*` block appears BEFORE the main `handle {}` block
- [ ] `/rest/*` bypass present (for Subsonic clients)
- [ ] `/share/*` bypass present (for public share links)
- [ ] `handle_response @authed` forwards `X-Authentik-Username` → `Remote-User`
- [ ] Catch-all `handle_response` injects `Remote-User: japtaptest`

### Authentik
- [ ] Google OAuth source created with correct callback URL registered in Google Console
- [ ] Facebook OAuth source created with correct callback URL registered in Facebook Developers
- [ ] Proxy Provider type is "Forward auth (single application)"
- [ ] Proxy Provider **External host** = `https://music.yourdomain.com`
- [ ] Application and Outpost created and linked to Proxy Provider
- [ ] Forward-auth endpoint verified: `GET /outpost.goauthentik.io/auth/caddy` returns 302 (unauthenticated) or 200 (authenticated)

### Pre-flight
- [ ] `japtaptest` user exists in Navidrome DB
- [ ] `japtaptest` is **not** admin
- [ ] Real admin user exists in Navidrome DB (your OAuth email)

### Frontend code
- [ ] `Logout.jsx` Login click → `window.location.href = '/outpost.goauthentik.io/start?rd=...'`
- [ ] `Logout.jsx` `useRedirect` import removed
- [ ] `authProvider.js` logout → `window.location.href = '/outpost.goauthentik.io/sign_out?rd=...'`
- [ ] Frontend rebuilt (`npm run build` or `docker compose build navidrome`)

### Tests passed
- [ ] TC-1: First visit loads as `japtaptest`, no OAuth redirect
- [ ] TC-2: Login click goes to Authentik with `rd` param
- [ ] TC-3: OAuth success returns to original page as authenticated user
- [ ] TC-4: Refresh keeps session
- [ ] TC-5: Logout returns to `japtaptest`
- [ ] TC-6: Subsonic API bypass works
- [ ] TC-7: Multi-tab behaviour correct

### Security
- [ ] `ReverseProxyWhitelist` is scoped to the Docker internal network (`172.18.0.0/16`), not `0.0.0.0/0`
- [ ] Caddy TLS is active (Let's Encrypt auto-provisioned)
- [ ] `EnableUserEditing = false` (users cannot change their own auth settings in Navidrome UI)
- [ ] Authentik admin portal (`auth.yourdomain.com`) is not publicly accessible to non-admins (Authentik enforces this by default)
- [ ] No OAuth client secrets are committed to version control

---

## 15. Google Cloud Console Setup

### 15.1 Create a Google Cloud Project

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click the project dropdown (top-left) → **New Project**
3. Name it (e.g., `Japtapsamagams`) → **Create**
4. Make sure the new project is selected in the dropdown before continuing

### 15.2 Configure the OAuth Consent Screen

1. Left sidebar → **APIs & Services → OAuth consent screen**
2. Select **External** user type → **Create**
3. Fill in required fields:
   - **App name:** `Japtapsamagams` (shown to users on the Google login page)
   - **User support email:** your email
   - **Developer contact information:** your email
4. Click **Save and Continue**
5. On the **Scopes** page → **Add or Remove Scopes** → add:
   - `openid`
   - `email`
   - `profile`
6. **Save and Continue**
7. On the **Test users** page (shown while app is in Testing mode):
   - Click **Add Users** → add every Google account that needs to log in
   - You can add up to 100 test users in Testing mode
   - To allow any Google account, publish the app to Production (requires no sensitive scopes, so verification is typically automatic)
8. **Save and Continue** → **Back to Dashboard**

### 15.3 Create OAuth Client Credentials

1. Left sidebar → **APIs & Services → Credentials**
2. **Create Credentials → OAuth client ID**
3. **Application type:** Web application
4. **Name:** `Japtapsamagams Authentik`
5. Under **Authorized redirect URIs** → **Add URI**:
   ```
   https://auth.yourdomain.com/source/oauth/callback/google/
   ```
   > This is the URL Authentik generates — trailing slash is required. Verify the exact URL in Authentik under **Directory → Federation & Social Login → google → Callback URL** before registering it here.
6. **Create**
7. Copy both values from the dialog that appears:
   - **Client ID** → save as `GOOGLE_CLIENT_ID`
   - **Client Secret** → save as `GOOGLE_CLIENT_SECRET`
8. Add them to your `.env` file:
   ```bash
   GOOGLE_CLIENT_ID=384624213715-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
   ```

### 15.4 Publish the App (when ready for all users)

While in **Testing** mode only the test users you added can sign in. To allow any Google account:

1. OAuth consent screen → **Publish App** → **Confirm**
2. If your app only requests `openid`, `email`, and `profile` (which is all we need), Google does **not** require a formal verification review — it goes live immediately.

### 15.5 Common Google errors

| Error | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` | Callback URL in Google Console doesn't exactly match what Authentik sends | In Google Console → your OAuth client → verify the URI is exactly `https://auth.yourdomain.com/source/oauth/callback/google/` (note trailing slash). Compare with what Authentik shows in the source settings. |
| `invalid_client` | Wrong Client ID or Secret | Re-copy from Google Console → Credentials → your OAuth client |
| "This app isn't verified" warning | App is in Testing mode | Expected during development — click **Continue**. Disappears after publishing. |
| Only specific accounts can log in | App still in Testing mode | Add accounts to Test Users, or publish the app |
| `Error 400: admin_policy_enforced` | Google Workspace admin blocked OAuth | Contact the Google Workspace admin, or use a personal Google account |

---

## 16. Facebook Developer Console Setup

### 16.1 Create a Facebook App

1. Go to [https://developers.facebook.com/](https://developers.facebook.com/)
2. **My Apps → Create App**
3. **Use case:** Select **Authenticate and request data from users with Facebook Login** → **Next**
4. **App name:** `Japtapsamagams`
5. **App contact email:** your email
6. **Create App** (may require your Facebook account password)

### 16.2 Add Facebook Login product

1. From the app dashboard, find **Facebook Login** → **Set Up**
2. Select **Web** as the platform
3. Skip the quickstart wizard (close/skip it)
4. In the left sidebar → **Facebook Login → Settings**
5. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://auth.yourdomain.com/source/oauth/callback/facebook/
   ```
   > Verify the exact URL in Authentik under **Directory → Federation & Social Login → facebook → Callback URL** before registering it here.
6. Enable the following toggles:
   - **Client OAuth Login:** Yes
   - **Web OAuth Login:** Yes
   - **Enforce HTTPS:** Yes
7. **Save Changes**

### 16.3 Get your credentials

1. Left sidebar → **Settings → Basic**
2. Copy:
   - **App ID** → save as `FACEBOOK_APP_ID` (this is the Consumer Key in Authentik)
   - **App Secret** → click **Show**, enter your Facebook password → save as `FACEBOOK_APP_SECRET`
3. Add them to your `.env` file:
   ```bash
   FACEBOOK_APP_ID=123456789012345
   FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
   ```

### 16.4 App mode: Development vs Live

| Mode | Who can log in | How to switch |
|---|---|---|
| **Development** (default) | Only app Admins, Developers, and Test Users | Add test accounts under **Roles → Test Users** |
| **Live** | Any Facebook user | Switch via the toggle at the top of the app dashboard; requires completing the **Data Use Checkup** |

Facebook does **not** require a formal review for `email` and `public_profile` permissions (which is all we request). Switching to Live mode should be straightforward.

### 16.5 Add test users (Development mode)

1. Left sidebar → **Roles → Test Users**
2. **Add** → find Facebook accounts to add as testers
3. Each tester must accept the invitation from their Facebook account

### 16.6 Common Facebook errors

| Error | Cause | Fix |
|---|---|---|
| "App Not Setup" | Your account is not a tester/developer on the app | Go to **Roles → Test Users** or **Roles → Developers** and add your account |
| `invalid_client` | Wrong App ID or App Secret | Re-copy from Settings → Basic. App Secret requires clicking **Show** |
| Facebook login succeeds but Authentik doesn't get email | `email` scope not granted or user denied | Ensure `email` is in Authentik Facebook source scopes. If user previously denied, they must remove the app from their Facebook settings and re-authorize |
| Redirect URI mismatch | URI registered in Facebook doesn't match Authentik callback | Verify the exact callback URL in Authentik, update Facebook Login → Settings → Valid OAuth Redirect URIs |
| "App is in development mode" shown to test users | User not added as tester | Add the Facebook account to **Roles → Test Users** |

---

## 17. End-to-End Deployment Steps

Run these in order after all configuration above is complete.
           
### Step 1 — Generate secrets

```bash
# In the project root
echo "AUTHENTIK_SECRET_KEY=$(openssl rand -hex 32)" >> .env
echo "AUTHENTIK_DB_PASSWORD=$(openssl rand -hex 16)" >> .env
# Then add your OAuth credentials manually:
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# FACEBOOK_APP_ID=...
# FACEBOOK_APP_SECRET=...
```

Verify `.gitignore` contains `.env`:
```bash
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

### Step 2 — Point DNS

Add two A records to your domain (or update existing):

| Hostname | Type | Value |
|---|---|---|
| `music.yourdomain.com` | A | your server's public IP |
| `auth.yourdomain.com` | A | your server's public IP |

Wait for DNS to propagate before continuing (`dig music.yourdomain.com` should return your IP).

### Step 3 — Update Caddyfile with real domains

In `deploy/caddy/Caddyfile`, replace the placeholder domains:
```bash
sed -i '' 's/music.yourdomain.com/music.japtapsamagams.org/g' deploy/caddy/Caddyfile
sed -i '' 's/auth.yourdomain.com/auth.japtapsamagams.org/g' deploy/caddy/Caddyfile
# Also update the global email:
sed -i '' 's/admin@yourdomain.com/your-real-email@example.com/g' deploy/caddy/Caddyfile
```

Or edit `deploy/caddy/Caddyfile` directly — replace all four occurrences of `yourdomain.com`.

### Step 4 — Start Authentik first (no Caddy yet)

Temporarily expose Authentik port 9000 for the initial setup UI. In `docker-compose-caddy.yml`, add a temporary `ports` entry to `authentik-server`:

```yaml
authentik-server:
  ports:
    - "9000:9000"   # TEMPORARY — remove after initial setup
```

Then start the Authentik stack:

```bash
docker compose -f deploy/docker-compose-caddy.yml up -d \
  authentik-db authentik-redis authentik-server authentik-worker
```

Wait ~60 seconds for Authentik to initialise, then check:
```bash
docker compose -f deploy/docker-compose-caddy.yml logs authentik-server | tail -20
# Look for: "Starting server" with no errors
```

### Step 5 — Complete Authentik initial setup

1. Open `http://your-server:9000/if/flow/initial-setup/`
2. Create the Authentik admin account (username + password)
3. Save credentials securely — this is the Authentik admin, not a Navidrome user

### Step 6 — Configure Authentik (follow §6)

Complete all steps from **§6** in this document:

- §6.2 — Add Google OAuth source (use your `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- §6.3 — Add Facebook OAuth source (use your `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`)
- §6.4 — Create Proxy Provider (`navidrome-proxy`, external host = `https://music.yourdomain.com`)
- §6.5 — Create Application (`navidrome`, provider = `navidrome-proxy`)
- §6.6 — Create Outpost (embedded, application = `navidrome`)

After §6.2, copy the exact Google callback URL from Authentik and register it in Google Console (§15.3 step 5).
After §6.3, copy the exact Facebook callback URL from Authentik and register it in Facebook (§16.2 step 5).

### Step 7 — Verify Authentik forward-auth endpoint

```bash
docker compose -f deploy/docker-compose-caddy.yml exec authentik-server \
  wget -qO- --server-response \
  "http://localhost:9000/outpost.goauthentik.io/auth/caddy" \
  --header="X-Original-URL: https://music.yourdomain.com/" 2>&1 | grep "HTTP/"
# Expected: HTTP/1.1 302  (no session — correct)
```

### Step 8 — Pre-flight: ensure japtaptest is non-admin

Before switching to the full stack, Navidrome must already have the `japtaptest` user as non-admin. Temporarily run Navidrome directly to check:

```bash
# Run Navidrome briefly with DevAutoLoginUsername still active (it still is in the
# container config since the .env overrides apply only to the compose file, not the
# navidrome.toml we already updated — so start it standalone for this check)
docker compose -f deploy/docker-compose-caddy.yml up -d navidrome
```

1. Open `http://your-server:4633` (expose the port temporarily for this step)
2. Log in → **Settings → Users**
3. Confirm `japtaptest` exists and `Admin` is **unchecked**
4. Create your personal admin user: username = your Google/Facebook email, set `Admin` = checked
5. Stop Navidrome: `docker compose -f deploy/docker-compose-caddy.yml stop navidrome`

### Step 9 — Remove temporary port exposures

Edit `deploy/docker-compose-caddy.yml`:
- Remove `ports: - "9000:9000"` from `authentik-server`
- Ensure `navidrome` has no `ports` entry (already commented out)

### Step 10 — Build Navidrome image

```bash
docker compose -f deploy/docker-compose-caddy.yml build navidrome
# This compiles the Go binary + React UI using the local Dockerfile.
# Takes 5-15 minutes on first build; subsequent builds use Docker layer cache.
```

### Step 11 — Start the full stack

```bash
docker compose -f deploy/docker-compose-caddy.yml up -d
```

Check all containers are running:
```bash
docker compose -f deploy/docker-compose-caddy.yml ps
# Expected: authentik-db, authentik-redis, authentik-server, authentik-worker, navidrome, caddy — all Up
```

Check Caddy obtained TLS certificates:
```bash
docker compose -f deploy/docker-compose-caddy.yml logs caddy | grep -i "certificate\|tls\|acme"
# Expected: certificate obtained for music.yourdomain.com and auth.yourdomain.com
```

### Step 12 — Run the test plan (§12)

Run all 7 test cases from **§12** in order:

```
TC-1 → TC-2 → TC-3 → TC-4 → TC-5 → TC-6 → TC-7
```

### Step 13 — Harden for production

Once all tests pass:

```bash
# Verify no internal ports are exposed
docker compose -f deploy/docker-compose-caddy.yml ps --format json | \
  python3 -c "import sys,json; [print(s['Ports']) for s in json.load(sys.stdin)]"
# Only ports 80, 443, 443/udp (Caddy) should appear

# Confirm ReverseProxyWhitelist is not 0.0.0.0/0
grep ReverseProxyWhitelist navidrome.toml
# Expected: ReverseProxyWhitelist = "172.18.0.0/16"

# Confirm DevAutoLoginUsername is disabled
grep DevAutoLoginUsername navidrome.toml
# Expected: the line should be commented out
```

### Useful ongoing commands

```bash
# View all logs in real time
docker compose -f deploy/docker-compose-caddy.yml logs -f

# Restart a single service after config change
docker compose -f deploy/docker-compose-caddy.yml restart caddy

# Rebuild and restart Navidrome after code changes
docker compose -f deploy/docker-compose-caddy.yml up -d --build navidrome

# Stop the entire stack
docker compose -f deploy/docker-compose-caddy.yml down

# Stop and remove volumes (full reset — loses Authentik DB and Navidrome DB)
docker compose -f deploy/docker-compose-caddy.yml down -v
```
