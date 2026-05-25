/** @jsxImportSource react */
import { type ComponentType, useEffect, useState } from 'react'
import type { ErrorInfo, LazyComponentOptions } from './types'
import { ERROR_TYPE } from './types'

export type { ErrorInfo } from './types'
export { ERROR_TYPE } from './types'

export interface UseLazyComponentResult<T> {
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
  options: LazyComponentOptions<T>,
): UseLazyComponentResult<T> {
  const {
    loader,
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

    void dataFetchParams
    void noSSR

    // 处理延迟显示 loading
    let delayTimer: NodeJS.Timeout | undefined
    if (delayLoading) {
      delayTimer = setTimeout(() => {
        if (mounted) {
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
        // Module Federation 可能返回直接组件或 { default: Component }
        let exportedComponent: ComponentType<T> | undefined

        if (exportName === 'default') {
          // 尝试默认导出，如果不存在则使用模块本身
          exportedComponent =
            (module as { default?: ComponentType<T> }).default ||
            (module as ComponentType<T>)
        } else {
          // 具名导出
          exportedComponent = (module as Record<string, ComponentType<T>>)[
            exportName
          ]
        }

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
  }, [loader, exportName, delayLoading, dataFetchParams, noSSR])

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
function isValidComponentType(value: unknown): value is ComponentType<unknown> {
  if (typeof value === 'function') return true
  if (typeof value === 'object' && value !== null && '$$typeof' in value) return true
  return false
}

export function createLazyComponent<T extends Record<string, unknown>>(
  options: LazyComponentOptions<T>,
): ComponentType<T> {
  const LazyComponent: ComponentType<T> = (props: T) => {
    const { loading, error, Component } = useLazyComponent(options)

    // 渲染错误状态
    if (error) {
      return options.fallback(error) as JSX.Element
    }

    // 渲染加载状态
    if (loading) {
      return options.loading as JSX.Element
    }

    // 渲染组件
    if (Component) {
      if (!isValidComponentType(Component)) {
        return options.fallback({
          error: new Error(
            `[Bridge] Invalid component type received: ${typeof Component}. Check remote module export and fallback behavior.`,
          ),
          errorType: ERROR_TYPE.LOAD_REMOTE,
        }) as JSX.Element
      }
      return <Component {...props} />
    }

    return null
  }

  // 设置组件显示名称
  LazyComponent.displayName = 'LazyComponent'

  return LazyComponent
}
