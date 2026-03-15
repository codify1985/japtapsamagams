# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Navidrome is an open-source, self-hosted music server and streamer written in Go (backend) and React (frontend). It provides:
- A web-based music player with Material-UI interface
- Subsonic API v1.16.1 compatibility for third-party clients
- Multi-user support with individual libraries and preferences
- A WASM-based plugin system for extensibility
- Automatic library scanning and metadata enrichment

**Technology Stack:**
- **Backend:** Go 1.24.5, Chi router, SQLite3 with Goose migrations
- **Frontend:** React 17, React-Admin 3.19.12, Material-UI 4, Vite bundler
- **DI:** Google Wire (compile-time dependency injection)
- **Data Access:** Repository pattern with PocketBase DBX and Squirrel query builder
- **Plugins:** WebAssembly with Wazero runtime

## Development Commands

### Initial Setup
```bash
make setup              # Install all dependencies (Go, Node, golangci-lint)
make download-deps      # Download Go dependencies only
make setup-git          # Install Git pre-commit and pre-push hooks
```

### Development Mode
```bash
make dev                # Start both frontend (port 8080) and backend (port 4633) with hot-reload
                        # Uses foreman with Procfile.dev

make server             # Start only backend with hot-reload (requires frontend to be built)
make stop               # Stop all development servers (vite and reflex)
```

### Building
```bash
make build              # Build production binary (includes frontend assets)
make buildjs            # Build only frontend assets (ui/build/)
make debug-build        # Build with debugging symbols (for remote debugging)
```

### Testing
```bash
make test               # Run Go tests with -tags netgo
make test PKG=./server  # Run tests for specific package
make test-race          # Run tests with race detector
make testall            # Run all tests (Go + JS + translations)
make test-js            # Run frontend tests (Vitest)
make watch              # Run Go tests in watch mode (auto re-run on changes)
```

### Linting and Formatting
```bash
make lint               # Lint Go code with golangci-lint
make lintall            # Lint both Go and JS code
make format             # Format code (Prettier for JS, goimports for Go)
```

### Database Migrations
```bash
make migration-sql name=add_feature    # Create new SQL migration
make migration-go name=add_feature     # Create new Go migration
```

### Dependency Injection
```bash
make wire               # Regenerate Wire dependency injection code
                        # Run after modifying providers or injectors
```

### Plugins
```bash
make plugin-gen         # Generate Go code from plugin protobuf definitions
make plugin-examples    # Build all example plugins
make plugin-tests       # Build test plugins
make plugin-clean       # Clean plugin build artifacts
```

### Cross-compilation and Packaging
```bash
make docker-platforms   # List all supported platforms
make docker-build       # Cross-compile for platforms specified in PLATFORMS variable
                        # Example: make PLATFORMS="linux/amd64,darwin/arm64" docker-build
make docker-image       # Build Docker image with IMAGE_PLATFORMS variable
make package            # Create binaries and packages for all platforms
```

### Running with Docker
```bash
make run-docker tag=deluan/navidrome:develop    # Run a Docker image locally
                                                 # Mounts navidrome.toml if present
```

## Development Workflow

### Frontend Development
- Frontend code lives in `/ui/src/`
- Uses Vite for development server and building
- In development mode, Vite runs on port 8080 and proxies API requests to backend on port 4633
- Vite proxies paths matching `^/(auth|api|rest|backgrounds)/.*` — the `/auth` prefix is reserved for the NextAuth.js gateway in production
- Frontend commands (from `/ui/` directory):
  ```bash
  npm start              # Start Vite dev server
  npm run build          # Build production bundle
  npm run test           # Run tests
  npm run lint           # Lint code
  npm run prettier       # Format code
  ```

### Backend Development
- Main entry point: `main.go` (uses `cmd.Execute()`)
- All Go code must be compiled with `-tags netgo` build tag (enforced in `main.go`)
- Hot-reload in development uses `reflex` (configured in `reflex.conf`)
- Backend watches: `*.go`, `*.cpp`, `*.h`, `*.wasm`, `navidrome.toml`, `resources/`, `token_received.html`

### Configuration
- Configuration file: `navidrome.toml` (or environment variables with `ND_` prefix)
- Development settings can be configured via `navidrome.toml` in the repo root
- Key dev settings:
  - `Port`: Server port (default: 4533, this repo uses 4633)
  - `LogLevel`: Set to "debug" for verbose logs
  - `DevAutoCreateAdminPassword`: Auto-create admin user
  - `DevAutoLoginUsername`: Auto-login in dev mode
  - `MusicFolder`: Path to music library
  - `DataFolder`: Path to database and cache

### Testing Guidelines
- Always run tests with `-tags netgo`
- Use table-driven tests for multiple scenarios
- Repository tests should use in-memory SQLite (`:memory:`)
- Frontend tests use Vitest with happy-dom

### Git Workflow
- Branch naming: `<Issue Title>/<Issue Number>` (e.g., `adding-docs/834`)
- Commit format: `<type>(scope): <description> - <issue number>`
  - Types: feat, fix, sec, docs, style, refactor, perf, test, build, revert, chore
  - Add `--signoff` to all commits (DCO sign-off required)
  - Example: `git commit --signoff -m "feat(themes): New-theme - #834"`
- Pre-commit hooks run linting, pre-push hooks run all tests

## Architecture

### Project Structure

```
/cmd                   Entry points and CLI commands (Cobra-based)
/core                  Business logic (agents, auth, ffmpeg, scrobbler, etc.)
  /agents             Metadata agents (LastFM, Spotify, Deezer, ListenBrainz)
  /artwork            Album art management and caching
  /auth               Authentication and authorization
  /ffmpeg             FFmpeg transcoding integration
  /lyrics             Lyrics fetching and caching
  /scrobbler          Play tracking and scrobble buffering
/server                HTTP server and API routers
  /subsonic           Subsonic API v1.16.1 compatible endpoints
  /nativeapi          Navidrome-specific REST API
  /events             Server-Sent Events (SSE) for real-time updates
/persistence           Data access layer (repository pattern)
/scanner              Library scanning with multi-phase pipeline
/plugins              WASM plugin system with host capabilities
/model                Domain models and interfaces
/db                   Database initialization and Goose migrations
/conf                 Configuration management (Viper)
/ui                   React frontend
  /src/dataProvider  REST API client
  /src/audioplayer   Music player components
  /src/album         Album browsing and display
  /src/artist        Artist browsing and display
/nextauth              Next.js 15 + Auth.js v5 SSO authentication gateway (port 3000)
                       Provides Google OAuth and other SSO for Navidrome via reverse proxy
/deploy                Production Docker Compose configurations
  docker-compose-caddy.yml    Caddy + Authentik production stack
  docker-compose-local.yml    Local testing stack (Caddy + Authentik, no TLS)
  caddy/                      Caddyfile configurations
/contrib               Community deployment configs
  docker-compose/     Variant docker-compose setups (vouch-nginx, traefik)
  k8s/               Kubernetes manifests
  navidrome.service  systemd service file
/docs/Authentication   Auth implementation guides and roadmap
```

### Dependency Injection with Wire

Navidrome uses **Google Wire** for compile-time dependency injection:
- Provider sets defined in `*/wire_providers.go` files
- Injectors defined in `/cmd/wire_injectors.go`
- Generated code in `/cmd/wire_gen.go` (committed to repo)
- **After modifying providers or injectors, run `make wire`**

Example provider:
```go
var Set = wire.NewSet(
    NewService,
    wire.Bind(new(Service), new(*serviceImpl)),
)
```

### Repository Pattern

All data access goes through repositories implementing interfaces defined in `/model/`:
- Main interface: `model.DataStore` (repository factory)
- Implementations in `/persistence/*_repository.go`
- Supports transactions via `WithTx()` and `WithTxImmediate()`
- Uses PocketBase DBX for query building and Squirrel for SQL construction

Example usage:
```go
ctx := request.NewContext(r.Context())
albums, err := ds.Album(ctx).GetAll(options)

// With transaction
err := ds.WithTx(func(tx model.DataStore) error {
    return tx.Album(ctx).Put(album)
})
```

### Multi-Phase Scanner

Library scanning uses a pipeline-based approach with 4 phases:
1. **Phase 1:** Walk directory tree, detect folder changes
2. **Phase 2:** Import new media files, detect deletions
3. **Phase 3:** Refresh album metadata (calls external agents/plugins)
4. **Phase 4:** Import and refresh playlists

Uses Google Pipeline (`github.com/google/go-pipeline`) for parallelization.

### Plugin System

Plugins are WebAssembly binaries providing extended functionality:
- **Capabilities:** MetadataAgent, Scrobbler, SchedulerCallback, WebSocketCallback
- **Runtime:** Wazero (pure Go WASM runtime)
- **Host API:** Exposed via protobuf-defined interfaces
- **Discovery:** Scans plugin directory for manifest files
- **Pool:** Instance pooling for concurrent execution

Plugin development guide: `/plugins/README.md`

### Event-Driven Updates

Real-time updates use Server-Sent Events (SSE):
- Event broker in `/server/events/`
- Event types: `ScanStatus`, `RefreshResource`, `NowPlayingCount`, `ServerStart`
- Clients subscribe via `/api/events` endpoint

### API Architecture

Navidrome serves two APIs from the same backend:
1. **Native API** (`/api/*`): REST API using react-admin conventions
2. **Subsonic API** (`/rest/*`): Subsonic v1.16.1 compatible (XML/JSON responses)

Both APIs share the same DataStore and business logic layer.

### Authentication Architecture (Phase 1 - Active Development)

This repo is implementing SSO authentication via an external auth gateway. The current branch (`dev-gs/phase1-authentication-changes`) adds:

- **`/nextauth`** - Standalone Next.js 15 app using Auth.js v5 (`next-auth@5`) as an OAuth/SSO gateway
  - Runs on port 3000; sits between the client and Navidrome
  - Dev: `npm run dev` from `/nextauth/`; Prod: `npm start`
  - `AUTH_TRUST_HOST=true` is **required** when deployed behind a reverse proxy (Caddy, Nginx, etc.)
- **Deployment options** (see `/docs/Authentication/Options/`):
  - **Option 1 (Primary):** Caddy + Authentik — configs in `/deploy/` and `/deploy/caddy/`
  - **Option 2:** Caddy + NextAuth.js gateway — configs in `/nextauth/` + `/deploy/`
  - **Option 3:** Vouch Proxy + Nginx — configs in `/contrib/docker-compose/vouch-nginx/`
- **Local testing:** Use `/contrib/docker-compose/vouch-nginx/docker-compose-local.yml` or `/deploy/docker-compose-local.yml`
  - Vouch config at `vouch-config-local.yml`: add allowed email domains to `vouch.domains` list; `AUTH_TRUST_HOST=true` in `.env`

## Key Implementation Notes

### The `netgo` Build Tag

All Go code **must** be compiled with `-tags netgo`. This is enforced in `main.go`:
```go
_ = buildtags.NETGO  // Compilation fails without -tags netgo
```

The Makefile handles this automatically, but if running `go` commands directly, always include `-tags netgo`.

### Context and Request Context

Use `request.NewContext(r.Context())` to create a context with user info:
```go
ctx := request.NewContext(r.Context())
user := request.UserFrom(ctx)
```

### Middleware Stack

The server uses Chi router with a comprehensive middleware stack:
- Security headers
- CORS handling
- Request ID tracking
- JWT verification
- Panic recovery
- Gzip compression
- Real IP detection

Custom middleware should be added to `defaultMiddlewares` in `/server/app.go`.

### Database Pragmas

SQLite is configured with:
- `foreign_keys=on` - Referential integrity
- `journal_mode=WAL` - Write-Ahead Logging for concurrency
- `busy_timeout=5000` - 5s timeout for locked database

Connection pool size = CPU count (minimum 4).

### Commit Conventions

Follow the commit format defined in CONTRIBUTING.md:
```
<type>(scope): <description> - <issue number>

[optional body]
```

Always include DCO sign-off: `git commit --signoff`

### Frontend Data Provider

The frontend uses a custom data provider in `/ui/src/dataProvider/` that:
- Handles authentication (JWT tokens)
- Formats requests for the Native API
- Transforms responses for react-admin
- Manages refresh tokens

### Translation Files

Translations are managed via POEditor and stored in `/resources/i18n/`.
Frontend translations are in `/ui/src/i18n/`.

Run `make test-i18n` to validate translation files before committing.

## Common Development Tasks

### Adding a New API Endpoint

1. Define repository methods in `/model/*_repository.go` (interface)
2. Implement in `/persistence/*_repository.go`
3. Add to DataStore interface in `/model/datastore.go`
4. For Native API: Add route in `/server/nativeapi/`
5. For Subsonic API: Add handler in `/server/subsonic/`
6. Update Wire providers if new dependencies needed
7. Add tests

### Adding a Migration

```bash
make migration-sql name=add_user_preferences
# Edit the generated file in db/migrations/
# Migration runs automatically on next server start
```

### Adding Configuration Options

1. Add field to config struct in `/conf/configuration.go`
2. Add default value and validation
3. Document in `/docs/content/docs/usage/configuration-options.md`
4. Update `navidrome.toml.example` if applicable

### Modifying the Scanner

Scanner logic is in `/scanner/`:
- Modify `phase_*.go` files for each scanning phase
- Update `metadata.go` for metadata extraction
- Modify `walk.go` for directory walking logic
- Changes to scanner often require running `make wire`

### Creating a Plugin

1. Read `/plugins/README.md` and `/plugins/examples/`
2. Implement plugin in any WASM-compatible language
3. Export required capability functions
4. Create manifest file
5. Compile to WASM
6. Place in plugins directory (configurable via `PluginsPath`)

### Frontend Component Development

1. Components go in `/ui/src/<domain>/` (e.g., `/ui/src/album/`)
2. Follow react-admin patterns (List, Show, Edit components)
3. Use Material-UI components
4. Connect to data via react-admin hooks (`useDataProvider`, `useGetOne`, etc.)
5. Add translations to `/ui/src/i18n/<lang>.json`

## Useful Debugging Techniques

### Enabling Debug Logs
Set `LogLevel = "debug"` in `navidrome.toml` or `ND_LOGLEVEL=debug` environment variable.

### Debugging with Delve
```bash
make debug-build      # Build with debug symbols
dlv exec ./navidrome  # Debug with Delve
```

### Frontend Debugging
Use browser DevTools. React DevTools extension recommended.

### Database Inspection
```bash
sqlite3 data/navidrome.db
sqlite> .tables
sqlite> .schema album
sqlite> SELECT * FROM album LIMIT 10;
```

### Profiling
The backend includes pprof endpoints when running in debug mode:
- `http://localhost:4633/debug/pprof/`

### Testing Subsonic API
Use `curl` or a Subsonic client:
```bash
curl "http://localhost:4633/rest/ping?u=demo&p=demo&f=json&v=1.16.1&c=test"
```

## External Documentation

- Main docs: https://www.navidrome.org/docs
- Subsonic API: https://www.navidrome.org/docs/developers/subsonic-api/
- Development setup: https://www.navidrome.org/docs/developers/dev-environment/
- Plugin development: https://www.navidrome.org/docs/developers/plugins/
