import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/loader', async () => {
  return {
    loadRemoteMultiVersion: vi.fn(),
  }
})

import { loadRemoteMultiVersion } from '../src/loader'
import {
  cancelPreload,
  clearPreloadCache,
  getPreloadStatus,
  preloadRemote,
  preloadRemoteList,
} from '../src/preload'

const mockLoadRemoteMultiVersion = vi.mocked(loadRemoteMultiVersion)

describe('preload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadRemoteMultiVersion.mockClear()
    // Clear the internal cache by calling clearPreloadCache
    clearPreloadCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearPreloadCache()
  })

  describe('preloadRemote', () => {
    it('should preload remote module successfully', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      const result = await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result).toEqual({
        scopeName: 'test-scope',
        mf: { loaded: true },
      })
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(1)
    })

    it('should return cached result when not forced', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      // First call - should load
      await preloadRemote({ pkg: 'test-pkg', version: '1.0.0', name: 'test' })

      // Second call - should use cache (not call loadRemoteMultiVersion again)
      const result = await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result).toEqual({
        scopeName: 'test-scope',
        mf: { loaded: true },
      })
      // Should still be called only once because of cache
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(1)
    })

    it('should force reload when force option is true', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      await preloadRemote({ pkg: 'test-pkg', version: '1.0.0', name: 'test' })
      await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
        force: true,
      })

      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(2)
    })

    it('should use high priority to load immediately', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      const result = await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
        priority: 'high',
      })

      expect(result).toBeDefined()
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(1)
    })

    it('should use idle priority with requestIdleCallback fallback', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      const result = await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
        priority: 'idle',
      })

      expect(result).toBeDefined()
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(1)
    })

    it('should return null when loading fails', async () => {
      mockLoadRemoteMultiVersion.mockRejectedValue(new Error('Load failed'))

      const result = await preloadRemote({
        pkg: 'test-pkg',
        version: '1.0.0',
        name: 'test',
      })

      expect(result).toBeNull()
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(1)
    })

    it('should cache the loaded result', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      await preloadRemote({ pkg: 'test-pkg', version: '1.0.0', name: 'test' })

      const status = getPreloadStatus('test-pkg')
      expect(status).toEqual({
        loaded: true,
        timestamp: expect.any(Number),
      })
    })
  })

  describe('preloadRemoteList', () => {
    it('should preload multiple remotes', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      const results = await preloadRemoteList([
        { pkg: 'pkg1', version: '1.0.0', name: 'test1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'test2' },
      ])

      expect(results).toHaveLength(2)
      expect(mockLoadRemoteMultiVersion).toHaveBeenCalledTimes(2)
    })

    it('should call progress callback', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      const onProgress = vi.fn()

      await preloadRemoteList(
        [
          { pkg: 'pkg1', version: '1.0.0', name: 'test1' },
          { pkg: 'pkg2', version: '2.0.0', name: 'test2' },
        ],
        onProgress,
      )

      expect(onProgress).toHaveBeenCalledTimes(2)
      expect(onProgress).toHaveBeenCalledWith(1, 2)
      expect(onProgress).toHaveBeenCalledWith(2, 2)
    })

    it('should handle empty list', async () => {
      const results = await preloadRemoteList([])
      expect(results).toEqual([])
    })

    it('should continue loading even if some items fail', async () => {
      mockLoadRemoteMultiVersion
        .mockResolvedValueOnce({ scopeName: 'scope1', mf: {} } as any)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ scopeName: 'scope3', mf: {} } as any)

      const results = await preloadRemoteList([
        { pkg: 'pkg1', version: '1.0.0', name: 'test1' },
        { pkg: 'pkg2', version: '2.0.0', name: 'test2' },
        { pkg: 'pkg3', version: '3.0.0', name: 'test3' },
      ])

      expect(results[0]).toBeDefined()
      expect(results[1]).toBeNull()
      expect(results[2]).toBeDefined()
    })
  })

  describe('cancelPreload', () => {
    it('should cancel cached preload', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      await preloadRemote({ pkg: 'test-pkg', version: '1.0.0', name: 'test' })

      let status = getPreloadStatus('test-pkg')
      expect(status?.loaded).toBe(true)

      cancelPreload('test-pkg')

      status = getPreloadStatus('test-pkg')
      expect(status).toBeNull()
    })

    it('should handle non-existent package gracefully', () => {
      expect(() => cancelPreload('non-existent')).not.toThrow()
    })
  })

  describe('clearPreloadCache', () => {
    it('should clear all preload cache', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      await preloadRemote({ pkg: 'pkg1', version: '1.0.0', name: 'test1' })
      await preloadRemote({ pkg: 'pkg2', version: '2.0.0', name: 'test2' })

      expect(getPreloadStatus('pkg1')).toBeDefined()
      expect(getPreloadStatus('pkg2')).toBeDefined()

      clearPreloadCache()

      expect(getPreloadStatus('pkg1')).toBeNull()
      expect(getPreloadStatus('pkg2')).toBeNull()
    })
  })

  describe('getPreloadStatus', () => {
    it('should return null for non-existent package', () => {
      const status = getPreloadStatus('non-existent')
      expect(status).toBeNull()
    })

    it('should return status for loaded package', async () => {
      mockLoadRemoteMultiVersion.mockResolvedValue({
        scopeName: 'test-scope',
        mf: { loaded: true },
      } as any)

      await preloadRemote({ pkg: 'test-pkg', version: '1.0.0', name: 'test' })

      const status = getPreloadStatus('test-pkg')
      expect(status).toEqual({
        loaded: true,
        timestamp: expect.any(Number),
      })
    })
  })
})
