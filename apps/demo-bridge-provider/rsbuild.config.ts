import { pluginModuleFederation } from '@module-federation/rsbuild-plugin'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'demo_provider',
      filename: 'remoteEntry.js',
      exposes: {
        './RemoteButton': './src/RemoteButton.tsx',
        './RemoteCard': './src/RemoteCard.tsx',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: false },
        'react-dom': { singleton: true, eager: true, requiredVersion: false },
      },
    }),
  ],
  server: {
    port: 3001,
  },
  html: {
    title: 'Demo Bridge Provider',
  },
})
