import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime'
import React, { useEffect, useState } from 'react'

interface ModuleState {
  loading: boolean
  error: Error | null
  component: React.ComponentType<any> | null
}

/**
 * Hook 选项：加载远程模块
 */
export interface UseRemoteModuleOptions {
  pkg: string
  version: string
  moduleName: string
  scopeName: string
  onError?: (error: Error) => void
  onLoad?: (component: React.ComponentType<any>) => void
  retryKey?: number
}

/**
 * Hook：加载远程模块
 */
export function useRemoteModule({
  pkg,
  version,
  moduleName,
  scopeName,
  onError,
  onLoad,
  retryKey = 0,
}: UseRemoteModuleOptions) {
  const [moduleState, setModuleState] = useState<ModuleState>({
    loading: true,
    error: null,
    component: null,
  })

  useEffect(() => {
    let mounted = true

    async function loadModule() {
      try {
        setModuleState((prev) => ({ ...prev, loading: true, error: null }))

        const { mf } = await loadRemoteMultiVersion(
          {
            name: scopeName,
            pkg,
            version,
          },
          [],
        )

        if (!mf || !mounted) return

        const mod = await mf.loadRemote(`${scopeName}/${moduleName}`)

        if (!mounted) return

        if (mod && typeof mod === 'object' && 'default' in mod) {
          const Component = (mod as { default: React.ComponentType<any> })
            .default
          setModuleState({
            loading: false,
            error: null,
            component: Component,
          })
          onLoad?.(Component)
        } else {
          throw new Error(
            `Module "${scopeName}/${moduleName}" does not export a default component`,
          )
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err))
          setModuleState({
            loading: false,
            error,
            component: null,
          })
          onError?.(error)
        }
      }
    }

    loadModule()

    return () => {
      mounted = false
    }
  }, [pkg, version, moduleName, scopeName, onError, onLoad, retryKey])

  return moduleState
}
