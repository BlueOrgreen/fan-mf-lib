import { defineConfig } from '@rslib/core'
import { pluginPublint } from 'rsbuild-plugin-publint'

export default defineConfig({
  plugins: [pluginPublint()],
  source: {
    entry: {
      main: './src/index.ts',
    },
  },
  output: {
    cssModules: {
      auto: true,
    },
    injectStyles: true,
  },
  tools: {
    rspack: {
      externals: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  lib: [
    {
      format: 'esm',
      syntax: ['node 18'],
      dts: true,
      bundle: true,
    },
    {
      format: 'cjs',
      syntax: ['node 18'],
      dts: true,
      bundle: true,
    },
  ],
})
