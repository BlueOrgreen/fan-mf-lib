import { defineConfig } from '@rslib/core'
import { pluginPublint } from 'rsbuild-plugin-publint'

export default defineConfig({
  plugins: [pluginPublint()],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  output: {
    cssModules: {
      auto: true,
    },
    injectStyles: true,
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
