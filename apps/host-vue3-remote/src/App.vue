<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import { VueRemoteModuleProvider, useVueRemoteModule, ReactComponentRenderer } from '@yunfan/vue-adapter'

// 示例：使用组件方式加载远程 React 组件
const handleLoad = (component: any) => {
  console.log('远程组件已加载:', component)
}

const handleError = (error: Error) => {
  console.error('加载失败:', error)
}

const handleReady = (_scopeName: string, _mf: any) => {
  console.log('MF 实例就绪:', _scopeName)
}

// 示例：使用 Hook 方式加载远程 React 组件（Button）
const {
  component: RemoteButton,
  loading: buttonLoading,
  error: buttonError,
  mf: buttonMf,
  retry: buttonRetry,
} = useVueRemoteModule({
  pkg: 'test-mf-unpkg',
  version: '1.0.7',
  moduleName: 'Button',
  scopeName: 'fan_mf_lib',
  onLoad: (comp) => console.log('Hook 方式加载 Button 成功:', comp),
  onError: (err) => console.error('Hook 方式加载 Button 失败:', err),
})

// 示例：使用 Hook 方式加载远程 React 组件（Card）
const {
  component: RemoteCard,
  loading: cardLoading,
  error: cardError,
  mf: cardMf,
  retry: cardRetry,
} = useVueRemoteModule({
  pkg: 'test-mf-unpkg',
  version: '1.0.7',
  moduleName: 'Card',
  scopeName: 'fan_mf_lib',
  onLoad: (comp) => console.log('Hook 方式加载 Card 成功:', comp),
  onError: (err) => console.error('Hook 方式加载 Card 失败:', err),
})
</script>

<template>
  <div class="app-container">
    <h1>Vue 3 Host + React Remote Components</h1>

    <!-- 原有的 Vue 组件 -->
    <HelloWorld />

    <!-- 示例 1: 使用 VueRemoteModuleProvider 组件加载 Card -->
    <section class="demo-section">
      <h2>示例 1: 使用 VueRemoteModuleProvider 组件加载 Card</h2>

      <VueRemoteModuleProvider
        pkg="test-mf-unpkg"
        version="1.0.7"
        moduleName="Card"
        scopeName="fan_mf_lib"
        :component-props="{ title: 'Card Title', subtitle: 'From VueRemoteModuleProvider', children: '示例1内容' }"
        class-name="remote-module-container"
        @load="handleLoad"
        @error="handleError"
        @ready="handleReady"
      >
        <!-- 自定义加载状态 -->
        <template #loading>
          <div class="loading-state">
            <span class="spinner"></span>
            <span>正在加载远程 React Card 组件...</span>
          </div>
        </template>

        <!-- 自定义错误状态 -->
        <template #error="{ error, retry }">
          <div class="error-state">
            <span class="error-icon">!</span>
            <span>加载失败：{{ error.message }}</span>
            <button @click="retry" class="retry-btn">重试</button>
          </div>
        </template>
      </VueRemoteModuleProvider>
    </section>

    <!-- 示例 2: 使用 useVueRemoteModule Hook 加载 Button -->
    <section class="demo-section">
      <h2>示例 2: 使用 useVueRemoteModule Hook 加载 Button</h2>

      <div class="remote-module-container">
        <div v-if="buttonLoading" class="loading-state">
          <span class="spinner"></span>
          <span>正在加载远程 React Button 组件 (Hook 方式)...</span>
        </div>

        <div v-else-if="buttonError" class="error-state">
          <span class="error-icon">!</span>
          <span>加载失败：{{ buttonError.message }}</span>
          <button @click="buttonRetry" class="retry-btn">重试</button>
        </div>

        <ReactComponentRenderer
          v-else-if="RemoteButton"
          :component="RemoteButton"
          :mf="buttonMf"
          class="remote-component"
          :component-props="{ title: 'Hello World' }"
        />
      </div>
    </section>

    <!-- 示例 3: 使用 useVueRemoteModule Hook 加载 Card -->
    <section class="demo-section">
      <h2>示例 3: 使用 useVueRemoteModule Hook 加载 Card</h2>

      <div class="remote-module-container">
        <div v-if="cardLoading" class="loading-state">
          <span class="spinner"></span>
          <span>正在加载远程 React Card 组件 (Hook 方式)...</span>
        </div>

        <div v-else-if="cardError" class="error-state">
          <span class="error-icon">!</span>
          <span>加载失败：{{ cardError.message }}</span>
          <button @click="cardRetry" class="retry-btn">重试</button>
        </div>

        <ReactComponentRenderer
          v-else-if="RemoteCard"
          :component="RemoteCard"
          :mf="cardMf"
          class="remote-component"
          :component-props="{ title: 'Card Title', subtitle: 'From Hook', children: '示例3内容' }"
        />
      </div>
    </section>

    <!-- 使用说明 -->
    <section class="demo-section info-section">
      <h2>使用说明</h2>
      <div class="info-content">
        <h3>当前配置</h3>
        <ul>
          <li><strong>React 版本:</strong> 18 (已挂载到全局 window 对象)</li>
          <li><strong>远程组件包:</strong> test-mf-unpkg@1.0.7</li>
          <li><strong>远程模块:</strong> Button, Card</li>
          <li><strong>作用域:</strong> fan_mf_lib</li>
        </ul>

        <h3>如何使用</h3>
        <ol>
          <li>在 <code>main.ts</code> 中调用 <code>mountReactToGlobal('18')</code></li>
          <li>使用 <code>VueRemoteModuleProvider</code> 组件或 <code>useVueRemoteModule</code> Hook</li>
          <li>指定远程组件的 <code>pkg</code>, <code>version</code>, <code>moduleName</code>, <code>scopeName</code></li>
        </ol>

        <h3>查看文档</h3>
        <p>
          更多详细信息请查看
          <a href="../../packages/vue-adapter/README.md" target="_blank">
            vue-adapter README（中文）
          </a>
          ，以及
          <a href="../../packages/vue-adapter/README.en.md" target="_blank">
            README.en（English）
          </a>
          。源码说明请看
          <a href="../../packages/vue-adapter/src/README.md" target="_blank">
            src/README
          </a>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: #42b883;
  margin-bottom: 2rem;
}

.demo-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.demo-section h2 {
  color: #35495e;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.remote-module-container {
  min-height: 100px;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e0e0e0;
  border-top-color: #42b883;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #dc3545;
}

.error-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.retry-btn {
  padding: 0.25rem 0.75rem;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
}

.retry-btn:hover {
  background-color: #38a872;
}

.info-section {
  background-color: #e8f5e9;
  border-color: #c8e6c9;
}

.info-section h2 {
  color: #2e7d32;
}

.info-content {
  color: #1b5e20;
}

.info-content h3 {
  font-size: 1rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.info-content ul,
.info-content ol {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}

.info-content li {
  margin-bottom: 0.25rem;
}

.info-content code {
  background-color: rgba(0, 0, 0, 0.06);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}

.info-content a {
  color: #2e7d32;
  text-decoration: underline;
}
</style>
