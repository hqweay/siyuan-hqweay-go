import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockShowAndHide",
  displayName: "边栏自动打开、关闭",
  description: "自动控制边栏的显示和隐藏",
  version: "1.0.0",
  defaultConfig: {
    enabled: false,
    items: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    leftWidth: "200px",
    rightWidth: "200px",
    hideDock: false,
    returnIfSplit: true,
    otherDocs: "恢复上次使用配置",
  },
  settings: [
    {
      type: "textinput",
      title: "左边栏打开默认宽度",
      description: "配置自动打开边栏时左边栏的默认宽度",
      key: "leftWidth",
      value: "200px",
      placeholder: "200px",
    },
    {
      type: "textinput",
      title: "右边栏打开默认宽度",
      description: "配置自动打开边栏时右边栏的默认宽度",
      key: "rightWidth",
      value: "200px",
      placeholder: "200px",
    },
    {
      type: "checkbox",
      title: "同时打开/关闭停靠栏",
      description: "打开/关闭边栏时同时操作停靠栏",
      key: "hideDock",
      value: false,
    },
    {
      type: "checkbox",
      title: "分屏时不触发",
      description: "分屏时不触发",
      key: "returnIfSplit",
      value: true,
    },
    {
      type: "select",
      title: "其它文档默认操作",
      description: "打开其他文件时配置边栏状态",
      key: "otherDocs",
      value: "恢复上次使用配置",
      options: {
        恢复上次使用配置: "恢复上次使用配置",
        保持当前配置: "保持当前配置",
      },
    },
    {
      type: "textarea",
      title: "配置",
      description:
        "格式：文档id====【show/hide】====【left[width]/right[width]】====备注（可选）<br/>多个文档以换行分隔",
      key: "items",
      value: ``,
      placeholder: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    },
  ],
};

export default pluginMetadata;
