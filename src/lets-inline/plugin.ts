export default {
  name: "extractInline",
  displayName: "lets-inline.displayName",
  description: "lets-inline.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "lets-inline.extractPath",
      description: "lets-inline.extractPathDesc",
      key: "extractPath",
      value: "",
      placeholder: "/我的笔记本/",
    },
    {
      type: "checkbox",
      title: "lets-inline.addRef",
      description: "lets-inline.addRefDesc",
      key: "addRef",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-inline.addOutline",
      description: "lets-inline.addOutlineDesc",
      key: "addOutline",
      value: false,
    },
  ],
};
