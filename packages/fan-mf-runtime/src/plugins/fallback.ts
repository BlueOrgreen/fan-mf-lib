import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime'

export const fallbackPlugin: () => ModuleFederationRuntimePlugin = () => ({
  name: 'fallback-plugin',
  errorLoadRemote(args: unknown) {
    console.error('[MF] loadRemote failed in fallbackPlugin', args)

    const rawError =
      typeof args === 'object' && args !== null && 'error' in args
        ? (args as { error?: unknown }).error
        : undefined

    throw rawError instanceof Error
      ? rawError
      : new Error('[MF] loadRemote failed and no valid fallback module was provided')
  },
})
