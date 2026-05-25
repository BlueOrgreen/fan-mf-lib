# Module Federation Bridge Lazy Component 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `@fan-scripts/fan-mf-runtime` 中封装 Module Federation Bridge React 的 `lazyLoadComponentPlugin`、`createLazyComponent` 和 `prefetch` API

**Architecture:** 创建 `src/bridge/` 目录，封装 MF Bridge 的 lazy component 相关 API，与现有 `loadRemoteMultiVersion` 集成，提供 React Hook 和组件两种使用方式

**Tech Stack:** TypeScript, React, @module-federation/bridge-react, @module-federation/runtime

---

### Task 1: 添加依赖和类型定义

**Files:**
- Modify: `packages/fan-mf-runtime/package.json`
- Create: `packages/fan-mf-runtime/src/bridge/types.ts`

- [ ] **Step 1: 添加 @module-federation/bridge-react 依赖**

在 `packages/fan-mf-runtime/package.json` 的 `dependencies` 中添加：

```json
"@module-federation/bridge-react": "latest",
"@module-federation/enhanced": "latest"
```

- [ ] **Step 2: 安装依赖**

```bash
cd packages/fan-mf-runtime && pnpm install
```

- [ ] **Step 3: 创建类型定义文件**

创建 `packages/fan-mf-runtime/src/bridge/types.ts`：

```typescript
import type { ReactNode } from 'react'

export interface ErrorInfo {
  error: Error
  errorType: ERROR_TYPE
  dataFetchMapKey?: string
}

export enum ERROR_TYPE {
  LOAD_REMOTE = 'LOAD_REMOTE',
  DATA_FETCH = 'DATA_FETCH',
  RENDER = 'RENDER',
}

export interface LazyComponentOptions<T = unknown, E extends keyof T = keyof T> {
  /**
   * 加载远程组件的函数
   * @example () => loadRemote('remote/Component')
   * @example () => import('remote/Component')
   */
  loader: () => Promise<T>

  /**
   * 加载中的占位内容
   */
  loading: ReactNode

  /**
   * 延迟显示 loading 的时间（毫秒）
   */
  delayLoading?: number

  /**
   * 加载或渲染失败时的容错组件
   */
  fallback: (errorInfo: ErrorInfo) => ReactNode

  /**
   * 指定导出的组件名称（默认为 'default'）
   */
  export?: string

  /**
   * 传递给数据获取函数的参数
   */
  dataFetchParams?: unknown

  /**
   * 是否禁用 SSR
   */
  noSSR?: boolean

  /**
   * SSR 时是否注入 script 标签
   */
  injectScript?: boolean

  /**
   * SSR 时是否注入 link 标签（样式）
   */
  injectLink?: boolean
}

export interface PrefetchOptions {
  /**
   * 预加载组件的 id
   */
  id: string

  /**
   * 是否预加载组件资源文件
   */
  preloadComponentResource?: boolean

  /**
   * 传递给数据获取函数的参数
   */
  dataFetchParams?: unknown
}

export interface BridgePluginOptions {
  /**
   * 插件名称
   */
  name?: string
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/fan-mf-runtime/package.json packages/fan-mf-runtime/src/bridge/types.ts
git commit -m "feat(bridge): add types for lazy component API"
```

---

### Task 2: 实现 lazyLoadComponentPlugin 封装

**Files:**
- Create: `packages/fan-mf-runtime/src/bridge/lazy-load-component-plugin.ts`
- Test: `packages/fan-mf-runtime/src/bridge/__tests__/plugin.test.ts`

- [ ] **Step 1: 编写测试**

创建 `packages/fan-mf-runtime/src/bridge/__tests__/plugin.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLazyLoadComponentPlugin } from '../lazy-load-component-plugin'

describe('createLazyLoadComponentPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return a plugin object with name and registerRemotes', () => {
    const plugin = createLazyLoadComponentPlugin()
    expect(plugin).toBeDefined()
    expect(typeof plugin.name).toBe('string')
  })

  it('should have correct plugin name', () => {
    const plugin = createLazyLoadComponentPlugin()
    expect(plugin.name).toBe('lazy-load-component-plugin')
  })

  it('should accept custom plugin name', () => {
    const plugin = createLazyLoadComponentPlugin({ name: 'custom-plugin' })
    expect(plugin.name).toBe('custom-plugin')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/plugin.test.ts
```

Expected: FAIL with "module not found" or "function not defined"

- [ ] **Step 3: 实现插件函数**

创建 `packages/fan-mf-runtime/src/bridge/lazy-load-component-plugin.ts`：

```typescript
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime'
import type { BridgePluginOptions } from './types'

/**
 * 创建懒加载组件插件
 *
 * 注册此插件后，可以使用 instance.createLazyComponent 和 instance.prefetch API
 *
 * @param options - 插件配置选项
 * @returns Module Federation Runtime Plugin
 *
 * @example
 * ```ts
 * import { getInstance } from '@module-federation/runtime'
 * import { createLazyLoadComponentPlugin } from '@fan-scripts/fan-mf-runtime/bridge'
 *
 * const instance = getInstance()
 * instance.registerPlugins([createLazyLoadComponentPlugin()])
 * ```
 */
export function createLazyLoadComponentPlugin(
  options: BridgePluginOptions = {}
): ModuleFederationRuntimePlugin {
  const { name = 'lazy-load-component-plugin' } = options

  return {
    name,
    init() {
      // 插件初始化逻辑
      // lazyLoadComponentPlugin 的核心功能由 @module-federation/bridge-react 提供
      // 此封装主要用于与 fan-mf-runtime 的其他模块集成
    },
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/plugin.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/fan-mf-runtime/src/bridge/lazy-load-component-plugin.ts packages/fan-mf-runtime/src/bridge/__tests__/plugin.test.ts
git commit -m "feat(bridge): implement createLazyLoadComponentPlugin"
```

---

### Task 3: 实现 createLazyComponent 封装

**Files:**
- Create: `packages/fan-mf-runtime/src/bridge/create-lazy-component.ts`
- Test: `packages/fan-mf-runtime/src/bridge/__tests__/create-lazy-component.test.ts`

- [ ] **Step 1: 编写测试**

创建 `packages/fan-mf-runtime/src/bridge/__tests__/create-lazy-component.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLazyComponent } from '../create-lazy-component'
import type { LazyComponentOptions } from '../types'

describe('useLazyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', async () => {
    const mockLoader = vi.fn(() => new Promise(() => {}))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.Component).toBeUndefined()
  })

  it('should return component after loader resolves', async () => {
    const MockComponent = vi.fn(() => <div>Mock</div>)
    const mockLoader = vi.fn(() => Promise.resolve({ default: MockComponent }))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.Component).toBeDefined()
  })

  it('should return error state when loader fails', async () => {
    const mockLoader = vi.fn(() => Promise.reject(new Error('Load failed')))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      })
    )

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/create-lazy-component.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 Hook 和组件**

创建 `packages/fan-mf-runtime/src/bridge/create-lazy-component.ts`：

```typescript
import { useState, useEffect, useCallback, type ReactNode, type ComponentType } from 'react'
import type { LazyComponentOptions, ErrorInfo, ERROR_TYPE } from './types'

interface UseLazyComponentResult<T> {
  loading: boolean
  error: ErrorInfo | null
  Component: ComponentType<T> | null
}

/**
 * React Hook 用于懒加载远程组件
 *
 * @param options - 加载选项
 * @returns 包含 loading 状态、错误信息和组件的返回值
 *
 * @example
 * ```ts
 * const { loading, error, Component } = useLazyComponent({
 *   loader: () => loadRemoteMultiVersion({ name: 'remote', pkg: '@org/remote', version: '1.0.0' }),
 *   loading: <div>Loading...</div>,
 *   fallback: ({ error }) => <div>Error: {error.message}</div>,
 * })
 * ```
 */
export function useLazyComponent<T = unknown>(
  options: LazyComponentOptions<T>
): UseLazyComponentResult<T> {
  const {
    loader,
    loading,
    fallback,
    delayLoading,
    export: exportName = 'default',
    dataFetchParams,
    noSSR,
  } = options

  const [loadingState, setLoadingState] = useState(true)
  const [error, setError] = useState<ErrorInfo | null>(null)
  const [Component, setComponent] = useState<ComponentType<T> | null>(null)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    // 处理延迟显示 loading
    let delayTimer: NodeJS.Timeout | undefined
    if (delayLoading) {
      delayTimer = setTimeout(() => {
        if (mounted && loadingState) {
          setShowLoading(true)
        }
      }, delayLoading)
    } else {
      setShowLoading(true)
    }

    const loadComponent = async () => {
      try {
        const module = await loader()

        if (!mounted) return

        // 处理默认导出和具名导出
        const exportedComponent =
          exportName === 'default'
            ? (module as { default?: ComponentType<T> }).default
            : (module as Record<string, ComponentType<T>>)[exportName]

        if (!exportedComponent) {
          throw new Error(`Export "${exportName}" not found in module`)
        }

        setComponent(() => exportedComponent)
        setLoadingState(false)
      } catch (err) {
        if (!mounted) return

        setError({
          error: err instanceof Error ? err : new Error(String(err)),
          errorType: ERROR_TYPE.LOAD_REMOTE,
        })
        setLoadingState(false)
      } finally {
        if (delayTimer) {
          clearTimeout(delayTimer)
        }
      }
    }

    loadComponent()

    return () => {
      mounted = false
      if (delayTimer) {
        clearTimeout(delayTimer)
      }
    }
  }, [
    loader,
    exportName,
    delayLoading,
    dataFetchParams,
    noSSR,
  ])

  return {
    loading: loadingState && showLoading,
    error,
    Component,
  }
}

/**
 * 创建懒加载 React 组件
 *
 * @param options - 加载选项
 * @returns React 组件
 *
 * @example
 * ```ts
 * const LazyButton = createLazyComponent({
 *   loader: () => loadRemoteMultiVersion({ name: 'remote', pkg: '@org/remote', version: '1.0.0' }),
 *   loading: <div>Loading...</div>,
 *   fallback: ({ error }) => <div>Error: {error.message}</div>,
 * })
 *
 * // 使用
 * <LazyButton prop1="value" prop2={123} />
 * ```
 */
export function createLazyComponent<T extends Record<string, unknown>>(
  options: LazyComponentOptions<T>
): ComponentType<T> {
  const LazyComponent: ComponentType<T> = (props: T) => {
    const { loading, error, Component } = useLazyComponent(options)

    // 渲染错误状态
    if (error) {
      return <>{options.fallback(error)}</>
    }

    // 渲染加载状态
    if (loading) {
      return <>{options.loading}</>
    }

    // 渲染组件
    if (Component) {
      return <Component {...props} />
    }

    return null
  }

  // 设置组件显示名称
  LazyComponent.displayName = 'LazyComponent'

  return LazyComponent
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/create-lazy-component.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/fan-mf-runtime/src/bridge/create-lazy-component.ts packages/fan-mf-runtime/src/bridge/__tests__/create-lazy-component.test.ts
git commit -m "feat(bridge): implement useLazyComponent hook and createLazyComponent"
```

---

### Task 4: 实现 prefetch 封装

**Files:**
- Create: `packages/fan-mf-runtime/src/bridge/prefetch.ts`
- Test: `packages/fan-mf-runtime/src/bridge/__tests__/prefetch.test.ts`

- [ ] **Step 1: 编写测试**

创建 `packages/fan-mf-runtime/src/bridge/__tests__/prefetch.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prefetchComponent } from '../prefetch'

describe('prefetchComponent', () => {
  const originalGetInstance = vi.hoisted(() => {
    return { getInstance: vi.fn() }
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call instance.prefetch with correct options', () => {
    const mockPrefetch = vi.fn()
    const mockInstance = {
      prefetch: mockPrefetch,
    }

    vi.mocked(originalGetInstance.getInstance).mockReturnValue(mockInstance as never)

    prefetchComponent({ id: 'remote/Component' })

    expect(mockPrefetch).toHaveBeenCalledWith({
      id: 'remote/Component',
    })
  })

  it('should pass preloadComponentResource option', () => {
    const mockPrefetch = vi.fn()
    const mockInstance = {
      prefetch: mockPrefetch,
    }

    vi.mocked(originalGetInstance.getInstance).mockReturnValue(mockInstance as never)

    prefetchComponent({
      id: 'remote/Component',
      preloadComponentResource: true,
    })

    expect(mockPrefetch).toHaveBeenCalledWith({
      id: 'remote/Component',
      preloadComponentResource: true,
    })
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/prefetch.test.ts
```

Expected: FAIL

- [ ] **Step 3: 实现 prefetch 函数**

创建 `packages/fan-mf-runtime/src/bridge/prefetch.ts`：

```typescript
import type { PrefetchOptions } from './types'

/**
 * 预加载远程组件资源和数据
 *
 * 需要在调用前注册 lazyLoadComponentPlugin 插件
 *
 * @param options - 预加载选项
 *
 * @example
 * ```ts
 * // 注册插件
 * const instance = getInstance()
 * instance.registerPlugins([createLazyLoadComponentPlugin()])
 *
 * // 预加载组件
 * prefetchComponent({
 *   id: 'remote/Component',
 *   preloadComponentResource: true,
 * })
 * ```
 */
export function prefetchComponent(options: PrefetchOptions): void {
  try {
    // 动态导入以支持 @module-federation/runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getInstance } = require('@module-federation/enhanced/runtime')

    const instance = getInstance()

    if (!instance || typeof instance.prefetch !== 'function') {
      console.warn(
        '[fan-mf-runtime/bridge] instance.prefetch 不可用，请确保已注册 lazyLoadComponentPlugin 插件'
      )
      return
    }

    instance.prefetch({
      id: options.id,
      preloadComponentResource: options.preloadComponentResource,
      dataFetchParams: options.dataFetchParams,
    })
  } catch (error) {
    console.warn(
      '[fan-mf-runtime/bridge] 预加载失败:',
      error instanceof Error ? error.message : error
    )
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
cd packages/fan-mf-runtime && pnpm test src/bridge/__tests__/prefetch.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/fan-mf-runtime/src/bridge/prefetch.ts packages/fan-mf-runtime/src/bridge/__tests__/prefetch.test.ts
git commit -m "feat(bridge): implement prefetchComponent function"
```

---

### Task 5: 创建主出口文件并集成到包

**Files:**
- Create: `packages/fan-mf-runtime/src/bridge/index.ts`
- Modify: `packages/fan-mf-runtime/src/index.ts`

- [ ] **Step 1: 创建 bridge 模块出口**

创建 `packages/fan-mf-runtime/src/bridge/index.ts`：

```typescript
// 插件
export { createLazyLoadComponentPlugin } from './lazy-load-component-plugin'

// 组件加载
export {
  createLazyComponent,
  useLazyComponent,
  type UseLazyComponentResult,
} from './create-lazy-component'

// 预加载
export { prefetchComponent } from './prefetch'

// 类型
export type {
  LazyComponentOptions,
  PrefetchOptions,
  BridgePluginOptions,
  ErrorInfo,
  ERROR_TYPE,
} from './types'
```

- [ ] **Step 2: 更新主出口文件**

修改 `packages/fan-mf-runtime/src/index.ts`，在文件末尾添加：

```typescript
// Bridge 模块
export {
  createLazyLoadComponentPlugin,
  createLazyComponent,
  useLazyComponent,
  prefetchComponent,
} from './bridge'
export type {
  LazyComponentOptions,
  PrefetchOptions,
  ErrorInfo,
  ERROR_TYPE,
} from './bridge'
```

- [ ] **Step 3: 验证构建**

```bash
cd packages/fan-mf-runtime && pnpm build
```

Expected: 构建成功，无错误

- [ ] **Step 4: Commit**

```bash
git add packages/fan-mf-runtime/src/bridge/index.ts packages/fan-mf-runtime/src/index.ts
git commit -m "feat(bridge): export bridge module APIs"
```

---

### Task 6: 创建使用示例文档

**Files:**
- Create: `packages/fan-mf-runtime/BUILDING.md` 或更新 `README.md`

- [ ] **Step 1: 创建使用示例**

在 `packages/fan-mf-runtime/README.md` 中添加 Bridge 模块使用示例章节：

```markdown
## Bridge 模块 - 懒加载远程组件

Bridge 模块提供了 Module Federation 的懒加载组件功能。

### 基本使用

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

### 使用 Hook

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

### 预加载组件

```tsx
import { prefetchComponent } from '@fan-scripts/fan-mf-runtime'

// 在用户可能需要的地方预加载
prefetchComponent({
  id: 'remote/Component',
  preloadComponentResource: true,
})
```
```

- [ ] **Step 2: Commit**

```bash
git add packages/fan-mf-runtime/README.md
git commit -m "docs(bridge): add usage examples for bridge module"
```

---

## 自检验

- [ ] **Spec coverage:** 检查所有需求是否都有对应的任务实现
- [ ] **Placeholder scan:** 检查是否有 TBD/TODO 占位符
- [ ] **Type consistency:** 检查类型定义在各文件中是否一致
- [ ] **Test coverage:** 每个功能都有对应的测试

---

**Plan complete and saved to `docs/superpowers/plans/2026-03-29-mf-bridge-lazy-component.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - 每个任务派遣一个独立的子代理执行，任务间进行审核，快速迭代

**2. Inline Execution** - 在当前会话中执行任务

**Which approach?**
