# NextAuth.js Authentication for Japtap Samagams

> **Replaces Authentik** (4 containers) with a single **Next.js + Auth.js v5** app.
> Zero changes to the Navidrome Go backend. Same `Remote-User` flow. Same default `japtaptest` guest experience.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Flow](#authentication-flow)
3. [Default User Flow (japtaptest)](#default-user-flow-japtaptest)
4. [Hybrid Login Page](#hybrid-login-page)
5. [OAuth Sign-In Flow](#oauth-sign-in-flow)
6. [Logout Flow](#logout-flow)
7. [Provider Support](#provider-support)
8. [Comparison: Authentik vs NextAuth.js](#comparison-authentik-vs-nextauthjs)
9. [File Inventory](#file-inventory)
10. [Related Docs](#related-docs)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                                   │
│                                                                          │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐              │
│  │  Browser  │─────▶│    Caddy      │─────▶│  Navidrome   │              │
│  │           │      │  (port 443)   │      │  (port 4633) │              │
│  └──────────┘      │               │      │              │              │
│                     │  ┌──────────┐ │      │  SQLite DB   │              │
│                     │  │sub-request│─┼─┐   │  (users auto-│              │
│                     │  └──────────┘ │ │   │   created)   │              │
│                     └───────────────┘ │   └──────────────┘              │
│                                       │                                  │
│                     ┌─────────────────▼─┐                               │
│                     │   NextAuth.js     │                               │
│                     │   (port 3000)     │                               │
│                     │                   │                               │
│                     │  /api/auth/caddy  │  ← Caddy auth-check           │
│                     │  /api/auth/signin │  ← OAuth provider redirect    │
│                     │  /api/auth/signout│  ← Sign-out + cookie clear    │
│                     │  /api/auth/callback/* ← OAuth callbacks           │
│                     └───────────────────┘                               │
│                                                                          │
│  Docker network: 172.18.0.0/16 (matches ND_REVERSEPROXYWHITELIST)       │
└─────────────────────────────────────────────────────────────────────────┘
```

**3 containers total** (down from 6 with Authentik):

| Service | Image | Purpose |
|---------|-------|---------|
| `nextauth` | `nextauth-gateway:latest` (custom) | OAuth sign-in/out + Caddy auth-check |
| `navidrome` | `navidrome-local:latest` (custom) | Music server |
| `caddy` | `caddy:2-alpine` | Reverse proxy + TLS |

**Removed** (no longer needed):
- ~~authentik-server~~ (Python app)
- ~~authentik-worker~~ (background tasks)
- ~~authentik-db~~ (PostgreSQL)
- ~~authentik-redis~~ (Redis cache)

---

## Authentication Flow

### How Caddy Decides Who the User Is

```
Browser request → Caddy
  │
  ├─ /api/auth/*  → proxy to NextAuth.js (OAuth callbacks, signout)
  ├─ /rest/*      → proxy to Navidrome directly (Subsonic client auth)
  ├─ /share/*     → proxy to Navidrome directly (public share links)
  │
  └─ everything else:
       │
       ├─ Sub-request to NextAuth.js /api/auth/caddy
       │   (forwards browser's Cookie header)
       │
       ├─ NextAuth.js decodes Auth.js session cookie (JWT)
       │   ├─ Valid session → HTTP 200 + X-NextAuth-Username: user@gmail.com
       │   └─ No session   → HTTP 401
       │
       ├─ Caddy handle_response:
       │   ├─ @authed (2xx): Remote-User = X-NextAuth-Username → Navidrome
       │   └─ catch-all:     Remote-User = japtaptest          → Navidrome
       │
       └─ Navidrome authenticates via Remote-User header
            (trusts it because source IP is in ReverseProxyWhitelist)
```

### How Navidrome Processes the Request

```
Navidrome receives request with Remote-User header:
  │
  ├─ realIPMiddleware → saves original RemoteAddr (Caddy's IP)
  ├─ JWTVerifier → extracts JWT from X-ND-Authorization (if present)
  │
  └─ Authenticator chain (server/auth.go):
       1. UsernameFromConfigPreferringToken → "" (DevAutoLoginUsername disabled)
       2. UsernameFromToken → JWT user (for API calls with existing session)
       3. UsernameFromReverseProxyHeader → reads Remote-User header
          └─ validates source IP is in 172.18.0.0/16 (Docker network)
          └─ returns username from header

  ├─ handleLoginFromHeaders (server/serve_index.go):
  │   └─ Looks up user in DB → auto-creates if not found
  │   └─ First user ever created gets IsAdmin = true
  │   └─ Returns auth payload (token, userId, name, isAdmin, etc.)
  │
  └─ Injects auth into window.__APP_CONFIG__ in HTML response
```

---

## Default User Flow (japtaptest)

When an **unauthenticated** visitor hits the app for the first time:

```
1. Browser → GET https://music.yourdomain.com/
2. Caddy → sub-request to nextauth:3000/api/auth/caddy
3. NextAuth.js → no session cookie → returns 401
4. Caddy → handle_response catch-all → injects Remote-User: japtaptest
5. Caddy → proxies to navidrome:4633 with Remote-User: japtaptest
6. Navidrome → handleLoginFromHeaders finds/creates "japtaptest" user
7. Navidrome → injects auth payload into window.__APP_CONFIG__
8. Browser → authProvider.js reads config.auth → saves to localStorage
9. User sees the app as "japtaptest" with a "Sign In" button in the top-right menu
```

**No login wall. No redirect. Instant access.**

When the japtaptest user clicks **"Sign In"**, they are taken to the Navidrome login page
(`/app/#/login`) — not the NextAuth.js default page. See [Hybrid Login Page](#hybrid-login-page).

---

## Hybrid Login Page

The Navidrome login page (`/app/#/login`) serves as the **single entry point for all authentication methods**. It combines native Navidrome credentials and Google OAuth in one familiar UI.

### Login Page Layout

```
┌────────────────────────────────────────────┐
│              [disc logo]                   │
│           Jap Tap Samagams                 │
│                                            │
│  Username  ____________________________    │
│  Password  ____________________________    │
│                                            │
│  [          Sign In           ]            │
│  [      Sign in with Google   ]  ← NEW    │
│  [ Guest ]       [ Sign Up ]               │
└────────────────────────────────────────────┘
```

### callbackUrl Passthrough

When `Logout.jsx` redirects to the login page, it encodes the **original page** as a `callbackUrl`
query parameter:

```
/app/#/login?callbackUrl=https%3A%2F%2Fdev.japtapsamagams.org%2Fapp%2F%23%2Falbum%2FrecentlyAdded
```

When the user clicks **"Sign in with Google"**, the login page reads this `callbackUrl` and passes
it on to NextAuth.js:

```
/api/auth/signin/google?callbackUrl=<originalPage>
```

After OAuth completes, NextAuth.js redirects the user back to `<originalPage>` so they land exactly
where they started.

### After Successful Login

Regardless of method (native or Google), after login:
- The top-right menu shows the user's **username** (native) or **email address** (Google)
- The menu shows a **Logout** item (replaces "Sign In")
- The app is fully functional under the logged-in identity

---

## OAuth Sign-In Flow

When a visitor clicks **"Sign In"** in the top-right menu, then clicks **"Sign in with Google"** on the login page:

```
1.  Logout.jsx → redirects to /app/#/login?callbackUrl=<currentPage>
2.  Navidrome renders the login page (Username, Password, Sign in with Google, Guest)
3.  User clicks "Sign in with Google"
4.  Login.jsx → redirects to /api/auth/signin/google?callbackUrl=<currentPage>
5.  Caddy → proxies /api/auth/signin/* to NextAuth.js
6.  NextAuth.js → redirects browser to Google OAuth consent screen
7.  User authorizes → Google redirects to /api/auth/callback/google
8.  Caddy → proxies callback to NextAuth.js
9.  NextAuth.js → validates OAuth response, creates JWT session cookie
10. NextAuth.js → redirects to callbackUrl (the original page the user was on)
11. Browser → requests the original page with Auth.js session cookie
12. Caddy → sub-request to /api/auth/caddy → gets 200 + X-NextAuth-Username
13. Caddy → sets Remote-User: user@gmail.com → proxies to Navidrome
14. Navidrome → auto-creates "user@gmail.com" user (or finds existing)
15. Navidrome → injects auth payload with real user info
16. User sees the app as "user@gmail.com" with a "Logout" button
```

---

## Logout Flow

When an authenticated user clicks **"Logout"**:

```
1. authProvider.js → clears all localStorage items
   (token, userId, name, username, avatar, role, subsonic tokens, is-authenticated flag)
2. authProvider.js → redirects to /api/auth/signout?callbackUrl=<origin>/app/#/login
3. Caddy → proxies to NextAuth.js
4. NextAuth.js → clears Auth.js session cookie → redirects to /app/#/login
5. User lands on the Navidrome login page
   (NOT redirected home as japtaptest — they see the login form instead)
```

> **Note:** The callbackUrl for signout points to `/app/#/login` (not `/`).
> This ensures users land on the login page rather than silently becoming japtaptest.

---

## Provider Support

Providers are **environment-variable-driven**. No code changes needed to add/remove.

| Provider | Env Vars | Callback URL | Notes |
|----------|----------|-------------|-------|
| **Google** | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | `/api/auth/callback/google` | ✅ Works with localhost (Phase 1 testing) |
| **Facebook** | `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` | `/api/auth/callback/facebook` | ⚠️ Requires HTTPS, no localhost support |
| **GitHub** | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | `/api/auth/callback/github` | ✅ Works with localhost |

**To enable a provider:** Set its `AUTH_*_ID` and `AUTH_*_SECRET` env vars, restart the NextAuth.js container.

**To disable a provider:** Remove or comment out its env vars, restart.

**To add a new provider later** (e.g., Apple, Microsoft):
1. Add the import in `nextauth/auth.ts`
2. Add a conditional block checking for `AUTH_NEWPROVIDER_ID`
3. Set the env vars in `.env`
4. Restart

---

## Comparison: Authentik vs NextAuth.js

| Aspect | Authentik | NextAuth.js |
|--------|-----------|-------------|
| **Containers** | 4 (server, worker, postgres, redis) | 1 (Next.js app) |
| **Image size** | ~1.5 GB total | ~50 MB |
| **Cold start** | 30-60 seconds | 2-5 seconds |
| **Auth protocol** | Full OIDC/SAML provider | OAuth2 client only |
| **Admin UI** | Built-in (flows, users, groups) | None (use Navidrome's user management) |
| **Provider setup** | Config via Admin UI | Config via env vars |
| **Session storage** | Server-side (Postgres + Redis) | JWT (stateless, no DB) |
| **SAML/LDAP** | ✅ Supported | ❌ Not supported |
| **Session revocation** | ✅ Instant (server-side) | ❌ Must wait for JWT expiry |
| **Navidrome changes** | None | None |
| **Caddy pattern** | Same `reverse_proxy` + `handle_response` | Same pattern, different endpoints |
| **Maintenance** | Authentik + Postgres upgrades | `npm update next-auth` |

### Pros of NextAuth.js

- 🟢 **Drastically simpler infrastructure** — 1 container replaces 4
- 🟢 **Lower resource usage** — ~50 MB vs ~1.5 GB, seconds vs minutes to start
- 🟢 **Zero Navidrome Go changes** — same `Remote-User` reverse proxy flow
- 🟢 **Easier upgrades** — `npm update` vs coordinated Authentik stack upgrades
- 🟢 **80+ auth providers** via Auth.js ecosystem
- 🟢 **Same tech stack** as frontend (JavaScript/TypeScript)
- 🟢 **Env-var-driven providers** — add Google/Facebook/GitHub by setting env vars
- 🟢 **Hybrid login page** — native + OAuth combined in the Navidrome UI (no generic Auth.js page)

### Cons of NextAuth.js

- 🔴 Must maintain a small Next.js app (~5 files)
- 🔴 No built-in admin UI for user/group management
- 🔴 No SAML, LDAP, or SCIM support
- 🔴 JWT sessions can't be instantly revoked (must wait for expiry)
- 🔴 Auth.js v5 is newer, smaller community than Authentik
- 🔴 Facebook OAuth doesn't support localhost (need tunnel for local testing)

---

## File Inventory

### NextAuth.js App (`nextauth/`)

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: `next`, `next-auth`, `react`, `react-dom` |
| `auth.ts` | Auth.js config — providers, JWT callbacks, `trustHost: true` |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js catch-all (signin, signout, callbacks) |
| `app/api/auth/caddy/route.ts` | Custom Caddy auth-check (200 + header or 401) |
| `app/layout.tsx` | Minimal root layout |
| `app/page.tsx` | Safety redirect to `/` |
| `next.config.js` | `output: 'standalone'` for Docker |
| `tsconfig.json` | TypeScript config |
| `Dockerfile` | Multi-stage Node.js build (~50 MB image) |
| `.env.example` | Template for all env vars |
| `.gitignore` | Ignores `node_modules/`, `.next/`, `.env*` |

### Deployment (`deploy/`)

| File | Purpose |
|------|---------|
| `deploy/nextauth/docker-compose.yml` | Production: 3 services |
| `deploy/nextauth/docker-compose.local.yml` | Local dev: 3 services with exposed ports |
| `deploy/nextauth/.env.example` | Docker-level env var template |
| `deploy/caddy/nextauth/Caddyfile` | Production Caddyfile |
| `deploy/caddy/nextauth/Caddyfile.local` | Local dev Caddyfile |

### UI Changes (`ui/src/`)

| File | Change |
|------|--------|
| `ui/src/layout/Logout.jsx` | Redirects to `/app/#/login?callbackUrl=<currentPage>` instead of `/api/auth/signin` |
| `ui/src/layout/Login.jsx` | Adds "Sign in with Google" button that triggers `/api/auth/signin/google?callbackUrl=<page>` |
| `ui/src/authProvider.js` | Logout redirects to `/api/auth/signout?callbackUrl=<origin>/app/#/login` instead of `<origin>/` |
| `ui/src/layout/LogoutAuthentik.jsx` | Backup of original Logout.jsx (Authentik URLs) |
| `ui/src/authProviderAuthentik.js` | Backup of original authProvider.js (Authentik URLs) |

### Documentation (`docs/Authentication/nextauth/`)

| File | Purpose |
|------|---------|
| `README.md` | This file — architecture + flows |
| `setup-guide.md` | Step-by-step deployment (Google/Facebook/GitHub console + Docker) |
| `env-reference.md` | All environment variables |
| `local-dev.md` | Local testing guide |

---

## Related Docs

- [AuthImplementationCaddy.md](../Options/AuthImplementationCaddy.md) — Original Authentik implementation (reference)
- [AuthImplementationPlan.md](../Options/AuthImplementationPlan.md) — All 3 auth options compared
- [authentication-roadmap.md](../Options/authentication-roadmap.md) — Phase 1/2 roadmap
