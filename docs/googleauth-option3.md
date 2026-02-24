### Option C: Nginx + Vouch Proxy

The simplest approach — Vouch Proxy is a single Go binary that handles the entire OAuth flow. Nginx calls it via the `auth_request` subrequest mechanism: every incoming request triggers a lightweight validation call to Vouch before being proxied to Navidrome. No admin dashboard, no database, no complexity beyond two config files.

#### Pros and Cons

**Pros:**
- Minimal infrastructure — only two containers (Vouch + Nginx) on top of Navidrome
- No database required — Vouch stores sessions in cookies (JWT), stateless
- Simple config — one YAML file for Vouch, one Nginx conf
- Low resource usage — Vouch is a single Go binary (~15 MB memory idle)
- Google OAuth works out of the box with built-in provider support
- Facebook works via the generic OIDC provider mode
- Well-documented `auth_request` pattern, widely used in the Nginx community
- Can protect multiple apps behind the same Vouch instance with shared cookies

**Cons:**
- No admin UI — user management, session revocation, and audit logs do not exist; if you need to block a user you must do it in the OAuth provider or in Navidrome's admin panel
- No built-in MFA — relies entirely on what the OAuth provider enforces (Google/Facebook MFA)
- No group/role mapping — every authenticated user gets the same level of access in Navidrome (the first user becomes admin, the rest are standard)
- Cookie-only sessions — no server-side session store means you cannot revoke a session early; it expires when the JWT TTL runs out
- Facebook requires OIDC-mode config — not as turnkey as Google (more manual endpoint URLs)
- Nginx does not auto-provision HTTPS — you need Certbot/Let's Encrypt separately (unlike Caddy which handles it automatically)
- Single point of failure — if Vouch goes down, all auth stops and Nginx returns 401 for every request

#### Architecture

```
Browser
  │
  ├─ GET https://music.yourdomain.com/
  │       │
  │   Nginx (port 443)
  │       │
  │       ├─ auth_request → GET http://vouch:9090/validate
  │       │                      │
  │       │                 Cookie present & valid?
  │       │                      │
  │       │              ┌───────┴────────┐
  │       │              │                │
  │       │          200 (valid)     401 (invalid/missing)
  │       │              │                │
  │       │              │          Nginx returns 302 → /login
  │       │              │                │
  │       │              │          GET http://vouch:9090/login
  │       │              │                │
  │       │              │          302 → Google/Facebook OAuth
  │       │              │                │
  │       │              │          User authenticates
  │       │              │                │
  │       │              │          Callback → http://vouch:9090/auth
  │       │              │                │
  │       │              │          Vouch sets JWT cookie
  │       │              │          302 → original URL
  │       │              │
  │       ├─ Adds header: Remote-User: user@example.com
  │       │
  │       └─ proxy_pass → http://navidrome:4633
  │
  └─ Subsonic clients (DSub, Symfonium, etc.)
       └─ GET /rest/* → bypasses auth_request, goes directly to Navidrome
```

#### Prerequisites

- Docker and Docker Compose
- A domain with DNS pointing to your server (e.g., `music.yourdomain.com`)
- A second subdomain for Vouch (e.g., `vouch.yourdomain.com`)
- TLS certificates (Let's Encrypt via Certbot, or provide your own)
- A Google account with access to [Google Cloud Console](https://console.cloud.google.com/)
- A Facebook account with access to [Facebook Developers](https://developers.facebook.com/) (optional — only if you want Facebook login)

#### Directory Structure

```
navidrome-stack/
├── docker-compose.yml
├── vouch-config.yml
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── navidrome.conf
├── certbot/              # TLS certs (Let's Encrypt)
│   ├── conf/
│   └── www/
└── music/                # Your music library
```

#### Step 1: Create Google OAuth Credentials

##### 1a. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top-left) → **New Project**
3. Name it (e.g., `Navidrome Music`) and click **Create**
4. Make sure the new project is selected in the dropdown

##### 1b. Configure the OAuth Consent Screen

1. In the left sidebar, navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace, in which case pick Internal)
3. Click **Create** and fill in the required fields:
   - **App name:** `Navidrome` (or whatever you want users to see on the Google login page)
   - **User support email:** your email address
   - **Developer contact information:** your email address
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes** and add:
   - `email`
   - `profile`
   - `openid`
6. Click **Save and Continue**
7. On the **Test users** page (only shown for External apps in testing mode):
   - Click **Add Users** and add the Google accounts that should be allowed to log in during testing
   - You can add up to 100 test users while the app is in "Testing" status
   - Once you publish the app to production, any Google account can log in
8. Click **Save and Continue**, then **Back to Dashboard**

##### 1c. Create OAuth Client Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type:** select **Web application**
4. **Name:** `Navidrome Vouch` (for your reference)
5. Under **Authorized redirect URIs**, click **Add URI** and enter:
   ```
   https://vouch.yourdomain.com/auth
   ```
   > **Important:** This must match EXACTLY — no trailing slash, correct protocol (`https`), correct subdomain. This is the URL Google redirects to after the user authenticates. Vouch Proxy listens on `/auth` for this callback.
6. Click **Create**
7. A dialog shows your **Client ID** and **Client Secret** — copy both and save them securely. You'll need them for `vouch-config.yml` in Step 2.

   Example values (yours will be different):
   ```
   Client ID:     YOUR_GOOGLE_CLIENT_ID
   Client Secret:  YOUR_GOOGLE_CLIENT_SECRET
   ```

##### 1d. (Optional) Create Facebook OAuth Credentials

Skip this if you only want Google login. Vouch Proxy supports one provider at a time, so if you configure Facebook, it replaces Google (not both simultaneously).

**Create a Facebook App:**

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** or **None** as the app type
4. Fill in:
   - **App name:** `Navidrome`
   - **App contact email:** your email
5. Click **Create App**

**Add Facebook Login:**

1. From the app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Select **Web** as the platform
4. Skip the quickstart wizard — go to **Facebook Login** → **Settings** in the left sidebar
5. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://vouch.yourdomain.com/auth
   ```
6. Enable:
   - **Client OAuth Login** — Yes
   - **Web OAuth Login** — Yes
   - **Enforce HTTPS** — Yes (for production)
7. Click **Save Changes**

**Get your credentials:**

1. Navigate to **Settings** → **Basic** (in the left sidebar)
2. Copy:
   - **App ID** → this is your `FACEBOOK_CLIENT_ID` (used as `client_id` in vouch-config.yml)
   - **App Secret** → click **Show**, enter your Facebook password, then copy — this is your `FACEBOOK_CLIENT_SECRET` (used as `client_secret`)

**App mode:**

- **Development mode** (default): Only app admins, developers, and testers can log in. Add test users under **Roles** → **Test Users**
- **Live mode**: Any Facebook user can log in. Requires Facebook's app review process before you can go live

> **Callback URL reference:**
>
> | Provider | Redirect URI for Vouch Proxy |
> |---|---|
> | Google | `https://vouch.yourdomain.com/auth` |
> | Facebook | `https://vouch.yourdomain.com/auth` |
>
> Both providers use the same Vouch callback path. The difference is which one you configure in `vouch-config.yml`.

#### Step 2: Create the Vouch Proxy Configuration

Create `vouch-config.yml`:

**Google-only setup:**

```yaml
vouch:
  # Listen port inside the container
  port: 9090

  # Domains that the auth cookie is valid for.
  # Must cover both the Vouch host and the Navidrome host.
  domains:
    - yourdomain.com

  # Where to send users after successful login
  whiteList:
    # Restrict which email addresses / domains can log in.
    # Remove this block to allow any Google/Facebook account.
    - user1@gmail.com
    - user2@gmail.com

  cookie:
    # Cookie domain — must be the parent domain so the cookie
    # is shared between vouch.yourdomain.com and music.yourdomain.com
    domain: yourdomain.com

    # Secure cookie settings
    secure: true
    httpOnly: true
    sameSite: lax

    # Session lifetime (after this, user must re-authenticate)
    maxAge: 2592000   # 30 days in seconds

    # Name of the cookie
    name: VouchCookie

oauth:
  provider: google
  client_id: YOUR_GOOGLE_CLIENT_ID
  client_secret: YOUR_GOOGLE_CLIENT_SECRET
  callback_url: https://vouch.yourdomain.com/auth

  # Scopes — email is needed so Vouch can extract the username
  scopes:
    - openid
    - email
    - profile
```

**Google + Facebook setup (using generic OIDC for Facebook):**

To support both providers, you need to run **two Vouch instances** (Vouch only supports one provider at a time) or pick one as the primary. If you want both login options, the recommended approach is to use Authentik or Authelia (Options A/B) instead.

If you only need Facebook, replace the `oauth` block:

```yaml
oauth:
  # Facebook via generic OIDC provider
  provider: oidc

  client_id: YOUR_FACEBOOK_APP_ID
  client_secret: YOUR_FACEBOOK_APP_SECRET

  auth_url: https://www.facebook.com/v21.0/dialog/oauth
  token_url: https://graph.facebook.com/v21.0/oauth/access_token
  user_info_url: https://graph.facebook.com/me?fields=id,name,email

  callback_url: https://vouch.yourdomain.com/auth

  scopes:
    - email
    - public_profile
```

#### Step 3: Create the Nginx Configuration

Create `nginx/conf.d/navidrome.conf`:

```nginx
# =============================================================================
# Vouch Proxy — handles OAuth login/callback
# =============================================================================
upstream vouch_backend {
    server vouch:9090;
}

# =============================================================================
# Navidrome — music server
# =============================================================================
upstream navidrome_backend {
    server navidrome:4633;
}

# =============================================================================
# Redirect HTTP → HTTPS
# =============================================================================
server {
    listen 80;
    server_name music.yourdomain.com vouch.yourdomain.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# =============================================================================
# Vouch Proxy virtual host (vouch.yourdomain.com)
# Handles /login, /auth (callback), /logout
# =============================================================================
server {
    listen 443 ssl;
    server_name vouch.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://vouch_backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# =============================================================================
# Navidrome virtual host (music.yourdomain.com)
# =============================================================================
server {
    listen 443 ssl;
    server_name music.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ------------------------------------------------------------------
    # Internal: Vouch validation endpoint
    # Nginx calls this on every request to check if the user is authed.
    # ------------------------------------------------------------------
    location = /validate {
        internal;

        proxy_pass http://vouch_backend/validate;

        # Do not send the request body to Vouch (not needed, saves bandwidth)
        proxy_pass_request_body off;
        proxy_set_header Content-Length "";

        # Forward the original request details so Vouch can validate the cookie
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Forward the original URI (Vouch uses this for redirect after login)
        proxy_set_header X-Original-URI $request_uri;
        proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    }

    # ------------------------------------------------------------------
    # Subsonic API: Bypass Vouch auth entirely.
    # Subsonic clients (DSub, play:Sub, Symfonium, etc.) authenticate
    # with their own password/token mechanism — they cannot do OAuth.
    # ------------------------------------------------------------------
    location /rest/ {
        proxy_pass http://navidrome_backend;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ------------------------------------------------------------------
    # Share links: Bypass auth so shared album/playlist links work
    # for unauthenticated visitors.
    # ------------------------------------------------------------------
    location /share/ {
        proxy_pass http://navidrome_backend;

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ------------------------------------------------------------------
    # Error handler: When Vouch returns 401, redirect to login.
    # ------------------------------------------------------------------
    error_page 401 = @error401;

    location @error401 {
        # Redirect to Vouch login, which will redirect to Google/Facebook
        # After auth, Vouch sends the user back to the original URL
        return 302 https://vouch.yourdomain.com/login?url=$scheme://$http_host$request_uri&vouch-failcount=$auth_resp_x_vouch_failcount&X-Vouch-Token=$auth_resp_x_vouch_token&error=$auth_resp_x_vouch_err;
    }

    # ------------------------------------------------------------------
    # All other paths: Require Vouch authentication
    # ------------------------------------------------------------------
    location / {
        # Trigger the /validate subrequest
        auth_request /validate;

        # Capture response headers from Vouch after successful validation
        auth_request_set $auth_resp_x_vouch_user      $upstream_http_x_vouch_user;
        auth_request_set $auth_resp_x_vouch_idp_claims $upstream_http_x_vouch_idp_claims_email;
        auth_request_set $auth_resp_x_vouch_failcount  $upstream_http_x_vouch_failcount;
        auth_request_set $auth_resp_x_vouch_token      $upstream_http_x_vouch_token;
        auth_request_set $auth_resp_x_vouch_err        $upstream_http_x_vouch_err;

        # Pass the authenticated username to Navidrome
        # This is the header Navidrome reads via ReverseProxyUserHeader
        proxy_set_header Remote-User $auth_resp_x_vouch_user;

        # Standard proxy headers
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (Navidrome uses it for real-time updates)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_pass http://navidrome_backend;
    }
}
```

Create `nginx/nginx.conf` (top-level Nginx config):

```nginx
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    # Performance
    sendfile    on;
    tcp_nopush  on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    include /etc/nginx/conf.d/*.conf;
}
```

#### Step 4: Create the Docker Compose File

Create `docker-compose.yml`:

```yaml
services:
  # --- Navidrome (Music Server) ---
  navidrome:
    image: deluan/navidrome:latest
    restart: unless-stopped
    environment:
      ND_MUSICFOLDER: /music
      ND_DATAFOLDER: /data

      # Reverse proxy auth — trust the Nginx container's IP on this network
      ND_REVERSEPROXYWHITELIST: "172.20.0.0/16"
      ND_REVERSEPROXYUSERHEADER: "Remote-User"

      # Disable auto-login (Vouch controls access)
      ND_DEVAUTOLOGINUSERNAME: ""

      # Disable password changes in UI (auth is handled by Vouch/OAuth)
      ND_ENABLEUSEREDITING: "false"
      ND_ENABLEUSERSELFSNIGNUP: "false"

      # Session timeout for the web UI
      ND_SESSIONTIMEOUT: "48h"
    volumes:
      - navidrome-data:/data
      - ./music:/music:ro
    networks:
      - internal

  # --- Vouch Proxy (OAuth Handler) ---
  vouch:
    image: quay.io/vouch/vouch-proxy:latest
    restart: unless-stopped
    volumes:
      - ./vouch-config.yml:/config/config.yml:ro
    networks:
      - internal

  # --- Nginx (Reverse Proxy + TLS) ---
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - navidrome
      - vouch
    networks:
      - internal

  # --- Certbot (TLS Certificate Renewal) ---
  certbot:
    image: certbot/certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    # Renew certificates every 12 hours
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  internal:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  navidrome-data:
```

#### Step 5: Obtain TLS Certificates

Before starting the full stack, get an initial certificate:

```bash
# 1. Start Nginx with a temporary HTTP-only config for the ACME challenge
#    (comment out the ssl server blocks in navidrome.conf first)
docker compose up -d nginx

# 2. Request the certificate
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d music.yourdomain.com \
  -d vouch.yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --no-eff-email

# 3. Uncomment the ssl server blocks in navidrome.conf

# 4. Restart Nginx to pick up the certs
docker compose restart nginx
```

#### Step 6: Start the Stack

```bash
docker compose up -d
```

Verify all containers are running:

```bash
docker compose ps
```

Expected output:

```
NAME         SERVICE      STATUS
navidrome    navidrome    Up
vouch        vouch        Up
nginx        nginx        Up
certbot      certbot      Up
```

#### Step 7: Test the Login Flow

1. Open `https://music.yourdomain.com` in a browser
2. Nginx triggers the `/validate` subrequest to Vouch
3. No cookie exists yet, so Vouch returns `401`
4. Nginx redirects you to `https://vouch.yourdomain.com/login`
5. Vouch redirects you to Google's OAuth consent screen
6. You sign in with your Google account
7. Google redirects back to `https://vouch.yourdomain.com/auth`
8. Vouch validates the token, sets a `VouchCookie` JWT cookie on `.yourdomain.com`
9. Vouch redirects you back to `https://music.yourdomain.com`
10. Nginx calls `/validate` again — this time the cookie is valid, Vouch returns `200`
11. Nginx extracts `X-Vouch-User` header and sets it as `Remote-User`
12. Navidrome receives the request, sees `Remote-User: you@gmail.com`
13. Navidrome auto-creates the user (first user = admin) and serves the web UI

#### Step 8: Restrict Access (Optional)

By default, anyone with a Google/Facebook account can log in. To restrict access to specific users, use the `whiteList` in `vouch-config.yml`:

```yaml
vouch:
  whiteList:
    - alice@gmail.com
    - bob@example.com
```

Or restrict by domain:

```yaml
vouch:
  allowAllUsers: false
  domains:
    - yourdomain.com      # Only allow @yourdomain.com emails
```

#### Step 9: Set Subsonic Passwords for Mobile Clients

After the first OAuth login, the admin user is created in Navidrome. Log in to the Navidrome web UI and:

1. Go to **Users** (admin panel)
2. For each user that needs Subsonic client access, set a password
3. Users enter this password in their Subsonic app (DSub, Symfonium, etc.) along with the server URL `https://music.yourdomain.com`

The `/rest/*` path bypasses Vouch auth, so Subsonic clients authenticate directly with Navidrome using password/token.

#### Troubleshooting

##### Vouch / Nginx Issues

| Problem | Cause | Fix |
|---|---|---|
| Infinite redirect loop between Nginx and Vouch | Cookie domain mismatch | Ensure `cookie.domain` in `vouch-config.yml` is the parent domain (e.g., `yourdomain.com`, not `music.yourdomain.com`) |
| `403 Forbidden` after Google login | Email not in whitelist | Add the email to `vouch.whiteList` or set `vouch.allowAllUsers: true` |
| `401` on every request even after login | Cookie not being sent | Check that both `vouch.yourdomain.com` and `music.yourdomain.com` share the same parent domain, and `cookie.secure: true` matches HTTPS |
| Navidrome shows its own login page instead of auto-login | `Remote-User` header not arriving | Verify `ND_REVERSEPROXYWHITELIST` includes the Nginx container's IP (`172.20.0.0/16`). Run `docker network inspect navidrome-stack_internal` to find the actual subnet |
| Vouch returns `500 Internal Server Error` | Invalid OAuth credentials | Double-check `client_id`, `client_secret`, and `callback_url` in `vouch-config.yml`. The callback URL must exactly match what's registered in Google/Facebook console |
| Subsonic clients get `401 Unauthorized` | Password not set for the user | Set a Navidrome password via the admin panel — Subsonic clients cannot use OAuth |
| Certificate errors | Certbot not renewed | Run `docker compose run --rm certbot renew` and `docker compose restart nginx` |
| WebSocket errors in browser console | Nginx not forwarding upgrade headers | Ensure the `proxy_http_version 1.1`, `Upgrade`, and `Connection` headers are set in the `location /` block |

##### Google OAuth Issues

| Problem | Cause | Fix |
|---|---|---|
| `redirect_uri_mismatch` error on Google login | The callback URL in Google Console doesn't match what Vouch sends | In Google Cloud Console → Credentials → your OAuth client, verify the **Authorized redirect URI** is exactly `https://vouch.yourdomain.com/auth` (no trailing slash). Also verify `callback_url` in `vouch-config.yml` matches the same value. Google can take a few minutes to propagate URI changes. |
| `invalid_client` error | Wrong Client ID or Secret | Go to Google Cloud Console → Credentials, copy the Client ID and Secret again. Make sure you're using the correct project. Check that the OAuth client hasn't been deleted or disabled. |
| Google consent screen says "This app isn't verified" | App is still in testing mode | This is normal during development. Click **Continue** (or **Advanced** → **Go to app**). To remove the warning, submit your app for Google's verification review (only needed for production with >100 users). |
| Only specific Google accounts can log in | App is in testing mode | In Google Console → OAuth consent screen → **Test users**, add the Google accounts that need access. Or publish the app to production to allow any account. |

##### Facebook OAuth Issues

| Problem | Cause | Fix |
|---|---|---|
| Facebook "App Not Setup" error | Your Facebook account isn't a tester/developer on the app | Go to Facebook Developers → your app → **Roles** → **Test Users** or **Roles**, and add your Facebook account. The app must be in Development mode, or in Live mode with approved permissions. |
| `invalid_client` error from Facebook | Wrong App ID or App Secret | Go to Facebook Developers → Settings → Basic. Copy the **App ID** and **App Secret** again. Note that App Secret requires clicking **Show** and entering your Facebook password. |
| Facebook login works but Vouch doesn't get the email | Missing `email` scope or user hasn't granted email permission | Ensure `scopes` in `vouch-config.yml` includes `email`. If the user previously denied email permission, they need to remove the app from their Facebook settings and re-authorize. |
| Facebook rejects the redirect URI | URI mismatch or not using HTTPS | In Facebook Developers → Facebook Login → Settings, the **Valid OAuth Redirect URIs** must include `https://vouch.yourdomain.com/auth`. Facebook requires HTTPS for all redirect URIs (no localhost exceptions for web apps). |

##### Cloudflare Tunnel (Local Testing)

If you're testing locally with a Cloudflare Tunnel instead of a real domain:

| Problem | Cause | Fix |
|---|---|---|
| Quick tunnel URL changed and OAuth fails | Cloudflare quick tunnels get a new random URL each time | Update the redirect URI in Google/Facebook console to the new tunnel URL, and update `callback_url` in `vouch-config.yml`. Restart Vouch after the config change. |
| Cookie domain doesn't work with tunnel URL | `trycloudflare.com` subdomains are random | Set `cookie.domain` in `vouch-config.yml` to `trycloudflare.com` (the parent domain). Both your Vouch and Navidrome tunnel URLs must be under the same parent domain for cookies to be shared — this may not work with quick tunnels since you get separate random subdomains. Use a **named tunnel** with a custom domain instead. |

**Tip for local testing:** Use a named Cloudflare Tunnel with your own domain to avoid the random-URL problem:
```bash
# One-time setup
cloudflared tunnel create navidrome
cloudflared tunnel route dns navidrome music.yourdomain.com
cloudflared tunnel route dns navidrome vouch.yourdomain.com

# Run the tunnel (point it at your local Nginx on port 80)
cloudflared tunnel --config cloudflared.yml run navidrome
```

#### Security Checklist

Before going to production, verify:

- [ ] `vouch-config.yml` is not committed to version control (contains OAuth secrets)
- [ ] Google Client Secret and Facebook App Secret are stored securely
- [ ] `cookie.secure: true` is set in `vouch-config.yml` (enforces HTTPS-only cookies)
- [ ] `cookie.httpOnly: true` is set (prevents JavaScript access to the cookie)
- [ ] `ND_REVERSEPROXYWHITELIST` is scoped to only the Nginx container's subnet — not `0.0.0.0/0`
- [ ] `ND_ENABLEUSEREDITING` is `false` (prevents users from changing auth settings in Navidrome UI)
- [ ] TLS certificates are valid and auto-renewing (Certbot cron)
- [ ] HTTPS is enforced (HTTP redirects to HTTPS in Nginx)
- [ ] `vouch.whiteList` restricts login to known email addresses (if not a public instance)
- [ ] Facebook app has been reviewed before going live (required by Facebook for public access)
- [ ] Google app is published if more than 100 users need access (testing mode limits to 100 test users)
- [ ] Test users removed from Google/Facebook console before production launch

### Navidrome Configuration

Regardless of which option you choose, the Navidrome config is the same:

| Config Key | Env Variable | Value | Purpose |
|---|---|---|---|
| `ReverseProxyWhitelist` | `ND_REVERSEPROXYWHITELIST` | CIDR of your proxy (e.g., `172.20.0.0/16`) | Only accept `Remote-User` from trusted IPs |
| `ReverseProxyUserHeader` | `ND_REVERSEPROXYUSERHEADER` | `Remote-User` (default) | HTTP header containing the username |
| `DevAutoLoginUsername` | `ND_DEVAUTOLOGINUSERNAME` | `""` (empty — must disable) | Dev auto-login bypasses all auth — must be cleared |
| `EnableUserEditing` | `ND_ENABLEUSEREDITING` | `false` | Prevent users from changing passwords (auth via OAuth) |
| `EnableUserSelfSignup` | `ND_ENABLEUSERSELFSNIGNUP` | `false` | Prevent self-registration (only OAuth-authed users allowed) |
| `SessionTimeout` | `ND_SESSIONTIMEOUT` | `48h` (default) | Navidrome's internal session lifetime |
| `AuthRequestLimit` | `ND_AUTHREQUESTLIMIT` | `5` (default) | Rate limit login attempts per IP |
| `AuthWindowLength` | `ND_AUTHWINDOWLENGTH` | `20s` (default) | Sliding window for rate limiting |

**User auto-creation behavior:**
- When Navidrome receives a request with a valid `Remote-User` header from a trusted source, it automatically creates the user in its SQLite database with a random password
- The **first user** created via external auth becomes an admin
- Subsequent users get standard (non-admin) permissions

**Important:** Set `ReverseProxyWhitelist` to only include the reverse proxy's IP. If set too broadly (`0.0.0.0/0`), any machine could forge the `Remote-User` header and impersonate any user.

### Subsonic Client Considerations

Subsonic clients (DSub, play:Sub, Symfonium, etc.) do **not** support OAuth. They authenticate using the Subsonic API's own mechanism (password or MD5 token). This means:

1. **Bypass proxy auth for `/rest/*`** — The Caddy/Nginx/Traefik config above skips the auth middleware for Subsonic API paths
2. **Users need a Navidrome password for Subsonic clients** — Even though web UI login uses OAuth, each user needs a password set in Navidrome's admin panel for their Subsonic apps to connect
3. **Alternative:** If `EnableUserEditing` is `false`, an admin must set passwords for Subsonic client users via Navidrome's admin interface

---

## Comparison: Samagam Flights vs Navidrome Auth

| Aspect | Samagam Flights | Navidrome |
|---|---|---|
| **App framework** | Next.js (JavaScript/TypeScript) | Go server with React frontend |
| **OAuth handling** | Native via NextAuth v5 | Delegated to external auth service |
| **Where OAuth code lives** | `src/lib/auth.ts` in the app | Separate service (Authentik/Authelia/Vouch) |
| **Session storage** | PostgreSQL (via PrismaAdapter) | SQLite (internal) + auth service session |
| **User creation** | NextAuth auto-creates on first OAuth login | Navidrome auto-creates when `Remote-User` header is received |
| **Infrastructure needed** | Just the Next.js app + PostgreSQL | Navidrome + reverse proxy + auth service |
| **Subsonic API compat** | N/A | Requires separate password-based auth |
| **Google/Facebook setup** | Add client ID/secret to `.env`, done | Configure as identity provider in auth service, configure reverse proxy forwarding |
| **Config format** | `.env` + TypeScript | TOML (`navidrome.toml`) or `ND_` env vars |
| **Cookie security** | Managed by NextAuth (auto-switches HTTP/HTTPS) | Managed by the auth service |

---

## Local Testing Guide (HTTP, no real domain required)

This section covers testing the full Nginx + Vouch + Navidrome stack on your local machine using Docker. No real domain or TLS certificate is needed — Google allows `http://localhost` as an OAuth redirect URI.

All config files for local testing live in:
```
contrib/docker-compose/vouch-nginx/
├── docker-compose-local.yml
├── vouch-config-local.yml.template   ← copy this → vouch-config-local.yml
├── nginx/
│   ├── nginx.conf
│   └── conf.d/navidrome-local.conf
```

### Step L1: Create Google OAuth Credentials (localhost)

Follow Steps 1a–1c from the main guide above. When configuring the OAuth client:

- **Authorized redirect URIs**: `http://localhost:9090/auth`

> Google explicitly permits `http://localhost` URIs — no HTTPS needed for local dev.

Save your **Client ID** and **Client Secret**.

### Step L2: Create the Vouch Config

```bash
cd contrib/docker-compose/vouch-nginx
cp vouch-config-local.yml.template vouch-config-local.yml
```

Edit `vouch-config-local.yml` and fill in:

```yaml
oauth:
  client_id: YOUR_GOOGLE_CLIENT_ID      # ← paste here
  client_secret: YOUR_GOOGLE_CLIENT_SECRET  # ← paste here
  callback_url: http://localhost:9090/auth

vouch:
  whiteList:
    - your-email@gmail.com             # ← your Google account
```

> `vouch-config-local.yml` is in `.gitignore` — it will not be committed.

### Step L3: Verify navidrome.toml

Make sure `DevAutoLoginUsername` is commented out in [navidrome.toml](../navidrome.toml). It was updated as part of this implementation:

```toml
# DevAutoLoginUsername = "japtaptest"   # DISABLED — Vouch Proxy handles authentication
```

If you are running Navidrome directly (not via this docker-compose), restart it after editing the toml.

### Step L4: Start the Stack

```bash
cd contrib/docker-compose/vouch-nginx
docker compose -f docker-compose-local.yml up -d
```

Verify all three containers are up:

```bash
docker compose -f docker-compose-local.yml ps
```

Expected output:
```
NAME        SERVICE     STATUS    PORTS
navidrome   navidrome   running
vouch       vouch       running   0.0.0.0:9090->9090/tcp
nginx       nginx       running   0.0.0.0:8080->8080/tcp
```

### Step L5: Test the Full Auth Flow

**1. Open the app:**
```
http://localhost:8080
```

**2. What should happen:**
1. Nginx receives the request → calls Vouch `/validate` internally
2. No cookie exists yet → Vouch returns `401`
3. Nginx redirects your browser to `http://localhost:9090/login`
4. Vouch redirects to Google's OAuth consent screen
5. Sign in with your Google account (must be in `whiteList`)
6. Google redirects back to `http://localhost:9090/auth`
7. Vouch validates the token, sets a `VouchCookie` on `localhost`
8. Vouch redirects back to `http://localhost:8080`
9. Nginx calls `/validate` again — cookie is valid, Vouch returns `200`
10. Nginx sets `Remote-User: your@gmail.com` header on the request to Navidrome
11. Navidrome auto-creates your user (first user = admin) and serves the web UI

**3. Verify the user was created in Navidrome:**
- Log in to `http://localhost:8080`
- Go to **Settings → Users** (admin panel)
- Your Google email should appear as a user

### Step L6: Test Subsonic API Bypass

Subsonic clients bypass Vouch and hit Navidrome directly. Test this works:

```bash
# Should return a valid Subsonic response (not a redirect to Vouch)
curl -v "http://localhost:8080/rest/ping.view?u=YOUR_USERNAME&p=YOUR_PASSWORD&v=1.16.1&c=test&f=json"
```

Expected: `{"subsonic-response": {"status": "ok", ...}}`

### Step L7: Set a Subsonic Password for Mobile Apps

After your first OAuth login, set a Navidrome password for Subsonic clients:

1. Open `http://localhost:8080` → log in via Google
2. Go to **Settings → Users** → click your user
3. Set a password in the **Subsonic API Password** field
4. Use this password in your mobile Subsonic client (DSub, Symfonium, etc.)

### Troubleshooting Local Setup

| Problem | Cause | Fix |
|---|---|---|
| Browser stuck on redirect loop | Cookie domain mismatch | Ensure `cookie.domain: localhost` in `vouch-config-local.yml` (not `localhost:8080`) |
| `403 Forbidden` after Google login | Email not in whitelist | Add your Google email to `vouch.whiteList` in `vouch-config-local.yml`, restart Vouch: `docker compose -f docker-compose-local.yml restart vouch` |
| Navidrome shows its own login instead of serving the UI | `Remote-User` header not arriving | Check Nginx container logs: `docker compose -f docker-compose-local.yml logs nginx`. Verify `ND_REVERSEPROXYWHITELIST` covers the Nginx container IP. Run `docker network inspect vouch-nginx_vouch-net` to confirm the subnet is `172.22.0.0/16`. |
| `redirect_uri_mismatch` from Google | Redirect URI mismatch | In Google Cloud Console, verify Authorized redirect URI is exactly `http://localhost:9090/auth` (no trailing slash). Also verify `callback_url` in `vouch-config-local.yml` matches. |
| Navidrome not accessible at all | `DevAutoLoginUsername` still set | Confirm `navidrome.toml` has `DevAutoLoginUsername` commented out AND the docker-compose passes `ND_DEVAUTOLOGINUSERNAME: ""`. Restart: `docker compose -f docker-compose-local.yml restart navidrome` |
| Vouch starts then immediately exits | Bad config YAML | Check Vouch logs: `docker compose -f docker-compose-local.yml logs vouch`. Common issue: tabs instead of spaces in YAML. |
| `upstream_http_x_vouch_user` is empty | Auth not completing properly | Check Vouch logs for JWT errors. Ensure `cookie.secure: false` is set (required for HTTP) |
| Container image not found (`navidrome-local:latest`) | Image not built | Build the image first: `make build && docker build -t navidrome-local:latest .` from the project root |

### Stopping the Stack

```bash
docker compose -f docker-compose-local.yml down
```

To also remove the Docker network:
```bash
docker compose -f docker-compose-local.yml down --remove-orphans
```
