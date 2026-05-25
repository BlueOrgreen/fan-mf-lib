import { pluginModuleFederation } from '@module-federation/rsbuild-plugin'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'demo_app_bridge_host',
      remotes: {
        demo_app_provider: 'demo_app_provider@http://localhost:3101/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: false },
        'react-dom': { singleton: true, eager: true, requiredVersion: false },
        '@module-federation/bridge-react': {
          singleton: true,
          eager: true,
          requiredVersion: false,
        },
      },
    }),
  ],
  server: {
    port: 3102,
  },
  html: {
    title: 'Demo App Bridge Host',
  },
})
