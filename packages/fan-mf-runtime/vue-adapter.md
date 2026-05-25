# Vue Adapter 使用文档

`@fan-scripts/fan-mf-runtime` 的 Vue 适配器使 Vue 3 项目能够加载和使用 React 远程组件。

## 目录

- [简介](#简介)
- [安装](#安装)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [使用示例](#使用示例)
- [故障排查](#故障排查)

## 简介

Vue 适配器提供了以下功能：

- **将 React/ReactDOM 挂载到全局**: 使 React 远程组件可以在 Vue 项目中运行
- **Vue 组件**: `VueRemoteModuleProvider` 用于在模板中加载远程组件
- **Vue Hook**: `useVueRemoteModule` 用于在 Composition API 中加载远程组件
- **共享依赖管理**: 自动处理 React/ReactDOM 的共享配置

## 安装

```bash
pnpm add @fan-scripts/fan-mf-runtime vue
```

## 快速开始

### 1. 在入口文件中初始化 React

在 Vue 项目的入口文件（`main.ts`）中，首先将 React 挂载到全局：

```typescript
import { createApp } from 'vue'
import { mountReactToGlobal } from '@fan-scripts/fan-mf-runtime/vue'
import App from './App.vue'

// 异步初始化 React
async function bootstrap() {
  // 将 React 18 挂载到全局 window 对象
  await mountReactToGlobal('18')

  // 创建并挂载 Vue 应用
  createApp(App).mount('#app')
}

bootstrap()
```

### 2. 使用组件方式加载远程 React 组件

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/fan-mf-runtime/vue'

const handleLoad = (component) => {
  console.log('远程组件已加载:', component)
}

const handleError = (error) => {
  console.error('加载失败:', error)
}
</script>

<template>
  <VueRemoteModuleProvider
    pkg="my-react-components"
    version="1.0.0"
    moduleName="Button"
    scopeName="my_react_app"
    @load="handleLoad"
    @error="handleError"
  >
    <!-- 自定义加载状态 -->
    <template #loading>
      <div>加载中...</div>
    </template>

    <!-- 自定义错误状态 -->
    <template #error="{ error, retry }">
      <div>
        <p>加载失败：{{ error.message }}</p>
        <button @click="retry">重试</button>
      </div>
    </template>
  </VueRemoteModuleProvider>
</template>
```

### 3. 使用 Hook 方式加载远程 React 组件

```vue
<script setup lang="ts">
import { useVueRemoteModule } from '@fan-scripts/fan-mf-runtime/vue'

const { component, loading, error, retry } = useVueRemoteModule({
  pkg: 'my-react-components',
  version: '1.0.0',
  moduleName: 'Button',
  scopeName: 'my_react_app',
})

const handleLoad = (comp) => {
  console.log('组件加载成功:', comp)
}

const handleError = (err) => {
  console.error('组件加载失败:', err)
}
</script>

<template>
  <div>
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">
      <p>加载失败：{{ error.message }}</p>
      <button @click="retry">重试</button>
    </div>
    <component
      v-else-if="component"
      :is="component"
      @vue_mounted="handleLoad"
    />
  </div>
</template>
```

## API 参考

### mountReactToGlobal

将 React 和 ReactDOM 挂载到全局 window 对象。

```typescript
function mountReactToGlobal(version?: '17' | '18' | '19'): Promise<{
  React: any;
  ReactDOM: any;
}>
```

**参数**:
- `version`: React 版本号，默认为 `'18'`

**返回值**:
- Promise，resolve 后包含 React 和 ReactDOM 实例

**示例**:
```typescript
await mountReactToGlobal('18')
```

### hasGlobalReact

检查全局是否已有 React。

```typescript
function hasGlobalReact(): boolean
```

### getGlobalReactVersion

获取全局 React 版本。

```typescript
function getGlobalReactVersion(): string | undefined
```

### getGlobalReact / getGlobalReactDOM

获取全局 React/ReactDOM 实例。

```typescript
function getGlobalReact(): any
function getGlobalReactDOM(): any
```

### unmountReactFromGlobal

清除全局 React（用于测试或卸载）。

```typescript
function unmountReactFromGlobal(): void
```

### VueRemoteModuleProvider

Vue 组件，用于在模板中加载远程 React 组件。

**Props**:
| 属性 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `pkg` | `string` | ✅ | - | npm 包名 |
| `version` | `string` | ❌ | `'latest'` | 版本号 |
| `moduleName` | `string` | ✅ | - | 远程模块名称 |
| `scopeName` | `string` | ✅ | - | 作用域名称 |
| `loadingFallback` | `Component \| VNode` | ❌ | `null` | 加载占位 |
| `errorFallback` | `Component \| VNode` | ❌ | `null` | 错误占位 |
| `componentProps` | `object` | ❌ | `{}` | 传递给远程组件的 props |
| `className` | `string` | ❌ | `''` | 容器类名 |
| `style` | `object` | ❌ | `{}` | 容器样式 |

**Events**:
| 事件名 | 参数 | 描述 |
|--------|------|------|
| `load` | `(component: Component) => void` | 加载成功 |
| `error` | `(error: Error) => void` | 加载失败 |
| `ready` | `(scopeName: string, mf: ModuleFederationInstance) => void` | MF 实例就绪 |

**Slots**:
| 插槽名 | 作用域变量 | 描述 |
|--------|-----------|------|
| `loading` | - | 加载状态内容 |
| `error` | `{ error: Error, retry: () => void }` | 错误状态内容 |

### useVueRemoteModule

Vue Hook，用于在 Composition API 中加载远程组件。

```typescript
function useVueRemoteModule(options: UseVueRemoteModuleOptions): UseVueRemoteModuleResult
```

**Options**:
| 属性 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `pkg` | `string` | ✅ | npm 包名 |
| `version` | `string` | ✅ | 版本号 |
| `moduleName` | `string` | ✅ | 远程模块名称 |
| `scopeName` | `string` | ✅ | 作用域名称 |
| `onLoad` | `(component) => void` | ❌ | 加载成功回调 |
| `onError` | `(error) => void` | ❌ | 加载失败回调 |

**Returns**:
| 属性 | 类型 | 描述 |
|------|------|------|
| `loading` | `Ref<boolean>` | 是否正在加载 |
| `error` | `Ref<Error \| null>` | 错误信息 |
| `component` | `Ref<Component \| null>` | 加载的组件 |
| `retry` | `() => void` | 重试函数 |

## 使用示例

### 示例 1: 基础使用

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/fan-mf-runtime/vue'
</script>

<template>
  <VueRemoteModuleProvider
    pkg="my-react-components"
    version="1.0.0"
    moduleName="Button"
    scopeName="my_react_app"
  />
</template>
```

### 示例 2: 传递 props 给远程组件

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/fan-mf-runtime/vue'
</script>

<template>
  <VueRemoteModuleProvider
    pkg="my-react-components"
    version="1.0.0"
    moduleName="Card"
    scopeName="my_react_app"
    :component-props="{
      title: '我的卡片',
      content: '这是 React 远程组件',
      onClick: () => console.log('clicked!')
    }"
  />
</template>
```

### 示例 3: 多个远程组件

```vue
<script setup lang="ts">
import { VueRemoteModuleProvider } from '@fan-scripts/fan-mf-runtime/vue'
</script>

<template>
  <div>
    <VueRemoteModuleProvider
      pkg="my-react-components"
      version="1.0.0"
      moduleName="Button"
      scopeName="my_react_app"
    />

    <VueRemoteModuleProvider
      pkg="my-react-components"
      version="1.0.0"
      moduleName="Input"
      scopeName="my_react_app"
    />
  </div>
</template>
```

### 示例 4: Hook 方式

```vue
<script setup lang="ts">
import { useVueRemoteModule, mountReactToGlobal } from '@fan-scripts/fan-mf-runtime/vue'

const {
  component: Button,
  loading: buttonLoading,
  error: buttonError,
  retry: buttonRetry
} = useVueRemoteModule({
  pkg: 'my-react-components',
  version: '1.0.0',
  moduleName: 'Button',
  scopeName: 'my_react_app',
})

const {
  component: Input,
  loading: inputLoading,
  error: inputError,
  retry: inputRetry
} = useVueRemoteModule({
  pkg: 'my-react-components',
  version: '1.0.0',
  moduleName: 'Input',
  scopeName: 'my_react_app',
})
</script>

<template>
  <div>
    <div v-if="buttonLoading || inputLoading">加载中...</div>
    <div v-else>
      <component v-if="Button" :is="Button" />
      <component v-if="Input" :is="Input" />
    </div>
  </div>
</template>
```

### 示例 5: 在主项目中配置共享依赖

如果你的 Vue 主项目也需要共享 React 给其他远程模块：

```typescript
// vite.config.ts
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    federation({
      name: 'host-vue3-remote',
      shared: {
        vue: { singleton: true, requiredVersion: '^3.0.0' },
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
})
```

## 故障排查

### 1. React 未挂载到全局

**症状**: 控制台显示 `React is not defined` 或 `window.React is undefined`

**解决方案**:
```typescript
// 在 main.ts 中确保在创建 App 之前调用
await mountReactToGlobal('18')
```

### 2. 远程组件渲染错误

**症状**: 组件加载成功但渲染时报错

**解决方案**:
- 确认 React 版本兼容性
- 检查远程组件是否需要特定的 props
- 使用浏览器的开发者工具查看 React DevTools

### 3. Module Federation 加载失败

**症状**: 控制台显示 `[MF] 所有 CDN 加载失败`

**解决方案**:
- 检查网络连接
- 验证 remoteEntry.js URL 是否可访问
- 确认 scopeName 和 moduleName 正确

### 4. TypeScript 类型错误

**症状**: 找不到类型定义

**解决方案**:
```typescript
// 在 tsconfig.json 中添加
{
  "compilerOptions": {
    "types": ["vue"]
  }
}
```
