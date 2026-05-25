# demo-app-bridge-provider shadcn/ui + Tailwind CSS 集成实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 demo-app-bridge-provider 项目集成 shadcn/ui 组件库和 Tailwind CSS，实现样式隔离和动态主题支持

**Architecture:** 使用 Tailwind prefix `tw-` 实现样式隔离，通过 CSS 变量和 props 实现动态主题注入，集成 Button/Card/Input/Label 四个基础组件

**Tech Stack:** Tailwind CSS 3.4, @rsbuild/plugin-tailwindcss, shadcn/ui CLI, class-variance-authority, clsx, tailwind-merge

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `apps/demo-app-bridge-provider/package.json` | Modify | 添加 Tailwind 和 shadcn/ui 相关依赖 |
| `apps/demo-app-bridge-provider/tailwind.config.ts` | Create | Tailwind 配置，prefix: 'tw-' |
| `apps/demo-app-bridge-provider/postcss.config.js` | Create | PostCSS 配置 |
| `apps/demo-app-bridge-provider/components.json` | Create | shadcn/ui CLI 配置 |
| `apps/demo-app-bridge-provider/rsbuild.config.ts` | Modify | 添加 Tailwind 插件和路径别名 |
| `apps/demo-app-bridge-provider/src/styles/globals.css` | Create | Tailwind 基础样式 + CSS 变量主题 |
| `apps/demo-app-bridge-provider/src/lib/utils.ts` | Create | cn() 工具函数 |
| `apps/demo-app-bridge-provider/src/components/ui/button.tsx` | Create | Button 组件 |
| `apps/demo-app-bridge-provider/src/components/ui/card.tsx` | Create | Card 组件 |
| `apps/demo-app-bridge-provider/src/components/ui/input.tsx` | Create | Input 组件 |
| `apps/demo-app-bridge-provider/src/components/ui/label.tsx` | Create | Label 组件 |
| `apps/demo-app-bridge-provider/src/BridgeApp.tsx` | Modify | 集成 UI 组件和动态主题 |
| `apps/demo-app-bridge-provider/src/App.tsx` | Modify | 本地展示页使用 UI 组件 |
| `apps/demo-app-bridge-provider/src/index.tsx` | Modify | 导入 globals.css |

---

### Task 1: 安装依赖

**Files:**
- Modify: `apps/demo-app-bridge-provider/package.json`

- [ ] **Step 1: 添加 Tailwind 和 shadcn/ui 相关依赖到 package.json**

在 `apps/demo-app-bridge-provider/package.json` 的 `dependencies` 和 `devDependencies` 中添加：

```json
{
  "dependencies": {
    "@module-federation/bridge-react": "0.18.3",
    "fan-mf-runtime": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "lucide-react": "^0.484.0"
  },
  "devDependencies": {
    "@module-federation/enhanced": "0.18.3",
    "@module-federation/rsbuild-plugin": "0.18.3",
    "@rsbuild/core": "^1.4.13",
    "@rsbuild/plugin-react": "^1.3.4",
    "@rsbuild/plugin-tailwindcss": "^1.1.0",
    "@rspack/core": "^1.6.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.5.3",
    "autoprefixer": "^10.4.21",
    "typescript": "^5.9.2"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
cd apps/demo-app-bridge-provider && pnpm install
```

Expected: 安装成功，无错误

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/package.json apps/demo-app-bridge-provider/pnpm-lock.yaml
git commit -m "feat(demo-bridge-provider): add tailwind and shadcn/ui dependencies"
```

---

### Task 2: 创建 Tailwind 和 PostCSS 配置

**Files:**
- Create: `apps/demo-app-bridge-provider/tailwind.config.ts`
- Create: `apps/demo-app-bridge-provider/postcss.config.js`

- [ ] **Step 1: 创建 tailwind.config.ts**

创建 `apps/demo-app-bridge-provider/tailwind.config.ts`：

```typescript
import type { Config } from 'tailwindcss'

export default {
  prefix: 'tw-',
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

- [ ] **Step 2: 创建 postcss.config.js**

创建 `apps/demo-app-bridge-provider/postcss.config.js`：

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/tailwind.config.ts apps/demo-app-bridge-provider/postcss.config.js
git commit -m "feat(demo-bridge-provider): add tailwind and postcss config with tw- prefix"
```

---

### Task 3: 更新 Rsbuild 配置

**Files:**
- Modify: `apps/demo-app-bridge-provider/rsbuild.config.ts`

- [ ] **Step 1: 添加 Tailwind 插件和路径别名**

修改 `apps/demo-app-bridge-provider/rsbuild.config.ts`：

```typescript
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin'
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss'

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
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
      '@': './src',
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

- [ ] **Step 2: 验证配置正确性**

```bash
cd apps/demo-app-bridge-provider && pnpm build
```

Expected: 构建成功，Tailwind 插件已加载

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/rsbuild.config.ts
git commit -m "feat(demo-bridge-provider): add tailwind plugin and @ alias to rsbuild config"
```

---

### Task 4: 创建样式基础文件

**Files:**
- Create: `apps/demo-app-bridge-provider/src/styles/globals.css`
- Create: `apps/demo-app-bridge-provider/src/lib/utils.ts`

- [ ] **Step 1: 创建 src/styles/globals.css**

创建 `apps/demo-app-bridge-provider/src/styles/globals.css`：

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

- [ ] **Step 2: 创建 src/lib/utils.ts**

创建 `apps/demo-app-bridge-provider/src/lib/utils.ts`：

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/src/styles/globals.css apps/demo-app-bridge-provider/src/lib/utils.ts
git commit -m "feat(demo-bridge-provider): add globals.css with theme variables and utils.ts"
```

---

### Task 5: 创建 shadcn/ui CLI 配置

**Files:**
- Create: `apps/demo-app-bridge-provider/components.json`

- [ ] **Step 1: 创建 components.json**

创建 `apps/demo-app-bridge-provider/components.json`：

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

- [ ] **Step 2: Commit**

```bash
git add apps/demo-app-bridge-provider/components.json
git commit -m "feat(demo-bridge-provider): add shadcn/ui components.json config"
```

---

### Task 6: 创建 Button 组件

**Files:**
- Create: `apps/demo-app-bridge-provider/src/components/ui/button.tsx`

- [ ] **Step 1: 创建 button.tsx**

创建 `apps/demo-app-bridge-provider/src/components/ui/button.tsx`：

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'tw-inline-flex tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-md tw-text-sm tw-font-medium tw-ring-offset-background tw-transition-colors tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-ring tw-focus-visible:ring-offset-2 tw-disabled:pointer-events-none tw-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'tw-bg-primary tw-text-primary-foreground tw-hover:bg-primary/90',
        destructive:
          'tw-bg-destructive tw-text-destructive-foreground tw-hover:bg-destructive/90',
        outline:
          'tw-border tw-border-input tw-bg-background tw-hover:bg-accent tw-hover:text-accent-foreground',
        secondary:
          'tw-bg-secondary tw-text-secondary-foreground tw-hover:bg-secondary/80',
        ghost: 'tw-hover:bg-accent tw-hover:text-accent-foreground',
        link: 'tw-text-primary tw-underline-offset-4 tw-hover:underline',
      },
      size: {
        default: 'tw-h-10 tw-px-4 tw-py-2',
        sm: 'tw-h-9 tw-rounded-md tw-px-3',
        lg: 'tw-h-11 tw-rounded-md tw-px-8',
        icon: 'tw-h-10 tw-w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

- [ ] **Step 2: 安装 @radix-ui/react-slot 依赖**

```bash
cd apps/demo-app-bridge-provider && pnpm add @radix-ui/react-slot
```

Expected: 安装成功

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/src/components/ui/button.tsx apps/demo-app-bridge-provider/package.json apps/demo-app-bridge-provider/pnpm-lock.yaml
git commit -m "feat(demo-bridge-provider): add Button component"
```

---

### Task 7: 创建 Card 组件

**Files:**
- Create: `apps/demo-app-bridge-provider/src/components/ui/card.tsx`

- [ ] **Step 1: 创建 card.tsx**

创建 `apps/demo-app-bridge-provider/src/components/ui/card.tsx`：

```typescript
import * as React from 'react'

import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'tw-rounded-lg tw-border tw-bg-card tw-text-card-foreground tw-shadow-sm',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('tw-flex tw-flex-col tw-space-y-1.5 tw-p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'tw-text-2xl tw-font-semibold tw-leading-none tw-tracking-tight',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('tw-text-sm tw-text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('tw-p-6 tw-pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('tw-flex tw-items-center tw-p-6 tw-pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-app-bridge-provider/src/components/ui/card.tsx
git commit -m "feat(demo-bridge-provider): add Card component"
```

---

### Task 8: 创建 Input 组件

**Files:**
- Create: `apps/demo-app-bridge-provider/src/components/ui/input.tsx`

- [ ] **Step 1: 创建 input.tsx**

创建 `apps/demo-app-bridge-provider/src/components/ui/input.tsx`：

```typescript
import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'tw-flex tw-h-10 tw-w-full tw-rounded-md tw-border tw-border-input tw-bg-background tw-px-3 tw-py-2 tw-text-sm tw-ring-offset-background tw-file:border-0 tw-file:bg-transparent tw-file:text-sm tw-file:font-medium tw-placeholder:text-muted-foreground tw-focus-visible:outline-none tw-focus-visible:ring-2 tw-focus-visible:ring-ring tw-focus-visible:ring-offset-2 tw-disabled:cursor-not-allowed tw-disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
```

- [ ] **Step 2: Commit**

```bash
git add apps/demo-app-bridge-provider/src/components/ui/input.tsx
git commit -m "feat(demo-bridge-provider): add Input component"
```

---

### Task 9: 创建 Label 组件

**Files:**
- Create: `apps/demo-app-bridge-provider/src/components/ui/label.tsx`

- [ ] **Step 1: 安装 @radix-ui/react-label 依赖**

```bash
cd apps/demo-app-bridge-provider && pnpm add @radix-ui/react-label
```

Expected: 安装成功

- [ ] **Step 2: 创建 label.tsx**

创建 `apps/demo-app-bridge-provider/src/components/ui/label.tsx`：

```typescript
import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const labelVariants = cva(
  'tw-text-sm tw-font-medium tw-leading-none tw-peer-disabled:cursor-not-allowed tw-peer-disabled:opacity-70'
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/src/components/ui/label.tsx apps/demo-app-bridge-provider/package.json apps/demo-app-bridge-provider/pnpm-lock.yaml
git commit -m "feat(demo-bridge-provider): add Label component"
```

---

### Task 10: 改造 BridgeApp 组件

**Files:**
- Modify: `apps/demo-app-bridge-provider/src/BridgeApp.tsx`

- [ ] **Step 1: 改造 BridgeApp.tsx 集成 UI 组件和动态主题**

修改 `apps/demo-app-bridge-provider/src/BridgeApp.tsx`：

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

- [ ] **Step 2: 验证构建**

```bash
cd apps/demo-app-bridge-provider && pnpm build
```

Expected: 构建成功，无错误

- [ ] **Step 3: Commit**

```bash
git add apps/demo-app-bridge-provider/src/BridgeApp.tsx
git commit -m "feat(demo-bridge-provider): integrate UI components and dynamic theme in BridgeApp"
```

---

### Task 11: 改造本地展示页 App.tsx

**Files:**
- Modify: `apps/demo-app-bridge-provider/src/App.tsx`
- Modify: `apps/demo-app-bridge-provider/src/index.tsx`

- [ ] **Step 1: 改造 App.tsx 使用 UI 组件**

修改 `apps/demo-app-bridge-provider/src/App.tsx`：

```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import './styles/globals.css'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <div className={cn('tw-min-h-screen tw-p-8', theme === 'dark' && 'tw-dark')}>
      <div className="tw-max-w-4xl tw-mx-auto tw-space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Bridge Provider App</CardTitle>
            <CardDescription>
              Remote Components Provider with shadcn/ui + Tailwind CSS
            </CardDescription>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-flex tw-items-center tw-gap-4">
              <Label>Theme:</Label>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
            <div className="tw-space-y-2">
              <Label htmlFor="demo-input">Demo Input</Label>
              <Input id="demo-input" placeholder="Type something..." />
            </div>
          </CardContent>
          <CardFooter>
            <p className="tw-text-sm tw-text-muted-foreground">
              Running on port 3101
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default App
```

- [ ] **Step 2: 更新 index.tsx 导入 globals.css**

修改 `apps/demo-app-bridge-provider/src/index.tsx`：

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
```

注意：globals.css 已在 App.tsx 中导入，无需在 index.tsx 再次导入。删除原来的 index.css 导入。

- [ ] **Step 3: 删除旧的 CSS 文件**

```bash
rm apps/demo-app-bridge-provider/src/App.css apps/demo-app-bridge-provider/src/index.css
```

- [ ] **Step 4: 验证构建和本地运行**

```bash
cd apps/demo-app-bridge-provider && pnpm build
```

Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add apps/demo-app-bridge-provider/src/App.tsx apps/demo-app-bridge-provider/src/index.tsx
git commit -m "feat(demo-bridge-provider): update App.tsx with shadcn/ui components and theme toggle"
```

---

### Task 12: 验证整体功能

**Files:**
- 无文件修改，仅验证

- [ ] **Step 1: 启动 Provider 应用**

```bash
cd apps/demo-app-bridge-provider && pnpm dev
```

Expected: 应用在 http://localhost:3101 正常运行，UI 组件正常显示，主题切换功能正常

- [ ] **Step 2: 检查 Tailwind 类名前缀**

在浏览器开发者工具中检查元素的 class 属性，确认所有 Tailwind 类名带有 `tw-` 前缀。

Expected: 类名格式如 `tw-p-4`, `tw-bg-primary`, `tw-text-sm` 等

- [ ] **Step 3: 验证 Module Federation 远程组件构建**

```bash
cd apps/demo-app-bridge-provider && pnpm build
ls dist/remoteEntry.js
```

Expected: `remoteEntry.js` 文件存在

---

### Task 13: 更新 tsconfig 添加路径别名

**Files:**
- Modify: `apps/demo-app-bridge-provider/tsconfig.json`

- [ ] **Step 1: 添加 @ 路径别名到 tsconfig**

修改 `apps/demo-app-bridge-provider/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

如果 tsconfig.node.json 不存在，可以移除 references 字段。

- [ ] **Step 2: Commit**

```bash
git add apps/demo-app-bridge-provider/tsconfig.json
git commit -m "feat(demo-bridge-provider): add @ path alias to tsconfig"
```

---

## 自检验

### Spec Coverage 检查

| 规格需求 | 任务覆盖 |
|----------|----------|
| Tailwind CSS + prefix | Task 2 (tailwind.config.ts) |
| Rsbuild 集成 | Task 3 (rsbuild.config.ts) |
| globals.css + CSS 变量 | Task 4 (globals.css) |
| utils.ts (cn 函数) | Task 4 (utils.ts) |
| components.json | Task 5 |
| Button 组件 | Task 6 |
| Card 组件 | Task 7 |
| Input 组件 | Task 8 |
| Label 组件 | Task 9 |
| BridgeApp 改造 + 动态主题 | Task 10 |
| App.tsx 本地展示 | Task 11 |
| 验证构建和功能 | Task 12 |
| TypeScript 路径别名 | Task 13 |

**覆盖完整，无遗漏。**

### Placeholder Scan

无 TBD/TODO 占位符，所有步骤包含完整代码和命令。

### Type Consistency

- `DemoBridgeAppProps` 类型在 Task 10 中定义，包含 `theme` 和 `themeVars` 属性
- `cn()` 函数在 Task 4 中定义，在 Task 6-11 中使用
- 所有组件使用 `@/lib/utils` 和 `@/components/ui/*` 路径别名，与 Task 13 的 tsconfig 配置一致

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-05-demo-bridge-provider-shadcn-tailwind.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - 我为每个任务派遣独立的子代理执行，任务间进行审核，快速迭代

**2. Inline Execution** - 在当前会话中使用 executing-plans 技能执行，批量执行带检查点

**选择哪种方式？**