// React 18 版本（默认，使用 createRoot）
export { createBridgeComponent } from '@module-federation/bridge-react/v18'

// React 19 版本（使用 createRoot）
export { createBridgeComponent as createBridgeComponentV19 } from '@module-federation/bridge-react/v19'

// 通用 API（适用于所有 React 版本）
export {
  createRemoteAppComponent,
  createRemoteComponent,
} from '@module-federation/bridge-react'

// 本地封装
export { createBridgeRemoteApp } from './create-remote-app'

// 类型导出
export type {
  BridgeAppComponent,
  BridgeAppProps,
  BridgeAppProviderFactory,
  BridgeAppProviderInstance,
  BridgeAppProviderOptions,
  CreateBridgeAppOptions,
} from './types'