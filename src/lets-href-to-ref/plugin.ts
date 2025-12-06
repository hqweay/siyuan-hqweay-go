export default {
  name: "convert",
  displayName: "行内元素转换",
  description: "块菜单/文档菜单打开事件增加行内元素转换的功能",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "样式嵌套仍转换？",
      description:
        "例如：A 同时为标注和粗体，当使用转换标注为文本时，将清除标注样式，保留粗体样式",
      key: "styleNesting",
      value: true,
    },
  ],
};
