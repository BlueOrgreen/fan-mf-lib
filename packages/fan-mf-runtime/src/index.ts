// 版本管理模块

export type {
  BridgeAppComponent,
  BridgeAppProps,
  BridgeAppProviderFactory,
  BridgeAppProviderInstance,
  BridgeAppProviderOptions,
  CreateBridgeAppOptions,
} from './app_bridge'
// 应用层桥接封装
export {
  createBridgeComponent,
  createBridgeComponentV19,
  createBridgeRemoteApp,
  createRemoteAppComponent,
  createRemoteComponent,
} from './app_bridge'
// Bridge 模块（懒加载组件）
export * from './bridge'
// 事件总线模块
export {
  createEventBus,
  eventBus,
} from './event-bus'
// 健康检查模块
export {
  checkModuleLoadable,
  checkRemoteHealth,
  formatHealthStatus,
  getRemoteHealthReport,
} from './health'
// 核心加载模块
export {
  createRemoteSourcePlugin,
  type LoadRemoteExtraOptions,
  loadRemoteMultiVersion,
  type RemoteSourcePlugin,
  type RemoteSourcePluginContext,
} from './loader'
export {
  buildCdnUrls,
  buildFinalUrls,
  fetchLatestVersion,
  getFinalSharedConfig,
  getVersionCache,
  type LoadResult,
  type RuntimeRemote,
  resolveFinalVersion,
  setVersionCache,
  tryLoadRemote,
} from './loader/utils'
// 插件导出
export { fallbackPlugin } from './plugins/fallback'
// 预加载模块
export {
  cancelPreload,
  clearPreloadCache,
  getPreloadStatus,
  preloadRemote,
  preloadRemoteList,
} from './preload'
// 类型导出
export type {
  LoadRemoteOptions,
  PreloadCacheItem,
  PreloadOptions,
  PreloadStatus,
  VersionCache,
} from './types'
// 卸载管理模块
export {
  getLoadedRemotes,
  isRemoteLoaded,
  registerLoadedModule,
  registerRemoteInstance,
  unloadAll,
  unloadRemote,
} from './unload'
export {
  checkVersionCompatibility,
  compareVersions,
  extractMajorVersion,
  fetchAvailableVersions,
  findCompatibleVersion,
  getCompatibleReactVersions,
  getLatestVersion,
  getStableVersions,
  isPrerelease,
  parseVersion,
  satisfiesVersion,
  sortVersions,
} from './version'
export { loadReactVersion } from './version/react'
