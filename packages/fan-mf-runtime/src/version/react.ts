import { createInstance } from '@module-federation/enhanced/runtime'

export async function loadReactVersion(version: '17' | '18' | '19') {
  const runtime = await createInstance({
    name: `react_${version}_runtime`,
    remotes: [
      {
        name: `react@${version}`,
        entry: `https://cdn.jsdelivr.net/npm/react@${version}/umd/react.production.min.js`,
        type: 'var',
        entryGlobalName: 'React',
      },
      {
        name: `react-dom@${version}`,
        entry: `https://cdn.jsdelivr.net/npm/react-dom@${version}/umd/react-dom.production.min.js`,
        type: 'var',
        entryGlobalName: 'ReactDOM',
      },
    ],
  })

  const React = await runtime.loadRemote(`react@${version}`)
  const ReactDOM = await runtime.loadRemote(`react-dom@${version}`)
  return { React, ReactDOM }
}
