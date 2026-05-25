import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime'

/**
 * 初始化全局 React/ReactDOM 到 Module Federation 共享作用域
 * 这是一个一次性操作，会在第一次调用时注册
 */
let hasInitialized = false

export function initSharedScope() {
  if (hasInitialized) {
    console.log('[register-shared-react] Already initialized, skipping')
    return
  }

  const globalReact = (window as any).React
  const globalReactDOM = (window as any).ReactDOM

  console.log('[register-shared-react] Initializing shared scope', {
    hasReact: !!globalReact,
    hasReactDOM: !!globalReactDOM,
    reactType: typeof globalReact,
    reactDomType: typeof globalReactDOM,
  })

  if (!globalReact || !globalReactDOM) {
    console.warn('[register-shared-react] Global React or ReactDOM not found')
    return
  }

  // 验证 React 实例是否有效
  if (
    typeof globalReact !== 'object' ||
    typeof globalReact.useCallback !== 'function'
  ) {
    console.warn('[register-shared-react] Invalid React instance', {
      react: globalReact,
      useCallback: globalReact.useCallback,
    })
    return
  }

  // @ts-ignore - webpack 共享作用域
  if (!window.__webpack_share_scopes__) {
    // @ts-ignore
    window.__webpack_share_scopes__ = {}
    console.log('[register-shared-react] Created __webpack_share_scopes__')
  }

  // @ts-ignore
  if (!window.__webpack_share_scopes__.default) {
    // @ts-ignore
    window.__webpack_share_scopes__.default = {}
    console.log('[register-shared-react] Created default share scope')
  }

  const reactVersion = globalReact.version || '18.0.0'
  const reactDomVersion = globalReactDOM.version || '18.0.0'

  console.log(
    '[register-shared-react] Registering React and ReactDOM to share scope',
    {
      reactVersion,
      reactDomVersion,
    },
  )

  // 注册 react 到共享作用域
  // @ts-ignore
  window.__webpack_share_scopes__.default.react = {
    get: () => () => {
      const react = (window as any).React
      if (!react || typeof react.useCallback !== 'function') {
        console.error(
          '[register-shared-react] React instance is invalid when getting',
        )
        return null
      }
      console.log('[register-shared-react] Getting React instance')
      return react
    },
    config: {
      singleton: true,
      eager: true,
    },
    scope: 'default',
    version: reactVersion,
  }

  // 注册 react-dom 到共享作用域
  // @ts-ignore
  window.__webpack_share_scopes__.default['react-dom'] = {
    get: () => () => {
      const reactdom = (window as any).ReactDOM
      if (!reactdom) {
        console.error(
          '[register-shared-react] ReactDOM instance is invalid when getting',
        )
        return null
      }
      console.log('[register-shared-react] Getting ReactDOM instance')
      return reactdom
    },
    config: {
      singleton: true,
      eager: true,
    },
    scope: 'default',
    version: reactDomVersion,
  }

  console.log('[register-shared-react] Registration complete')
  console.log('[register-shared-react] Share scope contents:', {
    // @ts-ignore
    react: window.__webpack_share_scopes__.default.react,
    // @ts-ignore
    'react-dom': window.__webpack_share_scopes__.default['react-dom'],
  })

  hasInitialized = true
}

/**
 * 注册全局 React/ReactDOM 到 Module Federation 共享作用域
 */
export const registerSharedReact: () => ModuleFederationRuntimePlugin = () => ({
  name: 'register-shared-react',

  init(args: any) {
    initSharedScope()
    return args
  },
})
