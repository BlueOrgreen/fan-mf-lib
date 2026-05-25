import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildCdnUrls,
  buildFinalUrls,
  fetchLatestVersion,
  getFinalSharedConfig,
  getVersionCache,
  resolveFinalVersion,
  setVersionCache,
  tryLoadRemote,
} from '../src/loader/utils'

// Mock @module-federation/enhanced/runtime
vi.mock('@module-federation/enhanced/runtime', () => ({
  createInstance: vi.fn(() => ({
    loadRemote: vi.fn(),
    cleanup: vi.fn(),
  })),
}))

describe('loader/utils', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    // 清除模块内部的缓存
    const utils = await import('../src/loader/utils')
    // 重置缓存 Map
    utils.mfInstanceCache.clear()
    utils.mfInstanceLoadingCache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetchLatestVersion', () => {
    it('should fetch latest version from npm registry', async () => {
      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': {
            latest: '2.0.0',
            beta: '2.0.0-beta.1',
          },
        }),
      } as any)

      const result = await fetchLatestVersion('test-pkg')
      expect(result).toBe('2.0.0')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://registry.npmjs.org/test-pkg',
      )
    })

    it('should throw error when fetch fails', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 404,
      } as any)

      await expect(fetchLatestVersion('test-pkg')).rejects.toThrow(
        '[MF] 无法获取 test-pkg 的版本信息，状态码：404',
      )
    })

    it('should throw error when latest tag is missing', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': {},
        }),
      } as any)

      await expect(fetchLatestVersion('test-pkg')).rejects.toThrow(
        '[MF] 无法从 NPM 获取 test-pkg 的 latest tag',
      )
    })
  })

  describe('getVersionCache', () => {
    it('should return empty object when cache is empty', () => {
      const result = getVersionCache()
      expect(result).toEqual({})
    })

    it('should return cached versions', () => {
      localStorage.setItem(
        'mf-multi-version',
        JSON.stringify({
          'test-pkg': {
            '1.0.0': { timestamp: Date.now() },
            '2.0.0': { timestamp: Date.now() },
          },
        }),
      )

      const result = getVersionCache()
      expect(result).toEqual({
        'test-pkg': {
          '1.0.0': { timestamp: expect.any(Number) },
          '2.0.0': { timestamp: expect.any(Number) },
        },
      })
    })

    it('should return empty object when localStorage throws error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      const result = getVersionCache()
      expect(result).toEqual({})
    })
  })

  describe('setVersionCache', () => {
    it('should write version cache to localStorage', () => {
      setVersionCache('test-pkg', '1.0.0')

      const cache = JSON.parse(localStorage.getItem('mf-multi-version')!)
      expect(cache['test-pkg']['1.0.0']).toBeDefined()
      expect(cache['test-pkg']['1.0.0'].timestamp).toBeDefined()
    })

    it('should preserve existing packages in cache', () => {
      localStorage.setItem(
        'mf-multi-version',
        JSON.stringify({
          'existing-pkg': {
            '1.0.0': { timestamp: 123456 },
          },
        }),
      )

      setVersionCache('new-pkg', '2.0.0')

      const cache = JSON.parse(localStorage.getItem('mf-multi-version')!)
      expect(cache['existing-pkg']).toBeDefined()
      expect(cache['new-pkg']).toBeDefined()
    })

    it('should handle localStorage errors gracefully', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full')
      })

      expect(() => setVersionCache('test-pkg', '1.0.0')).not.toThrow()
    })
  })

  describe('buildCdnUrls', () => {
    it('should build CDN URLs from templates', () => {
      const urls = buildCdnUrls('test-pkg', '1.0.0')
      expect(urls).toEqual([
        'https://cdn.jsdelivr.net/npm/test-pkg@1.0.0/dist/remoteEntry.js',
        'https://unpkg.com/test-pkg@1.0.0/dist/remoteEntry.js',
      ])
    })

    it('should handle special characters in package name', () => {
      const urls = buildCdnUrls('@scope/test-pkg', '1.0.0')
      expect(urls[0]).toBe(
        'https://cdn.jsdelivr.net/npm/@scope/test-pkg@1.0.0/dist/remoteEntry.js',
      )
    })
  })

  describe('getFinalSharedConfig', () => {
    it('should return default shared config', () => {
      const result = getFinalSharedConfig()
      expect(result).toEqual({
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
      })
    })

    it('should merge custom shared config', () => {
      const customConfig = {
        'custom-lib': {
          singleton: false,
          eager: false,
        },
      }

      const result = getFinalSharedConfig(customConfig)
      expect(result.react).toBeDefined()
      expect(result['react-dom']).toBeDefined()
      expect(result['custom-lib']).toEqual(customConfig['custom-lib'])
    })

    it('should handle undefined custom config', () => {
      const result = getFinalSharedConfig(undefined)
      expect(result.react).toBeDefined()
      expect(result['react-dom']).toBeDefined()
    })
  })

  describe('buildFinalUrls', () => {
    it('should return CDN URLs without local fallback', () => {
      const urls = buildFinalUrls('test-pkg', '1.0.0')
      expect(urls).toHaveLength(2)
      expect(urls[0]).toContain('cdn.jsdelivr.net')
      expect(urls[1]).toContain('unpkg.com')
    })

    it('should append local fallback when provided', () => {
      const urls = buildFinalUrls(
        'test-pkg',
        '1.0.0',
        'http://localhost:3000/remoteEntry.js',
      )
      expect(urls).toHaveLength(3)
      expect(urls[2]).toBe('http://localhost:3000/remoteEntry.js')
    })
  })

  describe('resolveFinalVersion', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('should return version directly when not latest', async () => {
      const result = await resolveFinalVersion(
        'test-pkg',
        '1.0.0',
        86400000,
        true,
      )
      expect(result).toBe('1.0.0')
    })

    it('should use cached version when available and not expired', async () => {
      localStorage.setItem(
        'mf-multi-version',
        JSON.stringify({
          'test-pkg': {
            '1.5.0': { timestamp: Date.now() },
          },
        }),
      )

      const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '2.0.0' },
        }),
      } as any)

      const result = await resolveFinalVersion(
        'test-pkg',
        'latest',
        86400000,
        false,
      )
      expect(result).toBe('1.5.0')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fetch latest when cache is expired', async () => {
      const expiredTimestamp = Date.now() - 86400000 * 2
      localStorage.setItem(
        'mf-multi-version',
        JSON.stringify({
          'test-pkg': {
            '1.0.0': { timestamp: expiredTimestamp },
          },
        }),
      )

      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '2.0.0' },
        }),
      } as any)

      const result = await resolveFinalVersion(
        'test-pkg',
        'latest',
        86400000,
        false,
      )
      expect(result).toBe('2.0.0')
    })

    it('should fetch latest when cache is empty', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '2.0.0' },
        }),
      } as any)

      const result = await resolveFinalVersion(
        'test-pkg',
        'latest',
        86400000,
        false,
      )
      expect(result).toBe('2.0.0')
    })

    it('should trigger async revalidate when enabled', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '2.0.0' },
        }),
      } as any)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await resolveFinalVersion(
        'test-pkg',
        'latest',
        86400000,
        true,
      )
      expect(result).toBe('2.0.0')

      // Wait for async revalidation
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('tryLoadRemote', () => {
    it('should create instance and return mf instance on success', async () => {
      const { createInstance } = await import(
        '@module-federation/enhanced/runtime'
      )
      vi.mocked(createInstance).mockReturnValue({
        name: 'host',
        loadRemote: vi.fn(),
      } as any)

      const result = await tryLoadRemote(
        'test-scope',
        'http://example.com/remoteEntry.js',
        3,
        1000,
        {},
        [],
      )

      expect(result.scopeName).toBe('test-scope')
      expect(result.mf).toBeDefined()
      expect(createInstance).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const { createInstance } = await import(
        '@module-federation/enhanced/runtime'
      )
      vi.mocked(createInstance).mockImplementation(() => {
        throw new Error('Load failed')
      })

      await expect(
        tryLoadRemote(
          'test-scope',
          'http://example.com/remoteEntry.js',
          3,
          10,
          {},
          [],
        ),
      ).rejects.toThrow()

      // Should have been called 3 times (retries)
      expect(createInstance).toHaveBeenCalledTimes(3)
    })

    it('should respect delay between retries', async () => {
      const { createInstance } = await import(
        '@module-federation/enhanced/runtime'
      )
      vi.mocked(createInstance).mockImplementation(() => {
        throw new Error('Load failed')
      })

      const startTime = Date.now()

      await expect(
        tryLoadRemote(
          'test-scope',
          'http://example.com/remoteEntry.js',
          3,
          50,
          {},
          [],
        ),
      ).rejects.toThrow()

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeGreaterThanOrEqual(100) // 2 delays of 50ms
    })

    it('should include fallback plugin in instance creation', async () => {
      const { createInstance } = await import(
        '@module-federation/enhanced/runtime'
      )
      vi.mocked(createInstance).mockReturnValue({
        name: 'host',
        loadRemote: vi.fn(),
      } as any)

      await tryLoadRemote(
        'test-scope',
        'http://example.com/remoteEntry.js',
        1,
        1000,
        {},
        [],
      )

      const callArgs = vi.mocked(createInstance).mock.calls[0][0]
      expect(callArgs?.plugins).toBeDefined()
    })
  })
})
