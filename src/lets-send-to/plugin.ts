import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "sendTo",
  displayName: "发送到",
  description: "将内容发送到指定的位置或应用",
  version: "1.0.0",
  defaultConfig: {
    inputArea: `Gemini 总结====shortcuts://run-shortcut?name=Gemini 总结剪贴板
ChatGPT 总结====https://chat.openai.com/chat?q=请帮我总结：\${content}
提醒事项====shortcuts://run-shortcut?name=从剪贴板添加提醒事项
添加到提醒事项====shortcuts://run-shortcut?name=从剪贴板添加提醒事项
Google 搜索====https://www.google.com/search?q=\${content}`,
    isToClipboard: true,
    separator: "",
  },
};
export default pluginMetadata;
