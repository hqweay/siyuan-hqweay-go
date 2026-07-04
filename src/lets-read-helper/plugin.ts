export default {
  name: "readHelper",
  displayName: "lets-readHelper.displayName",
  description: "lets-readHelper.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "lets-readHelper.markAndCopyRef",
      description: "lets-readHelper.markAndCopyRefDesc",
      key: "markAndCopyRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-readHelper.markAndCopyTextRef",
      description: "lets-readHelper.markAndCopyTextRefDesc",
      key: "markAndCopyTextRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-readHelper.markAndCopyTextRefNoHighlight",
      description: "lets-readHelper.markAndCopyTextRefNoHighlightDesc",
      key: "markAndCopyTextRefNoHighlight",
      value: false,
    },
  ],
};
