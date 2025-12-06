export default {
  name: "readHelper",
  displayName: "阅读增强",
  description: "为思源阅读体验增强",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "toolbar 新增标注并复制块引",
      description: "toolbar 新增标注并复制块引",
      key: "markAndCopyRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "toolbar 新增标注并复制 Text* 格式块引",
      description: "toolbar 新增标注并复制块引",
      key: "markAndCopyTextRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "toolbar 新增标注并复制 * 格式块引",
      description: "toolbar 新增标注并复制块引",
      key: "markAndCopyTextRefNoHighlight",
      value: false,
    },
  ],
};
