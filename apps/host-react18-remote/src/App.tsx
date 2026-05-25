import './App.css';
import { RemoteButton, RemoteCard } from './components';

/**
 * 主应用组件
 */
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>React Module Federation Demo</h1>
        <p>Remote components loaded with fan-mf-runtime</p>
      </header>

      <main className="app-main">
        <section className="demo-section">
          <h2>Remote Button Component</h2>
          <RemoteButton />
        </section>

        <section className="demo-section">
          <h2>Remote Card Component</h2>
          <RemoteCard />
        </section>
      </main>
    </div>
  );
}

export default App;
