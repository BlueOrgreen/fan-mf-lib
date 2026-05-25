/**
 * Vue Adapter for fan-mf-runtime
 *
 * 使 Vue 3 项目能够加载和使用 React 远程组件
 * 自动将 React/ReactDOM 挂载到全局 window 对象
 *
 * @example
 * ```ts
 * // 在 Vue 项目的入口文件 (main.ts) 中
 * import { mountReactToGlobal } from '@yunfan/vue-adapter'
 *
 * // 加载 React 到全局 (React 远程组件需要这些全局变量)
 * await mountReactToGlobal('18')
 *
 * // 然后创建 Vue 应用
 * createApp(App).mount('#app')
 * ```
 *
 * @example
 * ```vue
 * <!-- 在 Vue 组件中使用远程 React 组件 -->
 * <script setup lang="ts">
 * import { VueRemoteModuleProvider } from '@yunfan/vue-adapter'
 * </script>
 *
 * <template>
 *   <VueRemoteModuleProvider
 *     pkg="my-react-components"
 *     version="1.0.0"
 *     moduleName="Button"
 *     scopeName="my_react_app"
 *   />
 * </template>
 * ```
 *
 * @example
 * ```vue
 * <!-- 使用 Hook 方式 -->
 * <script setup lang="ts">
 * import { useVueRemoteModule } from '@yunfan/vue-adapter'
 *
 * const { component, loading, error, retry } = useVueRemoteModule({
 *   pkg: 'my-react-components',
 *   version: '1.0.0',
 *   moduleName: 'Button',
 *   scopeName: 'my_react_app'
 * })
 * </script>
 *
 * <template>
 *   <div>
 *     <div v-if="loading">Loading...</div>
 *     <div v-else-if="error">Error: {{ error.message }}</div>
 *     <component :is="component" v-else />
 *   </div>
 * </template>
 * ```
 */

// 导出所有模块
export * from './components'
export * from './hooks'
export * from './composables'
export * from './types'

// React 全局挂载工具
export {
  mountReactToGlobal,
  hasGlobalReact,
  getGlobalReactVersion,
  getGlobalReact,
  getGlobalReactDOM,
  unmountReactFromGlobal,
  createReactComponentRenderer,
} from './mountReactToGlobal'
