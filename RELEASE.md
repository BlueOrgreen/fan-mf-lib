# Release Scripts

统一的内容发布管理脚本，基于 Changesets 实现多包版本管理和发布。

## 快速开始

### 首次配置

**1. 设置 npm token（避免浏览器验证）**

```bash
# 获取 npm token
# 方式一：命令行登录（会创建 token）
npm login

# 方式二：在 npm 官网生成 Automation Token
# https://www.npmjs.com/settings/YOUR_USERNAME/tokens

# 设置环境变量
export NPM_TOKEN="npm_xxxxxxxxxxxxxxxxxxxxx"

# 添加到 ~/.zshrc 或 ~/.bashrc 永久生效
echo 'export NPM_TOKEN="npm_xxxxxxxxxxxxxxxxxxxxx"' >> ~/.zshrc
source ~/.zshrc
```

**2. 项目已配置好以下文件：**

- `.nvmrc` - Node.js 版本管理
- `.npmrc` - npm 认证配置（使用 `${NPM_TOKEN}` 环境变量）
- `.gitignore` - 已忽略 `.npmrc` 防止 token 泄露

### 使用 npm/pnpm 脚本

```bash
# 查看所有 changeset 状态
pnpm status

# 添加新的 changeset
pnpm add

# 应用版本变更（更新版本号、生成 CHANGELOG）
pnpm version

# 发布所有包到 npm
pnpm publish

# 进入预发布模式
pnpm pre enter beta    # 进入 beta 预发布
pnpm pre exit          # 退出预发布模式
```

### 使用 shell 脚本

```bash
# 查看所有 changeset 状态
./release.sh status

# 添加新的 changeset
./release.sh add

# 应用版本变更
./release.sh version

# 发布所有包
./release.sh publish

# 进入预发布模式
./release.sh pre enter beta
./release.sh pre exit
```

## 完整工作流

### 1. 开发阶段

创建新的 changeset 来记录你的更改：

```bash
pnpm add
```

这会引导你选择受影响的包并填写变更说明。

### 2. 发布前准备

应用所有 changesets 来更新版本号并生成 CHANGELOG：

```bash
pnpm version
```

这个命令会：
- 根据 changesets 更新所有包的版本号
- 生成/更新 CHANGELOG.md
- 自动运行 `pnpm install` 更新依赖

### 3. 发布到 npm

```bash
pnpm publish
```

这个命令会：
- 构建所有包（如果有 build 脚本）
- 发布所有包到 npm
- 创建 git tag

### 4. 预发布流程

对于 beta、rc 等预发布版本：

```bash
# 进入预发布模式
pnpm pre enter beta

# 正常的 add -> version -> publish 流程
pnpm add
pnpm version
pnpm publish --tag beta

# 完成后退出预发布模式
pnpm pre exit
```

## Changeset 格式

每个 changeset 文件使用 Markdown 格式：

```markdown
---
'@fan-scripts/fan-mf-runtime': minor
'@fan-scripts/react-adapter': patch
---

这里描述变更内容

- 新增功能
- 修复的问题
```

## 注意事项

1. **发布顺序**: 总是先 `version` 再 `publish`
2. **Git 提交**: version 命令后会产生 git 变更，记得提交
3. **版本号**: 遵循语义化版本规范 (major.minor.patch)
4. **Workspace 依赖**: 内部依赖会自动更新

## 故障排查

### 发布失败 - npm token 问题

**检查 token 是否有效：**

```bash
# 验证当前登录状态
npm whoami

# 如果显示错误，重新登录
npm login

# 或者手动设置 token
export NPM_TOKEN="npm_xxxxxxxxxxxxxxxxxxxxx"
```

**Token 类型说明：**

- `Publish` - 用于发布包（推荐用于 CI/CD）
- `Automation` - 自动化 token，更安全
- `Read` - 只读权限

### 发布失败

如果有冲突的 changeset，运行：

```bash
pnpm status --verbose
```

### 手动发布

如需手动控制发布过程：

```bash
cd packages/fan-mf-runtime
npm publish --access public
```
