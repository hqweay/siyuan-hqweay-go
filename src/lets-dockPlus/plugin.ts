import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockPlus",
  displayName: "lets-dockPlus.displayName",
  description: "lets-dockPlus.description",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "lets-dockPlus.settingTitle",
      description: "lets-dockPlus.settingDesc",
      key: "docks",
      placeholder: `
      格式：位置,图标,块ID/sql/链接,名称
      示例：dockLeft-top,🥹,20240416195915-sod1ftd\ntoolbar-left,🥹,siyuan://plugins/siyuan-hqweay-go/open\ndockLeft-Bottom,🥹,select * from blocks`,
      value: `toolbar-left,🥹,https://leay.net,养恐龙\ntoolbar-left,🥹,siyuan://plugins/siyuan-hqweay-go/open\ndockLeft-bottom,🥹,select * from blocks`,
    },
  ],
};

export default pluginMetadata;
