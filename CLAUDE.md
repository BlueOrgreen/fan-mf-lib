# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A pnpm monorepo for Module Federation utilities to dynamically load remote React/Vue components at runtime, with multi-version support, CDN failover, and lifecycle management.

**Published packages:**
- `@fan-scripts/fan-mf-runtime` (v1.0.3) - Core runtime loading library
- `@fan-scripts/react-adapter` (v1.0.1) - React adapter for loading remote components
- `@fan-scripts/vue-adapter` (v1.0.1) - Vue 3 adapter for loading React remote components

**Example apps:**
- `apps/test-mf-unpkg` - Remote component provider (React)
- `apps/host-react18-remote` - Host app consuming remote components (React)
- `apps/host-vue3-remote` - Host app consuming React components via Vue adapter

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build single package
pnpm --filter @fan-scripts/fan-mf-runtime build
pnpm --filter @fan-scripts/react-adapter build
pnpm --filter @fan-scripts/vue-adapter build

# Dev/watch mode
pnpm --filter @fan-scripts/fan-mf-runtime dev

# Run tests (fan-mf-runtime has 155+ unit tests)
pnpm --filter @fan-scripts/fan-mf-runtime test
pnpm --filter @fan-scripts/fan-mf-runtime test:watch
pnpm --filter @fan-scripts/fan-mf-runtime test --coverage

# Lint/format/check
pnpm lint          # All packages
pnpm format        # All packages
pnpm check         # All packages

# Package-specific
pnpm --filter @fan-scripts/fan-mf-runtime format
pnpm --filter @fan-scripts/fan-mf-runtime check

# Sync remote module types (generates @mf-types)
pnpm sync:types
pnpm sync:types:help

# Release workflow
pnpm changeset           # Create new changeset
pnpm changeset version   # Apply version changes
pnpm release.sh version  # Same as above
pnpm release.sh publish  # Publish to npm (requires NPM_TOKEN)
```

## Package Exports

**fan-mf-runtime**:
- Main: `@fan-scripts/fan-mf-runtime` → ESM/CJS + types
- Vue entry: `fan-mf-runtime/vue`
- React entry: `fan-mf-runtime/react`

**@fan-scripts/react-adapter**:
- Components: `RemoteModuleProvider`, `lazyRemote`
- Hooks: `useRemoteModuleHook`

**@fan-scripts/vue-adapter**:
- Components: `VueRemoteModuleProvider`
- Utils: `mountReactToGlobal`, `ReactComponentRenderer`

## Architecture

### Monorepo Structure

```
fan-mf-lib/
├── packages/
│   ├── fan-mf-runtime/    # Core library (published to npm)
│   │   ├── src/
│   │   │   ├── index.ts          # Main entry - re-exports all
│   │   │   ├── loader/           # loadRemoteMultiVersion
│   │   │   ├── preload/          # Preloading utilities
│   │   │   ├── unload/           # Unloading/cleanup
│   │   │   ├── health/           # Health check utilities
│   │   │   ├── version/          # Version parsing/compatibility
│   │   │   ├── event-bus/        # Cross-module event system
│   │   │   ├── plugins/          # Plugin system
│   │   │   ├── hooks/            # React hooks (useRemote, useRemoteList)
│   │   │   ├── shared-state/     # Shared context across modules
│   │   │   └── bridge/           # Bridge module (createLazyComponent, useLazyComponent, prefetchComponent)
│   │   ├── __tests__/            # Vitest tests
│   │   └── rslib.config.ts
│   ├── react-adapter/          # React adapter (published)
│   │   └── src/
│   │       ├── components/     # RemoteModuleProvider, lazyRemote
│   │       └── hooks/          # useRemoteModuleHook
│   └── vue-adapter/            # Vue adapter (published)
│       └── src/
│           ├── components/     # VueRemoteModuleProvider
│           ├── hooks/          # useVueRemoteModule
│           └── utils/          # mountReactToGlobal, ReactComponentRenderer
└── apps/
    ├── demo-bridge-provider/   # Bridge Provider Demo (port 3001)
    ├── demo-bridge-host/       # Bridge Host Demo (port 3002)
    ├── test-mf-unpkg/          # Remote component provider
    ├── host-react18-remote/    # React host consuming remotes
    └── host-vue3-remote/       # Vue host consuming React remotes
```

### Configuration Files

- `mf-types.config.json` - Remote module type generation config
- `.changeset/config.json` - Changesets versioning config
- `pnpm-workspace.yaml` - Workspace packages definition

### Key Technologies

- **Build:** Rslib (produces ESM + CJS with d.ts)
- **Runtime:** @module-federation/enhanced, @module-federation/bridge-react
- **Package manager:** pnpm workspace
- **Linting:** Biome
- **Testing:** Vitest + happy-dom
- **Versioning:** Changesets
- **Type Sync:** @module-federation/typescript

### Bridge Module (Core Feature)

The Bridge module provides lazy loading and prefetching for remote components:

- `createLazyComponent(options)` - Factory for creating lazy remote components
- `useLazyComponent(options)` - React hook for lazy loading
- `prefetchComponent(options)` - Prefetch remote component resources

### Core API Patterns

```typescript
// Core loading function
import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime'

const { scopeName, mf } = await loadRemoteMultiVersion({
  name: 'my_lib',
  pkg: '@myorg/remote-app',
  version: '1.0.0',  // or 'latest'
})

const mod = await mf.loadRemote(`${scopeName}/ComponentName`)

// React adapter
import { RemoteModuleProvider, lazyRemote } from '@fan-scripts/react-adapter'

// Vue adapter
import { mountReactToGlobal, VueRemoteModuleProvider } from '@fan-scripts/vue-adapter'

// Bridge - Lazy component
import { createLazyComponent, prefetchComponent } from '@fan-scripts/fan-mf-runtime'

const RemoteButton = createLazyComponent({
  loader: () => loadRemoteMultiVersion({...}),
  loading: <div>Loading...</div>,
  fallback: ({ error }) => <div>Error: {error.message}</div>,
})

// Prefetch component
prefetchComponent({
  id: 'remote/Button',
  preloadComponentResource: true,
})
```

### Build Configuration

All packages use `rslib.config.ts` with similar patterns:
- ESM + CJS output formats
- TypeScript declaration generation
- Bundle mode enabled
- Node 18 syntax target

### Testing

Tests located in `packages/fan-mf-runtime/__tests__/`:
- Run with Vitest + happy-dom (no JSDOM)
- Coverage reports available via `--coverage` flag
- Test remote loading, version management, event bus, health checks, bridge module

### Release Process

1. `pnpm changeset add` - Create changeset for changes
2. `pnpm changeset` - Review pending changesets
3. `pnpm release.sh version` - Apply versions and update changelogs
4. `pnpm release.sh publish` - Publish to npm (requires `NPM_TOKEN`)

Uses Changesets with git changelog, publishes to public npm registry.

### Running Demo Apps

```bash
# Bridge Demo (recommended for testing Bridge module)
cd apps/demo-bridge-host
pnpm dev:all  # Starts both Provider (3001) and Host (3002)

# Or start individually:
# Provider (port 3001)
cd apps/demo-bridge-provider && pnpm dev
# Host (port 3002)
cd apps/demo-bridge-host && pnpm dev

# Traditional MF examples
pnpm --filter test-mf-unpkg dev       # Remote component (3001)
pnpm --filter host-react18-remote dev # React host (3002)
pnpm --filter host-vue3-remote dev    # Vue host (3003)
```

## Development Notes

- **Current branch**: `main` - default branch for PRs
- **Release branches**: `release/v*` - auto-generated for npm releases
- **npm authentication**: Requires `NPM_TOKEN` env var for publishing
