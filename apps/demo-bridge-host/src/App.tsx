import "./App.css";
import { useEffect, useState } from "react";
import {
  createLazyComponent,
  loadRemoteMultiVersion,
  prefetchComponent,
} from "@fan-scripts/fan-mf-runtime";

// 使用 createLazyComponent 创建远程组件
const RemoteButton = createLazyComponent({
  loader: () =>
    loadRemoteMultiVersion({
      name: "demo_provider",
      pkg: "demo-bridge-provider",
      version: "1.0.0",
      // localFallback: 'http://localhost:3001/remoteEntry.js',
      localDebug: {
        enabled: true,
        entry: "http://localhost:3001/remoteEntry.js",
      },
    }).then(({ mf }) =>
      mf!.loadRemote("demo_provider/RemoteButton")
    ) as Promise<Record<string, unknown>>,
  loading: <div className="loading">Loading RemoteButton...</div>,
  fallback: ({ error }) => (
    <div className="error">Failed to load RemoteButton: {error.message}</div>
  ),
});

// 使用 manual load 加载远程组件
function RemoteCardWrapper() {
  const [RemoteCardComp, setRemoteCardComp] =
    useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadCard() {
      try {
        const { mf } = await loadRemoteMultiVersion({
          name: "demo_provider",
          pkg: "demo-bridge-provider",
          version: "1.0.0",
          // localFallback: "http://localhost:3001/remoteEntry.js",
          localDebug: {
            enabled: true,
            entry: "http://localhost:3001/remoteEntry.js",
          },
        });
        const mod: any = await mf!.loadRemote("demo_provider/RemoteCard");
        // 支持默认导出或组件本身
        const component = mod?.default || mod;
        if (component) {
          setRemoteCardComp(() => component);
        }
        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    }
    loadCard();
  }, []);

  if (loading) {
    return <div className="loading">Loading RemoteCard...</div>;
  }

  if (error || !RemoteCardComp) {
    return (
      <div className="error">
        Failed to load RemoteCard: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <RemoteCardComp title="Remote Card from Provider">
      <p>This card component is loaded from the remote provider app.</p>
      <p>Bridge module is working correctly!</p>
    </RemoteCardComp>
  );
}

function App() {
  const [buttonClickCount, setButtonClickCount] = useState(0);

  // 预加载 RemoteCard 组件
  useEffect(() => {
    prefetchComponent({
      id: "demo_provider/RemoteCard",
      preloadComponentResource: true,
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bridge Module Demo - Host App</h1>
        <p>Running on port 3002</p>
      </header>

      <main className="App-main">
        <section className="demo-section">
          <h2>RemoteButton (using createLazyComponent)</h2>
          <RemoteButton
            onClick={() => setButtonClickCount((c) => c + 1)}
            variant="primary"
          >
            Remote Button (clicks: {buttonClickCount})
          </RemoteButton>
        </section>

        <section className="demo-section">
          <h2>RemoteCard (using manual load)</h2>
          <RemoteCardWrapper />
        </section>

        <section className="demo-section">
          <h2>Bridge Module Features</h2>
          <ul className="feature-list">
            <li>✅ createLazyComponent working</li>
            <li>✅ loadRemoteMultiVersion integration</li>
            <li>✅ Error handling with fallback</li>
            <li>✅ prefetchComponent for preloading</li>
          </ul>
        </section>
      </main>
    </div>
  );
}

export default App;
