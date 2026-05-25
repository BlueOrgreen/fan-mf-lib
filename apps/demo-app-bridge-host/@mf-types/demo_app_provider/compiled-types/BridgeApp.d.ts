import type { ReactNode } from 'react';
export interface DemoBridgeAppProps {
    title?: string;
    userName?: string;
    count?: number;
    onAction?: () => void;
    children?: ReactNode;
    [key: string]: unknown;
}
export default function BridgeApp({ title, userName, count, onAction, children, }: DemoBridgeAppProps): import("react/jsx-runtime").JSX.Element;
