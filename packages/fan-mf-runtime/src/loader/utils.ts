import {
  createInstance,
  type ModuleFederationRuntimePlugin,
} from '@module-federation/enhanced/runtime'
import { fallbackPlugin } from '../plugins/fallback'
import type { VersionCache } from '../types'

// --- 核心配置抽象 ---

/** 默认的 CDN 地址模板 */
const DEFAULT_CDN_TEMPLATES = [
  'https://cdn.jsdelivr.net/npm/{pkg}@{version}/dist/remoteEntry.js',
  'https://unpkg.com/{pkg}@{version}/dist/remoteEntry.js',
]

/** 默认的共享模块配置（使用 runtime 期望的 shareConfig 结构） */
const DEFAULT_SHARED_CONFIG: Record<string, any> = {
  react: {
    shareConfig: {
      singleton: true,
      eager: true,
      requiredVersion: false,
      strictVersion: false,
    },
    strategy: 'loaded-first',
  },
  'react-dom': {
    shareConfig: {
      singleton: true,
      eager: true,
      requiredVersion: false,
      strictVersion: false,
    },
    strategy: 'loaded-first',
  },
  'react-dom/client': {
    shareConfig: {
      singleton: true,
      eager: true,
      requiredVersion: false,
      strictVersion: false,
    },
    strategy: 'loaded-first',
  },
  'react/jsx-runtime': {
    shareConfig: {
      singleton: true,
      eager: true,
      requiredVersion: false,
      strictVersion: false,
    },
    strategy: 'loaded-first',
  },
  'react/jsx-dev-runtime': {
    shareConfig: {
      singleton: true,
      eager: true,
      requiredVersion: false,
      strictVersion: false,
    },
    strategy: 'loaded-first',
  },
}

// --- 工具函数 ---

interface NpmRegistryResponse {
  'dist-tags'?: {
    latest: string
    [tag: string]: string | undefined
  }
}

/**
 * 从 npm registry 获取最新版本，并增加类型安全性
 */
export async function fetchLatestVersion(pkg: string): Promise<string> {
  const res = await fetch(`https://registry.npmjs.org/${pkg}`)
  if (!res.ok)
    throw new Error(`[MF] 无法获取 ${pkg} 的版本信息，状态码：${res.status}`)
  const data = (await res.json()) as NpmRegistryResponse
  const latest = data['dist-tags']?.latest

  if (!latest) throw new Error(`[MF] 无法从 NPM 获取 ${pkg} 的 latest tag`)
  return latest
}

/**
 * 读取多版本缓存，增强健壮性
 */
export function getVersionCache(): VersionCache {
  try {
    const cacheStr = localStorage.getItem('mf-multi-version')
    return cacheStr ? JSON.parse(cacheStr) : {}
  } catch (e) {
    console.error('[MF Cache] 读取缓存失败:', e)
    return {}
  }
}

/**
 * 写入多版本缓存，增强健壮性
 */
export function setVersionCache(pkg: string, version: string) {
  try {
    const cache = getVersionCache()
    cache[pkg] = cache[pkg] || {}
    cache[pkg][version] = { timestamp: Date.now() }
    localStorage.setItem('mf-multi-version', JSON.stringify(cache))
  } catch (e) {
    console.error('[MF Cache] 写入缓存失败:', e)
  }
}

/**
 * 拼接 CDN 地址 (统一使用抽象的模板)
 */
export function buildCdnUrls(pkg: string, version: string): string[] {
  return DEFAULT_CDN_TEMPLATES.map((template) =>
    template.replace('{pkg}', pkg).replace('{version}', version),
  )
}

// --- 核心加载逻辑 ---

export interface LoadResult {
  scopeName: string
  mf: ReturnType<typeof createInstance>
}

export type RuntimeRemote = Parameters<
  ReturnType<typeof createInstance>['registerRemotes']
>[0][number]

const mfInstanceCache = new Map<string, ReturnType<typeof createInstance>>()
const mfInstanceLoadingCache = new Map<string, Promise<LoadResult>>()

// 导出缓存用于测试
export { mfInstanceCache, mfInstanceLoadingCache }

function buildRemotesIdentity(remotes: RuntimeRemote[]): string {
  if (remotes.length === 0) return ''
  return remotes
    .map((remote) =>
      JSON.stringify({
        name: remote.name,
        entry: 'entry' in remote ? remote.entry : '',
        version: 'version' in remote ? remote.version : '',
        alias: remote.alias || '',
        type: remote.type || '',
        entryGlobalName: remote.entryGlobalName || '',
      }),
    )
    .sort()
    .join('|')
}

/**
 * 尝试加载单个远程模块 URL
 * 注意：实际的重试机制在外层 loadRemoteMultiVersion 的 URL 遍历中实现
 */
export async function tryLoadRemote(
  scopeName: string,
  url: string,
  retries: number,
  delay: number,
  sharedConfig: Record<string, any>,
  plugins: ModuleFederationRuntimePlugin[],
  extraRemotes: RuntimeRemote[] = [],
  registerOptions: { force?: boolean } = {},
): Promise<LoadResult> {
  const remotesIdentity = buildRemotesIdentity(extraRemotes)
  const cacheKey = `${scopeName}::${url}::${remotesIdentity}::${registerOptions.force ? 'force' : 'normal'}`

  // 检查缓存
  const cachedMfs = mfInstanceCache.get(cacheKey)
  if (cachedMfs) {
    return { scopeName, mf: cachedMfs }
  }

  // 检查是否正在加载中
  const loadingMfs = mfInstanceLoadingCache.get(cacheKey)
  if (loadingMfs) {
    return loadingMfs
  }

  // 创建 MF 实例并缓存 Promise
  const loadPromise = Promise.resolve().then(async () => {
    let lastError: Error | undefined
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        const mf = createInstance({
          name: 'host',
          remotes: [
            {
              name: scopeName,
              entry: url,
            },
          ],
          shared: sharedConfig,
          plugins: [...plugins, fallbackPlugin()],
        })

        if (extraRemotes.length > 0) {
          mf.registerRemotes(extraRemotes, registerOptions)
        }

        const result = { scopeName, mf }
        mfInstanceCache.set(cacheKey, mf)
        return result
      } catch (e) {
        lastError = e as Error
      }
    }
    throw lastError || new Error('Unknown error')
  })

  mfInstanceLoadingCache.set(cacheKey, loadPromise)

  try {
    return await loadPromise
  } finally {
    mfInstanceLoadingCache.delete(cacheKey)
  }
}

/**
 * 获取最终的共享配置
 */
export function getFinalSharedConfig(
  customShared?: Record<string, any>,
): Record<string, any> {
  // 检查全局是否有 React/ReactDOM（用于 Vue 项目加载 React 远程组件）
  const globalReact = (window as any).React
  const globalReactDOM = (window as any).ReactDOM

  const globalShared: Record<string, any> = {}

  if (globalReact && globalReactDOM) {
    // 验证 React 实例是否有效
    const isValidReact =
      typeof globalReact === 'object' &&
      typeof globalReact.useCallback === 'function'

    if (isValidReact) {
      // 注意：runtime shared 需要使用 shareConfig，而不是直接 singleton/eager 顶层字段
      globalShared.react = {
        version: globalReact.version || '18.0.0',
        lib: () => globalReact,
        shareConfig: {
          singleton: true,
          eager: true,
          requiredVersion: false,
          strictVersion: false,
        },
        strategy: 'loaded-first',
      }
      globalShared['react-dom'] = {
        version: globalReactDOM.version || '18.0.0',
        lib: () => globalReactDOM,
        shareConfig: {
          singleton: true,
          eager: true,
          requiredVersion: false,
          strictVersion: false,
        },
        strategy: 'loaded-first',
      }
      globalShared['react-dom/client'] = {
        version: globalReactDOM.version || '18.0.0',
        lib: () => globalReactDOM,
        shareConfig: {
          singleton: true,
          eager: true,
          requiredVersion: false,
          strictVersion: false,
        },
        strategy: 'loaded-first',
      }

      console.log('[getFinalSharedConfig] Using global React instance', {
        version: globalReact.version,
      })
    } else {
      console.warn('[getFinalSharedConfig] Global React found but is invalid', {
        type: typeof globalReact,
        useCallback: typeof globalReact?.useCallback,
      })
    }
  } else {
    console.log(
      '[getFinalSharedConfig] No global React found, using default shared config',
    )
  }

  const mergedShared = {
    ...DEFAULT_SHARED_CONFIG,
    ...globalShared,
    ...(customShared || {}),
  }

  // 保证 React 关键共享模块总是单例 + loaded-first
  const keepSingletonPackages = [
    'react',
    'react-dom',
    'react-dom/client',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
  ]

  for (const pkgName of keepSingletonPackages) {
    const base = mergedShared[pkgName] || {}
    mergedShared[pkgName] = {
      ...base,
      strategy: 'loaded-first',
      shareConfig: {
        singleton: true,
        eager: true,
        requiredVersion: false,
        strictVersion: false,
        ...(base.shareConfig || {}),
      },
    }
  }

  // 如果全局存在 React，则优先保留 host 侧 lib，避免 remote 侧 React 抢占
  if (typeof globalShared.react?.lib === 'function') {
    mergedShared.react = {
      ...(mergedShared.react || {}),
      lib: globalShared.react.lib,
      version: globalShared.react.version,
    }
  }

  if (typeof globalShared['react-dom']?.lib === 'function') {
    mergedShared['react-dom'] = {
      ...(mergedShared['react-dom'] || {}),
      lib: globalShared['react-dom'].lib,
      version: globalShared['react-dom'].version,
    }
  }

  if (typeof globalShared['react-dom/client']?.lib === 'function') {
    mergedShared['react-dom/client'] = {
      ...(mergedShared['react-dom/client'] || {}),
      lib: globalShared['react-dom/client'].lib,
      version: globalShared['react-dom/client'].version,
    }
  }

  return mergedShared
}

/**
 * 解析最终版本号（处理 latest 情况）
 */
export async function resolveFinalVersion(
  pkg: string,
  version: string,
  cacheTTL: number,
  revalidate: boolean,
): Promise<string> {
  let finalVersion = version

  if (version === 'latest') {
    const cache = getVersionCache()
    const versions = cache[pkg] || {}
    // 找到最新的缓存版本
    const latestCached = Object.keys(versions).sort(
      (a, b) => versions[b].timestamp - versions[a].timestamp,
    )[0]

    // 如果有未过期缓存
    if (
      latestCached &&
      Date.now() - versions[latestCached].timestamp < cacheTTL
    ) {
      finalVersion = latestCached

      // 如果开启了重新验证，异步检查是否有新版本，不阻塞主流程
      if (revalidate) {
        fetchLatestVersion(pkg)
          .then((latest) => {
            if (latest !== latestCached) {
              console.log(`[MF] 发现 ${pkg} 新版本 ${latest}，已更新缓存。`)
              setVersionCache(pkg, latest)
            }
          })
          .catch((e) => console.error(`[MF] 异步检查最新版本失败:`, e))
      }
    } else {
      // 缓存过期或首次加载，同步获取最新版本（阻塞）
      finalVersion = await fetchLatestVersion(pkg)
      setVersionCache(pkg, finalVersion)
    }
  }

  return finalVersion
}

/**
 * 构建最终的 URL 列表（包含本地 fallback）
 */
export function buildFinalUrls(
  pkg: string,
  version: string,
  localFallback?: string,
): string[] {
  const urls = buildCdnUrls(pkg, version)
  if (localFallback) urls.push(localFallback)
  return urls
}

export function isEmpty(params: unknown): boolean {
  if (params === null || params === undefined) {
    return true
  }

  if (typeof params === 'number') {
    return Number.isNaN(params)
  }

  if (typeof params === 'string') {
    return params.trim().length === 0
  }

  if (Array.isArray(params)) {
    return params.length === 0
  }

  if (typeof params === 'object') {
    return Object.keys(params).length === 0
  }

  return false
}