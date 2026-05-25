# Rslib project

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Build the library:

```bash
pnpm build
```

Build the library in watch mode:

```bash
pnpm dev
```

### 使用方式

#### 1. 基础加载远程模块

```ts
import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime';
const [comp, setComp] = useState(null);
useEffect(() => {
  async function init() {
    const { scopeName, mf } = await loadRemoteMultiVersion({
      name: 'fan_mf_lib',
      pkg: 'test-mf-unpkg',
      version: '1.0.5',
      // version: 'latest',
    });
    if (!mf) {
      return;
    }
    if (mf) {
      console.log(mf);
      const mod = await mf.loadRemote(`${scopeName}/Button`);
      console.log(mod.default); // 这里就是远程组件
      setComp(mod.default);
    }
    // 用 mf 实例加载暴露的模块
    // const mod = await mf.loadRemote(`${scopeName}/Button`);
    // const mod = await mf.loadRemote(`fan_mf_lib/Button`);
    // console.log(mod.default);
  }
  init();
}, []);
```

#### 本地调试

本地开发时，可以使用 `localDebug` 配置直接加载本地运行的远程组件服务：

```ts
import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime';

const { scopeName, mf } = await loadRemoteMultiVersion({
  name: 'fan_mf_lib',
  pkg: 'test-mf-unpkg',
  version: '1.0.0',
  localDebug: {
    enabled: true,
    entry: 'http://localhost:3001/remoteEntry.js',
  },
});

const mod = await mf.loadRemote(`${scopeName}/Button`);
```

#### 2. 使用 React 组件加载远程模块

```tsx
import { RemoteModuleProvider, ErrorBoundary, lazyRemote } from '@fan-scripts/fan-mf-runtime';
import React, { Suspense } from 'react';

// 方式一：使用 RemoteModuleProvider 组件（推荐）
function App() {
  return (
    <RemoteModuleProvider
      pkg="@myorg/remote-app"
      version="^1.0.0"
      moduleName="Dashboard"
      scopeName="myorg"
      loadingFallback={<Spinner />}
      errorFallback={(error, reset) => (
        <div>
          <p>加载失败：{error.message}</p>
          <button onClick={reset}>重试</button>
        </div>
      )}
      componentProps={{ userId: 123 }}
    />
  );
}

// 方式二：使用 lazy + Suspense
const LazyDashboard = lazyRemote({
  pkg: "@myorg/remote-app",
  version: "^1.0.0",
  moduleName: "Dashboard",
  scopeName: "myorg"
});

function App() {
  return (
    <ErrorBoundary fallback={(error) => <div>错误：{error.message}</div>}>
      <Suspense fallback={<Spinner />}>
        <LazyDashboard userId={123} />
      </Suspense>
    </ErrorBoundary>
  );
}

// 方式三：使用 SuspenseRemoteLoader（一体化方案）
function App() {
  return (
    <SuspenseRemoteLoader
      pkg="@myorg/remote-app"
      version="^1.0.0"
      moduleName="Dashboard"
      scopeName="myorg"
      fallback={<Spinner />}
      errorFallback={(error) => <div>错误：{error.message}</div>}
      componentProps={{ userId: 123 }}
    />
  );
}
```

#### 3. Bridge 模块 - 懒加载远程组件

Bridge 模块提供了 Module Federation 的懒加载组件功能，基于 `@module-federation/bridge-react`。

##### 基本使用

```tsx
import {
  createLazyLoadComponentPlugin,
  createLazyComponent,
  loadRemoteMultiVersion,
} from '@fan-scripts/fan-mf-runtime'
import { getInstance } from '@module-federation/runtime'

// 1. 注册插件
const instance = getInstance()
instance.registerPlugins([createLazyLoadComponentPlugin()])

// 2. 创建懒加载组件
const RemoteButton = createLazyComponent({
  loader: () => loadRemoteMultiVersion({
    name: 'remote',
    pkg: '@org/remote-components',
    version: '1.0.0',
  }),
  loading: <div>Loading...</div>,
  fallback: ({ error }) => <div>Error: {error.message}</div>,
})

// 3. 使用组件
function App() {
  return (
    <div>
      <RemoteButton onClick={() => console.log('clicked')} />
    </div>
  )
}
```

##### 使用 Hook

```tsx
import { useLazyComponent, loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime'

function MyComponent() {
  const { loading, error, Component } = useLazyComponent({
    loader: () => loadRemoteMultiVersion({
      name: 'remote',
      pkg: '@org/remote-components',
      version: '1.0.0',
    }),
    loading: <div>Loading...</div>,
    fallback: ({ error }) => <div>Error: {error.message}</div>,
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!Component) return null

  return <Component />
}
```

##### 预加载组件

```tsx
import { prefetchComponent } from '@fan-scripts/fan-mf-runtime'

// 在用户可能需要的地方预加载
prefetchComponent({
  id: 'remote/Component',
  preloadComponentResource: true,
})
```

##### API 参考

**`createLazyLoadComponentPlugin(options?)`**

创建并返回懒加载组件插件，注册后可以使用 `createLazyComponent` 和 `prefetchComponent`。

**`createLazyComponent(options)`**

创建懒加载 React 组件。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| loader | `() => Promise<T>` | 是 | - | 加载远程组件的函数 |
| loading | `ReactNode` | 是 | - | 加载中的占位内容 |
| fallback | `(errorInfo) => ReactNode` | 是 | - | 加载或渲染失败时的容错组件 |
| delayLoading | `number` | 否 | - | 延迟显示 loading 的时间（毫秒） |
| export | `string` | 否 | `'default'` | 指定导出的组件名称 |
| dataFetchParams | `unknown` | 否 | - | 传递给数据获取函数的参数 |
| noSSR | `boolean` | 否 | `false` | 是否禁用 SSR |
| injectScript | `boolean` | 否 | `false` | SSR 时是否注入 script 标签 |
| injectLink | `boolean` | 否 | `true` | SSR 时是否注入 link 标签 |

**`useLazyComponent(options)`**

React Hook 用于懒加载远程组件，返回 `{ loading, error, Component }`。

**`prefetchComponent(options)`**

预加载远程组件资源和数据。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | `string` | 是 | - | 预加载组件的 id |
| preloadComponentResource | `boolean` | 否 | `false` | 是否预加载组件资源文件 |
| dataFetchParams | `unknown` | 否 | - | 传递给数据获取函数的参数 |
