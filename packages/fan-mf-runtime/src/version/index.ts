export interface VersionInfo {
  major: number
  minor: number
  patch: number
  prerelease?: string
  build?: string
  raw: string
}

export interface CompatibilityResult {
  compatible: boolean
  currentVersion: string
  requiredVersion: string
  suggestion?: string
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface VersionRange {
  min?: string
  max?: string
  exact?: string
}

function parseVersion(version: string): VersionInfo {
  const cleaned = version.replace(/^v/i, '')

  const parts = cleaned.split(/[-+]/)
  const [major, minor, patch] = parts[0].split('.').map(Number)

  return {
    major: isNaN(major) ? 0 : major,
    minor: isNaN(minor) ? 0 : minor,
    patch: isNaN(patch) ? 0 : patch,
    prerelease: parts[1],
    build: parts[2],
    raw: cleaned,
  }
}

function compareVersions(v1: string, v2: string): number {
  const p1 = parseVersion(v1)
  const p2 = parseVersion(v2)

  if (p1.major !== p2.major) return p1.major - p2.major
  if (p1.minor !== p2.minor) return p1.minor - p2.minor
  if (p1.patch !== p2.patch) return p1.patch - p2.patch

  if (p1.prerelease && !p2.prerelease) return -1
  if (!p1.prerelease && p2.prerelease) return 1
  if (p1.prerelease && p2.prerelease) {
    return p1.prerelease.localeCompare(p2.prerelease)
  }

  return 0
}

export function satisfiesVersion(current: string, required: string): boolean {
  const opMatch = required.match(/^(>=|<=|>|<|=|~|\^)?/)
  const operator = opMatch?.[1] || '='
  const version = required.replace(/^(>=|<=|>|<|=|~|\^)/, '')

  const cmp = compareVersions(current, version)

  switch (operator) {
    case '>':
      return cmp > 0
    case '>=':
      return cmp >= 0
    case '<':
      return cmp < 0
    case '<=':
      return cmp <= 0
    case '=':
    case '':
      return cmp === 0
    case '^':
      return (
        parseVersion(current).major === parseVersion(version).major &&
        (parseVersion(current).major > 0 ||
          parseVersion(current).minor === parseVersion(version).minor)
      )
    case '~':
      return (
        parseVersion(current).major === parseVersion(version).major &&
        parseVersion(current).minor === parseVersion(version).minor
      )
    default:
      return cmp === 0
  }
}

export function checkVersionCompatibility(
  currentVersion: string,
  requiredVersion: string,
  packageName: string,
): CompatibilityResult {
  const isCompatible = satisfiesVersion(currentVersion, requiredVersion)
  const current = parseVersion(currentVersion)
  const required = parseVersion(requiredVersion)

  let message: string
  let suggestion: string | undefined
  let severity: 'error' | 'warning' | 'info'

  if (isCompatible) {
    message = `${packageName}@${currentVersion} 满足要求 ${requiredVersion}`
    severity = 'info'
  } else {
    const cmp = compareVersions(currentVersion, requiredVersion)

    if (cmp < 0) {
      message = `${packageName}@${currentVersion} 版本过低，需要 ${requiredVersion}`
      severity = 'error'

      const patchVersion = Math.max(0, current.patch)
      const suggestedPatch = `${current.major}.${current.minor}.${patchVersion + 1}`
      suggestion = `建议升级到 ${current.major}.${current.minor}.x 或更高版本`
    } else {
      message = `${packageName}@${currentVersion} 版本过高，需要 ${requiredVersion}`
      severity = 'warning'
      suggestion = `建议降级到 ${required.major}.${required.minor}.x 或匹配主版本的兼容版本`
    }
  }

  return {
    compatible: isCompatible,
    currentVersion,
    requiredVersion,
    suggestion,
    severity,
    message,
  }
}

export function findCompatibleVersion(
  availableVersions: string[],
  range: VersionRange,
): string | null {
  let candidates = availableVersions

  if (range.exact) {
    candidates = candidates.filter((v) => v === range.exact)
  } else {
    if (range.min) {
      candidates = candidates.filter((v) => compareVersions(v, range.min!) >= 0)
    }
    if (range.max) {
      candidates = candidates.filter((v) => compareVersions(v, range.max!) <= 0)
    }
  }

  if (candidates.length === 0) return null

  return candidates.sort((a, b) => compareVersions(b, a))[0]
}

export function getCompatibleReactVersions(hostVersion: string): string[] {
  const host = parseVersion(hostVersion)
  const versions: string[] = []

  for (let i = host.major; i >= 15; i--) {
    for (let j = 0; j <= 5; j++) {
      const version = `${i}.${j}.0`
      if (
        checkVersionCompatibility(version, `^${host.major}.0.0`, 'react')
          .compatible
      ) {
        versions.push(version)
      }
    }
  }

  const uniqueVersions: string[] = []
  const seen = new Set<string>()
  for (const v of versions) {
    if (!seen.has(v)) {
      seen.add(v)
      uniqueVersions.push(v)
    }
  }
  return uniqueVersions
}

export async function fetchAvailableVersions(pkg: string): Promise<string[]> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}`)
    if (!res.ok) return []
    const data = await res.json()
    return Object.keys(data.versions || {})
  } catch {
    return []
  }
}

export function sortVersions(
  versions: string[],
  order: 'asc' | 'desc' = 'desc',
): string[] {
  return [...versions].sort((a, b) => {
    const cmp = compareVersions(a, b)
    return order === 'desc' ? -cmp : cmp
  })
}

export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) return null
  return sortVersions(versions, 'desc')[0]
}

export function getStableVersions(versions: string[]): string[] {
  return versions.filter(
    (v) => !v.includes('alpha') && !v.includes('beta') && !v.includes('rc'),
  )
}

export function extractMajorVersion(version: string): number {
  return parseVersion(version).major
}

export function isPrerelease(version: string): boolean {
  const v = parseVersion(version)
  return !!v.prerelease
}

export { parseVersion, compareVersions }
