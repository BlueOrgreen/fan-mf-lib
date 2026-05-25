import {
  type BridgeAppProviderFactory,
  createBridgeComponent,
} from '@fan-scripts/fan-mf-runtime'
import BridgeApp, { type DemoBridgeAppProps } from './BridgeApp'

const providerFactory = createBridgeComponent<DemoBridgeAppProps>({
  rootComponent: BridgeApp,
})

export type { DemoBridgeAppProps }
export type DemoBridgeProviderFactory = BridgeAppProviderFactory
export default providerFactory
