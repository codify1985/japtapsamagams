# Local Development Guide

> How to test the NextAuth.js + Caddy + Navidrome stack locally on your Mac.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Infrastructure Test (No OAuth)](#phase-1-infrastructure-test-no-oauth)
3. [Phase 2: OAuth Test (Cloudflare Tunnel)](#phase-2-oauth-test-cloudflare-tunnel)
4. [Useful Commands](#useful-commands)
5. [Debugging Tips](#debugging-tips)
6. [Provider-Specific Local Notes](#provider-specific-local-notes)

---

## Overview

Local testing happens in two phases:

| Phase | What It Tests | OAuth? | Domain |
|-------|--------------|--------|--------|
| **Phase 1** | Caddy routing, default user flow, NextAuth.js starts | ❌ No | `http://localhost` |
| **Phase 2** | Full OAuth sign-in/out with Google | ✅ Yes | `https://abc-def.trycloudflare.com` |

**Local compose file:** `deploy/nextauth/docker-compose.local.yml`
**Local Caddyfile:** `deploy/caddy/nextauth/Caddyfile.local`

Key differences from production:
- NextAuth.js port **3000** exposed on host (for direct endpoint testing)
- Navidrome port **4633** exposed on host (for pre-flight access)
- Caddy uses `http://localhost` (no TLS, no Let's Encrypt)
- Docker network subnet: `172.19.0.0/16` (separate from production `172.18.0.0/16`)
- Separate Docker volumes (no mixing with production data)

---

## Phase 1: Infrastructure Test (No OAuth)

### 1.1 Create .env

```bash
cd /Users/gagan/MyCodebae/japtapsamagams

# Copy template
cp deploy/nextauth/.env.example .env

# Edit — only AUTH_SECRET is needed for Phase 1
# Google credentials can be empty for now
```

Edit `.env`:
```bash
AUTH_SECRET="test-secret-at-least-32-characters-long-here"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

### 1.2 Build & Start

```bash
# Build both images
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml build

# Start all services
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml up -d

# Watch logs (all services)
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs -f
```

### 1.3 Verify

| Test | URL | Expected |
|------|-----|----------|
| Caddy → Navidrome (default user) | http://localhost | App loads as `japtaptest` |
| NextAuth.js is running | http://localhost:3000/api/auth/providers | JSON response (empty or with providers) |
| Caddy auth-check (no session) | http://localhost:3000/api/auth/caddy | HTTP 401 |
| Subsonic API bypass | http://localhost/rest/ping | Navidrome XML response |
| Navidrome direct | http://localhost:4633 | Navidrome UI (bypasses Caddy) |

### 1.4 What to Look For

- ✅ Visiting `http://localhost` shows the app as `japtaptest`
- ✅ "Sign In" button is visible in the user menu (top right)
- ✅ Clicking "Sign In" redirects to `/app/#/login` (Navidrome login page — **not** the Auth.js page)
- ✅ The login page shows: Username field, Password field, "Sign In" button, "Sign in with Google" button, Guest button
- ✅ The "Sign in with Google" button is visible (even if Google credentials are empty — the button won't complete OAuth yet)
- ✅ Subsonic API at `/rest/ping` returns XML directly (not redirected to auth)

---

## Phase 2: OAuth Test (Cloudflare Tunnel)

Google OAuth requires HTTPS and a real domain. Cloudflare Tunnel provides a free, temporary public URL.

### 2.1 Install cloudflared

```bash
brew install cloudflare/cloudflare/cloudflared
```

### 2.2 Start a Tunnel

```bash
cloudflared tunnel --url http://localhost:80
```

You'll see output like:
```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
|  https://random-words-here.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
```

Copy the `https://...trycloudflare.com` URL.

### 2.3 Set Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth Client ID
3. Add to **Authorized redirect URIs**:
   ```
   https://random-words-here.trycloudflare.com/api/auth/callback/google
   ```
4. Click **Save**

### 2.4 Update .env

```bash
AUTH_SECRET="test-secret-at-least-32-characters-long-here"
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-google-secret"
```

### 2.5 Update Caddyfile.local

Edit `deploy/caddy/nextauth/Caddyfile.local`:

Comment out `http://localhost {` and uncomment the tunnel URL block:
```
# http://localhost {
https://random-words-here.trycloudflare.com {
```

### 2.6 Restart

```bash
# Restart to pick up new env vars and Caddyfile
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml down
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml up -d
```

### 2.7 Test the Full Flow

1. Open `https://random-words-here.trycloudflare.com` in your browser
2. You should see the app as `japtaptest` ✅
3. Click **"Sign In"** → you are taken to `/app/#/login` (Navidrome login page) ✅
4. Click **"Sign in with Google"** → Google OAuth flow
5. After authorizing → redirected back to the original page as `youremail@gmail.com` ✅
6. Your email is visible in the top-right menu, and "Logout" replaces "Sign In" ✅
7. Click **"Logout"** → localStorage cleared, redirected to `/app/#/login` ✅

### 2.8 Test Cases

| # | Test | Expected |
|---|------|----------|
| TC-1 | Visit tunnel URL (no cookies) | App as `japtaptest`, "Sign In" visible in top-right |
| TC-2 | Click "Sign In" | Redirected to `/app/#/login` (NOT the NextAuth.js page) |
| TC-3 | Click "Sign in with Google" on login page | Google consent → back to original page as your email |
| TC-4 | Refresh page | Still logged in (session cookie persists) |
| TC-5 | Open incognito → visit tunnel URL | App as `japtaptest` (separate cookies) |
| TC-6 | Click "Logout" | Session cleared, redirected to `/app/#/login` |
| TC-7 | Visit `/rest/ping` via tunnel | Navidrome XML response (auth bypassed) |
| TC-8 | Direct `http://localhost:3000/api/auth/caddy` | HTTP 401 (no session) |

---

## Useful Commands

```bash
# Start stack
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml up -d

# Stop stack
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml down

# Rebuild after code changes
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml build

# Rebuild + restart specific service
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml build nextauth
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml restart nextauth

# View logs (all services)
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs -f

# View logs (specific service)
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs -f nextauth
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs -f caddy
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs -f navidrome

# Check running services
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml ps

# Enter a container
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml exec nextauth sh
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml exec navidrome sh

# Check NextAuth.js auth-check endpoint directly
curl -v http://localhost:3000/api/auth/caddy

# Check configured providers
curl http://localhost:3000/api/auth/providers | jq

# Check Caddy is forwarding correctly
curl -v http://localhost/

# Nuke everything (volumes too)
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml down -v
```

---

## Debugging Tips

### NextAuth.js Not Starting

```bash
# Check logs
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs nextauth

# Common issues:
# - Missing AUTH_SECRET → "AUTH_SECRET is missing"
# - Port conflict → "EADDRINUSE 0.0.0.0:3000"
# - Build failed → rebuild: docker compose ... build nextauth
```

### Caddy Shows 502

```bash
# Check if NextAuth.js is reachable from Caddy
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml exec caddy \
  wget -qO- http://nextauth:3000/api/auth/providers

# If this fails, NextAuth.js isn't reachable on the Docker network.
# Check: are both services on the same network?
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml exec caddy \
  nslookup nextauth
```

### OAuth Callback Fails

```bash
# Check the callback URL is correct
curl http://localhost:3000/api/auth/providers | jq

# Verify the callbackUrl matches what's in Google Console
# Must be EXACTLY: https://your-tunnel.trycloudflare.com/api/auth/callback/google
```

### Session Cookie Not Working

```bash
# Check if Auth.js sets the cookie
# After signing in, check browser DevTools → Application → Cookies
# Look for: authjs.session-token (or __Secure-authjs.session-token for HTTPS)

# Test the caddy endpoint with the cookie
curl -v -H "Cookie: authjs.session-token=<paste-token>" http://localhost:3000/api/auth/caddy
# Should return 200 with X-NextAuth-Username header
```

### User Not Created in Navidrome

```bash
# Check Navidrome logs
docker compose --env-file .env -f deploy/nextauth/docker-compose.local.yml logs navidrome | grep -i "user\|remote\|auth"

# Check if Remote-User header is reaching Navidrome
# Navidrome logs should show: "Authenticating with Remote-User header"
```

---

## Provider-Specific Local Notes

### Google
- ✅ Works with `http://localhost` callback URLs
- Add `http://localhost/api/auth/callback/google` to Authorized redirect URIs
- For tunnel testing, add the tunnel URL too

### Facebook
- ❌ Does NOT support `localhost` callbacks
- Must use Cloudflare Tunnel (Phase 2) to test
- Add the tunnel URL to Valid OAuth Redirect URIs in Facebook Developer Console
- **Tip:** Skip Facebook in local testing, verify in production only

### GitHub
- ✅ Works with `http://localhost` callback URLs
- Create a separate OAuth App for local testing with `http://localhost` as Homepage URL
- Add `http://localhost/api/auth/callback/github` as the callback URL
