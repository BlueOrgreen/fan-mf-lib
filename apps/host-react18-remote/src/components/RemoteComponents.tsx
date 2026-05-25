import { RemoteLoader } from './RemoteLoader';

/**
 * 远程 Button 组件
 */
export function RemoteButton() {
  return (
    <RemoteLoader
      pkg="test-mf-unpkg"
      version="1.0.5"
      moduleName="Button"
      scopeName="fan_mf_lib"
      fallback={<div className="module-card module-card--loading">Loading Button...</div>}
    />
  );
}

/**
 * 远程 Card 组件（带 props）
 */
export function RemoteCard() {
  return (
    <RemoteLoader
      pkg="test-mf-unpkg"
      version="1.0.5"
      moduleName="Card"
      scopeName="fan_mf_lib"
      fallback={<div className="module-card module-card--loading">Loading Card...</div>}
    />
  );
}
