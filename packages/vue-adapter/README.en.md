# @yunfan/vue-adapter

Load and render React remote components in Vue 3 (via Module Federation).

This package is built on top of `fan-mf-runtime` and provides:

- Global React/ReactDOM mounting to `window`
- `VueRemoteModuleProvider` for template-first usage
- `useVueRemoteModule + ReactComponentRenderer` for composition-style control

## Install

```bash
pnpm add @yunfan/vue-adapter fan-mf-runtime
```

## Quick Start

### 1. Mount React globally in `main.ts`

```ts
import { createApp } from 'vue'
import App from './App.vue'
import { mountReactToGlobal } from '@yunfan/vue-adapter'

async function bootstrap() {
  await mountReactToGlobal('18')
  createApp(App).mount('#app')
}

bootstrap()
```

### 2. Provider mode (template-first)

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@yunfan/vue-adapter'
</script>

<template>
  <VueRemoteModuleProvider
    pkg="test-mf-unpkg"
    version="1.0.7"
    moduleName="Card"
    scopeName="fan_mf_lib"
    :component-props="{
      title: 'Card Title',
      subtitle: 'From VueRemoteModuleProvider',
      children: 'Example Content'
    }"
    class-name="remote-module-container"
  >
    <template #loading>
      <div>Loading remote component...</div>
    </template>

    <template #error="{ error, retry }">
      <div>
        <p>{{ error.message }}</p>
        <button @click="retry">Retry</button>
      </div>
    </template>
  </VueRemoteModuleProvider>
</template>
```

### 3. Hook mode (state-first)

```vue
<script setup lang="ts">
import {
  useVueRemoteModule,
  ReactComponentRenderer,
} from '@yunfan/vue-adapter'

const {
  component: RemoteButton,
  loading,
  error,
  mf,
  retry,
} = useVueRemoteModule({
  pkg: 'test-mf-unpkg',
  version: '1.0.7',
  moduleName: 'Button',
  scopeName: 'fan_mf_lib',
})
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">
    <p>{{ error.message }}</p>
    <button @click="retry">Retry</button>
  </div>
  <ReactComponentRenderer
    v-else-if="RemoteButton"
    :component="RemoteButton"
    :mf="mf"
    :component-props="{ children: 'Remote Button' }"
  />
</template>
```

## API Summary

### `mountReactToGlobal(version?)`

- Loads React and ReactDOM from CDN
- Supported versions: `'17' | '18' | '19'`
- Returns: `Promise<{ React: any; ReactDOM: any }>`

### `VueRemoteModuleProvider`

Common props:

- `pkg`, `version`, `moduleName`, `scopeName`
- `componentProps`
- `className`, `style`
- `loadingFallback`, `errorFallback`

Events:

- `load(component)`
- `error(error)`
- `ready(scopeName, mf)`

Slots:

- `#loading`
- `#error="{ error, retry }"`

### `useVueRemoteModule(options)`

Input:

- `pkg`, `version`, `moduleName`, `scopeName`
- `onLoad?`, `onError?`

Return:

- `component`, `loading`, `error`, `mf`, `scopeName`, `retry()`

### `ReactComponentRenderer`

Use this when you already have a React component and only need mounting/rendering in Vue.

## Notes

- `children` is only visible when the remote React component actually renders it.
- In Vue templates, use `class-name`; it maps to `className` prop internally.
- Call `await mountReactToGlobal(...)` before `createApp(...).mount(...)`.

## Docs

- Chinese package doc: [README.md](./README.md)
- Chinese source doc: [src/README.md](./src/README.md)
