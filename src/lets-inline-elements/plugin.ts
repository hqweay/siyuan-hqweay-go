export default {
  name: "inline-elements",
  displayName: "lets-inline-elements.displayName",
  description: "lets-inline-elements.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "number",
      title: "lets-inline-elements.pageSize",
      description: "lets-inline-elements.pageSizeDesc",
      key: "pageSize",
      value: 20,
      placeholder: "20",
    },
    {
      type: "checkbox",
      title: "lets-inline-elements.autoRefresh",
      description: "lets-inline-elements.autoRefreshDesc",
      key: "autoRefresh",
      value: false,
    },
  ],
};
