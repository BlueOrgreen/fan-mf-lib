import { type BridgeAppProviderFactory } from 'fan-mf-runtime';
import { type DemoBridgeAppProps } from './BridgeApp';
declare const providerFactory: () => {
    render(info: import("@module-federation/bridge-react/v18").RenderParams): Promise<void>;
    destroy(info: import("@module-federation/bridge-react/v18").DestroyParams): void;
};
export type { DemoBridgeAppProps };
export type DemoBridgeProviderFactory = BridgeAppProviderFactory;
export default providerFactory;
