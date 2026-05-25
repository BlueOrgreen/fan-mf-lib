# Release Guide

本指南说明如何使用发布脚本管理 `fan-mf-runtime` 的版本发布流程。

## 目录结构

```
packages/fan-mf-runtime/
├── scripts/              # 发布脚本
│   ├── generateReleasePr.mjs  # 生成发布 PR
│   └── finalizeRelease.mjs    # 完成发布
├── CHANGELOG.md          # 变更日志
└── package.json
```

## 快速开始

### 1. 准备发布

```bash
# 发布补丁版本 (0.0.x -> 0.0.x+1)
pnpm release:patch

# 发布小版本 (0.x.0 -> 0.x+1.0)
pnpm release:minor

# 发布主版本 (x.0.0 -> x+1.0.0)
pnpm release:major
```

这会自动：
- 创建新版本分支（如 `release/v0.0.9`）
- 更新 CHANGELOG.md
- 更新 package.json 版本号
- 构建 package
- 提交并推送分支

### 2. 创建 Pull Request

在 GitHub 上创建 PR，将发布分支合并到 `main`。

### 3. 合并 PR 并发布

PR 合并后，运行：

```bash
# 发布到 npm
pnpm publish:live
```

## 脚本说明

| 脚本 | 说明 |
|------|------|
| `pnpm release:prepare` | 准备发布（支持 -t patch/minor/major） |
| `pnpm release:finalize` | 完成发布（发布到 npm） |
| `pnpm release:patch` | 发布补丁版本 |
| `pnpm release:minor` | 发布小版本 |
| `pnpm release:major` | 发布主版本 |
| `pnpm publish:dry` | 预演发布（不会真正发布） |
| `pnpm publish:live` | 正式发布到 npm |

## 手动发布流程

如果不想使用自动化脚本，可以手动执行：

```bash
# 1. 更新 CHANGELOG.md
# 在 [未发布] 部分后添加新版本条目

# 2. 更新 package.json 版本
npm version patch --no-git-tag-version

# 3. 构建
pnpm run build

# 4. 提交
git add .
git commit -m "Release v0.0.x"

# 5. 创建并发布 PR

# 6. 合并后发布
npm publish
```

## 版本命名规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **major**: 不兼容的 API 变更
- **minor**: 向后兼容的新功能
- **patch**: 向后兼容的 bug 修复

## 发布检查清单

- [ ] 所有 tests 通过
- [ ] CHANGELOG.md 已更新
- [ ] 版本号正确
- [ ] dist 目录已构建
- [ ] package.json 的 dependencies 正确
- [ ] npm 登录状态正常 (`npm whoami`)

## 故障排查

### 发布失败

检查 npm 登录状态：

```bash
npm whoami
```

如需重新登录：

```bash
npm login
```

### 构建失败

确保先运行构建：

```bash
pnpm run build
```

## 相关资源

- [npm publish 文档](https://docs.npmjs.com/cli/commands/npm-publish)
- [语义化版本规范](https://semver.org/)
