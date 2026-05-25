import { pluginModuleFederation } from '@module-federation/rsbuild-plugin'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'demo_app_provider',
      filename: 'remoteEntry.js',
      exposes: {
        './export-app': './src/export-app.tsx',
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
  resolve: {
    alias: {
      '@': './src',
    },
  },
  server: {
    port: 3101,
  },
  dev: {
    hmr: false,
    liveReload: false,
  },
  html: {
    title: 'Demo App Bridge Provider',
  },
})
