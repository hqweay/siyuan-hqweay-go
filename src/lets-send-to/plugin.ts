import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "sendTo",
  displayName: "发送到",
  description: "将内容发送到指定的位置或应用",
  version: "1.0.0",
  defaultConfig: {
    enabled: false,
    inputArea: `Gemini 总结====shortcuts://run-shortcut?name=Gemini 总结剪贴板
ChatGPT 总结====https://chat.openai.com/chat?q=请帮我总结：\${content}
提醒事项====shortcuts://run-shortcut?name=从剪贴板添加提醒事项
添加到提醒事项====shortcuts://run-shortcut?name=从剪贴板添加提醒事项
Google 搜索====https://www.google.com/search?q=\${content}`,
    isToClipboard: true,
    separator: "",
    card: {
      template: "default",
      hideLi: false,
      pLineHeight: -1,
      addDOCTitle: "none",
      templates: {
        default: {
          name: "默认",
          css: "",
        },
      },
    },
  },
  settings: [
    {
      type: "checkbox",
      title: "写入剪贴板？",
      description: "",
      key: "isToClipboard",
      value: false,
    },
    {
      type: "textinput",
      title: "多行内容分隔符",
      description: "",
      key: "separator",
      value: ``,
      placeholder: "====",
    },
    {
      type: "textarea",
      title: "自定义链接",
      description: "",
      key: "inputArea",
      value: ``,
      placeholder:
        "以 名称====链接 配置；换行分隔。${content} 将会替换为选中的内容",
    },
  ],
};
export default pluginMetadata;
