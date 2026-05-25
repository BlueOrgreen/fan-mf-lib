import type { LoadRemoteOptions } from '../../types'
import type { RuntimeRemote } from '../utils'

type MaybePromise<T> = T | Promise<T>

export interface RemoteSourcePluginContext {
  options: LoadRemoteOptions
  scopeName: string
  pkg: string
  finalVersion: string
  currentEntry: string
  allEntries: string[]
}

export interface RemoteSourcePlugin {
  name: string
  registerRemotes?: (
    context: RemoteSourcePluginContext,
  ) => MaybePromise<RuntimeRemote[] | void>
}

export interface LoadRemoteExtraOptions {
  remoteSourcePlugins?: RemoteSourcePlugin[]
  baseRemotes?: RuntimeRemote[]
  registerOptions?: {
    force?: boolean
  }
}

function dedupeRemotes(remotes: RuntimeRemote[]): RuntimeRemote[] {
  const map = new Map<string, RuntimeRemote>()

  for (const remote of remotes) {
    if (!remote?.name) continue

    const key = [
      remote.name,
      'entry' in remote ? remote.entry || '' : '',
      'version' in remote ? remote.version || '' : '',
      remote.alias || '',
    ].join('::')

    if (!map.has(key)) {
      map.set(key, remote)
    }
  }

  return Array.from(map.values())
}

export async function resolveRegisteredRemotes(
  context: RemoteSourcePluginContext,
  baseRemotes: RuntimeRemote[],
  remoteSourcePlugins: RemoteSourcePlugin[],
): Promise<RuntimeRemote[]> {
  const remoteList: RuntimeRemote[] = [...baseRemotes]

  for (const plugin of remoteSourcePlugins) {
    if (!plugin.registerRemotes) continue

    try {
      const pluginRemotes = await plugin.registerRemotes(context)
      if (pluginRemotes?.length) {
        remoteList.push(...pluginRemotes)
      }
    } catch (error) {
      throw new Error(
        `[MF] remote 来源插件 ${plugin.name} 执行失败: ${(error as Error).message}`,
      )
    }
  }

  return dedupeRemotes(remoteList).filter((remote) => {
    return !(
      remote.name === context.scopeName &&
      'entry' in remote &&
      remote.entry === context.currentEntry
    )
  })
}

/**
 * 创建静态 remote 来源插件
 */
export function createRemoteSourcePlugin(
  name: string,
  remotes: RuntimeRemote[],
): RemoteSourcePlugin {
  return {
    name,
    registerRemotes: () => remotes,
  }
}
