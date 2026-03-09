# Environment Variables Reference

> All environment variables used by the NextAuth.js + Caddy + Navidrome stack.

---

## NextAuth.js Container

These are set in `.env` and passed to the `nextauth` service via Docker Compose.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | Secret for signing JWTs and encrypting cookies. At least 32 characters. Generate with `openssl rand -base64 33`. | `a1b2c3d4e5f6g7h8i9j0...` |
| `AUTH_TRUST_HOST` | Must be `true` when behind a reverse proxy (Caddy). Tells Auth.js to trust `X-Forwarded-Host` headers. | `true` |

### OAuth Providers (Set Only the Ones You Want)

Auth.js dynamically enables providers based on which env vars are present. If a provider's `_ID` and `_SECRET` are both set and non-empty, that provider appears on the sign-in page.

#### Google

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client IDs |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Same page as above |

**Callback URL to register in Google Console:**
```
https://music.yourdomain.com/api/auth/callback/google
```

#### Facebook

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `AUTH_FACEBOOK_ID` | Facebook App ID | [Facebook Developers](https://developers.facebook.com/) → Settings → Basic |
| `AUTH_FACEBOOK_SECRET` | Facebook App Secret | Same page → Show → copy |

**Callback URL to register in Facebook:**
```
https://music.yourdomain.com/api/auth/callback/facebook
```

> ⚠️ Facebook does NOT support `localhost` callbacks. Use a Cloudflare Tunnel for local testing.

#### GitHub

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `AUTH_GITHUB_ID` | GitHub OAuth App Client ID | [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps |
| `AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret | Same page → Generate secret |

**Callback URL to register in GitHub:**
```
https://music.yourdomain.com/api/auth/callback/github
```

---

## Navidrome Container

These are set in the Docker Compose `environment` block for the `navidrome` service.

| Variable | Description | Value | Notes |
|----------|-------------|-------|-------|
| `ND_REVERSEPROXYWHITELIST` | CIDR range(s) of trusted proxy IPs | `172.18.0.0/16` (prod), `172.19.0.0/16` (local) | Must match Docker network subnet |
| `ND_REVERSEPROXYUSERHEADER` | HTTP header containing the authenticated username | `Remote-User` | Caddy sets this header |
| `ND_ENABLEUSEREDITING` | Allow users to edit their own profile | `false` | Prevent users from changing auth settings |
| `ND_ENABLEUSERSELFSIGNUP` | Allow username/password self-registration | `false` | All users come through OAuth |
| `ND_MUSICFOLDER` | Path to music files inside container | `/music` | Mounted from host |
| `ND_DATAFOLDER` | Path to data directory inside container | `/data` | Contains SQLite DB |
| `ND_PORT` | HTTP port Navidrome listens on | `4633` | Internal to Docker network |
| `ND_LOGFILE` | Path to log file | `/logs/log.txt` | Mounted from host |
| `ND_FFMPEGPATH` | Path to ffmpeg binary | `/usr/bin/ffmpeg` | Installed in Docker image |

---

## Caddy

Caddy is configured via the Caddyfile, not environment variables. The key configuration points are:

| Setting | File | Value |
|---------|------|-------|
| Domain | `deploy/caddy/nextauth/Caddyfile` | `music.yourdomain.com` (replace with your domain) |
| Let's Encrypt email | Same file, global block | `admin@yourdomain.com` (replace) |
| Auth-check endpoint | Same file, handle block | `nextauth:3000/api/auth/caddy` |
| Default user | Same file, handle_response catch-all | `japtaptest` |
| Subsonic bypass | Same file, handle /rest/* | Direct proxy to Navidrome |
| Share bypass | Same file, handle /share/* | Direct proxy to Navidrome |

---

## Docker Network

| Setting | Production | Local |
|---------|-----------|-------|
| Subnet | `172.18.0.0/16` | `172.19.0.0/16` |
| Driver | `bridge` | `bridge` |

The subnet must match `ND_REVERSEPROXYWHITELIST` — this is how Navidrome knows to trust the `Remote-User` header from Caddy.

---

## Quick Reference: Minimal .env for Google-Only Setup

```bash
# Generate: openssl rand -base64 33
AUTH_SECRET="your-random-secret-at-least-32-chars"

# Google OAuth (from Google Cloud Console)
AUTH_GOOGLE_ID="123456789-abcdefg.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-abcdefghijklmnop"
```

That's it. Facebook and GitHub can be added later by setting their env vars.
