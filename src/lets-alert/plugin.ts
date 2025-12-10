import { PluginMetadata } from "@/types/plugin";
import { alertInfo } from "./CHANGELOG";

export const pluginMetadata: PluginMetadata = {
  name: "lets-alert",
  displayName: "更新说明",
  description: "接收恐龙工具箱的更新说明",
  version: "1.0.0",
  enabled: true,
  settings: [
    {
      type: "number",
      title: "version",
      description: "",
      key: "version",
      value: 1,
    },
    {
      type: "textarea",
      title: "详情",
      description: `更新详情`,
      key: "detail",
      placeholder: ``,
      value: `${alertInfo}`,
    },
  ],
};

export default pluginMetadata;
