import { beforeEach, describe, expect, it, vi } from 'vitest'
import { prefetchComponent } from '../prefetch'

describe('prefetchComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call instance.prefetch with correct options', () => {
    const mockPrefetch = vi.fn()
    const mockInstance = {
      prefetch: mockPrefetch,
    }

    const mockGetInstance = vi.fn().mockReturnValue(mockInstance)

    prefetchComponent({ id: 'remote/Component' }, mockGetInstance)

    expect(mockPrefetch).toHaveBeenCalledWith({
      id: 'remote/Component',
    })
  })

  it('should pass preloadComponentResource option', () => {
    const mockPrefetch = vi.fn()
    const mockInstance = {
      prefetch: mockPrefetch,
    }

    const mockGetInstance = vi.fn().mockReturnValue(mockInstance)

    prefetchComponent(
      {
        id: 'remote/Component',
        preloadComponentResource: true,
      },
      mockGetInstance,
    )

    expect(mockPrefetch).toHaveBeenCalledWith({
      id: 'remote/Component',
      preloadComponentResource: true,
    })
  })
})
