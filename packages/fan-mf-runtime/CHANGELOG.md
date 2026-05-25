# Changelog

## 1.0.3

### Patch Changes

- - chore: git 记录到 changelog 日志中

## 1.0.2

### Major Changes

- 8e4a168: test publish

### Patch Changes

- d5c8346: 完善单元测试 & runtime 实例重试机制

## 1.0.0

### Major Changes

- 9306c65: changeset cli 集成 & 变更日志记录

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

## [1.0.6] - 2026-05-08

### Release

- Published version 1.0.6 with patch bump


## [1.0.5] - 2026-03-29

### Release

- Published version 1.0.5 with patch bump


## [1.0.4] - 2026-03-27

### Release

- Published version 1.0.4 with patch bump


## [1.0.1] - 2026-03-20

### Release

- Published version 1.0.1 with patch bump

## [0.0.17] - 2026-03-19

### Release

- Published version 0.0.17 with patch bump

## [0.0.16] - 2026-03-18

### Release

- Published version 0.0.16 with patch bump

## [0.0.15] - 2026-03-17

### Release

- Published version 0.0.15 with patch bump

## [0.0.14] - 2026-03-17

### Release

- Published version 0.0.14 with patch bump

## [0.0.13] - 2026-03-17

### Release

- Published version 0.0.13 with patch bump

## [0.0.12] - 2026-03-16

### Release

- Published version 0.0.12 with patch bump

## [0.0.11] - 2026-03-16

### Release

- Published version 0.0.11 with patch bump

## [0.0.10] - 2026-03-15

### Release

- Published version 0.0.10 with patch bump

## [0.0.9] - 2026-03-15

### Release

- Published version 0.0.9 with patch bump

### Refactor

- 重构项目为模块化目录结构
  - `src/loader/` - 核心加载模块
  - `src/version/` - 版本管理模块
  - `src/preload/` - 预加载模块
  - `src/unload/` - 卸载管理模块
  - `src/health/` - 健康检查模块
  - `src/event-bus/` - 事件总线模块
  - `src/plugins/` - 插件模块
  - `src/types/` - 类型定义
- 更新 rslib.config.ts entry 为 `./src/index.ts`
- 更新 package.json types 路径为 `./dist/index.d.ts`

### Changed

- 修复 preloadRemote 引用从 loadRemote2 改为 loadRemote
- 移除 App.tsx 中未使用的 React 导入
- 添加 release 脚本到 package.json

## [0.0.8] - 2026-03-15

### Refactor

- 抽离公共工具函数到 `loadRemoteUtils.ts`
  - 新增 `fetchLatestVersion()` - 从 npm registry 获取最新版本
  - 新增 `getVersionCache()` / `setVersionCache()` - 缓存管理
  - 新增 `buildCdnUrls()` - 构建 CDN 地址列表
  - 新增 `tryLoadRemote()` - 单个 URL 的加载重试逻辑
  - 新增 `getFinalSharedConfig()` - 合并共享配置
  - 新增 `resolveFinalVersion()` - 解析最终版本号
  - 新增 `buildFinalUrls()` - 构建最终 URL 列表
- 删除冗余文件 `loadRemote2.ts`
- 简化 `loadRemote.ts`，使用公共工具函数

### Changed

- 更新 `index.ts` 导出，新增工具函数导出

### Docs

- 更新 `loadRemote.md`，添加工具函数 API 文档

## [0.0.7] - 2026-03-15

### Features

- 新增微前端工具函数集
  - 远程模块加载
  - React 多版本支持
  - 预加载功能
  - 健康检查
  - 事件总线

## [0.0.6] - 2026-03-14

### Docs

- 更新 README 和 loadRemote.md 文档
- 添加使用指南和 API 参考

### Chore

- 更新 fan-mf-runtime 版本至 0.0.8

## [0.0.5] - 2026-03-14

### Features

- 添加多版本远程加载功能
- 支持自定义 shared 配置
- 改进错误处理机制

## [0.0.4] - 2026-03-14

### Chore

- 更新错误处理逻辑
- 优化加载流程

## [0.0.3] - 2026-03-14

### Docs

- 添加项目描述和 git 仓库信息
- 更新 README 中的示例代码
- 将 loadRemote.md 从 src 移动到根目录

### Chore

- 更新 fan-mf-runtime 的版本号至 0.0.3

## [0.0.2] - 2026-03-14

### Features

- 添加 React 多版本加载功能（v17/v18/v19）
- 添加共享配置支持
  - 默认共享 react 和 react-dom
  - 支持自定义共享模块

### Docs

- 更新示例代码展示如何使用 loadRemoteMultiVersion

## [0.0.1] - 2026-03-14

### Features

- 实现多版本远程模块加载功能
  - 支持 CDN 故障转移（jsdelivr、unpkg）
  - 支持本地 fallback 兜底
  - 支持重试机制
  - 支持版本缓存
- 基础工具函数
  - `loadRemoteMultiVersion()` - 加载远程模块
  - `loadReactVersion()` - 加载特定版本 React

---

## 版本说明

| 版本   | 日期       | 主要变更                       |
| ------ | ---------- | ------------------------------ |
| 0.0.17 | 2026-03-19 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.16 | 2026-03-18 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.15 | 2026-03-17 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.14 | 2026-03-17 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.13 | 2026-03-17 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.12 | 2026-03-16 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.11 | 2026-03-16 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.10 | 2026-03-15 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.9  | 2026-03-15 | patch 版本发布                 |
| ------ | ------     | ----------                     |
| 0.0.9  | 2026-03-15 | 重构为模块化目录结构           |
| 0.0.8  | 2026-03-15 | 重构代码结构，抽离公共工具函数 |
| 0.0.7  | 2026-03-15 | 新增微前端工具函数集           |
| 0.0.6  | 2026-03-14 | 文档更新                       |
| 0.0.5  | 2026-03-14 | 多版本远程加载                 |
| 0.0.4  | 2026-03-14 | 错误处理优化                   |
| 0.0.3  | 2026-03-14 | 文档和配置更新                 |
| 0.0.2  | 2026-03-14 | React 多版本支持               |
| 0.0.1  | 2026-03-14 | 初始版本                       |
