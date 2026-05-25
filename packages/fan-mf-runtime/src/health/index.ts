import type { LoadRemoteOptions } from '../types'

export interface HealthCheckResult {
  pkg: string
  version: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  cdn: string
  details: {
    cdnReachable: boolean
    remoteEntryValid: boolean
    modulesLoadable: boolean
    error?: string
  }
}

export interface RemoteHealthReport {
  timestamp: number
  overall: 'healthy' | 'degraded' | 'unhealthy'
  remotes: HealthCheckResult[]
}

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/{pkg}@{version}/dist/remoteEntry.js',
  'https://unpkg.com/{pkg}@{version}/dist/remoteEntry.js',
]

async function checkCdnAccess(
  cdnUrl: string,
): Promise<{ reachable: boolean; latency: number }> {
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(cdnUrl, {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const latency = Math.round(performance.now() - start)

    return {
      reachable: res.ok,
      latency,
    }
  } catch (e) {
    const latency = Math.round(performance.now() - start)
    return { reachable: false, latency }
  }
}

async function fetchLatestVersion(pkg: string): Promise<string | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}`)
    if (!res.ok) return null
    const data = await res.json()
    return data['dist-tags']?.latest || null
  } catch {
    return null
  }
}

export async function checkRemoteHealth(
  options: LoadRemoteOptions,
): Promise<HealthCheckResult> {
  const { pkg, version = 'latest' } = options

  const actualVersion =
    version === 'latest' ? (await fetchLatestVersion(pkg)) || version : version

  const results: Array<{ cdn: string; reachable: boolean; latency: number }> =
    []

  for (const template of CDN_URLS) {
    const url = template
      .replace('{pkg}', pkg)
      .replace('{version}', actualVersion)
    const result = await checkCdnAccess(url)
    results.push({
      cdn: url,
      ...result,
    })
  }

  const workingCdn = results.find((r) => r.reachable)
  const bestCdn = results.sort((a, b) => a.latency - b.latency)[0]

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'unhealthy'
  if (workingCdn) {
    status = bestCdn.latency < 1000 ? 'healthy' : 'degraded'
  }

  return {
    pkg,
    version: actualVersion,
    status,
    latency: bestCdn?.latency || 0,
    cdn: bestCdn?.cdn || '',
    details: {
      cdnReachable: !!workingCdn,
      remoteEntryValid: false,
      modulesLoadable: false,
    },
  }
}

export async function checkModuleLoadable(
  scopeName: string,
  modulePath: string,
  mf: any,
): Promise<boolean> {
  try {
    if (!mf || typeof mf.loadRemote !== 'function') {
      return false
    }
    const mod = await mf.loadRemote(`${scopeName}/${modulePath}`)
    return mod !== undefined && mod !== null
  } catch {
    return false
  }
}

export async function getRemoteHealthReport(
  remotes: LoadRemoteOptions[],
): Promise<RemoteHealthReport> {
  const results = await Promise.all(remotes.map((r) => checkRemoteHealth(r)))

  let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (results.some((r) => r.status === 'unhealthy')) {
    overall = 'unhealthy'
  } else if (results.some((r) => r.status === 'degraded')) {
    overall = 'degraded'
  }

  return {
    timestamp: Date.now(),
    overall,
    remotes: results,
  }
}

export function formatHealthStatus(
  status: 'healthy' | 'degraded' | 'unhealthy',
): string {
  const icons = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴',
  }
  return `${icons[status]} ${status}`
}
