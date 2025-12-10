export default {
  name: "typography",
  displayName: "【实验】中文排版优化",
  description:
    "右上角增加机器人图标/块菜单增加格式化文档的功能；注意有损坏数据风险。",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "添加一个 slash，格式化当前块",
      description: "",
      key: "slashFormat",
      value: false,
    },
    {
      type: "checkbox",
      title: "文档格式化时插入空格？",
      description:
        "点击右上角机器人对文档格式化时调用思源的「排版优化」来自动插入空格",
      key: "autoSpace",
      value: true,
    },
    {
      type: "checkbox",
      title: "文档格式化时网络资源文件转换本地？",
      description:
        "点击右上角机器人对文档格式化时调用思源的「网络资源文件转换本地」",
      key: "netImg2LocalAssets",
      value: false,
    },
    {
      type: "checkbox",
      title: "关闭提示？",
      description:
        "点击右上角机器人对文档格式化时会有损坏数据的风险，如果你确认风险可以打开开关，关闭每次操作前的提示。",
      key: "closeTip",
      value: false,
    },
    {
      type: "number",
      title: "图片居中？",
      description: "为 10-100 的值则居中并按百分比数值缩放；其它值则不居中。",
      key: "imageCenter",
      value: 50,
    },
  ],
};
