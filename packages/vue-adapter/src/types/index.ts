import type { LoadResult } from '@fan-scripts/fan-mf-runtime'

/**
 * 运行时 MF 实例类型（完整的 createInstance 返回值类型）
 * 可以访问 MF 实例上的所有公共 API
 */
export type MFInstance = LoadResult['mf']

// export interface MFInstance extends ReactResolverResult {
//   /** 加载共享模块 */
//   loadShare?: (name: string) => Promise<any>
//   /** 加载远程模块 */
//   loadRemote?: (name: string) => Promise<any>
// }

// MFInstanceFull is deprecated, use MFInstance instead
// export type MFInstanceFull = LoadResult['mf']

/**
 * React 实例类型
 */
export interface ReactInstance {
  createElement: (...args: any[]) => any
  useCallback: (...args: any[]) => any
  useState: (...args: any[]) => any
  version?: string
  [key: string]: any
}

/**
 * ReactDOM 实例类型
 */
export interface ReactDOMInstance {
  render?: (...args: any[]) => void
  createRoot?: (container: HTMLElement) => ReactDOMRoot
  unmountComponentAtNode?: (container: HTMLElement) => boolean | void
  version?: string
  [key: string]: any
}

/**
 * ReactDOM Root 实例类型
 */
export interface ReactDOMRoot {
  render?: (element: any) => void
  unmount: () => void
}

/**
 * React 组件类型
 */
export type ReactComponentType = any

/**
 * 远程模块加载结果
 */
export interface RemoteModuleResult<T = any> {
  /** 模块实例 */
  module: T
  /** 运行时 MF 实例 */
  mf: MFInstance
  /** 作用域名称 */
  scopeName: string
}
