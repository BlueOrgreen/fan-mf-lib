import { describe, expect, it } from 'vitest'
import type {
  LoadRemoteOptions,
  PreloadCacheItem,
  PreloadOptions,
  PreloadStatus,
  VersionCache,
} from '../src/types'

describe('Types', () => {
  describe('LoadRemoteOptions', () => {
    it('should accept valid options', () => {
      const options: LoadRemoteOptions = {
        name: 'test-remote',
        pkg: 'test-pkg',
        version: '1.0.0',
        retries: 3,
        delay: 1000,
        localFallback: 'http://localhost:3000/remoteEntry.js',
        cacheTTL: 86400000,
        revalidate: true,
        shared: {},
      }

      expect(options.name).toBe('test-remote')
      expect(options.pkg).toBe('test-pkg')
      expect(options.version).toBe('1.0.0')
    })

    it('should have optional version', () => {
      const options: LoadRemoteOptions = {
        name: 'test',
        pkg: 'pkg',
      }

      expect(options.version).toBeUndefined()
    })

    it('should allow undefined shared config', () => {
      const options: LoadRemoteOptions = {
        name: 'test',
        pkg: 'pkg',
        shared: undefined,
      }

      expect(options.shared).toBeUndefined()
    })
  })

  describe('VersionCache', () => {
    it('should allow nested version entries', () => {
      const cache: VersionCache = {
        'test-pkg': {
          '1.0.0': { timestamp: Date.now() },
          '1.1.0': { timestamp: Date.now() },
        },
      }

      expect(cache['test-pkg']['1.0.0']).toBeDefined()
    })
  })

  describe('PreloadOptions', () => {
    it('should extend LoadRemoteOptions', () => {
      const options: PreloadOptions = {
        name: 'test',
        pkg: 'pkg',
        priority: 'high',
        force: true,
      }

      expect(options.priority).toBe('high')
      expect(options.force).toBe(true)
    })

    it('should allow idle priority', () => {
      const options: PreloadOptions = {
        name: 'test',
        pkg: 'pkg',
        priority: 'idle',
      }

      expect(options.priority).toBe('idle')
    })
  })

  describe('PreloadCacheItem', () => {
    it('should have required fields', () => {
      const item: PreloadCacheItem = {
        version: '1.0.0',
        scopeName: 'test',
        mf: {},
        timestamp: Date.now(),
      }

      expect(item.version).toBe('1.0.0')
      expect(item.scopeName).toBe('test')
      expect(item.mf).toEqual({})
    })
  })

  describe('PreloadStatus', () => {
    it('should return status info', () => {
      const status: PreloadStatus = {
        loaded: true,
        timestamp: Date.now(),
      }

      expect(status.loaded).toBe(true)
      expect(status.timestamp).toBeDefined()
    })
  })
})
