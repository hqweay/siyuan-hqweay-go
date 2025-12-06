export default {
  name: "extractInline",
  displayName: "提取元素至新文档",
  description: "文档菜单打开事件新增提取当前文档行内元素至新文档。",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "新文档保存路径",
      description:
        "文档菜单打开事件新增提取当前文档行内元素至新文档。<br/>若为空，则新文档建立于当前文档下；若配置，则新文档建立在配置路径下。",
      key: "extractPath",
      value: "",
      placeholder: "/我的笔记本/",
    },
    {
      type: "checkbox",
      title: "添加一个 * 引用",
      description: "新文档内的行内元素会在末尾添加一个 * 引用指向原块",
      key: "addRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "提取元素为大纲块",
      description: "开启则新文档内的行内元素提取为大纲块，否则为文档块",
      key: "addOutline",
      value: false,
    },
  ],
};
