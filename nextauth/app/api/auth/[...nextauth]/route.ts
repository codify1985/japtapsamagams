/**
 * Auth.js catch-all route handler.
 *
 * This single file handles ALL Auth.js endpoints:
 *   GET  /api/auth/signin          — Sign-in page (lists configured providers)
 *   POST /api/auth/signin/:provider — Initiates OAuth flow for a provider
 *   GET  /api/auth/callback/:provider — OAuth callback (Google, Facebook, GitHub)
 *   POST /api/auth/signout         — Sign-out (clears session cookie)
 *   GET  /api/auth/session         — Returns current session (JSON)
 *   GET  /api/auth/csrf            — Returns CSRF token
 *   GET  /api/auth/providers       — Returns list of configured providers
 */

import { handlers } from '@/auth'

export const { GET, POST } = handlers
