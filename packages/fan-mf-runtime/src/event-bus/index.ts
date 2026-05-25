type EventCallback<T = any> = (data: T, meta?: EventMeta) => void

interface EventMeta {
  timestamp: number
  source?: string
  id?: string
}

interface EventSubscription<T = any> {
  callback: EventCallback<T>
  once: boolean
  filter?: (data: T, meta: EventMeta) => boolean
}

interface EventEmitterOptions {
  once?: boolean
  filter?: (data: any, meta: EventMeta) => boolean
}

export class EventBusClass {
  private listeners: Map<string, Set<EventSubscription>> = new Map()
  private eventHistory: Map<string, Array<{ data: any; meta: EventMeta }>> =
    new Map()
  private maxHistorySize = 100

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  on<T = any>(
    event: string,
    callback: EventCallback<T>,
    options?: EventEmitterOptions,
  ): () => void {
    const onceValue = options?.once ?? false

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }

    const subscription: EventSubscription<T> = {
      callback,
      once: onceValue,
      filter: options?.filter,
    }

    this.listeners.get(event)!.add(subscription)

    return () => {
      this.off(event, callback)
    }
  }

  once<T = any>(event: string, callback: EventCallback<T>): () => void {
    return this.on(event, callback, { once: true })
  }

  off<T = any>(event: string, callback?: EventCallback<T>): void {
    if (!this.listeners.has(event)) return

    if (callback) {
      const subscriptions = this.listeners.get(event)!
      subscriptions.forEach((sub) => {
        if (sub.callback === callback) {
          subscriptions.delete(sub)
        }
      })
    } else {
      this.listeners.delete(event)
    }
  }

  emit<T = any>(event: string, data?: T, meta?: Partial<EventMeta>): void {
    const eventMeta: EventMeta = {
      timestamp: Date.now(),
      source: meta?.source,
      id: meta?.id || this.generateId(),
    }

    this.addToHistory(event, data, eventMeta)

    const subscriptions = this.listeners.get(event)
    if (!subscriptions) return

    const toRemove: EventSubscription[] = []

    subscriptions.forEach((sub) => {
      if (sub.filter && !sub.filter(data, eventMeta)) {
        return
      }

      try {
        sub.callback(data, eventMeta)
      } catch (e) {
        console.error(`[MF EventBus] 事件 ${event} 处理出错:`, e)
      }

      if (sub.once) {
        toRemove.push(sub)
      }
    })

    toRemove.forEach((sub) => subscriptions.delete(sub))
  }

  private addToHistory(event: string, data: any, meta: EventMeta): void {
    if (!this.eventHistory.has(event)) {
      this.eventHistory.set(event, [])
    }

    const history = this.eventHistory.get(event)!
    history.push({ data, meta })

    if (history.length > this.maxHistorySize) {
      history.shift()
    }
  }

  getHistory<T = any>(event: string): Array<{ data: T; meta: EventMeta }> {
    return this.eventHistory.get(event) || []
  }

  getEvents(): string[] {
    return Array.from(this.listeners.keys())
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0
  }

  hasListeners(event: string): boolean {
    return this.listeners.has(event) && this.listeners.get(event)!.size > 0
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      this.eventHistory.delete(event)
    } else {
      this.listeners.clear()
      this.eventHistory.clear()
    }
  }

  listenerExists(event: string, callback: EventCallback): boolean {
    const subscriptions = this.listeners.get(event)
    if (!subscriptions) return false

    let exists = false
    subscriptions.forEach((sub) => {
      if (sub.callback === callback) {
        exists = true
      }
    })

    return exists
  }

  emitAsync<T = any>(
    event: string,
    data?: T,
    meta?: Partial<EventMeta>,
  ): Promise<void> {
    return new Promise((resolve) => {
      this.emit(event, data, meta)
      resolve()
    })
  }

  static create(): EventBusClass {
    return new EventBusClass()
  }
}

export const eventBus = EventBusClass.create()

export function createEventBus(): EventBusClass {
  return EventBusClass.create()
}

export type { EventCallback, EventMeta, EventEmitterOptions, EventSubscription }
