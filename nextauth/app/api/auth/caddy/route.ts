/**
 * Custom Caddy auth-check endpoint.
 *
 * Caddy makes a sub-request to this endpoint on every incoming request.
 * This replaces Authentik's /outpost.goauthentik.io/auth/caddy endpoint.
 *
 * Flow:
 *   1. Caddy sends the browser's cookies via header_up Cookie {http.request.header.Cookie}
 *   2. This endpoint decodes the Auth.js session JWT from the cookie
 *   3. If valid session → 200 + X-NextAuth-Username header (user's email)
 *   4. If no session   → 401 (Caddy's handle_response catch-all injects Remote-User: japtaptest)
 *
 * The getToken() function reads the Auth.js session cookie (authjs.session-token)
 * and verifies it using AUTH_SECRET. No database lookup needed (JWT-only strategy).
 */

import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function GET(request: Request) {
  try {
    // getToken reads the session JWT from cookies and verifies it with AUTH_SECRET.
    // We pass the raw request — Next.js extracts cookies automatically.
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    })

    if (token?.email) {
      // Valid session — return 200 with the username header.
      // Caddy's @authed branch copies this into Remote-User for Navidrome.
      return new NextResponse('OK', {
        status: 200,
        headers: {
          'X-NextAuth-Username': token.email as string,
        },
      })
    }

    // No valid session — return 401.
    // Caddy's catch-all branch injects Remote-User: japtaptest.
    return new NextResponse('Unauthorized', { status: 401 })
  } catch (error) {
    // Token decode failed — treat as unauthenticated.
    console.error('Auth check failed:', error)
    return new NextResponse('Unauthorized', { status: 401 })
  }
}
