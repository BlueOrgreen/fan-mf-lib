import { ref, watchEffect, type Ref } from 'vue'
import { loadRemoteMultiVersion } from '@fan-scripts/fan-mf-runtime'
import type { MFInstance } from '../types'

/**
 * Vue Hook 选项：加载远程模块
 */
export interface UseVueRemoteModuleOptions {
  pkg: string
  version: string
  moduleName: string
  scopeName: string
  onError?: (error: Error) => void
  onLoad?: (component: any) => void
}

/**
 * Vue Hook 返回状态
 */
export interface UseVueRemoteModuleResult {
  loading: Ref<boolean>
  error: Ref<Error | null>
  component: Ref<any | null>
  /** 运行时 MF 实例（用于解析与远程一致的 React 实例） */
  mf: Ref<MFInstance | null>
  scopeName: Ref<string | null>
}

/**
 * Vue 3 Hook：加载远程模块
 *
 * @example
 * ```ts
 * const { component, loading, error } = useVueRemoteModule({
 *   pkg: 'my-react-components',
 *   version: '1.0.0',
 *   moduleName: 'Button',
 *   scopeName: 'my_react_app'
 * })
 * ```
 */
export function useVueRemoteModule({
  pkg,
  version,
  moduleName,
  scopeName,
  onError,
  onLoad,
}: Omit<UseVueRemoteModuleOptions, 'retryKey'>): UseVueRemoteModuleResult {
  const loading = ref(true)
  const error = ref<Error | null>(null)
  const component = ref<any>(null)
  const mf = ref<MFInstance | null>(null)
  const resolvedScopeName = ref<string | null>(null)

  async function loadModule() {
    try {
      loading.value = true
      error.value = null

      const { mf: mfInstance } = await loadRemoteMultiVersion(
        {
          name: scopeName,
          pkg,
          version,
        },
        [],
      )

      if (!mfInstance) return

      mf.value = mfInstance as unknown as MFInstance
      resolvedScopeName.value = scopeName

      const mod = await mfInstance.loadRemote(`${scopeName}/${moduleName}`)

      // 处理不同的模块导出格式
      let Component: any = null

      if (mod) {
        // 情况 1: { default: Component } - default 导出
        if ((mod as any).default) {
          Component = (mod as any).default
        }
        // 情况 2: 模块本身就是一个函数/组件
        else if (typeof mod === 'function') {
          Component = mod
        }
        // 情况 3: 模块是对象但不是 default 导出，尝试找到第一个可导出的组件
        else if (typeof mod === 'object') {
          const keys = Object.keys(mod)
          for (const key of keys) {
            const value = (mod as any)[key]
            if (typeof value === 'function') {
              Component = value
              console.log(`[useVueRemoteModule] Using named export: ${key}`)
              break
            }
          }
        }
      }

      if (Component) {
        component.value = Component
        loading.value = false
        onLoad?.(Component)
      } else {
        throw new Error(
          `Module "${scopeName}/${moduleName}" does not export a component`,
        )
      }
    } catch (err) {
      const errInstance = err instanceof Error ? err : new Error(String(err))
      error.value = errInstance
      loading.value = false
      onError?.(errInstance)
    }
  }

  watchEffect(() => {
    loadModule()
  })

  return {
    loading,
    error,
    component,
    mf: mf as Ref<MFInstance | null>,
    scopeName: resolvedScopeName,
  }
}
