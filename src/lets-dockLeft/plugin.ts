import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockPlus",
  displayName: "边栏扩充固定",
  description: "在边栏新增快捷方式，可执行SQL、固定文档、链接",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "在左上边栏新增图标固定打开链接或文档（块）",
      description: ``,
      key: "docks",
      placeholder: `
      格式：图标,块ID/sql/链接
      示例：🥹,20240416195915-sod1ftd`,
      value: `🥹,20251126002344-r4jzwns
			🥹,20240416195915-sod1ftd`,
    },
  ],
};

export default pluginMetadata;
