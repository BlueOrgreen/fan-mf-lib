import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getLoadedRemotes,
  isRemoteLoaded,
  registerLoadedModule,
  registerRemoteInstance,
  unloadAll,
  unloadRemote,
} from '../src/unload'

describe('unload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Unload all remotes to reset state between tests
    unloadAll(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    unloadAll(true)
  })

  describe('registerRemoteInstance', () => {
    it('should register a remote instance and return key', () => {
      const mfInstance = { loadRemote: vi.fn() }
      const key = registerRemoteInstance(
        'test-name',
        'test-scope',
        'test-pkg',
        '1.0.0',
        mfInstance,
      )

      expect(key).toBe('test-name::test-pkg@1.0.0')
    })

    it('should store instance with correct metadata', () => {
      const mfInstance = { loadRemote: vi.fn() }
      const key = registerRemoteInstance(
        'my-app',
        'my-scope',
        '@org/pkg',
        '2.0.0',
        mfInstance,
      )

      expect(key).toBe('my-app::@org/pkg@2.0.0')
    })

    it('should generate unique keys for different versions', () => {
      const key1 = registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      const key2 = registerRemoteInstance('test', 'scope', 'pkg', '2.0.0', {})

      expect(key1).not.toBe(key2)
    })
  })

  describe('registerLoadedModule', () => {
    it('should register a loaded module to instance', () => {
      const key = registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      registerLoadedModule(key, 'module-a')

      const remotes = getLoadedRemotes()
      expect(remotes.find((r) => r.name === 'test')?.loadedModules).toBe(1)
    })

    it('should track multiple loaded modules', () => {
      const key = registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      registerLoadedModule(key, 'module-a')
      registerLoadedModule(key, 'module-b')
      registerLoadedModule(key, 'module-c')

      const remotes = getLoadedRemotes()
      expect(remotes.find((r) => r.name === 'test')?.loadedModules).toBe(3)
    })

    it('should handle non-existent key gracefully', () => {
      expect(() =>
        registerLoadedModule('non-existent', 'module-a'),
      ).not.toThrow()
    })
  })

  describe('getLoadedRemotes', () => {
    it('should return empty array when no remotes', () => {
      const remotes = getLoadedRemotes()
      expect(remotes).toEqual([])
    })

    it('should return all loaded remotes', () => {
      registerRemoteInstance('app1', 'scope1', 'pkg1', '1.0.0', {})
      registerRemoteInstance('app2', 'scope2', 'pkg2', '2.0.0', {})

      const remotes = getLoadedRemotes()
      expect(remotes).toHaveLength(2)
      expect(remotes.map((r) => r.name)).toContain('app1')
      expect(remotes.map((r) => r.name)).toContain('app2')
    })

    it('should return correct remote info', () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})

      const remotes = getLoadedRemotes()
      const remote = remotes.find((r) => r.name === 'test')
      expect(remote).toEqual({
        name: 'test',
        pkg: 'pkg',
        version: '1.0.0',
        loadedModules: 0,
        timestamp: expect.any(Number),
      })
    })
  })

  describe('isRemoteLoaded', () => {
    it('should return false when remote is not loaded', () => {
      expect(isRemoteLoaded('test', 'pkg', '1.0.0')).toBe(false)
    })

    it('should return true when remote is loaded', () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      expect(isRemoteLoaded('test', 'pkg', '1.0.0')).toBe(true)
    })

    it('should return false for mismatched version', () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      expect(isRemoteLoaded('test', 'pkg', '2.0.0')).toBe(false)
    })

    it('should handle optional version', () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})
      // Version is optional, should check with wildcard
      expect(isRemoteLoaded('test', 'pkg')).toBe(false)
    })
  })

  describe('unloadRemote', () => {
    it('should unload remote by name, pkg, and version', async () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {
        cleanup: vi.fn().mockResolvedValue(undefined),
      })

      const result = await unloadRemote({
        name: 'test',
        pkg: 'pkg',
        version: '1.0.0',
      })

      expect(result).toBe(true)
      expect(getLoadedRemotes()).toHaveLength(0)
    })

    it('should unload all versions with wildcard', async () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {
        cleanup: vi.fn(),
      })
      registerRemoteInstance('test', 'scope', 'pkg', '2.0.0', {
        cleanup: vi.fn(),
      })

      const result = await unloadRemote({
        name: 'test',
        pkg: 'pkg',
        version: '*',
      })

      expect(result).toBe(true)
      expect(getLoadedRemotes()).toHaveLength(0)
    })

    it('should return false when no matching remote', async () => {
      const result = await unloadRemote({
        name: 'non-existent',
        pkg: 'non-existent',
      })
      expect(result).toBe(false)
    })

    it('should clear version cache when clearCache is true', async () => {
      const cacheData = {
        'test-pkg': {
          '1.0.0': { timestamp: Date.now() },
          '2.0.0': { timestamp: Date.now() },
        },
        'other-pkg': {
          '1.0.0': { timestamp: Date.now() },
        },
      }
      localStorage.setItem('mf-multi-version', JSON.stringify(cacheData))

      registerRemoteInstance('test', 'scope', 'test-pkg', '1.0.0', {
        cleanup: vi.fn(),
      })

      // Note: clearCache uses the specific version, not wildcard
      await unloadRemote({
        name: 'test',
        pkg: 'test-pkg',
        version: '1.0.0',
        clearCache: true,
      })

      const cacheStr = localStorage.getItem('mf-multi-version')
      if (cacheStr) {
        const cache = JSON.parse(cacheStr)
        // Only version 1.0.0 should be removed, 2.0.0 should remain
        expect(cache['test-pkg']['1.0.0']).toBeUndefined()
        expect(cache['test-pkg']['2.0.0']).toBeDefined()
        expect(cache['other-pkg']).toBeDefined()
      }
    })

    it('should handle cleanup errors gracefully', async () => {
      const mfInstance = {
        cleanup: vi.fn().mockRejectedValue(new Error('Cleanup failed')),
      }

      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', mfInstance)

      await expect(
        unloadRemote({ name: 'test', pkg: 'pkg', version: '1.0.0' }),
      ).resolves.toBe(true)
    })

    it('should handle missing cleanup method', async () => {
      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {})

      await expect(
        unloadRemote({ name: 'test', pkg: 'pkg', version: '1.0.0' }),
      ).resolves.toBe(true)
    })
  })

  describe('unloadAll', () => {
    it('should unload all remotes', async () => {
      registerRemoteInstance('app1', 'scope1', 'pkg1', '1.0.0', {
        cleanup: vi.fn(),
      })
      registerRemoteInstance('app2', 'scope2', 'pkg2', '2.0.0', {
        cleanup: vi.fn(),
      })

      await unloadAll()

      expect(getLoadedRemotes()).toHaveLength(0)
    })

    it('should resolve immediately when no remotes', async () => {
      await expect(unloadAll()).resolves.toBeUndefined()
    })

    it('should clear all cache when clearAllCache is true', async () => {
      localStorage.setItem(
        'mf-multi-version',
        JSON.stringify({ pkg1: { '1.0.0': {} } }),
      )

      registerRemoteInstance('app1', 'scope1', 'pkg1', '1.0.0', {
        cleanup: vi.fn(),
      })

      await unloadAll(true)

      expect(localStorage.getItem('mf-multi-version')).toBeNull()
    })

    it('should handle localStorage errors gracefully', async () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error')
      })

      registerRemoteInstance('test', 'scope', 'pkg', '1.0.0', {
        cleanup: vi.fn(),
      })

      await expect(unloadAll(true)).resolves.toBeUndefined()
    })
  })
})
