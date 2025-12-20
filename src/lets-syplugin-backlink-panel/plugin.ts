import { PluginMetadata } from "@/types/plugin";

const pluginMetadata: PluginMetadata = {
  name: "lets-backlink-panel",
  displayName: "【实验】关联信息面板",
  description: "在文档底部显示反链列表，支持自定义SQL查询和动态加载",
  version: "1.0.0",
  author: "Misuzu2027",
  enabled: false,
  reference: "https://github.com/Misuzu2027/syplugin-backlink-panel",
  settings: [
    {
      type: "textarea",
      title: "",
      description: "",
      key: "excludeTags",
      value: `该功能原作者：https://github.com/Misuzu2027/syplugin-backlink-panel`,
      placeholder: "",
    },
  ],
};

export default pluginMetadata;
