# Setup Guide — NextAuth.js Authentication for Japtap Samagams

> Step-by-step instructions to deploy the NextAuth.js + Caddy + Navidrome stack.
> Covers OAuth console setup for Google, Facebook, and GitHub.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Generate AUTH_SECRET](#step-1-generate-auth_secret)
3. [Step 2: Google OAuth Setup](#step-2-google-oauth-setup)
4. [Step 3: Facebook OAuth Setup (Optional)](#step-3-facebook-oauth-setup-optional)
5. [Step 4: GitHub OAuth Setup (Optional)](#step-4-github-oauth-setup-optional)
6. [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
7. [Step 6: Update Caddyfile Domain](#step-6-update-caddyfile-domain)
8. [Step 7: Build & Deploy](#step-7-build--deploy)
9. [Step 8: First Login (Admin Setup)](#step-8-first-login-admin-setup)
10. [Step 9: Verify the Full Flow](#step-9-verify-the-full-flow)
11. [Step 10: Managing Users](#step-10-managing-users)
12. [Adding Providers Later](#adding-providers-later)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A VPS or server with Docker and Docker Compose installed
- A domain name pointed to your server (e.g., `music.yourdomain.com`)
- Ports 80 and 443 open on the server's firewall
- Git clone of the japtapsamagams repository

---

## Step 1: Generate AUTH_SECRET

Auth.js requires a secret for signing JWTs and encrypting cookies. Generate one:

```bash
openssl rand -base64 33
```

Save this value — you'll need it in Step 5.

---

## Step 2: Google OAuth Setup

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `Japtap Samagams` (or any name)
4. Click **Create**

### 2.2 Configure the OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** → **Create**
3. Fill in:
   - **App name**: `Japtap Samagams`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Click **Save and Continue**
5. **Scopes**: Click **Add or Remove Scopes**, select:
   - `openid`
   - `email`
   - `profile`
6. Click **Save and Continue**
7. **Test users**: Add your email (required while app is in "Testing" status)
8. Click **Save and Continue** → **Back to Dashboard**

### 2.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: `Japtap Samagams NextAuth`
5. **Authorized redirect URIs**: Add:
   ```
   https://music.yourdomain.com/api/auth/callback/google
   ```
   For local testing, also add:
   ```
   http://localhost/api/auth/callback/google
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### 2.4 Publish the App (When Ready)

While in "Testing" status, only test users can sign in (max 100).
To allow anyone to sign in:
1. Go to **OAuth consent screen** → **Publishing status**
2. Click **Publish App** → **Confirm**

> ⚠️ Google may require a verification review if you request sensitive scopes. For `openid`, `email`, `profile` this is usually not required.

### Common Google OAuth Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | Callback URL doesn't match | Add exact URL in Google Console |
| `access_denied` | User not in test users list | Add user or publish the app |
| `invalid_client` | Wrong Client ID/Secret | Double-check values in .env |
| Consent screen shows "unverified" | App in testing mode | Normal — publish when ready |

---

## Step 3: Facebook OAuth Setup (Optional)

> ⚠️ Facebook OAuth does NOT support `localhost` callbacks. Use a Cloudflare Tunnel or ngrok for local testing.

### 3.1 Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** (or **Business** if required)
4. **App name**: `Japtap Samagams`
5. Click **Create App**

### 3.2 Add Facebook Login Product

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** → **Set Up**
3. Select **Web**
4. **Site URL**: `https://music.yourdomain.com`
5. Click **Save** → **Continue**

### 3.3 Configure OAuth Settings

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. **Valid OAuth Redirect URIs**: Add:
   ```
   https://music.yourdomain.com/api/auth/callback/facebook
   ```
3. Click **Save Changes**

### 3.4 Get App ID and Secret

1. Go to **Settings** → **Basic** (left sidebar)
2. Copy **App ID** (this is `AUTH_FACEBOOK_ID`)
3. Click **Show** next to **App Secret** → copy it (this is `AUTH_FACEBOOK_SECRET`)

### 3.5 Go Live

1. Go to **Settings** → **Basic**
2. Fill in **Privacy Policy URL** and **Terms of Service URL** (required)
3. Toggle **App Mode** from **Development** to **Live**

> While in Development mode, only users with a role in the app (admin, developer, tester) can log in.

### Common Facebook OAuth Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `URL Blocked` | Redirect URI not whitelisted | Add exact URL in Facebook Login → Settings |
| `App Not Active` | App in Development mode | Add user as tester, or go Live |
| No email returned | Account created via mobile | Facebook may not return email for some accounts — user will need to add one |
| `Can't Load URL` | Domain not added to App Domains | Add domain in Settings → Basic → App Domains |

---

## Step 4: GitHub OAuth Setup (Optional)

### 4.1 Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `Japtap Samagams`
   - **Homepage URL**: `https://music.yourdomain.com`
   - **Authorization callback URL**:
     ```
     https://music.yourdomain.com/api/auth/callback/github
     ```
4. Click **Register application**

### 4.2 Get Client ID and Secret

1. Copy **Client ID** (this is `AUTH_GITHUB_ID`)
2. Click **Generate a new client secret**
3. Copy the secret (this is `AUTH_GITHUB_SECRET`)

> ⚠️ The client secret is only shown once. Save it immediately.

### 4.3 For Local Testing

Create a separate OAuth App for localhost:
- **Homepage URL**: `http://localhost`
- **Authorization callback URL**: `http://localhost/api/auth/callback/github`

### Common GitHub OAuth Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri is not registered` | Callback URL mismatch | Exactly match the URL in GitHub settings |
| `bad_verification_code` | Code expired or reused | Retry the auth flow |
| `application_suspended` | App suspended by GitHub | Check GitHub developer dashboard |

---

## Step 5: Configure Environment Variables

1. Copy the env template:
   ```bash
   cp deploy/nextauth/.env.example .env
   ```

2. Edit `.env` with your values:
   ```bash
   # Required
   AUTH_SECRET="<paste your openssl output from Step 1>"

   # Google (required — primary provider)
   AUTH_GOOGLE_ID="<paste from Step 2.3>"
   AUTH_GOOGLE_SECRET="<paste from Step 2.3>"

   # Facebook (optional — uncomment when ready)
   # AUTH_FACEBOOK_ID="<paste from Step 3.4>"
   # AUTH_FACEBOOK_SECRET="<paste from Step 3.4>"

   # GitHub (optional — uncomment when ready)
   # AUTH_GITHUB_ID="<paste from Step 4.2>"
   # AUTH_GITHUB_SECRET="<paste from Step 4.2>"
   ```

---

## Step 6: Update Caddyfile Domain

Edit `deploy/caddy/nextauth/Caddyfile`:

1. Replace `music.yourdomain.com` with your actual domain
2. Replace `admin@yourdomain.com` with your email (used for Let's Encrypt)

```bash
sed -i 's/music.yourdomain.com/music.youractualdomain.com/g' deploy/caddy/nextauth/Caddyfile
sed -i 's/admin@yourdomain.com/you@youractualdomain.com/g' deploy/caddy/nextauth/Caddyfile
```

---

## Step 7: Build & Deploy

```bash
# Build both images (NextAuth.js gateway + Navidrome)
docker compose --env-file .env -f deploy/nextauth/docker-compose.yml build

# Start all services
docker compose --env-file .env -f deploy/nextauth/docker-compose.yml up -d

# Check logs
docker compose --env-file .env -f deploy/nextauth/docker-compose.yml logs -f
```

Verify services are running:
```bash
docker compose --env-file .env -f deploy/nextauth/docker-compose.yml ps
```

Expected output:
```
NAME              SERVICE     STATUS
japtapsamagams    navidrome   running
...-nextauth-1   nextauth    running
...-caddy-1      caddy       running
```

---

## Step 8: First Login (Admin Setup)

**The first user to log in via OAuth becomes the admin.**

1. Open `https://music.yourdomain.com` in your browser
2. You should see the app as `japtaptest` (default user) — **this confirms the stack is working**
3. Click **"Sign In"** in the user menu (top right)
4. You'll be taken to the **Navidrome login page** (`/app/#/login`) — not the NextAuth.js page
5. Click **"Sign in with Google"**
6. Complete the Google OAuth consent flow
7. You'll be redirected back to the app as `youremail@gmail.com`
8. **You are now the admin** (first user created via reverse proxy gets `IsAdmin: true`)

> **Why the login page instead of the NextAuth.js page?**
> The "Sign In" button now redirects to Navidrome's own login page, which combines native
> username/password login and the "Sign in with Google" button in one familiar UI.

To verify admin status:
- Go to **Settings** → you should see the **Users** section
- Your user should show the admin badge

---

## Step 9: Verify the Full Flow

Run through these test cases:

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Visit `https://music.yourdomain.com` with no cookies | See app as `japtaptest`, "Sign In" visible in top-right menu |
| 2 | Click "Sign In" | Redirected to `/app/#/login` (Navidrome login page, NOT the NextAuth.js page) |
| 3 | Click "Sign in with Google" on the login page | Redirected to Google consent → back to original page as your email |
| 4 | Refresh the page | Still logged in as your email (session cookie persists) |
| 5 | Open incognito window → visit site | See app as `japtaptest` (separate cookie jar) |
| 6 | Click "Logout" | localStorage cleared, redirected to `/app/#/login` |
| 7 | Visit `/rest/ping` | Navidrome responds directly (auth bypassed for Subsonic clients) |
| 8 | Visit `/share/*` | Public share loads (auth bypassed) |

---

## Step 10: Managing Users

### View Users
As admin, go to **Settings** → **Users** in the Navidrome UI.

### Promote a User to Admin
Option A — **Navidrome UI**: Settings → Users → click user → toggle Admin

Option B — **API call** (requires admin JWT):
```bash
curl -X PUT https://music.yourdomain.com/api/user/<user-id> \
  -H "X-ND-Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"isAdmin": true}'
```

Option C — **Direct SQLite** (on the server):
```bash
sqlite3 /path/to/navidrome.db "UPDATE user SET is_admin = 1 WHERE user_name = 'someone@gmail.com';"
```

### Delete a User
Settings → Users → click user → Delete

---

## Adding Providers Later

### Add Facebook

1. Complete [Step 3: Facebook OAuth Setup](#step-3-facebook-oauth-setup-optional)
2. Uncomment and set in `.env`:
   ```
   AUTH_FACEBOOK_ID="your-facebook-app-id"
   AUTH_FACEBOOK_SECRET="your-facebook-app-secret"
   ```
3. Restart the NextAuth.js container:
   ```bash
   docker compose --env-file .env -f deploy/nextauth/docker-compose.yml restart nextauth
   ```
4. The sign-in page now shows a "Sign in with Facebook" button alongside Google.

### Add GitHub

Same process — uncomment `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET` in `.env`, restart.

### Add Any Other Auth.js Provider

1. Edit `nextauth/auth.ts` — add the import and conditional block
2. Set the env vars in `.env`
3. Rebuild and restart:
   ```bash
   docker compose --env-file .env -f deploy/nextauth/docker-compose.yml build nextauth
   docker compose --env-file .env -f deploy/nextauth/docker-compose.yml up -d nextauth
   ```

---

## Troubleshooting

### NextAuth.js Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Sign-in page shows no providers | No `AUTH_*_ID` env vars set | Check `.env` and ensure vars are passed to container |
| `UNTRUST_HOST` error | `AUTH_TRUST_HOST` not set | Ensure `AUTH_TRUST_HOST=true` in env |
| `CSRF token mismatch` | Cookie domain mismatch | Check that Caddy forwards cookies correctly |
| OAuth callback error | Wrong callback URL in provider console | Must be `https://yourdomain/api/auth/callback/<provider>` |
| `AUTH_SECRET` error | Secret not set or too short | Generate with `openssl rand -base64 33` |

### Caddy Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| 502 Bad Gateway | NextAuth.js or Navidrome not running | `docker compose ps` — check service status |
| TLS errors | Caddy can't reach Let's Encrypt | Ensure ports 80/443 are open, domain points to server |
| All requests get `japtaptest` | Caddy can't reach `/api/auth/caddy` | Check NextAuth.js logs, verify Docker network |
| Authenticated user gets `japtaptest` | Cookies not forwarded in sub-request | Ensure `header_up Cookie` line in Caddyfile |

### Navidrome Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `Remote-User` ignored | Source IP not in whitelist | Check `ND_REVERSEPROXYWHITELIST` matches Docker subnet |
| User created with wrong name | Email used as both username and name | Expected behaviour — email is the display name |
| First user not admin | Another user was created first | Update via SQLite: `UPDATE user SET is_admin = 1 WHERE ...` |
| `DevAutoLoginUsername` overriding | Config not commented out | Ensure `DevAutoLoginUsername` is commented out in `navidrome.toml` |
