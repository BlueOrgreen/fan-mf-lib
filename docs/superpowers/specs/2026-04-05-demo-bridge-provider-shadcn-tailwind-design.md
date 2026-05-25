# demo-app-bridge-provider shadcn/ui + Tailwind CSS 集成设计

> **项目:** 为 Module Federation 远程组件 Provider 应用添加 shadcn/ui 和 Tailwind CSS 支持
> **日期:** 2026-04-05
> **状态:** 待审核

## 1. 项目概述

### 目标

在 `demo-app-bridge-provider` 项目中集成 shadcn/ui 无头组件库和 Tailwind CSS，用于本地展示页面和远程组件（BridgeApp）。

### 核心需求

| 需求 | 描述 |
|------|------|
| shadcn/ui + Tailwind | 使用 shadcn/ui CLI 添加无头组件，配置 Tailwind CSS |
| 样式隔离 | 使用 `prefix: 'tw-'` 防止远程组件样式与 Host 应用冲突 |
| 动态主题 | 通过 CSS 变量和 props 实现主题动态切换，由 Host 应用控制 |
| 基础组件 | Button、Card、Input、Label 四个核心组件 |
| 本地 + 远程使用 | 本地 App.tsx 和远程 BridgeApp.tsx 都使用同一套组件 |

### 成功标准

- Tailwind CSS 正常构建，所有类名带有 `tw-` 前缀
- shadcn/ui 组件（Button、Card、Input、Label）可正常使用
- 远程组件通过 props 接收主题配置，能动态切换 light/dark 模式
- Module Federation 构建正常，远程组件可被 Host 应用加载
- 样式不与 Host 应用冲突

## 2. 技术架构

### 目录结构

```
demo-app-bridge-provider/
├── src/
│   ├── components/ui/          # shadcn/ui 组件 (CLI 自动生成)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   ├── lib/
│   │   └── utils.ts            # shadcn/ui 工具函数 (cn 等)
│   ├── styles/
│   │   └── globals.css         # Tailwind 基础样式 + CSS 变量主题定义
│   ├── BridgeApp.tsx           # 远程组件 (改造后使用 UI 组件)
│   ├── export-app.tsx          # Module Federation 导出入口
│   └── App.tsx                 # 本地展示页面 (使用 UI 组件)
├── tailwind.config.ts          # Tailwind 配置 (prefix: 'tw-')
├── postcss.config.js           # PostCSS 配置
├── components.json             # shadcn/ui CLI 配置
└── rsbuild.config.ts           # 更新以支持 Tailwind 插件
```

### 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| tailwindcss | ^3.4.0 | CSS 框架，带 prefix 配置 |
| @rsbuild/plugin-tailwindcss | ^1.0.0 | Rsbuild Tailwind 集成 |
| class-variance-authority | ^0.7.0 | shadcn/ui 组件变体管理 |
| clsx | ^2.0.0 | 类名条件合并 |
| tailwind-merge | ^2.0.0 | Tailwind 类名智能去重 |
| shadcn-ui CLI | npx | 组件生成工具 |

## 3. 配置文件设计

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

export default {
  prefix: 'tw-',  // 样式隔离关键配置
  content: ['./src/**/*.{ts,tsx,css}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--tw-background) / <alpha-value>)',
        foreground: 'hsl(var(--tw-foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--tw-primary) / <alpha-value>)',
          foreground: 'hsl(var(--tw-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--tw-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--tw-secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--tw-muted) / <alpha-value>)',
          foreground: 'hsl(var(--tw-muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--tw-accent) / <alpha-value>)',
          foreground: 'hsl(var(--tw-accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--tw-destructive) / <alpha-value>)',
          foreground: 'hsl(var(--tw-destructive-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--tw-border) / <alpha-value>)',
        input: 'hsl(var(--tw-input) / <alpha-value>)',
        ring: 'hsl(var(--tw-ring) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--tw-card) / <alpha-value>)',
          foreground: 'hsl(var(--tw-card-foreground) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--tw-radius)',
        md: 'calc(var(--tw-radius) - 2px)',
        sm: 'calc(var(--tw-radius) - 4px)',
      },
    },
  },
} satisfies Config
```

### components.json (shadcn/ui CLI 配置)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": "tw-"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib",
    "ui": "@/components/ui"
  }
}
```

### rsbuild.config.ts 更新

```typescript
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),  // 新增 Tailwind 插件
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
  source: {
    alias: {
      '@': './src',  // 新增路径别名
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
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## 4. 主题系统设计

### globals.css - CSS 变量定义

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --tw-background: 0 0% 100%;
    --tw-foreground: 222.2 84% 4.9%;
    --tw-card: 0 0% 100%;
    --tw-card-foreground: 222.2 84% 4.9%;
    --tw-popover: 0 0% 100%;
    --tw-popover-foreground: 222.2 84% 4.9%;
    --tw-primary: 222.2 47.4% 11.2%;
    --tw-primary-foreground: 210 40% 98%;
    --tw-secondary: 210 40% 96.1%;
    --tw-secondary-foreground: 222.2 47.4% 11.2%;
    --tw-muted: 210 40% 96.1%;
    --tw-muted-foreground: 215.4 16.3% 46.9%;
    --tw-accent: 210 40% 96.1%;
    --tw-accent-foreground: 222.2 47.4% 11.2%;
    --tw-destructive: 0 84.2% 60.2%;
    --tw-destructive-foreground: 210 40% 98%;
    --tw-border: 214.3 31.8% 91.4%;
    --tw-input: 214.3 31.8% 91.4%;
    --tw-ring: 222.2 84% 4.9%;
    --tw-radius: 0.5rem;
  }

  .tw-dark {
    --tw-background: 222.2 84% 4.9%;
    --tw-foreground: 210 40% 98%;
    --tw-card: 222.2 84% 4.9%;
    --tw-card-foreground: 210 40% 98%;
    --tw-popover: 222.2 84% 4.9%;
    --tw-popover-foreground: 210 40% 98%;
    --tw-primary: 210 40% 98%;
    --tw-primary-foreground: 222.2 47.4% 11.2%;
    --tw-secondary: 217.2 32.6% 17.5%;
    --tw-secondary-foreground: 210 40% 98%;
    --tw-muted: 217.2 32.6% 17.5%;
    --tw-muted-foreground: 215 20.2% 65.1%;
    --tw-accent: 217.2 32.6% 17.5%;
    --tw-accent-foreground: 210 40% 98%;
    --tw-destructive: 0 62.8% 30.6%;
    --tw-destructive-foreground: 210 40% 98%;
    --tw-border: 217.2 32.6% 17.5%;
    --tw-input: 217.2 32.6% 17.5%;
    --tw-ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply tw-border-border;
  }
  body {
    @apply tw-bg-background tw-text-foreground;
  }
}
```

### lib/utils.ts

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## 5. BridgeApp Props 扩展

### 新增类型定义

```typescript
export interface DemoBridgeAppProps {
  // 原有 props
  title?: string
  userName?: string
  count?: number
  onAction?: () => void
  children?: ReactNode

  // 新增主题 props
  theme?: 'light' | 'dark' | string
  themeVars?: {
    background?: string
    foreground?: string
    primary?: string
    primaryForeground?: string
    secondary?: string
    secondaryForeground?: string
    border?: string
    input?: string
    ring?: string
    radius?: string
    [key: string]: string | undefined
  }

  // 其他任意 props
  [key: string]: unknown
}
```

### 动态主题注入逻辑

```typescript
useEffect(() => {
  if (themeVars && containerRef.current) {
    Object.entries(themeVars).forEach(([key, value]) => {
      if (value) {
        // 将 camelCase 转换为 CSS 变量格式
        const cssKey = `--tw-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        containerRef.current.style.setProperty(cssKey, value)
      }
    })
  }
}, [themeVars])
```

## 6. BridgeApp 改造示例

```typescript
import { useRef, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import './styles/globals.css'

export interface DemoBridgeAppProps {
  title?: string
  userName?: string
  count?: number
  onAction?: () => void
  children?: ReactNode
  theme?: 'light' | 'dark' | string
  themeVars?: Record<string, string | undefined>
  [key: string]: unknown
}

export default function BridgeApp({
  title = 'Bridge Remote App',
  userName = 'Guest',
  count = 0,
  onAction,
  children,
  theme = 'light',
  themeVars,
}: DemoBridgeAppProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (themeVars && containerRef.current) {
      Object.entries(themeVars).forEach(([key, value]) => {
        if (value) {
          const cssKey = `--tw-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
          containerRef.current.style.setProperty(cssKey, value)
        }
      })
    }
  }, [themeVars])

  return (
    <div ref={containerRef} className={cn('tw-p-4', theme === 'dark' && 'tw-dark')}>
      <Card className="tw-w-full tw-max-w-md">
        <CardHeader>
          <h3 className="tw-text-lg tw-font-semibold">{title}</h3>
        </CardHeader>
        <CardContent className="tw-space-y-4">
          <div className="tw-space-y-2">
            <Label htmlFor="username">User Name</Label>
            <Input id="username" value={userName} readOnly />
          </div>
          <p className="tw-text-sm tw-text-muted-foreground">
            Count from host: {count}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={onAction}>Trigger host action</Button>
        </CardFooter>
        {children && <div className="tw-mt-4 tw-px-6 tw-pb-6">{children}</div>}
      </Card>
    </div>
  )
}
```

## 7. 实施步骤

| 步骤 | 任务 | 产出 |
|------|------|------|
| 1 | 安装 Tailwind 及相关依赖 | package.json 更新 |
| 2 | 创建 Tailwind 和 PostCSS 配置 | tailwind.config.ts, postcss.config.js |
| 3 | 更新 Rsbuild 配置 | rsbuild.config.ts 添加 Tailwind 插件 |
| 4 | 创建 globals.css 和 utils.ts | 样式基础文件 |
| 5 | 创建 components.json | shadcn/ui CLI 配置 |
| 6 | 使用 CLI 添加组件 | Button、Card、Input、Label |
| 7 | 改造 BridgeApp.tsx | 集成 UI 组件和动态主题 |
| 8 | 改造 App.tsx | 本地展示页使用 UI 组件 |
| 9 | 验证构建和远程加载 | 确保 Module Federation 正常 |
| 10 | 测试主题切换功能 | light/dark + 自定义主题Vars |

## 8. 验收标准

1. **构建验证**: `pnpm build` 成功无错误
2. **样式隔离验证**: 所有 Tailwind 类名带有 `tw-` 前缀
3. **组件功能验证**: Button、Card、Input、Label 可正常渲染和交互
4. **远程加载验证**: Host 应用可正常加载远程组件
5. **主题切换验证**:
   - `theme="light"` 显示亮色主题
   - `theme="dark"` 显示暗色主题
   - `themeVars` 可动态覆盖 CSS 变量
6. **无样式冲突**: 与 Host 应用样式不冲突

## 9. 风险和注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Tailwind 样式体积增大 | 远程组件加载性能 | Tailwind 会自动移除未使用的样式 |
| CSS 变量命名冲突 | Host 应用可能使用相同变量名 | 使用 `--tw-` 前缀隔离 |
| globals.css 未被远程组件加载 | 样式缺失 | 确保 globals.css 在 BridgeApp.tsx 中导入 |
| 主题切换闪烁 | 切换时可能有短暂闪烁 | 使用 CSS 过渡动画平滑切换 |

## 10. 后续扩展（可选）

- 添加更多 shadcn/ui 组件（Dialog、Dropdown、Tooltip 等）
- 支持更多预设主题（品牌色主题）
- 添加主题过渡动画
- 支持组件级别的主题覆盖