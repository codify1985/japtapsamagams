import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const frontendPort = parseInt(process.env.PORT) || 4533
// Allow overriding the backend proxy port explicitly; fallback to frontend+100
const backendPort = process.env.BACKEND_PORT
  ? parseInt(process.env.BACKEND_PORT)
  : frontendPort + 100

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
    /// TODO: Review these 3 settings for security implications
    // TRY REMOVING THIS AND TEST  
    hmr: {
      protocol: 'wss',     // behind Tunnel/Cloudflare
      clientPort: 443,
      timeout: 60000,      // tolerate phone sleep
      overlay: true
    }, 
    proxy: {
      '^/(auth|api|rest|backgrounds)/.*': 'http://localhost:' + backendPort,
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
