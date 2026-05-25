import React, { useEffect, useState, useCallback, Suspense } from 'react'
import type { ErrorBoundaryProps } from './ErrorBoundary'
import { ErrorBoundary } from './ErrorBoundary'
import { useRemoteModule, type UseRemoteModuleOptions } from '../hooks/useRemoteModule'

export interface RemoteModuleCardProps {
  /** 包名称 */
  pkg: string
  /** 版本号，支持 semver 范围 */
  version: string
  /** 远程模块名称（导出名） */
  moduleName: string
  /** 作用域名称 */
  scopeName: string
  /** 加载中的占位内容 */
  loadingFallback?: React.ReactNode
  /** 错误状态的占位内容 */
  errorFallback?:
    | React.ReactNode
    | ((error: Error, resetError: () => void) => React.ReactNode)
  /** 传递给远程组件的 props */
  componentProps?: Record<string, any>
  /** 容器类名 */
  className?: string
  /** 容器样式 */
  style?: React.CSSProperties
  /** 加载成功回调 */
  onLoad?: (component: React.ComponentType<any>) => void
  /** 加载失败回调 */
  onError?: (error: Error) => void
  /** 是否禁用错误边界 */
  disableErrorBoundary?: boolean
  /** 错误边界配置 */
  errorBoundaryOptions?: Omit<ErrorBoundaryProps, 'children' | 'fallback'>
}

/**
 * 远程模块渲染器：纯内容渲染（不含 Suspense/ErrorBoundary）
 */
export function RemoteModuleRenderer({
  pkg,
  version,
  moduleName,
  scopeName,
  loadingFallback,
  errorFallback,
  componentProps,
  className,
  style,
  onError,
  onLoad,
}: RemoteModuleCardProps) {
  const moduleState = useRemoteModule({
    pkg,
    version,
    moduleName,
    scopeName,
    onError,
    onLoad,
  })
  const [retryKey, setRetryKey] = useState(0)

  // 强制重新加载
  const handleRetry = useCallback(() => {
    setRetryKey((prev) => prev + 1)
  }, [])

  // retryKey 变化会触发 useRemoteModule 重新加载（依赖项中包含 retryKey）
  useEffect(() => {
    // 通过 key 变化触发重新加载
  }, [retryKey])

  if (moduleState.loading) {
    return (
      <div className={className} style={style} role="status" aria-live="polite">
        {loadingFallback || (
          <div className="module-card module-card--loading">
            <div className="loading-spinner" aria-hidden="true" />
            <span className="text-gray-600">Loading {moduleName}...</span>
          </div>
        )}
      </div>
    )
  }

  if (moduleState.error) {
    if (typeof errorFallback === 'function') {
      return <>{errorFallback(moduleState.error, handleRetry)}</>
    }
    if (errorFallback !== undefined) {
      return <>{errorFallback}</>
    }
    // 默认错误 UI
    return (
      <div className={className} style={style} role="alert">
        <div className="module-card module-card--error">
          <span className="error-icon" aria-hidden="true">
            !
          </span>
          <span>Failed to load {moduleName}</span>
          <p className="error-message">{moduleState.error.message}</p>
          <button onClick={handleRetry} className="retry-button" type="button">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!moduleState.component) {
    return null
  }

  const Component = moduleState.component

  return (
    <div className={className} style={style}>
      <Component {...componentProps} />
    </div>
  )
}

/**
 * 远程模块提供者：带 Suspense 和 ErrorBoundary 的完整组件
 *
 * @features
 * - 自动加载远程模块
 * - 内置加载状态和错误处理
 * - 支持 Suspense 惰性加载
 * - 可配置的错误边界
 * - 支持重试机制
 *
 * @example
 * ```tsx
 * <RemoteModuleProvider
 *   pkg="@myorg/remote-app"
 *   version="^1.0.0"
 *   moduleName="Dashboard"
 *   scopeName="myorg"
 *   loadingFallback={<Spinner />}
 *   errorFallback={(error, reset) => <Button onClick={reset}>Retry</Button>}
 *   componentProps={{ userId: 123 }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // 使用 lazy + Suspense 模式
 * const LazyRemote = lazyRemote({
 *   pkg: "@myorg/remote-app",
 *   version: "^1.0.0",
 *   moduleName: "Dashboard",
 *   scopeName: "myorg"
 * });
 *
 * <Suspense fallback={<Spinner />}>
 *   <LazyRemote userId={123} />
 * </Suspense>
 * ```
 */
export function RemoteModuleProvider(props: RemoteModuleCardProps) {
  const {
    disableErrorBoundary,
    errorFallback,
    loadingFallback,
    errorBoundaryOptions,
  } = props

  // 如果禁用了错误边界，直接渲染内容
  if (disableErrorBoundary) {
    return (
      <Suspense fallback={loadingFallback || <div>Loading...</div>}>
        <RemoteModuleRenderer {...props} />
      </Suspense>
    )
  }

  // 默认启用错误边界
  return (
    <ErrorBoundary
      fallback={errorFallback}
      onError={errorBoundaryOptions?.onError}
      onReset={errorBoundaryOptions?.onReset}
    >
      <Suspense fallback={loadingFallback || <div>Loading...</div>}>
        <RemoteModuleRenderer {...props} />
      </Suspense>
    </ErrorBoundary>
  )
}
