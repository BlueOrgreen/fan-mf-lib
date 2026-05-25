import { loadRemoteMultiVersion } from '../loader'
import type { LoadRemoteOptions } from '../types'

interface PreloadCache {
  [pkg: string]: {
    version: string
    scopeName: string
    mf: any
    timestamp: number
  }
}

const preloadCache: PreloadCache = {}

const PRELOAD_CACHE_TTL = 5 * 60 * 1000

export interface PreloadOptions extends LoadRemoteOptions {
  priority?: 'idle' | 'high'
  force?: boolean
}

function getCachedPreload(
  pkg: string,
  version: string,
): { scopeName: string; mf: any } | null {
  const cached = preloadCache[pkg]
  if (!cached) return null
  if (cached.version !== version) return null
  if (Date.now() - cached.timestamp > PRELOAD_CACHE_TTL) {
    delete preloadCache[pkg]
    return null
  }
  return { scopeName: cached.scopeName, mf: cached.mf }
}

function setCachedPreload(
  pkg: string,
  version: string,
  scopeName: string,
  mf: any,
): void {
  preloadCache[pkg] = {
    version,
    scopeName,
    mf,
    timestamp: Date.now(),
  }
}

declare const requestIdleCallback:
  | ((callback: () => void) => number)
  | undefined

function executeWhenIdle(callback: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => callback())
  } else {
    setTimeout(callback, 1)
  }
}

export async function preloadRemote(
  options: PreloadOptions,
): Promise<{ scopeName: string; mf: any } | null> {
  const { pkg, version = 'latest', priority = 'idle', force = false } = options

  if (!force) {
    const cached = getCachedPreload(pkg, version)
    if (cached) {
      return cached
    }
  }

  const preloadTask = async (): Promise<{
    scopeName: string
    mf: any
  } | null> => {
    try {
      const { scopeName, mf } = await loadRemoteMultiVersion(options, [])
      setCachedPreload(pkg, version, scopeName, mf)
      return { scopeName, mf }
    } catch (e) {
      console.warn(`[MF Preload] 预加载失败 ${pkg}@${version}:`, e)
      return null
    }
  }

  if (priority === 'high') {
    return preloadTask()
  }

  return new Promise((resolve) => {
    executeWhenIdle(async () => {
      const result = await preloadTask()
      resolve(result)
    })
  })
}

export function preloadRemoteList(
  optionsList: PreloadOptions[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<Array<{ scopeName: string; mf: any } | null>> {
  let loaded = 0
  const total = optionsList.length

  const promises = optionsList.map((options) =>
    preloadRemote(options).then((result) => {
      loaded++
      onProgress?.(loaded, total)
      return result
    }),
  )

  return Promise.all(promises)
}

export function cancelPreload(pkg: string): void {
  const cached = preloadCache[pkg]
  if (cached) {
    delete preloadCache[pkg]
  }
}

export function clearPreloadCache(): void {
  Object.keys(preloadCache).forEach((pkg) => delete preloadCache[pkg])
}

export function getPreloadStatus(
  pkg: string,
): { loaded: boolean; timestamp: number } | null {
  const cached = preloadCache[pkg]
  if (!cached) return null
  return { loaded: true, timestamp: cached.timestamp }
}
