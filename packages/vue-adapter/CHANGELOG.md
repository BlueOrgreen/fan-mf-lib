# Changelog

## 1.0.1

### Patch Changes

- Updated dependencies
  - fan-mf-runtime@1.0.3

## 1.0.0

### Patch Changes

- Updated dependencies [9306c65]
  - fan-mf-runtime@1.0.0

## 0.0.1 (2026-03-18)

### Features

- Initial release of @yunfan/vue-adapter
- Vue 3 adapter for loading React remote components via Module Federation
- `mountReactToGlobal` - Load React and ReactDOM from CDN to global window object
- `VueRemoteModuleProvider` - Vue component for loading and rendering React remote components
- `useVueRemoteModule` - Vue composable hook for loading React remote components
- `ReactComponentRenderer` - Vue component for rendering React components when you already have the component

### Usage

```bash
npm install @yunfan/vue-adapter fan-mf-runtime
```

```ts
// In main.ts
import { mountReactToGlobal } from "@yunfan/vue-adapter";
await mountReactToGlobal("18");

// In Vue component
import { VueRemoteModuleProvider } from "@yunfan/vue-adapter";
```

### License

MIT
