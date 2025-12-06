import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockPlus",
  displayName: "边栏按钮扩充",
  description: "在任意边栏新增按钮，可执行SQL、固定文档、打开链接",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "在左上边栏、右上边栏新增图标固定打开链接或文档（块）",
      description: `dockLeft-top | dockLeft-bottom | dockRight-top | dockRight-bottom | toolar-left | toolbar-right`,
      key: "docks",
      placeholder: `
      格式：位置,图标,块ID/sql/链接,名称
      示例：dockLeft-top,🥹,20240416195915-sod1ftd\ntoolbar-left,🥹,siyuan://plugins/siyuan-hqweay-go/open\ndockLeft-Bottom,🥹,select * from blocks`,
      value: `toolbar-left,🥹,https://leay.net,养恐龙\ntoolbar-left,🥹,siyuan://plugins/siyuan-hqweay-go/open\ndockLeft-bottom,🥹,select * from blocks`,
    },
  ],
};

export default pluginMetadata;
