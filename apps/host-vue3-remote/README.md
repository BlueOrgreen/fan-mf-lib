# host-vue3-remote

Vue 3 Host 应用示例：用于加载并渲染 React 远程组件（Module Federation）。

## 运行方式

在 monorepo 根目录执行：

```bash
pnpm install
pnpm --filter @fan-scripts/vue-adapter build
pnpm --filter host-vue3-remote dev
```

## 当前示例说明

`src/App.vue` 包含 3 个示例：

1. `VueRemoteModuleProvider` 方式加载 `Card`
2. `useVueRemoteModule` 方式加载 `Button`
3. `useVueRemoteModule + ReactComponentRenderer` 方式加载 `Card`

关键配置（与示例一致）：

- 远程包：`test-mf-unpkg@1.0.7`
- `scopeName`: `fan_mf_lib`
- 入口会在 `main.ts` 调用 `mountReactToGlobal('18')`

## 文档入口

- Vue adapter 中文文档：`../../packages/vue-adapter/README.md`
- Vue adapter 英文文档：`../../packages/vue-adapter/README.en.md`
- Vue adapter 源码文档：`../../packages/vue-adapter/src/README.md`

## 常见排查

如果出现“远程模块已加载但页面没显示”：

- 确认已执行 `mountReactToGlobal('18')`
- 确认 `moduleName` 导出是可渲染的 React 组件
- 确认 `componentProps`（例如 `children`）被远程组件实际使用
