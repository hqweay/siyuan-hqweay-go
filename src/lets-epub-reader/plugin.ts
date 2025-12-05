export default {
  name: "epubReader",
  displayName: "EPUB 阅读器",
  description: "支持 EPUB 文件的阅读功能",
  version: "1.0.0",
  author: "hqweay",
  defaultConfig: {
    enabled: false,
  },
  settings: [
    {
      type: "checkbox",
      title: "启用 EPUB 阅读器",
      description: "启用 EPUB 文件阅读功能",
      key: "enabled",
      value: false,
    },
  ],
};
