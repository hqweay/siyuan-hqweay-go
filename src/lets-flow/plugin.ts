export default {
  name: "flow-doc",
  displayName: "文档流",
  description: "通过 url 打开一个文档流",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textarea",
      title: "随机浏览的范围，通过 SQL 限定",
      description: "",
      key: "rangeSQL",
      value: "SELECT id FROM blocks WHERE type = 'd'",
      placeholder: "SELECT id FROM blocks WHERE type = 'd'",
    },
  ],
};
