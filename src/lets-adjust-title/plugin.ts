import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "title",
  displayName: "标题",
  description: "块菜单/文档菜单打开事件增加标题层级转换",
  version: "1.0.0",
  settings: [
    {
      type: "checkbox",
      title: "调整标题层级",
      description: "块菜单/文档菜单打开事件增加标题层级转换",
      key: "adjustTitleLevel",
      value: false,
    },
  ],
};

export default pluginMetadata;
