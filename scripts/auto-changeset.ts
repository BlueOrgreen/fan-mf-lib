#!/usr/bin/env node

/**
 * 自动根据 Git commits 生成 changeset 文件
 * 使用方法：pnpm tsx scripts/auto-changeset.ts
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const changesetDir = path.join(rootDir, '.changeset')

type ReleaseType = 'major' | 'minor' | 'patch'

// 获取上次 tag 以来的 commits
function getCommitsSinceLastTag(): string[] {
  try {
    // 尝试获取上一个版本 tag
    const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null', {
      cwd: rootDir,
      encoding: 'utf-8',
    }).trim()

    const commits = execSync(`git log ${lastTag}..HEAD --pretty=format:"%h %s"`, {
      cwd: rootDir,
      encoding: 'utf-8',
    }).trim()

    return commits ? commits.split('\n') : []
  } catch {
    // 如果没有 tag，获取最近 10 条 commits
    const commits = execSync('git log -10 --pretty=format:"%h %s"', {
      cwd: rootDir,
      encoding: 'utf-8',
    }).trim()

    return commits ? commits.split('\n') : []
  }
}

// 判断变更类型
function getReleaseType(commitMessage: string): ReleaseType {
  const msg = commitMessage.toLowerCase()
  if (msg.includes('feat:') || msg.includes('feature:')) return 'minor'
  if (msg.includes('fix:') || msg.includes('bugfix:')) return 'patch'
  if (msg.includes('break:') || msg.includes('breaking:')) return 'major'
  return 'patch' // 默认 patch
}

// 生成 changeset ID
function generateChangesetId(): string {
  const adjectives = ['fast', 'smart', 'bright', 'calm', 'eager', 'warm', 'cool', 'fresh']
  const nouns = ['pandas', 'eagles', 'waves', 'stars', 'clouds', 'winds', 'lights', 'seeds']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}-${noun}`
}

// 主函数
function main(): void {
  const args = process.argv.slice(2)
  const packages = args.length > 0 ? args : ['fan-mf-runtime']

  // 确保 .changeset 目录存在
  if (!fs.existsSync(changesetDir)) {
    fs.mkdirSync(changesetDir, { recursive: true })
  }

  const commits = getCommitsSinceLastTag()
  console.log(`找到 ${commits.length} 条 commits`)

  if (commits.length === 0) {
    console.log('没有新的 commits')
    return
  }

  // 按包分组 commits（简单处理：所有 commits 归到指定包）
  for (const pkg of packages) {
    const relevantCommits = commits.filter((_, idx) => idx < 10) // 最多取 10 条

    if (relevantCommits.length === 0) continue

    // 确定版本类型
    let releaseType: ReleaseType = 'patch'
    for (const commit of relevantCommits) {
      const type = getReleaseType(commit)
      if (type === 'major') releaseType = 'major'
      else if (type === 'minor' && releaseType !== 'major') releaseType = 'minor'
    }

    // 生成 changeset 内容
    const changesetContent = `---
"${pkg}": ${releaseType}
---

${relevantCommits.map(c => `- ${c.replace(/^[\da-f]+ /, '')}`).join('\n')}
`

    // 写入文件
    const filename = `${generateChangesetId()}.md`
    const filepath = path.join(changesetDir, filename)
    fs.writeFileSync(filepath, changesetContent)

    console.log(`已创建 changeset: ${filename}`)
    console.log(changesetContent)
  }

  console.log('\n运行 pnpm changeset version 来应用变更')
}

main()
