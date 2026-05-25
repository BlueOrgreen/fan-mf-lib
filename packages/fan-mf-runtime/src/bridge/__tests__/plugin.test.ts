import { describe, expect, it } from 'vitest'
import { createLazyLoadComponentPlugin } from '../lazy-load-component-plugin'

describe('createLazyLoadComponentPlugin', () => {
  it('should return a plugin object', () => {
    const plugin = createLazyLoadComponentPlugin()
    expect(plugin).toBeDefined()
    expect(typeof plugin.name).toBe('string')
  })

  it('should have correct plugin name', () => {
    const plugin = createLazyLoadComponentPlugin()
    expect(plugin.name).toBe('lazy-load-component-plugin')
  })
})
