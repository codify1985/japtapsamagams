/**
 * Custom Caddy auth-check endpoint.
 *
 * Caddy makes a sub-request to this endpoint on every incoming request
 * via forward_auth. This replaces Authentik's auth endpoint.
 *
 * Flow:
 *   1. Caddy forwards the browser's Cookie header to this endpoint
 *   2. auth() reads the Auth.js session from the cookie
 *   3. If valid session → 200 + Remote-User header (user's email)
 *   4. If no session   → 401 (Caddy's handle_response injects Remote-User: japtaptest)
 *
 * Why auth() instead of getToken():
 *   On HTTPS, Auth.js names the session cookie __Secure-authjs.session-token.
 *   getToken() requires secureCookie: true to find it, but auth() handles
 *   the cookie name correctly on both HTTP and HTTPS automatically.
 *
 * Why Remote-User in the response header:
 *   The Caddyfile uses `copy_headers Remote-User` to copy this value from
 *   the auth response into the request sent to Navidrome.
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const GET = auth(function GET(req) {
  const email = req.auth?.user?.email

  if (email) {
    // Valid session — return 200 with Remote-User header.
    // Caddy's copy_headers directive copies Remote-User into the Navidrome request.
    return new NextResponse('OK', {
      status: 200,
      headers: {
        'Remote-User': email,
      },
    })
  }

  // No valid session — return 401.
  // Caddy's handle_response @unauthed block injects Remote-User: japtaptest.
  return new NextResponse('Unauthorized', { status: 401 })
})
