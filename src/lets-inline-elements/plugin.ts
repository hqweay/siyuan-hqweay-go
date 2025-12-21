export default {
  name: "inline-elements",
  displayName: "侧边栏展示行内元素",
  description: "侧边栏展示行内元素",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "使用 Protyle 模式",
      description: "启用后使用可编辑的 Protyle 展示标注，支持滚动加载",
      key: "useProtyle",
      value: false,
    },
    {
      type: "number",
      title: "每页加载数量",
      description: "Protyle 模式下的分页加载数量",
      key: "pageSize",
      value: 20,
      placeholder: "20",
    },
  ],
};
