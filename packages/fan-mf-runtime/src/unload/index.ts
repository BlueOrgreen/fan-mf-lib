interface RemoteInstance {
  name: string
  scopeName: string
  pkg: string
  version: string
  mf: any
  loadedModules: Set<string>
  timestamp: number
}

const remoteInstances: Map<string, RemoteInstance> = new Map()

function generateInstanceKey(
  name: string,
  pkg: string,
  version: string,
): string {
  return `${name}::${pkg}@${version}`
}

export interface UnloadOptions {
  name: string
  pkg: string
  version?: string
  clearCache?: boolean
}

export async function unloadRemote(options: UnloadOptions): Promise<boolean> {
  const { name, pkg, version = '*', clearCache = false } = options

  const keysToDelete: string[] = []

  remoteInstances.forEach((instance, key) => {
    const versionMatch = version === '*' || instance.version === version
    const pkgMatch = instance.pkg === pkg
    const nameMatch = instance.name === name

    if (nameMatch && pkgMatch && versionMatch) {
      keysToDelete.push(key)
    }
  })

  for (const key of keysToDelete) {
    const instance = remoteInstances.get(key)
    if (instance) {
      await cleanupInstance(instance)
      remoteInstances.delete(key)
    }
  }

  if (clearCache) {
    clearVersionCache(pkg, version)
  }

  return keysToDelete.length > 0
}

async function cleanupInstance(instance: RemoteInstance): Promise<void> {
  try {
    instance.loadedModules.clear()

    if (instance.mf && typeof instance.mf.cleanup === 'function') {
      await instance.mf.cleanup()
    }

    console.log(`[MF Unload] 已卸载 ${instance.pkg}@${instance.version}`)
  } catch (e) {
    console.warn(`[MF Unload] 卸载时出错 ${instance.pkg}:`, e)
  }
}

function clearVersionCache(pkg: string, version: string): void {
  try {
    const cacheKey = 'mf-multi-version'
    const cacheStr = localStorage.getItem(cacheKey)
    if (!cacheStr) return

    const cache = JSON.parse(cacheStr)
    if (!cache[pkg]) return

    if (version === '*') {
      delete cache[pkg]
    } else {
      delete cache[pkg][version]
    }

    localStorage.setItem(cacheKey, JSON.stringify(cache))
    console.log(`[MF Unload] 已清除版本缓存 ${pkg}@${version}`)
  } catch (e) {
    console.warn('[MF Unload] 清除缓存失败:', e)
  }
}

export function registerRemoteInstance(
  name: string,
  scopeName: string,
  pkg: string,
  version: string,
  mf: any,
): string {
  const key = generateInstanceKey(name, pkg, version)

  const instance: RemoteInstance = {
    name,
    scopeName,
    pkg,
    version,
    mf,
    loadedModules: new Set(),
    timestamp: Date.now(),
  }

  remoteInstances.set(key, instance)
  return key
}

export function registerLoadedModule(key: string, moduleId: string): void {
  const instance = remoteInstances.get(key)
  if (instance) {
    instance.loadedModules.add(moduleId)
  }
}

export function unloadAll(clearAllCache = false): Promise<void> {
  return new Promise((resolve) => {
    const keys = Array.from(remoteInstances.keys())

    if (keys.length === 0) {
      resolve()
      return
    }

    let completed = 0
    keys.forEach(async (key) => {
      const instance = remoteInstances.get(key)
      if (instance) {
        await cleanupInstance(instance)
        remoteInstances.delete(key)
      }
      completed++
      if (completed >= keys.length) {
        if (clearAllCache) {
          try {
            localStorage.removeItem('mf-multi-version')
          } catch (e) {
            console.warn('[MF Unload] 清除所有缓存失败:', e)
          }
        }
        resolve()
      }
    })
  })
}

export function getLoadedRemotes(): Array<{
  name: string
  pkg: string
  version: string
  loadedModules: number
  timestamp: number
}> {
  const result: Array<{
    name: string
    pkg: string
    version: string
    loadedModules: number
    timestamp: number
  }> = []

  remoteInstances.forEach((instance) => {
    result.push({
      name: instance.name,
      pkg: instance.pkg,
      version: instance.version,
      loadedModules: instance.loadedModules.size,
      timestamp: instance.timestamp,
    })
  })

  return result
}

export function getRemoteInstance(key: string): RemoteInstance | undefined {
  return remoteInstances.get(key)
}

export function isRemoteLoaded(
  name: string,
  pkg: string,
  version?: string,
): boolean {
  const key = generateInstanceKey(name, pkg, version || '*')
  return remoteInstances.has(key)
}
