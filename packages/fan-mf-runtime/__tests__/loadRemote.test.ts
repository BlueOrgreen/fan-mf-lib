import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadRemoteMultiVersion } from '../src/loader'

vi.mock('../src/loader/utils', async () => {
  const actual = await vi.importActual('../src/loader/utils')
  return {
    ...(actual as any),
    resolveFinalVersion: vi.fn(),
    buildFinalUrls: vi.fn(),
    getFinalSharedConfig: vi.fn(),
    tryLoadRemote: vi.fn(),
  }
})

const {
  resolveFinalVersion,
  buildFinalUrls,
  getFinalSharedConfig,
  tryLoadRemote,
} = await import('../src/loader/utils')

describe('loader/index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('loadRemoteMultiVersion', () => {
    const baseOptions = {
      name: 'test-module',
      pkg: 'test-pkg',
      version: '1.0.0',
    }

    it('should load remote successfully', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
        'http://cdn2.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({
        scopeName: 'test-module',
        mf: {},
      })

      const result = await loadRemoteMultiVersion(baseOptions, [])

      expect(result).toEqual({ scopeName: 'test-module', mf: {} })
      expect(resolveFinalVersion).toHaveBeenCalledWith(
        'test-pkg',
        '1.0.0',
        86400000,
        true,
      )
      expect(buildFinalUrls).toHaveBeenCalledWith(
        'test-pkg',
        '1.0.0',
        undefined,
      )
      expect(getFinalSharedConfig).toHaveBeenCalledWith(undefined)
    })

    it('should use default options', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({ scopeName: 'test', mf: {} })

      await loadRemoteMultiVersion(
        {
          name: 'test',
          pkg: 'test-pkg',
        },
        [],
      )

      expect(resolveFinalVersion).toHaveBeenCalledWith(
        'test-pkg',
        'latest',
        86400000,
        true,
      )
    })

    it('should use custom options', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('2.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({ scopeName: 'test', mf: {} })

      await loadRemoteMultiVersion(
        {
          name: 'test',
          pkg: 'test-pkg',
          version: '2.0.0',
          retries: 5,
          delay: 2000,
          localFallback: 'http://localhost:3000/remoteEntry.js',
          cacheTTL: 3600000,
          revalidate: false,
          shared: { custom: {} },
        },
        [],
      )

      expect(resolveFinalVersion).toHaveBeenCalledWith(
        'test-pkg',
        '2.0.0',
        3600000,
        false,
      )
      expect(buildFinalUrls).toHaveBeenCalledWith(
        'test-pkg',
        '2.0.0',
        'http://localhost:3000/remoteEntry.js',
      )
      expect(getFinalSharedConfig).toHaveBeenCalledWith({ custom: {} })
    })

    it('should try multiple URLs on failure', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
        'http://cdn2.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote)
        .mockRejectedValueOnce(new Error('CDN1 failed'))
        .mockResolvedValueOnce({ scopeName: 'test-scope', mf: {} })

      const result = await loadRemoteMultiVersion(baseOptions, [])

      expect(result).toBeDefined()
      expect(tryLoadRemote).toHaveBeenCalledTimes(2)
    })

    it('should throw error when all URLs fail', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
        'http://cdn2.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockRejectedValue(new Error('Load failed'))

      await expect(loadRemoteMultiVersion(baseOptions, [])).rejects.toThrow(
        '[MF] 所有加载源 (2 个) 均加载失败。',
      )
    })

    it('should pass plugins to tryLoadRemote', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({
        scopeName: 'test-module',
        mf: {},
      })

      const plugins = [{ name: 'test-plugin' }]
      await loadRemoteMultiVersion(baseOptions, plugins as any)

      expect(tryLoadRemote).toHaveBeenCalledWith(
        'test-module',
        expect.any(String),
        3,
        1000,
        {},
        plugins,
        [],
        {},
      )
    })

    it('should use scopeName from name option', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({
        scopeName: 'my-scope',
        mf: {},
      })

      await loadRemoteMultiVersion(
        {
          name: 'my-scope',
          pkg: 'test-pkg',
        },
        [],
      )

      expect(tryLoadRemote).toHaveBeenCalledWith(
        'my-scope',
        expect.any(String),
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
        expect.any(Array),
        [],
        {},
      )
    })

    it('should handle retries parameter', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({ scopeName: 'test', mf: {} })

      await loadRemoteMultiVersion(
        {
          name: 'test',
          pkg: 'test-pkg',
          retries: 10,
        },
        [],
      )

      expect(tryLoadRemote).toHaveBeenCalledWith(
        'test',
        expect.any(String),
        10,
        expect.any(Number),
        expect.any(Object),
        [],
        [],
        {},
      )
    })

    it('should handle delay parameter', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({ scopeName: 'test', mf: {} })

      await loadRemoteMultiVersion(
        {
          name: 'test',
          pkg: 'test-pkg',
          delay: 5000,
        },
        [],
      )

      expect(tryLoadRemote).toHaveBeenCalledWith(
        'test',
        expect.any(String),
        expect.any(Number),
        5000,
        expect.any(Object),
        [],
        [],
        {},
      )
    })

    it('should collect remotes from remote source plugins', async () => {
      vi.mocked(resolveFinalVersion).mockResolvedValue('1.0.0')
      vi.mocked(buildFinalUrls).mockReturnValue([
        'http://cdn1.com/remoteEntry.js',
      ])
      vi.mocked(getFinalSharedConfig).mockReturnValue({})
      vi.mocked(tryLoadRemote).mockResolvedValue({
        scopeName: 'test-module',
        mf: {},
      })

      const remoteSourcePlugins = [
        {
          name: 'custom-remote-source',
          registerRemotes: () => [
            {
              name: 'remote-a',
              entry: 'https://cdn.example.com/remote-a/remoteEntry.js',
            },
            {
              name: 'remote-b',
              entry: 'https://cdn.example.com/remote-b/remoteEntry.js',
            },
          ],
        },
      ]

      await loadRemoteMultiVersion(baseOptions, [], { remoteSourcePlugins })

      expect(tryLoadRemote).toHaveBeenCalledWith(
        'test-module',
        'http://cdn1.com/remoteEntry.js',
        3,
        1000,
        {},
        [],
        [
          {
            name: 'remote-a',
            entry: 'https://cdn.example.com/remote-a/remoteEntry.js',
          },
          {
            name: 'remote-b',
            entry: 'https://cdn.example.com/remote-b/remoteEntry.js',
          },
        ],
        {},
      )
    })
  })
})
