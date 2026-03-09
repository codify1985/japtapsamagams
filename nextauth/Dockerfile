# ─────────────────────────────────────────────────
# Multi-stage Dockerfile for the NextAuth.js gateway
# Produces a minimal standalone image (~50 MB).
#
# Build:
#   docker build -t nextauth-gateway ./nextauth
#
# Run (requires env vars — see .env.example):
#   docker run -p 3000:3000 --env-file .env nextauth-gateway
# ─────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build the Next.js app ──────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.js has output: 'standalone' — produces a self-contained build
RUN npm run build

# ── Stage 3: Production image ───────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build (includes server + dependencies)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
