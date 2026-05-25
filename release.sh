#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"

cd "$ROOT_DIR"

# 使用 nvm 切换 Node.js 版本
use_nvm() {
  if [ -f .nvmrc ]; then
    local NVM_VERSION=$(cat .nvmrc | tr -d '\n')
    echo "Using Node.js version from .nvmrc: $NVM_VERSION"

    # 检查 nvm 是否安装
    if command -v nvm &> /dev/null || [ -n "$NVM_DIR" ]; then
      nvm use "$NVM_VERSION" 2>/dev/null || {
        echo "Warning: nvm version '$NVM_VERSION' not installed, using current version"
      }
    else
      echo "Warning: nvm not installed, skipping version switch"
    fi
  fi
}

# 检查 npm token
check_npm_token() {
  if [ "$1" = "publish" ]; then
    if [ -z "$NPM_TOKEN" ]; then
      echo "Error: NPM_TOKEN environment variable is not set"
      echo ""
      echo "To fix this, run:"
      echo "  export NPM_TOKEN='npm_xxxxxxxxxxxxxxxxxxxxx'"
      echo ""
      echo "Or login to npm:"
      echo "  npm login"
      echo ""
      exit 1
    fi
    echo "NPM token found, authentication configured"
  fi
}

case "$1" in
  version)
    echo "Applying version changes..."
    pnpm changeset version "${@:2}"
    echo "Installing dependencies..."
    pnpm install
    ;;
  publish)
    check_npm_token publish
    use_nvm
    echo "Publishing packages..."
    pnpm changeset publish "${@:2}"
    ;;
  add)
    echo "Adding changeset..."
    pnpm changeset add "${@:2}"
    ;;
  pre)
    echo "Entering pre-release mode..."
    pnpm changeset pre "${@:2}"
    ;;
  status)
    echo "Checking changeset status..."
    pnpm changeset status "${@:2}"
    ;;
  *)
    echo "Usage: ./release.sh <command>"
    echo ""
    echo "Commands:"
    echo "  version  - Apply version changes from changesets"
    echo "  publish  - Publish packages to npm"
    echo "  add      - Add a new changeset"
    echo "  pre      - Enter pre-release mode (pre major/minor/patch)"
    echo "  status   - Check the status of changesets"
    exit 1
    ;;
esac
