# Bridge Module Demo

这个 demo 展示了如何使用 `fan-mf-runtime` 的 Bridge 模块来懒加载远程 React 组件。

## 项目结构

```
apps/
├── demo-bridge-provider/   # 远程组件提供者 (端口 3001)
│   └── src/
│       ├── RemoteButton.tsx    # 远程 Button 组件
│       └── RemoteCard.tsx      # 远程 Card 组件
└── demo-bridge-host/       # 宿主应用 (端口 3002)
    └── src/
        └── App.tsx             # 使用 Bridge 模块加载远程组件
```

## 启动步骤

### 方式 1：同时启动两个应用（推荐）

在宿主应用目录下执行：

```bash
cd apps/demo-bridge-host
pnpm dev:all
```

这将自动先启动 Provider 应用，等待 3 秒后启动 Host 应用。两个应用都会在终端显示输出，按 `Ctrl+C` 停止所有服务。

### 方式 2.1：启动 Provider 应用

```bash
cd apps/demo-bridge-provider
pnpm dev
```

Provider 应用将在 http://localhost:3001 启动

### 方式 2.2：启动 Host 应用

```bash
cd apps/demo-bridge-host
pnpm dev
```

Host 应用将在 http://localhost:3002 启动

## 使用的 Bridge API

### 1. createLazyLoadComponentPlugin

```typescript
import { createLazyLoadComponentPlugin } from 'fan-mf-runtime'
import { getInstance } from '@module-federation/enhanced/runtime'

const instance = getInstance()
instance.registerPlugins([createLazyLoadComponentPlugin()])
```

### 2. createLazyComponent

```typescript
import { createLazyComponent, loadRemoteMultiVersion } from 'fan-mf-runtime'

const RemoteButton = createLazyComponent({
  loader: () => loadRemoteMultiVersion({
    name: 'demo_provider',
    pkg: 'demo-bridge-provider',
    version: '1.0.0',
  }).then(({ mf }) => mf!.loadRemote('demo_provider/RemoteButton')),
  loading: <div>Loading...</div>,
  fallback: ({ error }) => <div>Error: {error.message}</div>,
})
```

### 3. prefetchComponent

```typescript
import { prefetchComponent } from 'fan-mf-runtime'

prefetchComponent({
  id: 'demo_provider/RemoteButton',
  preloadComponentResource: true,
})
```

## 功能特性

- ✅ `createLazyLoadComponentPlugin` 注册
- ✅ `prefetchComponent` 预加载远程组件
- ✅ `createLazyComponent` 创建懒加载组件
- ✅ `loadRemoteMultiVersion` 多版本加载集成
- ✅ 错误处理和 fallback 支持
- ✅ TypeScript 类型支持

## 验证步骤

1. 打开浏览器访问 http://localhost:3002
2. 应该看到 "Bridge Module Demo - Host App" 页面
3. RemoteButton 组件应该正常渲染并可点击
4. RemoteCard 组件应该正常显示
5. 所有功能列表项应显示绿色对勾

## 故障排除

### RemoteButton 显示 "Loading..."

- 确认 Provider 应用在 http://localhost:3001 运行
- 检查浏览器控制台是否有错误信息
- 确认 `remoteEntry.js` 可以访问：http://localhost:3001/remoteEntry.js

### 类型错误

- 运行 `pnpm build` 在 `packages/fan-mf-runtime` 中
- 确保 `fan-mf-runtime` 已正确链接
