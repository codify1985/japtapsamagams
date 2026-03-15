#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# Local Development Launcher — Navidrome + NextAuth.js + Caddy
# ─────────────────────────────────────────────────────────────────────
#
# Starts all services with hot-reload for local development:
#
#   1. Caddy        (Docker, port 80)  — reverse proxy
#   2. NextAuth.js  (port 3000)        — auth gateway (hot-reload via next dev)
#   3. Go backend   (port 4633)        — Navidrome server (hot-reload via reflex)
#   4. Vite frontend (port 8080)       — React UI (hot-reload via Vite HMR)
#
# Usage:
#   ./docs/localdev/start-localdev.sh          # start all services
#   ./docs/localdev/start-localdev.sh stop      # stop all services
#
# Access:
#   http://localhost        — full stack via Caddy (auth-aware)
#   http://localhost:8080   — Vite dev server (direct, bypasses auth)
#   http://localhost:4633   — Go backend (direct)
#   http://localhost:3000   — NextAuth.js (direct)
#
# Prerequisites:
#   - Go 1.24+, Node.js, npm, Docker
#   - Run 'make setup' once to install Go/Node dependencies
#   - Run 'cd nextauth && npm install' once to install NextAuth deps
#   - Copy nextauth/.env.example to nextauth/.env.local (set AUTH_SECRET)
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CADDY_CONTAINER="navidrome-localdev-caddy"
LOG_DIR="$PROJECT_ROOT/logs/localdev"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[localdev]${NC} $*"; }
warn() { echo -e "${YELLOW}[localdev]${NC} $*"; }
err()  { echo -e "${RED}[localdev]${NC} $*" >&2; }

# ── Stop all services ──────────────────────────────────────────────────
stop_all() {
    log "Stopping all local dev services..."

    # Stop Caddy container
    docker rm -f "$CADDY_CONTAINER" 2>/dev/null && log "Stopped Caddy" || true

    # Kill background processes by PID files
    for pidfile in "$LOG_DIR"/*.pid; do
        [ -f "$pidfile" ] || continue
        pid=$(cat "$pidfile")
        name=$(basename "$pidfile" .pid)
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null && log "Stopped $name (PID $pid)" || true
        fi
        rm -f "$pidfile"
    done

    # Also kill any orphaned processes from previous runs
    pkill -f "next dev.*nextauth" 2>/dev/null || true
    pkill -f "reflex -d none -c reflex.conf" 2>/dev/null || true
    pkill -f "vite --port 8080" 2>/dev/null || true

    log "All services stopped."
}

if [ "${1:-}" = "stop" ]; then
    stop_all
    exit 0
fi

# ── Pre-flight checks ─────────────────────────────────────────────────
cd "$PROJECT_ROOT"

mkdir -p "$LOG_DIR"

# Check dependencies
for cmd in go node npm docker; do
    command -v "$cmd" >/dev/null 2>&1 || { err "$cmd is required but not found"; exit 1; }
done

# Check NextAuth.js dependencies
if [ ! -d "$PROJECT_ROOT/nextauth/node_modules" ]; then
    warn "NextAuth.js dependencies not installed. Running npm install..."
    (cd "$PROJECT_ROOT/nextauth" && npm install)
fi

# Check NextAuth.js .env.local
if [ ! -f "$PROJECT_ROOT/nextauth/.env.local" ]; then
    warn "nextauth/.env.local not found. Creating from .env.example..."
    cp "$PROJECT_ROOT/nextauth/.env.example" "$PROJECT_ROOT/nextauth/.env.local"
    # Generate a random AUTH_SECRET
    SECRET=$(openssl rand -base64 33)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|your-random-secret-at-least-32-chars|$SECRET|" "$PROJECT_ROOT/nextauth/.env.local"
    else
        sed -i "s|your-random-secret-at-least-32-chars|$SECRET|" "$PROJECT_ROOT/nextauth/.env.local"
    fi
    warn "Generated AUTH_SECRET in nextauth/.env.local"
    warn "To enable Google OAuth, add AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to nextauth/.env.local"
fi

# Check UI dependencies
if [ ! -d "$PROJECT_ROOT/ui/node_modules" ]; then
    warn "UI dependencies not installed. Running npm install..."
    (cd "$PROJECT_ROOT/ui" && npm ci)
fi

# Stop any previous instances
stop_all 2>/dev/null || true

log "Starting local development environment..."
echo ""

# ── 1. Start Caddy (Docker) ───────────────────────────────────────────
log "Starting Caddy reverse proxy on ${CYAN}http://localhost${NC} ..."
docker run -d \
    --name "$CADDY_CONTAINER" \
    --add-host=host.docker.internal:host-gateway \
    -p 80:80 \
    -e DEFAULT_USER=japtaptest \
    -v "$SCRIPT_DIR/Caddyfile.localdev:/etc/caddy/Caddyfile:ro" \
    caddy:2-alpine \
    > /dev/null 2>&1
log "  Caddy running → ${CYAN}http://localhost${NC}"

# ── 2. Start NextAuth.js (hot-reload) ─────────────────────────────────
log "Starting NextAuth.js on port 3000..."
(
    cd "$PROJECT_ROOT/nextauth"
    AUTH_TRUST_HOST=true \
    AUTH_URL=http://localhost \
    npm run dev
) > "$LOG_DIR/nextauth.log" 2>&1 &
echo $! > "$LOG_DIR/nextauth.pid"
log "  NextAuth.js running → ${CYAN}http://localhost:3000${NC}  (log: logs/localdev/nextauth.log)"

# ── 3. Start Go backend (hot-reload via reflex) ───────────────────────
log "Starting Go backend on port 4633..."
(
    cd "$PROJECT_ROOT"
    ND_ENABLEINSIGHTSCOLLECTOR=false \
    ND_REVERSEPROXYWHITELIST="0.0.0.0/0,::/0" \
    ND_REVERSEPROXYUSERHEADER="Remote-User" \
    go tool reflex -d none -c reflex.conf
) > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$LOG_DIR/backend.pid"
log "  Go backend running → ${CYAN}http://localhost:4633${NC}  (log: logs/localdev/backend.log)"

# ── 4. Start Vite frontend (hot-reload via HMR) ───────────────────────
log "Starting Vite frontend on port 8080..."
(
    cd "$PROJECT_ROOT/ui"
    PORT=8080 BACKEND_PORT=4633 NEXTAUTH_PORT=3000 npm start
) > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$LOG_DIR/frontend.pid"
log "  Vite frontend running → ${CYAN}http://localhost:8080${NC}  (log: logs/localdev/frontend.log)"

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "All services started!"
echo ""
echo -e "  ${CYAN}http://localhost${NC}        Full stack (Caddy → NextAuth → Navidrome)"
echo -e "  ${CYAN}http://localhost:8080${NC}   Vite dev server (direct, hot-reload)"
echo -e "  ${CYAN}http://localhost:4633${NC}   Go backend (direct)"
echo -e "  ${CYAN}http://localhost:3000${NC}   NextAuth.js (direct)"
echo ""
echo -e "  Logs: ${YELLOW}logs/localdev/*.log${NC}"
echo -e "  Stop: ${YELLOW}./docs/localdev/start-localdev.sh stop${NC}"
echo -e "  Tail: ${YELLOW}tail -f logs/localdev/*.log${NC}"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
