# fan-mf-lib — GitHub 展示

## Goal

完善 `fan-mf-lib` monorepo，作为 Yunfan 的 Module Federation 工具集在 GitHub 公开展示（README、demo、CI 可构建通过）。

## Decisions

| 项 | 选择 |
|----|------|
| 仓库 | https://github.com/BlueOrgreen/fan-mf-lib |
| 核心包 | `fan-mf-runtime` |
| 适配层 | `@yunfan/react-adapter`、`@yunfan/vue-adapter` |

## Requirements

* [x] monorepo 结构与包名统一为 fan-mf / @yunfan
* [x] 文档与配置中不出现第三方仓库品牌信息
* [x] `pnpm build` 通过
* [x] GitHub Actions CI

## Acceptance Criteria

* [x] 公开文档仅描述 fan-mf-lib 与 BlueOrgreen 仓库
* [x] 公开可见文件中无第三方仓库品牌残留

## Out of Scope

* npm 正式发布
