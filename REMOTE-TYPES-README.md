# Module Federation 远程类型使用指南

## 概述

本项目实现了 Module Federation 远程模块的类型自动同步机制，支持：

- 远程模块（test-mf-unpkg）自动生成并导出类型声明
- Host 项目自动拉取远程类型并获得 TypeScript 类型提示
- 支持 React 和 Vue 3 项目
- 统一的类型同步脚本，支持多 Host 项目

## 目录结构

```
fan-mf-lib/
├── scripts/
│   └── sync-remote-types.ts    # 统一的类型同步脚本
├── mf-types.config.json        # 全局类型同步配置
│
├── apps/
│   ├── test-mf-unpkg/          # 远程模块（发布到 npm/unpkg）
│   │   ├── src/
│   │   │   ├── Button.tsx      # 导出 ButtonProps 类型
│   │   │   ├── Card.tsx        # 导出 CardProps 类型
│   │   │   └── index.ts        # 类型导出入口
│   │   ├── dist/types/         # 生成的类型声明
│   │   ├── package.json        # 包含 types 字段
│   │   └── tsconfig.json       # 启用 declaration
│   │
│   ├── host-react18-remote/    # React Host 项目
│   │   ├── @mf-types/          # 自动生成的远程类型（.gitignore）
│   │   ├── src/components/
│   │   │   └── RemoteLoader.tsx # 类型化的远程组件
│   │   ├── tsconfig.json       # 配置 paths 指向 @mf-types
│   │   └── package.json        # 包含 sync:types 脚本
│   │
│   └── host-vue3-remote/       # Vue 3 Host 项目
│       ├── @mf-types/          # 自动生成的远程类型（.gitignore）
│       ├── src/components/
│       │   └── RemoteCard.vue  # 类型化的远程组件
│       ├── tsconfig.json
│       └── package.json
```

## 远程模块配置 (test-mf-unpkg)

### 1. tsconfig.json

```json
{
  "compilerOptions": {
    "declaration": true,
    "emitDeclarationOnly": true,
    "declarationDir": "./dist/types",
    // ... 其他配置
  },
  "include": ["src"]
}
```

### 2. package.json

```json
{
  "main": "dist/remoteEntry.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/remoteEntry.js"
    },
    "./Button": {
      "types": "./dist/types/Button.d.ts"
    },
    "./Card": {
      "types": "./dist/types/Card.d.ts"
    }
  },
  "scripts": {
    "build:types": "tsc --emitDeclarationOnly --outDir dist/types",
    "build:all": "pnpm build:types && pnpm build"
  }
}
```

### 3. src/index.ts（类型入口）

```typescript
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export { default as Button } from './Button';
export { default as Card } from './Card';
```

## Host 项目配置

### 1. tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["./@mf-types/*"]
    }
  }
}
```

### 2. package.json

```json
{
  "scripts": {
    "sync:types": "pnpm --workspace-root sync:types -- --target $PROJECT_NAME"
  },
  "devDependencies": {
    "tsx": "^4.19.3"
  }
}
```

## 使用方式

### 根目录同步所有 Host 项目

```bash
# 在项目根目录
pnpm sync:types
```

### 同步指定 Host 项目

```bash
# 同步 React Host
pnpm tsx scripts/sync-remote-types.ts --target host-react18-remote

# 同步 Vue Host
pnpm tsx scripts/sync-remote-types.ts --target host-vue3-remote
```

### 使用自定义配置

```bash
pnpm tsx scripts/sync-remote-types.ts --config mf-types.config.json
```

### 在 Host 项目目录同步

```bash
cd apps/host-react18-remote
pnpm sync:types
```

### React 项目使用

```typescript
// src/App.tsx
import { RemoteButton, RemoteCard } from './components';

function App() {
  return (
    <div>
      {/* 完整的类型提示 */}
      <RemoteButton
        variant="primary"
        size="large"
        onClick={() => console.log('clicked')}
      >
        Click Me
      </RemoteButton>

      <RemoteCard
        title="Remote Card"
        elevated
        width={300}
      >
        Content here
      </RemoteCard>
    </div>
  );
}
```

### Vue 3 项目使用

```vue
<script setup lang="ts">
import RemoteCard from './components/RemoteCard.vue'
</script>

<template>
  <RemoteCard
    title="Remote Card"
    elevated
    :width="300"
  >
    Content here
  </RemoteCard>
</template>
```

## 开发流程

### 1. 开发远程模块

```bash
# 在远程模块目录
cd apps/test-mf-unpkg

# 开发模式
pnpm dev

# 构建类型和代码
pnpm build:all
```

### 2. 同步类型到 Host

```bash
# 在项目根目录（同步所有 Host）
pnpm sync:types

# 或在 Host 项目目录
cd apps/host-react18-remote
pnpm sync:types
```

### 3. 发布远程模块

```bash
cd apps/test-mf-unpkg
pnpm build:all
npm publish  # 或发布到私有 registry
```

## 配置说明

### 全局配置文件 (mf-types.config.json)

```json
{
  "remoteModules": [
    {
      "name": "test-mf-unpkg",
      "version": "latest",
      "registry": "https://registry.npmjs.org",
      "unpkg": "https://unpkg.com",
      "localPath": "apps/test-mf-unpkg",
      "exposedModules": {
        "./Button": "Button",
        "./Card": "Card"
      }
    }
  ],
  "typesDir": "@mf-types"
}
```

### 项目级配置文件 (apps/{project}/mf-types.config.json)

如果某个 Host 项目需要特殊配置，可以在项目目录下创建 `mf-types.config.json`：

```json
{
  "remoteModules": [
    {
      "name": "custom-remote",
      "version": "1.0.0",
      "localPath": "apps/custom-remote",
      "exposedModules": {
        "./Component": "Component"
      }
    }
  ]
}
```

## 类型同步脚本特性

- **自动发现 Host 项目**: 自动扫描 `apps/` 目录下包含 `sync:types` 脚本或 adapter 依赖的项目
- **开发环境**: 从本地 `dist/types` 目录复制类型
- **生产环境**: 从 unpkg CDN 下载类型
- **自动生成**: Module Federation 模块声明
- **版本管理**: 支持 semver 版本号
- **目标指定**: 支持 `--target` 参数同步指定项目

## 命令行选项

```
pnpm tsx scripts/sync-remote-types.ts [选项]

选项:
  -c, --config <file>   指定配置文件路径（JSON 格式）
  -t, --target <name>   指定同步目标项目（apps 目录下的子目录名）
  -h, --help            显示帮助信息
```

## 添加新的远程模块

### 方式 1: 修改全局配置

编辑 `mf-types.config.json`：

```json
{
  "remoteModules": [
    {
      "name": "test-mf-unpkg",
      // ...
    },
    {
      "name": "my-remote-module",
      "version": "latest",
      "registry": "https://registry.npmjs.org",
      "unpkg": "https://unpkg.com",
      "localPath": "apps/my-remote-module",
      "exposedModules": {
        "./ComponentA": "ComponentA",
        "./ComponentB": "ComponentB"
      }
    }
  ]
}
```

### 方式 2: 使用项目级配置

在 Host 项目目录创建 `mf-types.config.json`，仅覆盖该项目的配置。

## 故障排除

### 类型未更新

```bash
# 清理缓存
rm -rf apps/host-react18-remote/@mf-types

# 重新同步
pnpm sync:types
```

### TypeScript 报错找不到模块

检查 `tsconfig.json` 中的 `paths` 配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["./@mf-types/*"]
    }
  }
}
```

### unpkg CDN 404

unpkg 需要几分钟缓存时间，开发时使用本地类型同步。

### 远程模块类型未生成

确保远程模块已执行 `pnpm build:types` 并生成 `dist/types` 目录。

## 参考链接

- [Module Federation 官方文档 - 类型提示](https://module-federation.io/zh/guide/basic/type-prompt.html)
- [@module-federation/typescript](https://www.npmjs.com/package/@module-federation/typescript)
