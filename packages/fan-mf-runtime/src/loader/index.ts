import type { ModuleFederationRuntimePlugin } from "@module-federation/enhanced/runtime";
import type { LoadRemoteOptions } from "../types";
import {
  createRemoteSourcePlugin,
  type LoadRemoteExtraOptions,
  type RemoteSourcePlugin,
  type RemoteSourcePluginContext,
  resolveRegisteredRemotes,
} from "./remote-source";
import {
  buildFinalUrls,
  getFinalSharedConfig,
  isEmpty,
  resolveFinalVersion,
  tryLoadRemote,
} from "./utils";

export {
  createRemoteSourcePlugin,
  type RemoteSourcePlugin,
  type RemoteSourcePluginContext,
  type LoadRemoteExtraOptions,
};

/**
 * 多版本共存的 loadRemote
 */
export async function loadRemoteMultiVersion(
  options: LoadRemoteOptions,
  plugins: ModuleFederationRuntimePlugin[] = [],
  extraOptions: LoadRemoteExtraOptions = {}
) {
  const {
    name,
    pkg,
    version = "latest",
    retries = 3,
    delay = 1000,
    localFallback,
    cacheTTL = 24 * 60 * 60 * 1000,
    revalidate = true,
    shared: customShared,
    localDebug,
  } = options;
  const {
    remoteSourcePlugins = [],
    baseRemotes = [],
    registerOptions = {},
  } = extraOptions;
  // 1. 解析最终版本号
  const finalVersion = await resolveFinalVersion(
    pkg,
    version,
    cacheTTL,
    revalidate
  );

  // 2. 构建最终 URL 列表
  const scopeName = `${name}`;
  let urls: string[];
  if (!isEmpty(localDebug) && localDebug?.entry && localDebug.enabled) {
    console.log("localDebug", localDebug);
    urls = localDebug?.entry ? [localDebug?.entry] as string[] : [];
  } else {
    urls = buildFinalUrls(pkg, finalVersion, localFallback);
  }
  // 3. 合并共享配置
  const finalSharedConfig = getFinalSharedConfig(customShared);

  // 4. 遍历 URL 并尝试加载（故障转移/Fallback）
  for (const url of urls) {
    try {
      const registeredRemotes = await resolveRegisteredRemotes(
        {
          options,
          scopeName,
          pkg,
          finalVersion,
          currentEntry: url,
          allEntries: urls,
        },
        baseRemotes,
        remoteSourcePlugins
      );

      return tryLoadRemote(
        scopeName,
        url,
        retries,
        delay,
        finalSharedConfig,
        plugins,
        registeredRemotes,
        registerOptions
      );
    } catch (e) {
      console.warn(`[MF] 切换 CDN 路径：${url} 失败，尝试下一个...`, e);
    }
  }

  // 5. 全部失败，抛出错误
  throw new Error(`[MF] 所有加载源 (${urls.length} 个) 均加载失败。`);
}
