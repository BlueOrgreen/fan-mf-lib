/// <reference types="vite/client" />

// Vue 3 项目中的 TypeScript 全局声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// React 全局变量类型扩展
interface Window {
  React?: any
  ReactDOM?: any
}
