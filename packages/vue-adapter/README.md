# @fan-scripts/vue-adapter

在 Vue 3 项目中加载并渲染 React 远程组件（Module Federation）。

`@fan-scripts/vue-adapter` 基于 `@fan-scripts/fan-mf-runtime`，提供三种能力：

- 将 React/ReactDOM 挂载到全局 `window`
- 用 `VueRemoteModuleProvider` 直接在模板里加载远程 React 组件
- 用 `useVueRemoteModule + ReactComponentRenderer` 在 Composition API 中更细粒度控制加载流程

文档入口：

- 中文（包文档）：[README.md](./README.md)
- 中文（源码文档）：[src/README.md](./src/README.md)
- English: [README.en.md](./README.en.md)

## 安装

```bash
pnpm add @fan-scripts/vue-adapter @fan-scripts/fan-mf-runtime
```

## 快速开始

### 1. 在入口文件挂载 React

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { mountReactToGlobal } from '@fan-scripts/vue-adapter'

async function bootstrap() {
  await mountReactToGlobal('18')
  createApp(App).mount('#app')
}

bootstrap()
```

### 2. 组件方式（推荐用于模板直接接入）

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/vue-adapter'

const handleLoad = (component: any) => {
  console.log('远程组件已加载:', component)
}

const handleError = (error: Error) => {
  console.error('加载失败:', error)
}
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
      children: '示例内容'
    }"
    class-name="remote-module-container"
    @load="handleLoad"
    @error="handleError"
  >
    <template #loading>
      <div>正在加载远程组件...</div>
    </template>

    <template #error="{ error, retry }">
      <div>
        <p>加载失败：{{ error.message }}</p>
        <button @click="retry">重试</button>
      </div>
    </template>
  </VueRemoteModuleProvider>
</template>
```

### 3. Hook 方式（推荐用于复杂状态控制）

```vue
<script setup lang="ts">
import {
  useVueRemoteModule,
  ReactComponentRenderer,
} from '@fan-scripts/vue-adapter'

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
  <div v-if="loading">加载中...</div>

  <div v-else-if="error">
    <p>加载失败：{{ error.message }}</p>
    <button @click="retry">重试</button>
  </div>

  <ReactComponentRenderer
    v-else-if="RemoteButton"
    :component="RemoteButton"
    :mf="mf"
    :component-props="{ children: 'Click Me' }"
  />
</template>
```

## 与 `host-vue3-remote/src/App.vue` 对照

如果你直接参考示例应用，可对照：
`apps/host-vue3-remote/src/App.vue`

示例 1（Provider 模式）：

```vue
<VueRemoteModuleProvider
  pkg="test-mf-unpkg"
  version="1.0.7"
  moduleName="Card"
  scopeName="fan_mf_lib"
  :component-props="{
    title: 'Card Title',
    subtitle: 'From VueRemoteModuleProvider',
    children: '示例1内容'
  }"
  class-name="remote-module-container"
  @load="handleLoad"
  @error="handleError"
  @ready="handleReady"
>
  <template #loading>
    <div class="loading-state">正在加载远程 React Card 组件...</div>
  </template>

  <template #error="{ error, retry }">
    <div class="error-state">
      <span>加载失败：{{ error.message }}</span>
      <button @click="retry">重试</button>
    </div>
  </template>
</VueRemoteModuleProvider>
```

关键点：

- `class-name` 是模板写法，对应组件内部 prop `className`
- `#loading` 和 `#error` 插槽用于自定义加载/错误 UI
- `#error` 会注入 `{ error, retry }`
- `@ready` 可拿到 `(scopeName, mf)`，方便调试 runtime
- `children` 需要远程组件自身消费（例如 React 组件里渲染 `{children}`）

## API 概览

### `mountReactToGlobal(version?)`

- 作用：从 CDN 加载 React/ReactDOM 并挂载到 `window`
- 支持版本：`'17' | '18' | '19'`
- 返回：`Promise<{ React: any; ReactDOM: any }>`

### `VueRemoteModuleProvider`

常用 Props：

| Prop | 类型 | 必填 | 默认值 |
|---|---|---|---|
| `pkg` | `string` | 是 | - |
| `version` | `string` | 否 | `'latest'` |
| `moduleName` | `string` | 是 | - |
| `scopeName` | `string` | 是 | - |
| `componentProps` | `Record<string, any>` | 否 | `{}` |
| `className` | `string` | 否 | `''` |
| `style` | `Record<string, any>` | 否 | `{}` |
| `loadingFallback` | `Component \| VNode \| () => VNode` | 否 | `null` |
| `errorFallback` | `Component \| VNode \| (error, retry) => VNode` | 否 | `null` |

Events：

- `load(component)`
- `error(error)`
- `ready(scopeName, mf)`

Slots：

- `#loading`
- `#error="{ error, retry }"`

### `useVueRemoteModule(options)`

入参：

- `pkg`、`version`、`moduleName`、`scopeName`
- `onLoad?: (component) => void`
- `onError?: (error) => void`

返回：

- `component`：远程 React 组件
- `loading`：加载状态
- `error`：错误状态
- `mf`：当前 MF runtime 实例
- `scopeName`：已解析 scope
- `retry()`：重新加载

### `ReactComponentRenderer`

当你已经拿到 React 组件时，用它负责最终挂载渲染。

常用 Props：

- `component`（必填）
- `componentProps`
- `mf`（可选，建议传入，便于优先使用同 runtime 的 shared React）
- `className`
- `style`

## 常见问题

### 1. 远程模块已加载，但页面没显示组件

- 确认使用最新版本 `@fan-scripts/vue-adapter`
- 确认传入的 `moduleName` 对应导出是 React 组件（函数组件/类组件）
- 确认远程组件确实消费了你传入的 props（例如 `children`）

### 2. 控制台提示 React/ReactDOM 不存在

- 必须在 `createApp(...).mount(...)` 前先执行 `await mountReactToGlobal(...)`
- 检查网络是否可访问 React CDN

### 3. `retry` 点击后没有重新加载

- 使用 `VueRemoteModuleProvider` 的 `#error` 插槽时，调用插槽参数里的 `retry`
- 使用 Hook 方式时，调用返回值里的 `retry()`

## License

MIT
