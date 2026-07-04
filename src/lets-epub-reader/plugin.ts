export default {
  name: "epubReader",
  displayName: "lets-epub-reader.displayName",
  description: "lets-epub-reader.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textarea",
      title: "lets-epub-reader.annotionFormat",
      description: "lets-epub-reader.annotionFormatDesc",
      key: "annotionFormat",
      value: "- [◎](${link}) ${text}",
      //       value: `> [!NOTE] 📚 摘录
      // > [◎](\${link}) \${text}`,
      plcaholder: "",
      height: "100px",
    },
  ],
};
