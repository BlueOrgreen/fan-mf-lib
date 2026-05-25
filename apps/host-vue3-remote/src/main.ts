import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// 导入 Vue 适配器，将 React 挂载到全局
import { mountReactToGlobal } from '@fan-scripts/vue-adapter'

// 异步初始化
async function bootstrap() {
  // 将 React 18 挂载到全局 window 对象
  // 这样 Vue 项目就可以加载和使用 React 远程组件了
  await mountReactToGlobal('18')

  console.log('[App] React mounted to global window object')
  console.log('[App] window.React:', typeof window.React)
  console.log('[App] window.ReactDOM:', typeof window.ReactDOM)

  // 创建并挂载 Vue 应用
  createApp(App).mount('#app')
}

bootstrap()
