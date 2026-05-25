/**
 * 同步远程模块类型声明脚本
 *
 * 从 npm 包或 CDN 拉取远程模块的类型声明文件
 * 并复制到 @mf-types 目录供 TypeScript 使用
 *
 * 使用方法:
 *   pnpm tsx scripts/sync-remote-types.ts                    # 使用默认配置
 *   pnpm tsx scripts/sync-remote-types.ts --config mf-types.config.json
 *   pnpm tsx scripts/sync-remote-types.ts --target host-react18-remote
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 根目录是 scripts 的父目录（因为脚本在 scripts/ 目录下）
const monorepoRoot = path.resolve(__dirname, '..');

// 默认配置
interface RemoteModuleConfig {
  name: string;
  version?: string;
  registry?: string;
  unpkg?: string;
  localPath: string;
  exposedModules: Record<string, string>;
}

interface SyncConfig {
  remoteModules: RemoteModuleConfig[];
  typesDir?: string;
  registry?: string;
  unpkg?: string;
}

const DEFAULT_CONFIG: SyncConfig = {
  remoteModules: [
    {
      name: 'test-mf-unpkg',
      version: 'latest',
      registry: 'https://registry.npmjs.org',
      unpkg: 'https://unpkg.com',
      localPath: 'apps/test-mf-unpkg',
      exposedModules: {
        './Button': 'Button',
        './Card': 'Card',
      },
    },
  ],
  typesDir: '@mf-types',
};

// 命令行参数解析
function parseArgs(): { config?: string; target?: string; help?: boolean } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config' || arg === '-c') {
      parsed.config = args[++i];
    } else if (arg === '--target' || arg === '-t') {
      parsed.target = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    }
  }

  return parsed;
}

// 加载配置文件
function loadConfig(configFile?: string): SyncConfig {
  if (configFile) {
    const configPath = path.resolve(monorepoRoot, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
    console.warn(`[Sync] 配置文件不存在：${configPath}，使用默认配置`);
  }
  return DEFAULT_CONFIG;
}

// 查找目标项目的配置
function findTargetConfig(target: string): SyncConfig | null {
  const configPaths = [
    `apps/${target}/mf-types.config.json`,
    `packages/${target}/mf-types.config.json`,
  ];

  for (const configPath of configPaths) {
    const fullPath = path.resolve(monorepoRoot, configPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    }
  }
  return null;
}

async function fetchRemoteTypes(
  remote: RemoteModuleConfig,
  outputDir: string,
  registry: string,
  unpkg: string,
) {
  console.log(`[Sync] 开始同步 ${remote.name}@${remote.version || 'latest'} 的类型...`);

  // 1. 获取最新版本号
  let version = remote.version || 'latest';
  if (version === 'latest') {
    try {
      const pkgRes = await fetch(`${registry}/${remote.name}/latest`);
      const pkgJson = await pkgRes.json();
      version = pkgJson.version;
      console.log(`[Sync] 最新版本号：${version}`);
    } catch (error) {
      console.warn(`[Sync] 获取最新版本失败：${error}`);
    }
  }

  // 2. 创建输出目录
  const indexPath = path.resolve(outputDir, 'index.d.ts');

  // 3. 尝试从本地构建目录复制类型（开发环境）
  const localTypesDir = path.resolve(monorepoRoot, remote.localPath, 'dist/types');
  let useLocal = false;

  console.log(`[Sync] 本地类型目录：${localTypesDir}`);
  console.log(`[Sync] 目录存在：${fs.existsSync(localTypesDir)}`);

  if (fs.existsSync(localTypesDir)) {
    console.log(`[Sync] 发现本地构建的类型：${localTypesDir}`);
    useLocal = true;
  }

  const typeContents: Record<string, string> = {};

  if (useLocal) {
    // 从本地复制
    for (const [, moduleName] of Object.entries(remote.exposedModules)) {
      const localFile = path.resolve(localTypesDir, `${moduleName}.d.ts`);
      if (fs.existsSync(localFile)) {
        const content = fs.readFileSync(localFile, 'utf-8');
        typeContents[moduleName] = content;
        console.log(`[Sync] 已复制：${localFile}`);
      } else {
        console.warn(`[Sync] 本地文件不存在：${localFile}`);
        typeContents[moduleName] = '';
      }
    }
  } else {
    // 从 unpkg 下载
    for (const [, moduleName] of Object.entries(remote.exposedModules)) {
      const typeUrl = `${unpkg}/${remote.name}@${version}/dist/types/${moduleName}.d.ts`;
      try {
        console.log(`[Sync] 下载：${typeUrl}`);
        const res = await fetch(typeUrl);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const content = await res.text();
        typeContents[moduleName] = content;
      } catch (error) {
        console.warn(`[Sync] 下载 ${typeUrl} 失败：${error}`);
        typeContents[moduleName] = '';
      }
    }
  }

  // 4. 生成类型文件
  fs.mkdirSync(outputDir, { recursive: true });

  // 写入各个模块的类型文件
  for (const [moduleName, content] of Object.entries(typeContents)) {
    const filePath = path.resolve(outputDir, `${moduleName}.d.ts`);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`[Sync] 已写入：${filePath}`);
  }

  // 5. 生成 index.d.ts - 模块声明
  let indexContent = `// 远程模块类型声明 - ${remote.name}@${version}\n`;
  indexContent += `// 自动生成于 ${new Date().toISOString()}\n\n`;

  // 导入本地类型文件
  for (const moduleName of Object.keys(typeContents)) {
    if (typeContents[moduleName]) {
      indexContent += `export * from './${moduleName}';\n`;
    }
  }

  // 添加模块联邦类型声明
  const declareModules = Object.entries(remote.exposedModules);
  indexContent += `\n// Module Federation 类型声明\n`;
  for (const [exposePath] of declareModules) {
    const moduleName = remote.exposedModules[exposePath];
    indexContent += `declare module '${remote.name}${exposePath.replace('./', '/')}' {\n`;
    indexContent += `  export * from './${moduleName}';\n`;
    indexContent += `}\n\n`;
  }

  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  console.log(`[Sync] 已生成：${indexPath}`);

  // 6. 生成 package.json 用于类型包
  const packageJson = {
    name: `@mf-types/${remote.name}`,
    version: version,
    description: `Auto-generated types for ${remote.name}`,
    main: 'index.d.ts',
    types: 'index.d.ts',
    private: true,
  };

  const packageJsonPath = path.resolve(outputDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
  console.log(`[Sync] 已生成：${packageJsonPath}`);

  console.log(`[Sync] ${remote.name} 类型同步完成！\n`);
}

async function syncTarget(
  targetName: string,
  config: SyncConfig,
  baseOutputDir?: string,
) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Sync] 同步目标：${targetName}`);
  console.log(`${'='.repeat(60)}\n`);

  const outputDir = baseOutputDir
    ? path.resolve(baseOutputDir, config.typesDir || '@mf-types')
    : path.resolve(monorepoRoot, 'apps', targetName, config.typesDir || '@mf-types');

  const registry = config.registry || 'https://registry.npmjs.org';
  const unpkg = config.unpkg || 'https://unpkg.com';

  // 清理旧目录
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  // 同步所有远程模块
  for (const remote of config.remoteModules) {
    try {
      await fetchRemoteTypes(remote, path.resolve(outputDir, remote.name), registry, unpkg);
    } catch (error) {
      console.error(`[Sync] ${remote.name} 同步失败：`, error);
    }
  }

  // 生成根目录的 index.d.ts
  const rootIndexPath = path.resolve(outputDir, 'index.d.ts');
  let rootIndexContent = '// 远程模块类型入口\n// 自动生成\n\n';
  for (const remote of config.remoteModules) {
    rootIndexContent += `export * from './${remote.name}';\n`;
  }
  fs.writeFileSync(rootIndexPath, rootIndexContent, 'utf-8');
  console.log(`[Sync] 已生成根索引：${rootIndexPath}`);

  console.log(`\n[Sync] ${targetName} 类型同步完成！`);
}

async function syncAll(config: SyncConfig) {
  console.log('[Sync] 开始同步所有 Host 项目的远程模块类型...\n');

  // 自动发现 apps 目录下的 Host 项目
  const appsDir = path.resolve(monorepoRoot, 'apps');
  if (!fs.existsSync(appsDir)) {
    console.error('[Sync] apps 目录不存在');
    return;
  }

  const hostProjects = fs.readdirSync(appsDir).filter((dir) => {
    if (dir.startsWith('.')) return false;
    const pkgPath = path.resolve(appsDir, dir, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    // 检查是否有 sync:types 脚本或依赖 vue-adapter/react-adapter
    const scripts = pkg.scripts || {};
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    return (
      scripts['sync:types'] ||
      deps['@fan-scripts/react-adapter'] ||
      deps['@fan-scripts/vue-adapter']
    );
  });

  console.log(`[Sync] 发现 ${hostProjects.length} 个 Host 项目：${hostProjects.join(', ')}\n`);

  for (const project of hostProjects) {
    // 检查项目是否有自己的配置
    const projectConfigPath = path.resolve(appsDir, project, 'mf-types.config.json');
    let projectConfig: SyncConfig = config;

    if (fs.existsSync(projectConfigPath)) {
      const content = fs.readFileSync(projectConfigPath, 'utf-8');
      projectConfig = { ...config, ...JSON.parse(content) };
      console.log(`[Sync] 加载项目配置：${projectConfigPath}`);
    }

    await syncTarget(project, projectConfig);
  }

  console.log('\n[Sync] 所有 Host 项目类型同步完成！');
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    console.log(`
Module Federation 类型同步工具

使用方法:
  pnpm tsx scripts/sync-remote-types.ts [选项]

选项:
  -c, --config <file>   指定配置文件路径（JSON 格式）
  -t, --target <name>   指定同步目标项目（apps 目录下的子目录名）
  -h, --help            显示帮助信息

示例:
  # 同步所有 Host 项目
  pnpm tsx scripts/sync-remote-types.ts

  # 同步指定项目
  pnpm tsx scripts/sync-remote-types.ts --target host-react18-remote

  # 使用自定义配置
  pnpm tsx scripts/sync-remote-types.ts --config mf-types.config.json

配置文件格式:
{
  "remoteModules": [
    {
      "name": "test-mf-unpkg",
      "version": "latest",
      "localPath": "apps/test-mf-unpkg",
      "exposedModules": {
        "./Button": "Button",
        "./Card": "Card"
      }
    }
  ],
  "typesDir": "@mf-types"
}
`);
    return;
  }

  const config = loadConfig(args.config as string | undefined);

  if (args.target) {
    // 同步指定目标
    const targetConfig = findTargetConfig(args.target) || config;
    await syncTarget(args.target, targetConfig);
  } else {
    // 同步所有
    await syncAll(config);
  }
}

main().catch(console.error);
