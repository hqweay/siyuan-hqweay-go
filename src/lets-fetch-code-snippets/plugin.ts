import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "fetch-code-snippets",
  displayName: "代码片段托管",
  description:
    "一些收集的代码片段；见 https://github.com/hqweay/siyuan-hqweay-go/issues/4。目标是支持托管与本地管理。目前只支持启用在 issue 里评论的代码片段。",
  version: "1.0.0",
  settings: [],
};
export default pluginMetadata;
