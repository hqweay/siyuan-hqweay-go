import { settings } from "@/settings";
import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "quick-bookmark",
  displayName: "快捷添加书签",
  description: "块菜单新增添加到书签",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "书签",
      description: "快捷添加的书签名<br/>多个书签以换行分隔",
      key: "items",
      value: `读到这里啦\n好句子`,
      placeholder: "读到这里啦",
    },
  ],
};

export default pluginMetadata;
