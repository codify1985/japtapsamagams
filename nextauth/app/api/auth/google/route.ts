/**
 * GET /api/auth/google?callbackUrl=<encoded-url>
 *
 * Browser-friendly entry point for Google OAuth sign-in.
 *
 * Auth.js v5 requires a POST + CSRF token to initiate sign-in via the
 * standard /api/auth/signin/:provider endpoint. This route lets the
 * Navidrome login page trigger Google sign-in with a plain GET redirect,
 * by calling signIn() server-side (no CSRF needed here).
 *
 * Flow:
 *   1. Login.jsx redirects to GET /api/auth/google?callbackUrl=<page>
 *   2. Caddy proxies /api/auth/* → nextauth:3000
 *   3. This handler calls signIn("google", { redirectTo: callbackUrl })
 *   4. Auth.js returns a 302 → Google OAuth consent screen
 *   5. After consent → /api/auth/callback/google → session cookie set
 *   6. Auth.js redirects to callbackUrl (the original page)
 */

import { signIn } from '@/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  return signIn('google', { redirectTo: callbackUrl })
}
