/**
 * GET /api/auth/logout?callbackUrl=<encoded-url>
 *
 * Browser-friendly entry point for sign-out.
 *
 * Auth.js v5 requires a POST + CSRF token to sign out via the standard
 * /api/auth/signout endpoint. This route lets authProvider.js trigger
 * sign-out with a plain GET redirect, by calling signOut() server-side.
 *
 * Flow:
 *   1. authProvider.js redirects to GET /api/auth/logout?callbackUrl=<page>
 *   2. Caddy proxies /api/auth/* → nextauth:3000
 *   3. This handler calls signOut({ redirectTo: callbackUrl })
 *   4. Auth.js clears the session cookie and redirects to callbackUrl
 *   5. Browser lands on /app/#/login (the callbackUrl set by authProvider.js)
 */

import { signOut } from '@/auth'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  return signOut({ redirectTo: callbackUrl })
}
