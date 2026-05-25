import './App.css'
import { loadRemote } from '@module-federation/runtime'
import { createRemoteAppComponent } from '@fan-scripts/fan-mf-runtime'
import { useState } from 'react'

interface DemoBridgeAppProps {
  title?: string
  userName?: string
  count?: number
  onAction?: () => void
  [key: string]: unknown
}

// 使用原始 Bridge API 创建远程 App 组件
const RemoteApp = createRemoteAppComponent<Record<string, unknown>, 'default'>({
  loader: () => loadRemote('demo_app_provider/export-app') as Promise<Record<string, unknown>>,
  export: 'default',
  loading: <div className="loading">加载远程组件中...</div>,
  fallback: ({ error }: { error: Error }) => (
    <div className="error">加载失败: {error.message}</div>
  ),
})

function App() {
  const [count, setCount] = useState(0)
  const remoteProps: DemoBridgeAppProps = {
    title: 'Hello from Bridge Host',
    userName: 'MF User',
    count,
    onAction: () => setCount((c) => c + 1),
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Demo App Bridge Host</h1>
        <p>Module Federation Bridge Demo (Host)</p>
      </header>

      <main className="App-main">
        <section className="demo-section">
          <h2>远程 Bridge 应用</h2>
          <RemoteApp {...remoteProps} />
        </section>

        <section className="demo-section">
          <h2>说明</h2>
          <ul className="feature-list">
            <li>✓ Host 通过 pluginModuleFederation + loadRemote + createRemoteAppComponent 加载 Provider 导出的 Bridge App</li>
            <li>✓ Provider 端口: 3101，Host 端口: 3102</li>
            <li>✓ 点击按钮会把 count 传递给远程组件</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

export default App
