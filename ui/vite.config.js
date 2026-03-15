import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const frontendPort = parseInt(process.env.PORT) || 4533
// Allow overriding the backend proxy port explicitly; fallback to frontend+100
const backendPort = process.env.BACKEND_PORT
  ? parseInt(process.env.BACKEND_PORT)
  : frontendPort + 100
// NextAuth.js gateway port for /api/auth/* routes (local dev only)
const nextauthPort = process.env.NEXTAUTH_PORT
  ? parseInt(process.env.NEXTAUTH_PORT)
  : 3000

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: manifest(),
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
    },
  },
  optimizeDeps: {
    include: ['qrcode'],
  },
  server: {
    host: true,
    port: frontendPort,
    // Allow specific external hosts (e.g., Cloudflare tunneled domain) during dev
    // Set via ALLOWED_HOSTS env var as a comma-separated list
    allowedHosts: (process.env.ALLOWED_HOSTS || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean),
    // HMR: use WSS/443 when behind Cloudflare Tunnel, default (ws) for localhost
    ...(process.env.ALLOWED_HOSTS
      ? {
          hmr: {
            protocol: 'wss',
            clientPort: 443,
            timeout: 60000,
            overlay: true,
          },
        }
      : {}),
    proxy: {
      // NextAuth.js routes → NextAuth gateway (port 3000)
      '^/api/auth/.*': {
        target: 'http://localhost:' + nextauthPort,
      },
      // Everything else → Navidrome backend
      '^/(auth|api|rest|backgrounds)/.*': {
        target: 'http://localhost:' + backendPort,
        headers: {
          'Remote-User': 'japtaptest',
        },
      },
    },

  },
  base: './',
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    reporters: ['verbose'],
    // reporters: ['default', 'hanging-process'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [],
    },
  },
})

// PWA manifest
function manifest() {
  return {
    name: 'Navidrome',
    short_name: 'Navidrome',
    description:
      'Navidrome, an open source web-based music collection server and streamer',
    categories: ['music', 'entertainment'],
    display: 'standalone',
    start_url: './',
    background_color: 'white',
    theme_color: 'blue',
    icons: [
      {
        src: './android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: './android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
