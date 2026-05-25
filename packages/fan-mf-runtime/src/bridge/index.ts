// 插件

// 组件加载
export {
  createLazyComponent,
  type UseLazyComponentResult,
  useLazyComponent,
} from './create-lazy-component'
export { createLazyLoadComponentPlugin } from './lazy-load-component-plugin'

// 预加载
export { prefetchComponent } from './prefetch'

// 类型
export type {
  BridgePluginOptions,
  ERROR_TYPE,
  ErrorInfo,
  LazyComponentOptions,
  PrefetchOptions,
} from './types'
