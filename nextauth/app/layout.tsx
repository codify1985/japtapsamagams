/**
 * Root layout for the NextAuth.js app.
 *
 * This is a minimal layout — the NextAuth.js app is a headless auth gateway,
 * not a user-facing UI. The only visible page is the default Auth.js sign-in
 * page at /api/auth/signin, which Auth.js renders automatically.
 */

export const metadata = {
  title: 'Japtap Samagams — Sign In',
  description: 'Authentication gateway for Japtap Samagams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
