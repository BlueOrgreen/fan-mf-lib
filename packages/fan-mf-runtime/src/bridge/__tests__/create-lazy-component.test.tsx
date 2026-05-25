import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLazyComponent } from '../create-lazy-component'
import type { LazyComponentOptions } from '../types'

describe('useLazyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', async () => {
    const mockLoader = vi.fn(() => new Promise(() => {}))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      }),
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.Component).toBeNull()
  })

  it('should return component after loader resolves', async () => {
    const MockComponent = vi.fn(() => <div>Mock</div>)
    const mockLoader = vi.fn(() => Promise.resolve({ default: MockComponent }))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      }),
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.Component).toBeDefined()
  })

  it('should return error state when loader fails', async () => {
    const mockLoader = vi.fn(() => Promise.reject(new Error('Load failed')))

    const { result } = renderHook(() =>
      useLazyComponent({
        loader: mockLoader,
        loading: <div>Loading...</div>,
        fallback: () => <div>Error</div>,
      }),
    )

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })
  })
})
