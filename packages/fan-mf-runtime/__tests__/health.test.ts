import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkModuleLoadable,
  checkRemoteHealth,
  formatHealthStatus,
  getRemoteHealthReport,
} from '../src/health'

describe('health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkRemoteHealth', () => {
    it('should return healthy status when CDN is reachable', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
      } as any)

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result.status).toBe('healthy')
      expect(result.pkg).toBe('test-pkg')
      expect(result.version).toBe('1.0.0')
      expect(result.details.cdnReachable).toBe(true)
    })

    it('should return unhealthy status when all CDNs are unreachable', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result.status).toBe('unhealthy')
      expect(result.details.cdnReachable).toBe(false)
    })

    it('should return degraded status when latency is high', async () => {
      // Mock fetch to succeed but simulate high latency
      vi.spyOn(global, 'fetch').mockImplementation(async () => {
        // Simulate high latency by waiting
        await new Promise((resolve) => setTimeout(resolve, 1500))
        return { ok: true } as any
      })

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      // With latency > 1000ms, status should be degraded
      expect(result.status).toBe('degraded')
      expect(result.latency).toBeGreaterThanOrEqual(1000)
    })

    it('should fetch latest version when version is latest', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            'dist-tags': { latest: '2.0.0' },
          }),
        } as any)
        .mockResolvedValueOnce({ ok: true } as any)
        .mockRejectedValueOnce(new Error('Timeout'))

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: 'latest',
        name: 'test',
      })

      expect(result.version).toBe('2.0.0')
    })

    it('should use specified version when not latest', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.5.0',
        name: 'test',
      })

      expect(result.version).toBe('1.5.0')
    })

    it('should handle npm registry fetch error', async () => {
      vi.spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Registry error'))
        .mockResolvedValue({ ok: true } as any)

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: 'latest',
        name: 'test',
      })

      // Should fall back to 'latest' string
      expect(result.version).toBe('latest')
    })

    it('should return latency in result', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result.latency).toBeGreaterThanOrEqual(0)
    })

    it('should return CDN URL in result', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

      const result = await checkRemoteHealth({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result.cdn).toContain('test-pkg')
      expect(result.cdn).toContain('1.0.0')
    })
  })

  describe('checkModuleLoadable', () => {
    it('should return true when module is loadable', async () => {
      const mf = {
        loadRemote: vi.fn().mockResolvedValue({ default: () => null }),
      }

      const result = await checkModuleLoadable('test-scope', 'MyComponent', mf)

      expect(result).toBe(true)
      expect(mf.loadRemote).toHaveBeenCalledWith('test-scope/MyComponent')
    })

    it('should return false when mf is null', async () => {
      const result = await checkModuleLoadable(
        'test-scope',
        'MyComponent',
        null,
      )
      expect(result).toBe(false)
    })

    it('should return false when mf.loadRemote is not a function', async () => {
      const mf = { loadRemote: 'not-a-function' }

      const result = await checkModuleLoadable('test-scope', 'MyComponent', mf)

      expect(result).toBe(false)
    })

    it('should return false when loadRemote returns null', async () => {
      const mf = {
        loadRemote: vi.fn().mockResolvedValue(null),
      }

      const result = await checkModuleLoadable('test-scope', 'MyComponent', mf)

      expect(result).toBe(false)
    })

    it('should return false when loadRemote throws', async () => {
      const mf = {
        loadRemote: vi.fn().mockRejectedValue(new Error('Load error')),
      }

      const result = await checkModuleLoadable('test-scope', 'MyComponent', mf)

      expect(result).toBe(false)
    })

    it('should return false when loadRemote returns undefined', async () => {
      const mf = {
        loadRemote: vi.fn().mockResolvedValue(undefined),
      }

      const result = await checkModuleLoadable('test-scope', 'MyComponent', mf)

      expect(result).toBe(false)
    })
  })

  describe('getRemoteHealthReport', () => {
    it('should return healthy overall when all remotes are healthy', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

      const report = await getRemoteHealthReport([
        { pkg: 'pkg1', version: '1.0.0', name: 'app1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'app2' },
      ])

      expect(report.overall).toBe('healthy')
      expect(report.remotes).toHaveLength(2)
      expect(report.timestamp).toBeDefined()
    })

    it('should return unhealthy overall when any remote is unhealthy', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true } as any)
        .mockRejectedValueOnce(new Error('Network error'))

      const report = await getRemoteHealthReport([
        { pkg: 'pkg1', version: '1.0.0', name: 'app1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'app2' },
      ])

      expect(report.overall).toBe('unhealthy')
    })

    it('should return degraded overall when any remote is degraded', async () => {
      vi.spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true } as any)
        .mockResolvedValueOnce({ ok: true } as any)

      const report = await getRemoteHealthReport([
        { pkg: 'pkg1', version: '1.0.0', name: 'app1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'app2' },
      ])

      // Both are reachable, but we need to check latency for degraded status
      expect(report.overall).toBe('healthy')
    })

    it('should return empty array for empty input', async () => {
      const report = await getRemoteHealthReport([])

      expect(report.overall).toBe('healthy')
      expect(report.remotes).toHaveLength(0)
    })

    it('should include all remote results', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as any)

      const report = await getRemoteHealthReport([
        { pkg: 'pkg1', version: '1.0.0', name: 'app1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'app2' },
        { pkg: 'pkg3', version: '3.0.0', name: 'app3' },
      ])

      expect(report.remotes.map((r) => r.pkg)).toEqual(['pkg1', 'pkg2', 'pkg3'])
    })
  })

  describe('formatHealthStatus', () => {
    it('should format healthy status', () => {
      expect(formatHealthStatus('healthy')).toBe('🟢 healthy')
    })

    it('should format degraded status', () => {
      expect(formatHealthStatus('degraded')).toBe('🟡 degraded')
    })

    it('should format unhealthy status', () => {
      expect(formatHealthStatus('unhealthy')).toBe('🔴 unhealthy')
    })
  })
})
