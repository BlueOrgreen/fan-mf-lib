import {
  defineComponent,
  ref,
  watch,
  h,
  nextTick,
  onMounted,
  onBeforeUnmount,
  type VNode,
  type Component,
  type PropType,
} from "vue";
import { loadRemoteMultiVersion } from "fan-mf-runtime";
import type {
  MFInstance,
  ReactDOMRoot,
} from "../types";
import { useReactResolver, type ReactResolverResult } from "../composables/useReactResolver";

/**
 * Vue 3 远程模块提供者 Props
 */
export interface VueRemoteModuleCardProps {
  /** 包名称 */
  pkg: string;
  /** 版本号，支持 semver 范围 */
  version: string;
  /** 远程模块名称（导出名） */
  moduleName: string;
  /** 作用域名称 */
  scopeName: string;
  /** 加载中的占位内容 */
  loadingFallback?: Component | VNode | (() => VNode) | null;
  /** 错误状态的占位内容 */
  errorFallback?:
    | Component
    | VNode
    | ((error: Error, retry: () => void) => VNode)
    | null;
  /** 传递给远程组件的 props */
  componentProps?: Record<string, any>;
  /** 容器类名 */
  className?: string;
  /** 容器样式 */
  style?: Record<string, any>;
  /** 是否禁用错误边界 */
  disableErrorBoundary?: boolean;
}

interface ModuleState {
  loading: boolean;
  error: Error | null;
  component: any | null;
  mf: MFInstance | null;
  scopeName: string | null;
}

/**
 * 创建 Vue 远程模块提供者组件
 */
export function createVueRemoteModuleProvider() {
  return defineComponent<VueRemoteModuleCardProps>({
    name: "VueRemoteModuleProvider",

    props: {
      pkg: { type: String, required: true },
      version: { type: String, default: "latest" },
      moduleName: { type: String, required: true },
      scopeName: { type: String, required: true },
      loadingFallback: { type: [Object, Function] as any, default: null },
      errorFallback: { type: [Object, Function] as any, default: null },
      componentProps: { type: Object, default: () => ({}) },
      className: { type: String, default: "" },
      style: { type: Object, default: () => ({}) },
      disableErrorBoundary: { type: Boolean, default: false },
    },

    emits: ["load", "error", "ready"],

    setup(props: VueRemoteModuleCardProps, { emit, slots }) {
      const state = ref<ModuleState>({
        loading: true,
        error: null,
        component: null,
        mf: null,
        scopeName: null,
      });

      const retryKey = ref(0);
      const containerRef = ref<HTMLElement | null>(null);
      const reactRootRef = ref<ReactDOMRoot | null>(null);
      const isMounted = ref(false);

      // 使用 useReactResolver composable
      const reactResolver: ReactResolverResult = useReactResolver();

      async function loadModule() {
        try {
          state.value.loading = true;
          state.value.error = null;

          const { mf } = await loadRemoteMultiVersion(
            {
              name: props.scopeName,
              pkg: props.pkg,
              version: props.version,
            },
            []
          );

          if (!mf) return;

          state.value.mf = mf as unknown as MFInstance;
          state.value.scopeName = props.scopeName;

          // 使用 useReactResolver 解析 React 共享模块
          await reactResolver.resolve(mf as unknown as MFInstance);
          emit("ready", props.scopeName, mf);

          const mod: any = await mf.loadRemote(
            `${props.scopeName}/${props.moduleName}`
          );

          console.log("[VueRemoteModuleProvider] Module loaded:", mod);

          // 处理不同的模块导出格式
          let Component: any = null;

          if (mod) {
            // 情况 1: { default: Component } - default 导出
            if (mod.default) {
              Component = mod.default;
            }
            // 情况 2: 模块本身就是一个函数/组件
            else if (typeof mod === "function") {
              Component = mod;
            }
            // 情况 3: 模块是对象但不是 default 导出，尝试直接使用
            else if (typeof mod === "object") {
              // 尝试找到第一个可导出的组件
              const keys = Object.keys(mod);
              for (const key of keys) {
                const value = mod[key];
                if (typeof value === "function") {
                  Component = value;
                  console.log(
                    `[VueRemoteModuleProvider] Using named export: ${key}`
                  );
                  break;
                }
              }
            }
          }

          if (Component) {
            state.value.component = Component;
            state.value.loading = false;
            emit("load", Component);
          } else {
            throw new Error(
              `Module "${props.scopeName}/${props.moduleName}" does not export a component`
            );
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          state.value.error = error;
          state.value.loading = false;
          emit("error", error);
        }
      }

      function retry() {
        retryKey.value++;
      }

      // 渲染 React 组件到容器
      function renderReactComponent(
        Component: any,
        componentProps: Record<string, any> = {}
      ) {
        if (!containerRef.value || !Component) return;

        const React = reactResolver.runtimeReact.value || (window as any).React;
        const ReactDOM =
          reactResolver.runtimeReactDOMClient.value ||
          (window as any).ReactDOM ||
          (window as any).ReactDOMClient;

        if (!React || !ReactDOM) {
          console.error("[VueRemoteModuleProvider] React not found on window");
          return;
        }

        // 验证 React 实例有效性
        if (
          (typeof React !== "function" && typeof React !== "object") ||
          (typeof ReactDOM !== "object" && typeof ReactDOM !== "function") ||
          ReactDOM === null
        ) {
          console.error(
            "[VueRemoteModuleProvider] Invalid React/ReactDOM instance"
          );
          return;
        }

        if (typeof React.useCallback !== "function") {
          console.error(
            "[VueRemoteModuleProvider] React instance is missing hooks"
          );
          return;
        }

        // 清理之前的 React 实例
        if (reactRootRef.value) {
          reactRootRef.value.unmount();
        }

        // 创建 React 元素
        const element = React.createElement(Component, componentProps);

        // 优先使用 ReactDOM 18+ 的 createRoot API
        if (ReactDOM.createRoot) {
          const root = ReactDOM.createRoot(containerRef.value);
          root.render(element);
          reactRootRef.value = root;
        } else if (ReactDOM.render) {
          // 使用旧的 ReactDOM.render API (React 17 及更早版本)
          ReactDOM.render(element, containerRef.value);
          reactRootRef.value = {
            render: () => {},
            unmount: () => ReactDOM.unmountComponentAtNode(containerRef.value!),
          };
        } else {
          console.error(
            "[VueRemoteModuleProvider] No suitable React rendering API found"
          );
        }
      }

      // 在组件挂载后渲染 React 组件
      onMounted(() => {
        isMounted.value = true;
        if (state.value.component && containerRef.value) {
          setTimeout(() => {
            renderReactComponent(
              state.value.component,
              props.componentProps || {}
            );
          }, 0);
        }
      });

      // 监听组件变化并渲染（只在组件挂载后执行）
      watch(
        () => [
          state.value.component,
          props.componentProps,
          state.value.loading,
        ],
        async () => {
          // 等待 loading 结束并在 DOM 提交后再渲染，避免容器 ref 尚未就绪
          if (
            !isMounted.value ||
            !state.value.component ||
            state.value.loading
          ) {
            return;
          }

          await nextTick();

          if (containerRef.value) {
            renderReactComponent(
              state.value.component,
              props.componentProps || {}
            );
          }
        },
        { deep: true, immediate: true, flush: "post" }
      );

      // 监听 props 变化和 retryKey 变化，重新加载
      watch(
        () => [
          props.pkg,
          props.version,
          props.moduleName,
          props.scopeName,
          retryKey.value,
        ],
        () => {
          void loadModule();
        },
        { immediate: true }
      );

      // 组件卸载时清理 React 实例
      onBeforeUnmount(() => {
        if (reactRootRef.value) {
          reactRootRef.value.unmount();
        }
      });

      // 渲染加载状态
      function renderLoading() {
        if (slots.loading) {
          return slots.loading();
        }

        if (props.loadingFallback) {
          if (typeof props.loadingFallback === "function") {
            try {
              return (props.loadingFallback as () => VNode)();
            } catch {
              return h(props.loadingFallback as Component);
            }
          }
          return h(props.loadingFallback as Component);
        }

        // 默认加载 UI
        return h("div", { class: "module-card module-card--loading" }, [
          h("div", { class: "loading-spinner", "aria-hidden": "true" }),
          h(
            "span",
            { class: "text-gray-600" },
            `Loading ${props.moduleName}...`
          ),
        ]);
      }

      // 渲染错误状态
      function renderError() {
        const error = state.value.error!;

        if (slots.error) {
          return slots.error({ error, retry });
        }

        if (props.errorFallback) {
          if (typeof props.errorFallback === "function") {
            try {
              return (
                props.errorFallback as (
                  error: Error,
                  retry: () => void
                ) => VNode
              )(error, retry);
            } catch {
              return h(props.errorFallback as Component);
            }
          }
          return h(props.errorFallback as Component);
        }

        // 默认错误 UI
        return h(
          "div",
          { class: "module-card module-card--error", role: "alert" },
          [
            h("span", { class: "error-icon", "aria-hidden": "true" }, "!"),
            h("span", {}, `Failed to load ${props.moduleName}`),
            h("p", { class: "error-message" }, error.message),
            h(
              "button",
              {
                class: "retry-button",
                type: "button",
                onClick: retry,
              },
              "Retry"
            ),
          ]
        );
      }

      // 主渲染函数
      return () => {
        const containerClass = props.className || "";
        const containerStyle = props.style || {};

        if (state.value.loading) {
          return h(
            "div",
            {
              class: containerClass,
              style: containerStyle,
              role: "status",
              "aria-live": "polite",
            },
            [renderLoading()]
          );
        }

        if (state.value.error) {
          return h(
            "div",
            {
              class: containerClass,
              style: containerStyle,
              role: "alert",
            },
            [renderError()]
          );
        }

        // 渲染 React 组件容器
        return h(
          "div",
          {
            class: containerClass,
            style: containerStyle,
          },
          [
            h("div", {
              ref: containerRef,
              class: "vue-react-container",
              style: { display: "contents" },
            }),
          ]
        );
      };
    },
  });
}

/**
 * Vue 远程模块提供者组件实例
 */
export const VueRemoteModuleProvider = createVueRemoteModuleProvider();
