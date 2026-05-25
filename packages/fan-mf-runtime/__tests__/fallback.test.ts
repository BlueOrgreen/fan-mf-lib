import { describe, expect, it, vi } from 'vitest'
import { fallbackPlugin } from '../src/plugins/fallback'

describe('fallbackPlugin', () => {
  it('should return a plugin object with correct name', () => {
    const plugin = fallbackPlugin()
    expect(plugin.name).toBe('fallback-plugin')
  })

  it('should have errorLoadRemote hook', () => {
    const plugin = fallbackPlugin()
    expect(plugin.errorLoadRemote).toBeDefined()
    expect(typeof plugin.errorLoadRemote).toBe('function')
  })

  describe('errorLoadRemote', () => {
    it('should rethrow original error when args.error is Error', () => {
      const plugin = fallbackPlugin()
      const testError = new Error('test')

      expect(() => plugin.errorLoadRemote({ error: testError })).toThrow(testError)
    })

    it('should throw generic error when args has no valid error', () => {
      const plugin = fallbackPlugin()

      expect(() => plugin.errorLoadRemote({ extra: 'data' })).toThrow(
        '[MF] loadRemote failed and no valid fallback module was provided',
      )
    })

    it('should log the args to console.error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const plugin = fallbackPlugin()
      const testArgs = { error: new Error('test'), extra: 'data' }

      expect(() => plugin.errorLoadRemote(testArgs)).toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[MF] loadRemote failed in fallbackPlugin',
        testArgs,
      )
      consoleSpy.mockRestore()
    })
  })
})
