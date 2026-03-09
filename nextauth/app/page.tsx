/**
 * Root page — redirects to the main Navidrome app.
 *
 * Users should never land here directly; Caddy routes all non-auth
 * requests to Navidrome. This is a safety fallback.
 */

import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/')
}
