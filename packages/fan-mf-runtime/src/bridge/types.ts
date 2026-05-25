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

export interface LazyComponentOptions<
  T = unknown,
  E extends keyof T = keyof T,
> {
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
