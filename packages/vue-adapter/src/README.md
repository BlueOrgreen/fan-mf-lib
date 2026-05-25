# Vue Adapter 使用文档

本文档对应 `@fan-scripts/vue-adapter` 源码目录，聚焦实际使用方式与常见接入场景。

## 适用场景

- Vue 3 项目需要直接消费 React 远程组件
- 同时存在 Vue 与 React 微前端，且希望统一由 Module Federation runtime 加载
- 需要在 Vue 中复用 React 组件能力（Button、Card、业务组件等）

## 导出能力

入口：`src/index.ts`

- `mountReactToGlobal`
- `hasGlobalReact`
- `getGlobalReactVersion`
- `getGlobalReact`
- `getGlobalReactDOM`
- `unmountReactFromGlobal`
- `createReactComponentRenderer`
- `VueRemoteModuleProvider`
- `useVueRemoteModule`
- `ReactComponentRenderer`

## 推荐接入步骤

### 1. 入口挂载 React（必须）

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

### 2. 组件模式：`VueRemoteModuleProvider`

适合模板中直接接入，默认封装了“加载 -> 错误 -> 成功渲染”完整流程。

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/vue-adapter'

const handleLoad = (component: any) => {
  console.log('远程组件加载成功:', component)
}

const handleError = (error: Error) => {
  console.error('远程组件加载失败:', error)
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
      children: '示例1内容'
    }"
    class-name="remote-module-container"
    @load="handleLoad"
    @error="handleError"
  >
    <template #loading>
      <div>正在加载远程 Card...</div>
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

### 3. Hook 模式：`useVueRemoteModule` + `ReactComponentRenderer`

适合你需要自己掌控加载状态、日志、埋点或组合多个远程组件的场景。

```vue
<script setup lang="ts">
import {
  useVueRemoteModule,
  ReactComponentRenderer,
} from '@fan-scripts/vue-adapter'

const {
  component: RemoteButton,
  loading: buttonLoading,
  error: buttonError,
  mf: buttonMf,
  retry: buttonRetry,
} = useVueRemoteModule({
  pkg: 'test-mf-unpkg',
  version: '1.0.7',
  moduleName: 'Button',
  scopeName: 'fan_mf_lib',
})
</script>

<template>
  <div v-if="buttonLoading">Button 加载中...</div>

  <div v-else-if="buttonError">
    <p>{{ buttonError.message }}</p>
    <button @click="buttonRetry">重试</button>
  </div>

  <ReactComponentRenderer
    v-else-if="RemoteButton"
    :component="RemoteButton"
    :mf="buttonMf"
    :component-props="{ children: 'Remote Button' }"
  />
</template>
```

## 与示例应用一一对应

示例文件：`apps/host-vue3-remote/src/App.vue`

`VueRemoteModuleProvider` 对照关系：

| App.vue 用法 | 说明 |
|---|---|
| `class-name="remote-module-container"` | Vue 模板用 `kebab-case`，对应内部 prop `className` |
| `:component-props="{ ..., children: '示例1内容' }"` | 透传给 React 远程组件的 props |
| `@load` / `@error` / `@ready` | 加载成功、加载失败、runtime 就绪回调 |
| `#loading` | 自定义加载态 UI |
| `#error="{ error, retry }"` | 自定义错误态 UI，并可调用 `retry` 重试 |

如果遇到“`@load` 已触发但界面没显示”的情况，优先检查：

- 是否使用了最新的 `@fan-scripts/vue-adapter`
- `moduleName` 导出是否真的是 React 组件
- `children` 等 props 是否在远程组件中被实际渲染
- 是否在 `main.ts` 执行了 `await mountReactToGlobal('18')`

## 关键参数说明

### `VueRemoteModuleProvider` / `useVueRemoteModule`

- `pkg`：npm 包名
- `version`：包版本（支持具体版本、范围或 `latest`）
- `moduleName`：远程导出模块名（例如 `Card`、`Button`）
- `scopeName`：Module Federation scope 名称

### `componentProps`

传给远程 React 组件的 props。  
例如传 `children`：

```ts
{
  children: '示例内容'
}
```

前提是远程组件实现里要消费 `children`，否则不会展示。

## 常见问题排查

### 1. 远程组件已加载成功，但页面不显示

- 确认 `moduleName` 导出确实是 React 组件
- 确认已执行 `mountReactToGlobal`
- 确认 `componentProps` 中传入的字段被远程组件消费

### 2. `retry` 不生效

- Provider 模式：使用 `#error` 作用域里的 `retry`
- Hook 模式：使用 `useVueRemoteModule` 返回的 `retry()`

### 3. 只显示 loading，不进入成功态

- 检查网络请求（CDN、remoteEntry、模块文件）
- 检查 `scopeName/moduleName` 拼接是否与远程配置一致

## 代码参考

- `src/VueRemoteModuleProvider.ts`
- `src/useVueRemoteModule.ts`
- `src/ReactComponentRenderer.ts`
- `src/mountReactToGlobal.ts`
