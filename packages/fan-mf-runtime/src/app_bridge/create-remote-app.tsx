import { createRemoteAppComponent } from '@module-federation/bridge-react'
import type {
  BridgeAppComponent,
  CreateBridgeAppOptions,
} from './types'

export function createBridgeRemoteApp<
  TModule extends Record<string, unknown>,
  TExport extends keyof TModule = keyof TModule,
  TProps extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreateBridgeAppOptions<TModule, TExport>,
): BridgeAppComponent<TProps> {
  return createRemoteAppComponent<TModule, TExport>(
    options,
  ) as unknown as BridgeAppComponent<TProps>
}
