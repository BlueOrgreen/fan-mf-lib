# @yunfan/react-adapter

React adapter for fan-mf-runtime - enables React apps to load remote components with Module Federation.

## Features

- Load remote React components dynamically
- Built-in Suspense and ErrorBoundary support
- Retry mechanism for failed loads
- TypeScript support

## Installation

```bash
npm install @yunfan/react-adapter fan-mf-runtime
```

## Usage

### RemoteModuleProvider

```tsx
import { RemoteModuleProvider } from '@yunfan/react-adapter'

function App() {
  return (
    <RemoteModuleProvider
      pkg="@myorg/remote-app"
      version="^1.0.0"
      moduleName="Dashboard"
      scopeName="myorg"
      loadingFallback={<Spinner />}
      errorFallback={(error, reset) => <Button onClick={reset}>Retry</Button>}
      componentProps={{ userId: 123 }}
    />
  )
}
```

### lazyRemote + Suspense

```tsx
import { lazyRemote } from '@yunfan/react-adapter'
import { Suspense } from 'react'

const LazyDashboard = lazyRemote({
  pkg: '@myorg/remote-app',
  version: '^1.0.0',
  moduleName: 'Dashboard',
  scopeName: 'myorg',
})

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyDashboard userId={123} />
    </Suspense>
  )
}
```

### SuspenseRemoteLoader

```tsx
import { SuspenseRemoteLoader } from '@yunfan/react-adapter'

function App() {
  return (
    <SuspenseRemoteLoader
      pkg="@myorg/remote-app"
      version="^1.0.0"
      moduleName="Dashboard"
      scopeName="myorg"
      fallback={<Spinner />}
      errorFallback={(error) => <div>Error: {error.message}</div>}
      componentProps={{ userId: 123 }}
    />
  )
}
```

### useRemoteModuleHook

```tsx
import { useRemoteModuleHook } from '@yunfan/react-adapter'

function MyComponent() {
  const { component: RemoteComp, loading, error } = useRemoteModuleHook({
    pkg: '@myorg/remote-app',
    version: '^1.0.0',
    moduleName: 'Dashboard',
    scopeName: 'myorg',
  })

  if (loading) return <Spinner />
  if (error) return <div>Error: {error.message}</div>
  if (!RemoteComp) return null

  return <RemoteComp userId={123} />
}
```

## License

MIT
