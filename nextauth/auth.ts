/**
 * Auth.js v5 configuration for Japtap Samagams.
 *
 * Providers are ENVIRONMENT-VARIABLE-DRIVEN:
 *   - Set AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET   → Google appears on sign-in page
 *   - Set AUTH_FACEBOOK_ID + AUTH_FACEBOOK_SECRET → Facebook appears
 *   - Set AUTH_GITHUB_ID + AUTH_GITHUB_SECRET   → GitHub appears
 *
 * To add a new provider later, just set its env vars and restart — no code changes.
 *
 * Session strategy: JWT-only (no database needed).
 * The JWT stores user.email and user.name from the OAuth profile.
 * The /api/auth/caddy endpoint reads these from the JWT to set the
 * X-NextAuth-Username header that Caddy forwards as Remote-User to Navidrome.
 */

import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'

// Dynamically build providers array based on which env vars are present.
// Auth.js v5 auto-discovers AUTH_[PROVIDER]_ID and AUTH_[PROVIDER]_SECRET,
// but we explicitly check so the sign-in page only shows configured providers.
const providers: any[] = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Force consent screen to always show (ensures refresh token on re-auth)
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  )
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  )
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,

  // JWT-only sessions — no database required
  session: {
    strategy: 'jwt',
  },

  // trustHost must be true when behind a reverse proxy (Caddy)
  // so Auth.js trusts the X-Forwarded-Host header.
  // Can also be set via AUTH_TRUST_HOST=true env var.
  trustHost: true,

  callbacks: {
    /**
     * JWT callback — runs on every token creation and refresh.
     * On initial sign-in, persist email and name from the OAuth profile.
     * On subsequent requests, the token already has these fields.
     */
    async jwt({ token, profile }) {
      if (profile) {
        // First sign-in: copy profile data into the JWT
        token.email = profile.email as string
        token.name = profile.name as string
      }
      return token
    },

    /**
     * Session callback — controls what the client can see via useSession().
     * Not critical for our Caddy auth-check flow (which reads the JWT directly),
     * but useful if you ever need client-side session info.
     */
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string
      }
      if (token.name) {
        session.user.name = token.name as string
      }
      return session
    },
  },
})
