#!/usr/bin/env node

/**
 * Changeset 发布辅助脚本
 * 使用方法：pnpm tsx scripts/release.ts <version|publish|add|pre|status> [options]
 */

import { execSync } from 'node:child_process'
import { argv, exit } from 'node:process'

const command = argv[2]

const validCommands = ['version', 'publish', 'add', 'pre', 'status']

if (!validCommands.includes(command)) {
  console.error(`Usage: pnpm tsx release.ts <${validCommands.join('|')}> [options]`)
  console.error('')
  console.error('Commands:')
  console.error('  version  - Apply version changes from changesets')
  console.error('  publish  - Publish packages to npm')
  console.error('  add      - Add a new changeset')
  console.error('  pre      - Enter pre-release mode')
  console.error('  status   - Check the status of changesets')
  exit(1)
}

try {
  const args = argv.slice(3).join(' ')

  if (command === 'version') {
    // Apply version changes
    execSync(`pnpm changeset version ${args}`, { stdio: 'inherit' })
    // Install updated dependencies
    execSync('pnpm install', { stdio: 'inherit' })
  } else if (command === 'publish') {
    // Version first if needed
    execSync(`pnpm changeset publish ${args}`, { stdio: 'inherit' })
  } else {
    execSync(`pnpm changeset ${command} ${args}`, { stdio: 'inherit' })
  }
} catch (error) {
  console.error('Release command failed:', (error as Error).message)
  exit(1)
}
