export default {
  name: "epubReader",
  displayName: "【实验】EPUB 阅读器",
  description: "支持 EPUB 文件的阅读，支持手机端，支持反链做笔记",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textarea",
      title: "自定义链接",
      description: "支持占位符 ${link} ${text}",
      key: "annotionFormat",
      value: "- [◎](${link}) ${text}",
      //       value: `> [!NOTE] 📚 摘录
      // > [◎](\${link}) \${text}`,
      plcaholder: "",
      height: "100px",
    },
  ],
};
