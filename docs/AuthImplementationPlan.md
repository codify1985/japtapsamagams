# Authentication Implementation — Samagam Flights

This document describes how Google and Facebook authentication is implemented in the Samagam Flights codebase using NextAuth v5, and provides a step-by-step guide for adding the same Google/Facebook login to a Navidrome instance.

> For provider-specific console setup (creating OAuth credentials, configuring redirect URIs, Cloudflare Tunnel details), see [oauth-setup.md](../oauth-setup.md).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Implementation Details (Samagam Flights)](#current-implementation-details-samagam-flights)
   - [Core Auth Configuration](#core-auth-configuration)
   - [OAuth Providers](#oauth-providers)
   - [Session Strategy](#session-strategy)
   - [Cookie Configuration](#cookie-configuration)
   - [Callbacks](#callbacks)
   - [Route Handler](#route-handler)
   - [Database Schema (Prisma)](#database-schema-prisma)
   - [Type Extensions](#type-extensions)
   - [Client-Side Session Provider](#client-side-session-provider)
   - [Auth Guard & Protection](#auth-guard--protection)
   - [UI Components](#ui-components)
3. [Environment Variables](#environment-variables)
4. [Callback URLs](#callback-urls)
5. [Implementing Google/Facebook Auth for Navidrome](#implementing-googlefacebook-auth-for-navidrome)
   - [Why Navidrome Requires a Different Approach](#why-navidrome-requires-a-different-approach)
   - [Architecture: Reverse Proxy + Auth Service](#architecture-reverse-proxy--auth-service)
   - [Choosing an Auth Service](#choosing-an-auth-service)
   - [Option A: Caddy + Authentik (Recommended)](#option-a-caddy--authentik-recommended)
   - [Option B: Traefik + Authelia](#option-b-traefik--authelia)
   - [Option C: Nginx + Vouch Proxy](#option-c-nginx--vouch-proxy) (detailed, self-contained)
     - [Pros and Cons](#pros-and-cons)
     - [Architecture](#architecture)
     - [Step 1: Create Google OAuth Credentials](#step-1-create-google-oauth-credentials)
     - [Step 1d: Create Facebook OAuth Credentials](#1d-optional-create-facebook-oauth-credentials)
     - [Step 2: Vouch Proxy Configuration](#step-2-create-the-vouch-proxy-configuration)
     - [Step 3: Nginx Configuration](#step-3-create-the-nginx-configuration)
     - [Step 4: Docker Compose](#step-4-create-the-docker-compose-file)
     - [Step 5: TLS Certificates](#step-5-obtain-tls-certificates)
     - [Steps 6-9: Launch, Test, Restrict, Subsonic](#step-6-start-the-stack)
     - [Troubleshooting (Vouch, Google, Facebook, Cloudflare)](#troubleshooting)
     - [Security Checklist](#security-checklist)
   - [Navidrome Configuration](#navidrome-configuration)
   - [Subsonic Client Considerations](#subsonic-client-considerations)
6. [Comparison: Samagam Flights vs Navidrome Auth](#comparison-samagam-flights-vs-navidrome-auth)

---

## Architecture Overview

### Samagam Flights (NextAuth — native OAuth)

```
Browser
  │
  ├─ LoginButton ──signIn('google')──► /api/auth/signin/google
  │                                         │
  │                                    Google/Facebook OAuth flow
  │                                         │
  │                                    /api/auth/callback/google
  │                                         │
  │                                    NextAuth (src/lib/auth.ts)
  │                                      ├─ PrismaAdapter → PostgreSQL
  │                                      ├─ Creates/updates User, Account, Session rows
  │                                      └─ Sets session cookie
  │
  ├─ SessionProvider ──useSession()──► reads cookie → session data
  │
  └─ API routes ──requireAuth()──► reads cookie → validates session → returns user
```

**Stack:**
- **NextAuth v5** (`next-auth@5.x`) — Auth framework
- **PrismaAdapter** (`@auth/prisma-adapter`) — Database adapter
- **PostgreSQL** — Session and account storage
- **Prisma** with `@prisma/adapter-pg` — ORM with native pg driver

---

## Current Implementation Details (Samagam Flights)

### Core Auth Configuration

**File:** `src/lib/auth.ts`

The entire auth system is configured in a single file that exports `handlers`, `signIn`, `signOut`, and `auth`:

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Dedicated Prisma client for auth — avoids singleton issues
function createAuthPrismaClient(): PrismaClient {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createAuthPrismaClient();

const isProduction = process.env.NODE_ENV === 'production';
const useSecureCookies = isProduction || process.env.NEXTAUTH_URL?.startsWith('https://');

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [ /* ... */ ],
  session: { /* ... */ },
  cookies: { /* ... */ },
  pages: { signIn: '/auth/signin', error: '/auth/error' },
  callbacks: { /* ... */ },
  trustHost: true,
});
```

**Key design choice:** A dedicated Prisma client is created for auth to avoid conflicts with the app's singleton Prisma instance. This uses `pg.Pool` directly via `@prisma/adapter-pg`.

### OAuth Providers

```typescript
providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  Facebook({
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
  }),
],
```

Both providers use the standard NextAuth provider modules. No additional scopes or authorization parameters are configured beyond the defaults (`openid`, `email`, `profile`).

### Session Strategy

```typescript
session: {
  strategy: 'database',
  maxAge: 30 * 24 * 60 * 60,   // 30 days
  updateAge: 24 * 60 * 60,      // refresh every 24 hours
},
```

Sessions are stored in PostgreSQL (not JWT). This means:
- Sessions survive server restarts
- Sessions can be revoked by deleting rows from the `Session` table
- Each session touch extends the expiry by up to 24 hours

### Cookie Configuration

The cookie setup auto-switches between development (HTTP) and production (HTTPS) modes:

```typescript
const useSecureCookies = isProduction || process.env.NEXTAUTH_URL?.startsWith('https://');

cookies: {
  sessionToken: {
    name: useSecureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
    options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
  },
  callbackUrl: {
    name: useSecureCookies ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
    options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
  },
  csrfToken: {
    name: useSecureCookies ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
    options: { httpOnly: true, sameSite: 'lax', path: '/', secure: useSecureCookies },
  },
},
```

| Environment | Cookie Prefix | Secure | SameSite |
|---|---|---|---|
| Development (HTTP) | `authjs.*` | No | Lax |
| Production / HTTPS | `__Secure-authjs.*` | Yes | Lax |
| CSRF Token (HTTPS) | `__Host-authjs.csrf-token` | Yes | Lax |

### Callbacks

A single `session` callback enriches the session object with the user's database ID:

```typescript
callbacks: {
  async session({ session, user }) {
    if (session.user) {
      session.user.id = user.id;
    }
    return session;
  },
},
```

This makes `session.user.id` available everywhere (client and server).

### Route Handler

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

This catch-all route handles all NextAuth endpoints:
- `GET /api/auth/signin` — Sign-in page redirect
- `GET /api/auth/callback/google` — Google OAuth callback
- `GET /api/auth/callback/facebook` — Facebook OAuth callback
- `GET /api/auth/signout` — Sign-out
- `GET /api/auth/session` — Session data (used by `useSession()`)
- `POST /api/auth/signin/*` — CSRF-protected sign-in
- `POST /api/auth/signout` — CSRF-protected sign-out

### Database Schema (Prisma)

**File:** `prisma/schema.prisma`

NextAuth requires four tables managed by PrismaAdapter:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  // ... app-specific relations
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### Type Extensions

**File:** `src/types/next-auth.d.ts`

Extends the default NextAuth `Session` type so `session.user.id` is typed as `string`:

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

### Client-Side Session Provider

**File:** `src/app/providers.tsx`

Wraps the app so `useSession()` works in any client component:

```typescript
'use client';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

This is rendered in the root layout (`src/app/layout.tsx`).

### Auth Guard & Protection

**Client-side (AppLayout):** `src/components/layout/AppLayout.tsx`

```typescript
export function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  const { data: session, status } = useSession();

  React.useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status, requireAuth]);

  if (requireAuth && status === 'loading') return <LoadingSkeleton />;
  if (requireAuth && !session) return null;

  return <Layout>{children}</Layout>;
}
```

**Server-side (API routes):** `src/lib/auth.ts`

```typescript
export async function requireAuth(request?: NextRequest): Promise<
  | { user: { id: string; email?: string | null; name?: string | null; image?: string | null } }
  | Response
> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return session as { user: { id: string } };
}

export function isAuthError(result: unknown): result is Response {
  return result instanceof Response;
}
```

**Usage in API routes:**

```typescript
export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  if (isAuthError(session)) return session;
  // session.user.id is now safely available
}
```

### UI Components

**File:** `src/components/auth/LoginButton.tsx`

```typescript
'use client';
import { signIn } from 'next-auth/react';

export function LoginButton({ showProviders = false, callbackUrl = '/' }) {
  if (showProviders) {
    return (
      <div className="flex flex-col gap-2">
        <Button onClick={() => signIn('google', { callbackUrl })}>
          <GoogleIcon /> Sign in with Google
        </Button>
        <Button onClick={() => signIn('facebook', { callbackUrl })}>
          <FacebookIcon /> Sign in with Facebook
        </Button>
      </div>
    );
  }
  return <Button onClick={() => signIn(undefined, { callbackUrl })}>Sign In</Button>;
}
```

Additional auth components exported from `src/components/auth/index.ts`:
- `LoginButton` — Provider sign-in buttons
- `LogoutButton` — Calls `signOut()` from `next-auth/react`
- `UserMenu` — Shows avatar + name for authenticated users, or a sign-in button

---

## Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `AUTH_SECRET` | Signs session cookies/tokens | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL for callbacks | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `384624...googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth app ID | `123456789` |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret | `abc123...` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

---

## Callback URLs

These are the OAuth redirect URIs that must be registered with each provider:

| Provider | Local Development | Production |
|---|---|---|
| Google | `http://localhost:3000/api/auth/callback/google` | `https://yourdomain.com/api/auth/callback/google` |
| Facebook | `http://localhost:3000/api/auth/callback/facebook` | `https://yourdomain.com/api/auth/callback/facebook` |

> See [oauth-setup.md](../oauth-setup.md) for detailed instructions on configuring these in Google Cloud Console and Facebook Developer Console, including Cloudflare Tunnel support.

---

## Implementing Google/Facebook Auth for Navidrome

### Why Navidrome Requires a Different Approach

Navidrome is a self-hosted music streaming server written in **Go**. Unlike Samagam Flights (a Next.js app where we embedded OAuth directly), Navidrome **does not support native OAuth/OIDC/SSO**. Its built-in auth methods are:

1. **Username/password** — for the web UI (JWT-based, 48h sessions)
2. **Subsonic API token** — MD5 challenge-response (`md5(password + salt)`)
3. **Externalized auth** — a reverse proxy injects a `Remote-User` header

The Navidrome maintainers intentionally keep OAuth out of core (see [GitHub Issue #858](https://github.com/navidrome/navidrome/issues/858)), treating it as a reverse-proxy concern. The plugin system also does not expose authentication hooks.

**The officially supported path:** Place a reverse proxy + an external auth service in front of Navidrome. The auth service handles the Google/Facebook OAuth flow. On success, the proxy forwards the authenticated username to Navidrome via an HTTP header.

### Architecture: Reverse Proxy + Auth Service

```
Browser
  │
  ├─ Visits https://music.yourdomain.com
  │         │
  │    Reverse Proxy (Caddy / Traefik / Nginx)
  │         │
  │         ├─ Unauthenticated? ──► Auth Service (Authentik / Authelia)
  │         │                            │
  │         │                       Google/Facebook OAuth flow
  │         │                            │
  │         │                       Sets auth session cookie
  │         │
  │         ├─ Authenticated? ──► Adds "Remote-User: john@example.com" header
  │         │                         │
  │         │                    Navidrome (Go server)
  │         │                      ├─ Reads Remote-User header
  │         │                      ├─ Auto-creates user if new
  │         │                      └─ Serves web UI / Subsonic API
  │
  └─ Subsonic clients (DSub, play:Sub, etc.)
       └─ Bypass the proxy auth, use Subsonic password/token directly
```

### Choosing an Auth Service

| Auth Service | Best For | Google OAuth | Facebook OAuth | Complexity |
|---|---|---|---|---|
| **Authentik** | Full-featured SSO | Yes (built-in) | Yes (built-in) | Medium |
| **Authelia** | Lightweight SSO | Yes (OIDC) | Yes (OIDC) | Low-Medium |
| **Vouch Proxy** | Minimal setup | Yes | Yes | Low |
| **Cloudflare Access** | Already using CF | Yes | Yes (via generic OIDC) | Low |

### Option A: Caddy + Authentik (Recommended)

This is the most battle-tested combination documented in the Navidrome community.

#### Prerequisites

- Docker and Docker Compose installed
- A domain name pointing to your server (e.g., `music.yourdomain.com`)
- Google and/or Facebook OAuth credentials (see [oauth-setup.md](../oauth-setup.md) for creation steps — use the Authentik callback URLs instead of NextAuth ones)

#### Step 1: Deploy Authentik

Create a `docker-compose.yml`:

```yaml
services:
  # --- Authentik (Auth Service) ---
  authentik-db:
    image: postgres:16-alpine
    restart: unless-stopped
    volumes:
      - authentik-db:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: authentik
      POSTGRES_USER: authentik
      POSTGRES_PASSWORD: ${AUTHENTIK_DB_PASSWORD}

  authentik-redis:
    image: redis:7-alpine
    restart: unless-stopped

  authentik-server:
    image: ghcr.io/goauthentik/server:latest
    restart: unless-stopped
    command: server
    ports:
      - "9000:9000"     # Authentik web UI
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

  authentik-worker:
    image: ghcr.io/goauthentik/server:latest
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

  # --- Navidrome ---
  navidrome:
    image: deluan/navidrome:latest
    restart: unless-stopped
    ports:
      - "4533:4533"
    volumes:
      - navidrome-data:/data
      - /path/to/your/music:/music:ro
    environment:
      ND_MUSICFOLDER: /music
      ND_DATAFOLDER: /data
      ND_EXTAUTH_TRUSTEDSOURCES: "172.18.0.0/16"   # Docker network CIDR
      ND_EXTAUTH_USERHEADER: "Remote-User"
      ND_ENABLEUSEREDITING: "false"

  # --- Caddy (Reverse Proxy) ---
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data

volumes:
  authentik-db:
  navidrome-data:
  caddy-data:
```

Create a `.env` file for Authentik secrets:

```bash
AUTHENTIK_SECRET_KEY=generate-a-long-random-string-here
AUTHENTIK_DB_PASSWORD=generate-a-strong-password-here
```

#### Step 2: Configure Authentik with Google/Facebook

1. Open Authentik at `http://your-server:9000/if/flow/initial-setup/` and create an admin account.

2. **Add Google as a Federation Source:**
   - Go to **Directory > Federation & Social Login > Create**
   - Type: **Google**
   - Consumer Key: your `GOOGLE_CLIENT_ID`
   - Consumer Secret: your `GOOGLE_CLIENT_SECRET`
   - Note the callback URL shown (e.g., `https://auth.yourdomain.com/source/oauth/callback/google/`) — add this to your Google OAuth console as an authorized redirect URI

3. **Add Facebook as a Federation Source:**
   - Go to **Directory > Federation & Social Login > Create**
   - Type: **Facebook**
   - App ID: your `FACEBOOK_CLIENT_ID`
   - App Secret: your `FACEBOOK_CLIENT_SECRET`
   - Add the callback URL to your Facebook app's valid OAuth redirect URIs

4. **Create a Proxy Provider for Navidrome:**
   - Go to **Applications > Providers > Create**
   - Type: **Proxy Provider**
   - Name: `Navidrome`
   - Authorization flow: `default-provider-authorization-implicit-consent`
   - Forward auth mode: **Single application**
   - External host: `https://music.yourdomain.com`

5. **Create an Application:**
   - Go to **Applications > Applications > Create**
   - Name: `Navidrome`
   - Slug: `navidrome`
   - Provider: select the `Navidrome` proxy provider
   - Launch URL: `https://music.yourdomain.com`

6. **Create an Outpost:**
   - Go to **Applications > Outposts > Create**
   - Name: `navidrome-outpost`
   - Type: **Proxy**
   - Integration: select Docker (or manual if not using Docker)
   - Applications: select `Navidrome`

#### Step 3: Configure Caddy

Create a `Caddyfile`:

```
music.yourdomain.com {
    # Forward auth to Authentik
    forward_auth authentik-server:9000 {
        uri /outpost.goauthentik.io/auth/caddy
        copy_headers X-Authentik-Username>Remote-User

        # Allow Subsonic API clients to bypass proxy auth
        # (they authenticate via Subsonic token/password)
        @subsonic path /rest/*
        skip @subsonic
    }

    # Proxy to Navidrome
    reverse_proxy navidrome:4533
}

# Authentik portal (for login UI)
auth.yourdomain.com {
    reverse_proxy authentik-server:9000
}
```

#### Step 4: Configure Navidrome

The key Navidrome settings (already in the docker-compose above):

```toml
# navidrome.toml (or use ND_ environment variables)

[ExtAuth]
# Trust requests from the Docker network where Caddy runs
TrustedSources = "172.18.0.0/16"

# Header that contains the authenticated username
UserHeader = "Remote-User"

[Server]
# Disable password editing since auth is handled externally
EnableUserEditing = false
```

Or as environment variables:

```bash
ND_EXTAUTH_TRUSTEDSOURCES=172.18.0.0/16
ND_EXTAUTH_USERHEADER=Remote-User
ND_ENABLEUSEREDITING=false
```

#### Step 5: Start Everything

```bash
docker compose up -d
```

**What happens on first login:**

1. User visits `https://music.yourdomain.com`
2. Caddy's `forward_auth` sends them to Authentik
3. Authentik shows Google/Facebook login buttons
4. User completes OAuth with their chosen provider
5. Authentik sets a session cookie and redirects back
6. Caddy adds `Remote-User: user@example.com` to the request
7. Navidrome sees the header, auto-creates the user in its SQLite DB
8. The first user created this way becomes an admin

### Option B: Traefik + Authelia

A lighter alternative using Authelia as the auth service.

#### docker-compose.yml (key parts)

```yaml
services:
  traefik:
    image: traefik:v3
    command:
      - --providers.docker=true
      - --entrypoints.websecure.address=:443
    ports:
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro

  authelia:
    image: authelia/authelia:latest
    volumes:
      - ./authelia/configuration.yml:/config/configuration.yml
    labels:
      - "traefik.http.routers.authelia.rule=Host(`auth.yourdomain.com`)"

  navidrome:
    image: deluan/navidrome:latest
    environment:
      ND_EXTAUTH_TRUSTEDSOURCES: "172.18.0.0/16"
      ND_EXTAUTH_USERHEADER: "Remote-User"
      ND_ENABLEUSEREDITING: "false"
    labels:
      - "traefik.http.routers.navidrome.rule=Host(`music.yourdomain.com`)"
      - "traefik.http.routers.navidrome.middlewares=authelia@docker"
```

#### Authelia configuration.yml (identity provider section)

```yaml
identity_providers:
  oidc:
    clients:
      - id: navidrome
        secret: 'your-client-secret'
        redirect_uris:
          - https://music.yourdomain.com

authentication_backend:
  # Configure to accept Google/Facebook via OIDC
  # See Authelia docs for full OIDC identity provider setup
```

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
  │       └─ proxy_pass → http://navidrome:4533
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
   Client ID:     YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   Client Secret:  GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx
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
    server navidrome:4533;
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
        # This is the header Navidrome reads via ExtAuth.UserHeader
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

      # Externalized Auth — trust the Nginx container's IP
      ND_EXTAUTH_TRUSTEDSOURCES: "172.20.0.0/16"
      ND_EXTAUTH_USERHEADER: "Remote-User"

      # Disable password changes in UI (auth is handled by Vouch/OAuth)
      ND_ENABLEUSEREDITING: "false"

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
| Navidrome shows its own login page instead of auto-login | `Remote-User` header not arriving | Verify `ND_EXTAUTH_TRUSTEDSOURCES` includes the Nginx container's IP (`172.20.0.0/16`). Run `docker network inspect navidrome-stack_internal` to find the actual subnet |
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
- [ ] `ND_EXTAUTH_TRUSTEDSOURCES` is scoped to only the Nginx container's subnet — not `0.0.0.0/0`
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
| `ExtAuth.TrustedSources` | `ND_EXTAUTH_TRUSTEDSOURCES` | CIDR of your proxy (e.g., `172.18.0.0/16`) | Only accept `Remote-User` from trusted IPs |
| `ExtAuth.UserHeader` | `ND_EXTAUTH_USERHEADER` | `Remote-User` (default) | HTTP header containing the username |
| `EnableUserEditing` | `ND_ENABLEUSEREDITING` | `false` | Prevent users from changing passwords (they log in via OAuth) |
| `SessionTimeout` | `ND_SESSIONTIMEOUT` | `48h` (default) | Navidrome's internal session lifetime |
| `AuthRequestLimit` | `ND_AUTHREQUESTLIMIT` | `5` (default) | Rate limit login attempts per IP |
| `AuthWindowLength` | `ND_AUTHWINDOWLENGTH` | `20s` (default) | Sliding window for rate limiting |

**User auto-creation behavior:**
- When Navidrome receives a request with a valid `Remote-User` header from a trusted source, it automatically creates the user in its SQLite database with a random password
- The **first user** created via external auth becomes an admin
- Subsequent users get standard (non-admin) permissions

**Important:** Set `TrustedSources` to only include the reverse proxy's IP. If set too broadly, any machine on the network could forge the `Remote-User` header and impersonate any user.

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
