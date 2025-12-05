import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "docky",
  displayName: "侧边栏展示文档或块",
  description: "在侧边栏中展示指定的文档或块内容",
  version: "1.0.0",
  defaultConfig: {
    zoomScale: 100,
    rules: `id:20251126002344-r4jzwns,name:haha,position: RightTop`,
  },
};

export default pluginMetadata;
