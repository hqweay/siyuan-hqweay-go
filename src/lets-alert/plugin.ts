import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "lets-alert",
  displayName: "更新说明",
  description: "接收恐龙工具箱的更新说明与日志",
  version: "1.0.0",
  enabled: true,
  settings: [
    {
      type: "textinput",
      title: "上次提示版本",
      description: "记录已展示过更新日志的最新版本号，手动修改可重新触发更新提示",
      key: "lastVersion",
      value: "",
    },
  ],
};

export default pluginMetadata;
