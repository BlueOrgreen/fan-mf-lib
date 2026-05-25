import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createEventBus, type EventBusClass, eventBus } from '../src/event-bus'

describe('EventBus', () => {
  let bus: EventBusClass

  beforeEach(() => {
    bus = createEventBus()
    bus.clear()
  })

  afterEach(() => {
    bus.clear()
  })

  describe('on/off', () => {
    it('should register and call listener', () => {
      const callback = vitest.fn()
      bus.on('test-event', callback)
      bus.emit('test-event', 'data')

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith('data', expect.any(Object))
    })

    it('should support multiple listeners', () => {
      const cb1 = vitest.fn()
      const cb2 = vitest.fn()
      bus.on('event', cb1)
      bus.on('event', cb2)
      bus.emit('event')

      expect(cb1).toHaveBeenCalled()
      expect(cb2).toHaveBeenCalled()
    })

    it('should remove listener on off', () => {
      const callback = vitest.fn()
      bus.on('test-event', callback)
      bus.off('test-event', callback)
      bus.emit('test-event')

      expect(callback).not.toHaveBeenCalled()
    })

    it('should remove all listeners when no callback provided', () => {
      const cb1 = vitest.fn()
      const cb2 = vitest.fn()
      bus.on('event', cb1)
      bus.on('event', cb2)
      bus.off('event')
      bus.emit('event')

      expect(cb1).not.toHaveBeenCalled()
      expect(cb2).not.toHaveBeenCalled()
    })
  })

  describe('once', () => {
    it('should call listener only once', () => {
      const callback = vitest.fn()
      bus.once('once-event', callback)
      bus.emit('once-event')
      bus.emit('once-event')
      bus.emit('once-event')

      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('emit', () => {
    it('should pass data to listeners', () => {
      const received: string[] = []
      bus.on('data-event', (data) => received.push(data))
      bus.emit('data-event', 'first')
      bus.emit('data-event', 'second')

      expect(received).toEqual(['first', 'second'])
    })

    it('should include metadata', () => {
      let meta: any
      bus.on('meta-event', (_data, m) => {
        meta = m
      })
      bus.emit('meta-event', null, { source: 'test' })

      expect(meta).toBeDefined()
      expect(meta.timestamp).toBeDefined()
      expect(meta.id).toBeDefined()
      expect(meta.source).toBe('test')
    })
  })

  describe('filter', () => {
    it('should filter events based on condition', () => {
      const callback = vitest.fn()
      bus.on('filtered-event', callback, { filter: (data: number) => data > 5 })
      bus.emit('filtered-event', 3)
      bus.emit('filtered-event', 10)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(10, expect.any(Object))
    })
  })

  describe('getHistory', () => {
    it('should return event history', () => {
      bus.emit('history-event', { id: 1 })
      bus.emit('history-event', { id: 2 })

      const history = bus.getHistory('history-event')
      expect(history.length).toBe(2)
    })

    it('should return empty array for unknown event', () => {
      const history = bus.getHistory('unknown-event')
      expect(history).toEqual([])
    })
  })

  describe('getEvents', () => {
    it('should return list of events with listeners', () => {
      bus.on('event1', () => {})
      bus.on('event2', () => {})
      bus.emit('event1')

      const events = bus.getEvents()
      expect(events).toContain('event1')
      expect(events).toContain('event2')
    })
  })

  describe('getListenerCount', () => {
    it('should return correct listener count', () => {
      bus.on('counted-event', () => {})
      bus.on('counted-event', () => {})

      expect(bus.getListenerCount('counted-event')).toBe(2)
      expect(bus.getListenerCount('unknown-event')).toBe(0)
    })
  })

  describe('hasListeners', () => {
    it('should return true when listeners exist', () => {
      bus.on('has-listeners', () => {})
      expect(bus.hasListeners('has-listeners')).toBe(true)
    })

    it('should return false when no listeners', () => {
      expect(bus.hasListeners('no-listeners')).toBe(false)
    })
  })

  describe('listenerExists', () => {
    it('should check if specific callback exists', () => {
      const callback = () => {}
      bus.on('exists-check', callback)

      expect(bus.listenerExists('exists-check', callback)).toBe(true)
      expect(bus.listenerExists('exists-check', () => {})).toBe(false)
    })
  })

  describe('clear', () => {
    it('should clear specific event', () => {
      bus.on('clear-event', () => {})
      bus.clear('clear-event')

      expect(bus.hasListeners('clear-event')).toBe(false)
    })

    it('should clear all events', () => {
      bus.on('event1', () => {})
      bus.on('event2', () => {})
      bus.clear()

      expect(bus.getEvents()).toEqual([])
    })
  })

  describe('error handling', () => {
    it('should handle errors in listeners', () => {
      const errorCallback = () => {
        throw new Error('Test error')
      }
      const normalCallback = vitest.fn()

      bus.on('error-event', errorCallback)
      bus.on('error-event', normalCallback)
      bus.emit('error-event')

      expect(normalCallback).toHaveBeenCalled()
    })
  })
})

describe('eventBus singleton', () => {
  it('should export default eventBus instance', () => {
    expect(eventBus).toBeDefined()
    expect(eventBus.on).toBeDefined()
    expect(eventBus.emit).toBeDefined()
  })
})
