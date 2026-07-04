import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "fetch-code-snippets",
  displayName: "lets-fetch-code-snippets.displayName",
  description: "lets-fetch-code-snippets.description",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "lets-fetch-code-snippets.dataSource",
      description: "lets-fetch-code-snippets.dataSourceDesc",
      key: "rules",
      value: `https://api.github.com/repos/hqweay/siyuan-hqweay-go/issues/4/comments?per_page=100&page=0`,
      placeholder: ``,
    },
  ],
};
export default pluginMetadata;
