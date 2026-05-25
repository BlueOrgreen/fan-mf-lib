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
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
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
    const packageJsonPath = path.join(rootDir, 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    const version = packageJson.version

    log(colors.blue, `Finalizing release for version ${version}`)

    // 发布到 npm
    log(colors.blue, 'Publishing to npm...')
    exec('pnpm changeset:publish')

    // 提交 CHANGELOG 更新
    log(colors.blue, 'Committing CHANGELOG...')
    exec('git add CHANGELOG.md')
    exec(
      `git commit -m "docs: update CHANGELOG for v${version}" || echo "No changes to commit"`,
    )
    exec('git push')

    log(colors.green, `\n✅ Release v${version} finalized!\n`)
  } catch (error) {
    log(colors.red, `Error: ${error.message}`)
    process.exit(1)
  }
}

main()
