import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime'

export type { ModuleFederationRuntimePlugin }

export interface LocalDebugOptions {
  enabled: boolean // 是否启用 localhost 本地调试
  entry: string // 本地调试 remoteEntry 地址
}

export interface LoadRemoteOptions {
  name: string // 模块联邦 name（基础名）
  pkg: string // npm 包名
  version?: string // 指定版本 or "latest"
  retries?: number // 重试次数
  delay?: number // 重试间隔
  localFallback?: string // 本地兜底
  cacheTTL?: number // 缓存时间
  revalidate?: boolean // 灰度更新
  shared?: Record<string, any> // 自定义 shared 配置
  localDebug?: LocalDebugOptions // 本地的 localhost 调试配置
}

export interface VersionCache {
  [pkg: string]: {
    [version: string]: {
      timestamp: number
    }
  }
}

export interface PreloadOptions extends LoadRemoteOptions {
  priority?: 'idle' | 'high'
  force?: boolean
}

export interface PreloadCacheItem {
  version: string
  scopeName: string
  mf: any
  timestamp: number
}

export interface PreloadStatus {
  loaded: boolean
  timestamp: number
}
