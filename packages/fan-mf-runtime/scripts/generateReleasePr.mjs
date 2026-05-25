#!/usr/bin/env node

import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

/**
 * 获取当前版本号
 */
async function getCurrentVersion() {
  const packageJsonPath = path.join(rootDir, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
  return packageJson.version
}

/**
 * 计算下一个版本号
 */
function getNextVersion(currentVersion, type) {
  const [major, minor, patch] = currentVersion.split('.').map(Number)
  switch (type) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'major':
      return `${major + 1}.0.0`
    default:
      throw new Error('Invalid version type')
  }
}

/**
 * 更新 CHANGELOG.md
 */
async function updateChangelog(nextVersion, bumpType) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md')
  const today = new Date().toISOString().split('T')[0]

  let changelogContent = await fs.readFile(changelogPath, 'utf-8')

  // 在 [未发布] 后添加新版本部分
  const unreleasedIndex = changelogContent.indexOf('## [未发布]')
  if (unreleasedIndex !== -1) {
    const insertPos = changelogContent.indexOf('\n', unreleasedIndex) + 1
    const newSection = `
## [${nextVersion}] - ${today}

### Release

- Published version ${nextVersion} with ${bumpType} bump

`
    changelogContent =
      changelogContent.slice(0, insertPos) +
      newSection +
      changelogContent.slice(insertPos)
    await fs.writeFile(changelogPath, changelogContent)
    log(colors.blue, 'Updated CHANGELOG.md')
  }

  // 更新版本表格
  const versionTableRegex = /\| 版本 \| 日期 \| 主要变更 \|/
  if (versionTableRegex.test(changelogContent)) {
    const newTableRow = `| ${nextVersion} | ${today} | ${bumpType} 版本发布 |`
    changelogContent = changelogContent.replace(
      versionTableRegex,
      `| 版本 | 日期 | 主要变更 |\n|------|------|----------|\n${newTableRow}`,
    )
    await fs.writeFile(changelogPath, changelogContent)
    log(colors.blue, 'Updated version table in CHANGELOG.md')
  }
}

/**
 * 执行 shell 命令
 */
function exec(command) {
  try {
    execSync(command, { stdio: 'inherit', cwd: rootDir })
    return true
  } catch (error) {
    log(colors.red, `Failed to execute: ${command}`)
    return false
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const args = process.argv.slice(3)
    let bumpType = 'patch'

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '-t' || args[i] === '--type') {
        bumpType = args[i + 1]
      }
    }

    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      log(
        colors.red,
        'Invalid bump type. Please select major, minor, or patch.',
      )
      process.exit(1)
    }

    // 1. 读取当前版本
    const currentVersion = await getCurrentVersion()
    log(colors.blue, `Current version: ${currentVersion}`)
    log(colors.blue, `Bump type: ${bumpType}`)

    const nextVersion = getNextVersion(currentVersion, bumpType)
    log(colors.blue, `Next version: ${nextVersion}`)

    // 2. 创建并切换到新分支
    const branchName = `release/v${nextVersion}`
    log(colors.blue, `Creating branch: ${branchName}`)
    exec(`git checkout -b ${branchName}`)

    // 3. 更新 CHANGELOG
    await updateChangelog(nextVersion, bumpType)

    // 4. 更新 package.json 版本
    log(colors.blue, 'Updating package.json version...')
    exec(`npm version ${nextVersion} --no-git-tag-version`)

    // 5. 构建
    log(colors.blue, 'Building package...')
    exec('pnpm run build')

    // 6. 提交更改
    log(colors.blue, 'Committing changes...')
    exec('git add .')
    exec(`git commit -m "Release v${nextVersion}"`)

    // 7. 推送到远程仓库
    log(colors.blue, `Pushing branch: ${branchName}`)
    exec(`git push -u origin ${branchName}`)

    log(colors.green, `\n✅ Successfully created and pushed ${branchName}`)
    log(colors.green, `   Next step: Create a PR to merge into main\n`)
  } catch (error) {
    log(colors.red, `Error: ${error.message}`)
    process.exit(1)
  }
}

main()
