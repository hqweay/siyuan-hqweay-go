import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "fetch-code-snippets",
  displayName: "代码片段托管",
  description:
    "一些收集的代码片段；见 https://github.com/hqweay/siyuan-hqweay-go/issues/4。目标是支持托管与本地管理。目前只支持启用在 issue 里评论的代码片段。",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "数据源",
      description: `目前支持 Github Issue；可配置多条`,
      key: "rules",
      value: `https://api.github.com/repos/hqweay/siyuan-hqweay-go/issues/4/comments?per_page=100&page=0`,
      placeholder: ``,
    },
  ],
};
export default pluginMetadata;
