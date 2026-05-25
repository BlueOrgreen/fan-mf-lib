import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime'
import React, {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { ErrorBoundary } from './ErrorBoundary'

export interface LazyRemoteOptions {
  /** 包名称 */
  pkg: string
  /** 版本号 */
  version?: string
  /** 模块名称 */
  moduleName: string
  /** 作用域名称 */
  scopeName: string
  /** 加载失败时的最大重试次数 */
  maxRetries?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
}

export interface SuspenseRemoteProps {
  /** 加载中的占位内容 */
  fallback?: ReactNode
  children: ReactNode
}

export interface SuspenseRemoteWithPropsProps extends LazyRemoteOptions {
  /** 加载中的占位内容 */
  fallback?: ReactNode
  /** 错误状态的占位内容 */
  errorFallback?: ReactNode | ((error: Error) => ReactNode)
  /** 传递给远程组件的 props */
  componentProps?: Record<string, any>
}

/**
 * 创建一个惰性加载的远程组件
 * 返回一个可用于 React.lazy() 的 Promise
 *
 * @example
 * ```tsx
 * const LazyDashboard = lazyRemote({
 *   pkg: "@myorg/remote-app",
 *   version: "^1.0.0",
 *   moduleName: "Dashboard",
 *   scopeName: "myorg"
 * });
 *
 * function App() {
 *   return (
 *     <Suspense fallback={<Spinner />}>
 *       <LazyDashboard userId={123} />
 *     </Suspense>
 *   );
 * }
 * ```
 */
export function lazyRemote(options: LazyRemoteOptions) {
  const {
    pkg,
    version = 'latest',
    moduleName,
    scopeName,
    maxRetries = 3,
    retryDelay = 1000,
  } = options

  let retryCount = 0

  const loadComponent = async (): Promise<{ default: ComponentType<any> }> => {
    try {
      const { mf } = await loadRemoteMultiVersion(
        {
          name: scopeName,
          pkg,
          version,
        },
        [],
      )

      if (!mf) {
        throw new Error(
          `[RemoteReloadUtils] Failed to get Module Federation instance for ${scopeName}`,
        )
      }

      const mod = await mf.loadRemote(`${scopeName}/${moduleName}`)

      if (!mod || typeof mod !== 'object' || !('default' in mod)) {
        throw new Error(
          `[RemoteReloadUtils] Module "${scopeName}/${moduleName}" does not export a default component`,
        )
      }

      return { default: mod.default as ComponentType<any> }
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * retryCount),
        )
        return loadComponent()
      }
      throw error
    }
  }

  return lazy(loadComponent)
}

/**
 * 带 Suspense 和错误处理的远程组件包装器
 * 注意：错误处理需要与 ErrorBoundary 配合使用
 *
 * @example
 * ```tsx
 * // 与 ErrorBoundary 配合使用
 * <ErrorBoundary fallback={(error) => <div>Error: {error.message}</div>}>
 *   <SuspenseRemote fallback={<Spinner />}>
 *     <RemoteModuleProvider pkg="@myorg/remote-app" version="^1.0.0" moduleName="Dashboard" scopeName="myorg" />
 *   </SuspenseRemote>
 * </ErrorBoundary>
 * ```
 */
export function SuspenseRemote({
  fallback,
  children,
}: {
  fallback?: ReactNode
  children: ReactNode
}) {
  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>{children}</Suspense>
  )
}

/**
 * 一体化的远程组件加载器（包含 Suspense 和 ErrorBoundary）
 *
 * @example
 * ```tsx
 * <SuspenseRemoteLoader
 *   pkg="@myorg/remote-app"
 *   version="^1.0.0"
 *   moduleName="Dashboard"
 *   scopeName="myorg"
 *   fallback={<Spinner />}
 *   errorFallback={(error) => <div>Error: {error.message}</div>}
 *   componentProps={{ userId: 123 }}
 * />
 * ```
 */
export function SuspenseRemoteLoader({
  pkg,
  version = 'latest',
  moduleName,
  scopeName,
  fallback,
  errorFallback,
  componentProps,
}: SuspenseRemoteWithPropsProps) {
  const RemoteComponent = lazyRemote({ pkg, version, moduleName, scopeName })

  if (errorFallback) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={fallback || <div>Loading...</div>}>
          <RemoteComponent {...componentProps} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <RemoteComponent {...componentProps} />
    </Suspense>
  )
}

/**
 * HOC：为组件添加远程加载能力
 *
 * @example
 * ```tsx
 * const EnhancedComponent = withRemote(
 *   (props) => <div>{props.message}</div>,
 *   {
 *     pkg: "@myorg/remote-app",
 *     version: "^1.0.0",
 *     moduleName: "RemoteComponent",
 *     scopeName: "myorg"
 *   }
 * );
 *
 * <EnhancedComponent message="Hello" />
 * ```
 */
export function withRemote<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: LazyRemoteOptions,
) {
  const RemoteComponent = lazyRemote(options)

  return function WithRemoteComponent(props: P) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <RemoteComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Hook：在函数组件中加载远程模块
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { component: RemoteComp, loading, error } = useRemoteModule({
 *     pkg: "@myorg/remote-app",
 *     version: "^1.0.0",
 *     moduleName: "Dashboard",
 *     scopeName: "myorg"
 *   });
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!RemoteComp) return null;
 *
 *   return <RemoteComp userId={123} />;
 * }
 * ```
 */
export function useRemoteModuleHook(options: LazyRemoteOptions): {
  component: ComponentType<any> | null
  loading: boolean
  error: Error | null
} {
  const { pkg, version = 'latest', moduleName, scopeName } = options
  const [state, setState] = useState<{
    component: ComponentType<any> | null
    loading: boolean
    error: Error | null
  }>({
    component: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }))

        const { mf } = await loadRemoteMultiVersion(
          {
            name: scopeName,
            pkg,
            version,
          },
          [],
        )

        if (!mf) {
          throw new Error(
            `[RemoteReloadUtils] Failed to get Module Federation instance for ${scopeName}`,
          )
        }

        const mod = await mf.loadRemote(`${scopeName}/${moduleName}`)

        if (mounted) {
          if (mod && typeof mod === 'object' && 'default' in mod) {
            setState({
              component: mod.default as ComponentType<any>,
              loading: false,
              error: null,
            })
          } else {
            throw new Error(
              `[RemoteReloadUtils] Module "${scopeName}/${moduleName}" does not export a default component`,
            )
          }
        }
      } catch (err) {
        if (mounted) {
          setState({
            component: null,
            loading: false,
            error: err instanceof Error ? err : new Error(String(err)),
          })
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [pkg, version, moduleName, scopeName])

  return {
    component: state.component,
    loading: state.loading,
    error: state.error,
  }
}
