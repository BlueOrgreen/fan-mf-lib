import { describe, expect, it } from 'vitest'
import {
  checkVersionCompatibility,
  compareVersions,
  extractMajorVersion,
  findCompatibleVersion,
  getLatestVersion,
  getStableVersions,
  isPrerelease,
  parseVersion,
  satisfiesVersion,
  sortVersions,
} from '../src/version'

describe('parseVersion', () => {
  it('should parse standard version', () => {
    const result = parseVersion('1.2.3')
    expect(result.major).toBe(1)
    expect(result.minor).toBe(2)
    expect(result.patch).toBe(3)
    expect(result.raw).toBe('1.2.3')
  })

  it('should parse version with v prefix', () => {
    const result = parseVersion('v2.0.0')
    expect(result.major).toBe(2)
    expect(result.raw).toBe('2.0.0')
  })

  it('should parse version with prerelease', () => {
    const result = parseVersion('1.0.0-alpha.1')
    expect(result.major).toBe(1)
    expect(result.prerelease).toBe('alpha.1')
  })

  it('should handle invalid version parts', () => {
    const result = parseVersion('x.y.z')
    expect(result.major).toBe(0)
    expect(result.minor).toBe(0)
    expect(result.patch).toBe(0)
  })
})

describe('compareVersions', () => {
  it('should return 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0)
  })

  it('should return positive when v1 > v2', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBeGreaterThan(0)
    expect(compareVersions('1.3.0', '1.2.0')).toBeGreaterThan(0)
    expect(compareVersions('1.2.3', '1.2.2')).toBeGreaterThan(0)
  })

  it('should return negative when v1 < v2', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBeLessThan(0)
    expect(compareVersions('1.2.0', '1.3.0')).toBeLessThan(0)
  })

  it('should handle prerelease versions', () => {
    expect(compareVersions('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0)
  })
})

describe('satisfiesVersion', () => {
  it('should match exact version', () => {
    expect(satisfiesVersion('1.2.3', '1.2.3')).toBe(true)
    expect(satisfiesVersion('1.2.3', '1.2.4')).toBe(false)
  })

  it('should match with >= operator', () => {
    expect(satisfiesVersion('2.0.0', '>=1.0.0')).toBe(true)
    expect(satisfiesVersion('1.0.0', '>=1.0.0')).toBe(true)
    expect(satisfiesVersion('0.9.0', '>=1.0.0')).toBe(false)
  })

  it('should match with > operator', () => {
    expect(satisfiesVersion('2.0.0', '>1.0.0')).toBe(true)
    expect(satisfiesVersion('1.0.0', '>1.0.0')).toBe(false)
  })

  it('should match with <= operator', () => {
    expect(satisfiesVersion('1.0.0', '<=2.0.0')).toBe(true)
    expect(satisfiesVersion('2.0.0', '<=2.0.0')).toBe(true)
    expect(satisfiesVersion('3.0.0', '<=2.0.0')).toBe(false)
  })

  it('should match with < operator', () => {
    expect(satisfiesVersion('1.0.0', '<2.0.0')).toBe(true)
    expect(satisfiesVersion('2.0.0', '<2.0.0')).toBe(false)
  })

  it('should match caret (^) ranges', () => {
    expect(satisfiesVersion('1.2.3', '^1.0.0')).toBe(true)
    expect(satisfiesVersion('2.0.0', '^1.0.0')).toBe(false)
    expect(satisfiesVersion('1.5.0', '^1.0.0')).toBe(true)
    expect(satisfiesVersion('0.5.0', '^0.5.0')).toBe(true)
  })

  it('should match tilde (~) ranges', () => {
    expect(satisfiesVersion('1.2.3', '~1.2.0')).toBe(true)
    expect(satisfiesVersion('1.3.0', '~1.2.0')).toBe(false)
    expect(satisfiesVersion('1.2.0', '~1.2.0')).toBe(true)
  })
})

describe('checkVersionCompatibility', () => {
  it('should return compatible for matching versions', () => {
    const result = checkVersionCompatibility('1.2.3', '1.2.3', 'test-pkg')
    expect(result.compatible).toBe(true)
    expect(result.severity).toBe('info')
  })

  it('should return error for version too low', () => {
    const result = checkVersionCompatibility('1.0.0', '^2.0.0', 'test-pkg')
    expect(result.compatible).toBe(false)
    expect(result.severity).toBe('warning')
    expect(result.suggestion).toBeDefined()
  })

  it('should return warning for version too high', () => {
    const result = checkVersionCompatibility('3.0.0', '^1.0.0', 'test-pkg')
    expect(result.compatible).toBe(false)
    expect(result.severity).toBe('warning')
    expect(result.suggestion).toBeDefined()
  })
})

describe('findCompatibleVersion', () => {
  const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0']

  it('should find exact version', () => {
    const result = findCompatibleVersion(versions, { exact: '1.1.0' })
    expect(result).toBe('1.1.0')
  })

  it('should find version in range', () => {
    const result = findCompatibleVersion(versions, {
      min: '1.1.0',
      max: '2.0.0',
    })
    expect(result).toBe('2.0.0')
  })

  it('should return null when no compatible version', () => {
    const result = findCompatibleVersion(versions, { min: '3.0.0' })
    expect(result).toBeNull()
  })
})

describe('sortVersions', () => {
  it('should sort in descending order by default', () => {
    const versions = ['1.0.0', '3.0.0', '2.0.0']
    const result = sortVersions(versions)
    expect(result).toEqual(['3.0.0', '2.0.0', '1.0.0'])
  })

  it('should sort in ascending order', () => {
    const versions = ['1.0.0', '3.0.0', '2.0.0']
    const result = sortVersions(versions, 'asc')
    expect(result).toEqual(['1.0.0', '2.0.0', '3.0.0'])
  })
})

describe('getLatestVersion', () => {
  it('should return latest version', () => {
    const versions = ['1.0.0', '3.0.0', '2.0.0']
    expect(getLatestVersion(versions)).toBe('3.0.0')
  })

  it('should return null for empty array', () => {
    expect(getLatestVersion([])).toBeNull()
  })
})

describe('getStableVersions', () => {
  it('should filter out prerelease versions', () => {
    const versions = ['1.0.0', '2.0.0-alpha', '3.0.0-beta', '1.5.0']
    const result = getStableVersions(versions)
    expect(result).toEqual(['1.0.0', '1.5.0'])
  })
})

describe('extractMajorVersion', () => {
  it('should extract major version', () => {
    expect(extractMajorVersion('1.2.3')).toBe(1)
    expect(extractMajorVersion('18.3.1')).toBe(18)
  })
})

describe('isPrerelease', () => {
  it('should return true for prerelease versions', () => {
    expect(isPrerelease('1.0.0-alpha')).toBe(true)
    expect(isPrerelease('2.0.0-beta.1')).toBe(true)
    expect(isPrerelease('3.0.0-rc.1')).toBe(true)
  })

  it('should return false for stable versions', () => {
    expect(isPrerelease('1.0.0')).toBe(false)
    expect(isPrerelease('2.3.4')).toBe(false)
  })
})
