import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "docky",
  displayName: "侧边栏展示文档或块",
  description: "在侧边栏中展示指定的文档或块内容",
  version: "1.0.0",
  defaultConfig: {
    enabled: false,
    zoomScale: 100,
    rules: `id:20251126002344-r4jzwns,name:haha,position: RightTop`,
  },
  settings: [
    {
      type: "number",
      title: "缩放程度",
      description: "缩放程度，100 为原始大小",
      key: "zoomScale",
      value: 100,
      placeholder: "100",
    },
    {
      type: "button",
      title: "选择图标",
      key: "selectIcon",
      value: "选择图标",
    },
    {
      type: "textarea",
      title: "配置",
      description: `e.g. id: xxx, name: hello, position: xxx, icon?: xxx, hotkey?: xxx
position: LeftTop | LeftBottom | RightTop | RightBottom | BottomLeft | BottomRight
`,
      key: "rules",
      value: "",
      placeholder: `id:20251126002344-r4jzwns,position:RightTop`,
    },
  ],
};

export default pluginMetadata;
