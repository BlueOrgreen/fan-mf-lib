import { ref, type Ref } from 'vue'
import type { MFInstance, ReactInstance, ReactDOMInstance } from '../types'

export interface ReactResolverResult {
  runtimeReact: Ref<ReactInstance | null>
  runtimeReactDOMClient: Ref<ReactDOMInstance | null>
  resolve: (mf: MFInstance) => Promise<void>
}

function normalizeSharedModule(mod: any) {
  if (!mod) return null
  if (typeof mod === 'object' && 'default' in mod && mod.default) return mod.default
  return mod
}

/**
 * 解析运行时 React 共享模块
 * @param mf - Module Federation 实例
 * @returns React 和 ReactDOM 的引用
 */
export function useReactResolver(): ReactResolverResult {
  const runtimeReactRef = ref<ReactInstance | null>(null)
  const runtimeReactDOMClientRef = ref<ReactDOMInstance | null>(null)

  async function resolve(mf: MFInstance) {
    if (!mf?.loadShare) return

    try {
      const [reactGetter, reactDomClientGetter, reactDomGetter] = await Promise.all([
        mf.loadShare('react'),
        mf.loadShare('react-dom/client'),
        mf.loadShare('react-dom'),
      ])

      const sharedReact =
        typeof reactGetter === 'function' ? normalizeSharedModule(reactGetter()) : null

      const sharedReactDOMClient =
        typeof reactDomClientGetter === 'function'
          ? normalizeSharedModule(reactDomClientGetter())
          : typeof reactDomGetter === 'function'
            ? normalizeSharedModule(reactDomGetter())
            : null

      if (sharedReact && sharedReactDOMClient) {
        runtimeReactRef.value = sharedReact
        runtimeReactDOMClientRef.value = sharedReactDOMClient
      }
    } catch (e) {
      console.warn('[useReactResolver] Failed to resolve runtime shared React, fallback to window', e)
    }
  }

  return {
    runtimeReact: runtimeReactRef,
    runtimeReactDOMClient: runtimeReactDOMClientRef,
    resolve,
  }
}
