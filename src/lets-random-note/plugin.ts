export default {
  name: "randomNote",
  displayName: "随机浏览",
  description:
    "在界面右上角生成一个随机图标，点击可跳转指定 id 条目；由于跳转通过 SQL 配置，你也可以配置固定跳转到某个块或文档。",
  version: "1.0.0",
  author: "hqweay",
  defaultConfig: {
    enabled: false,
    rangeSQL: "SELECT root_id FROM blocks",
    limitNum: 30,
  },
  settings: {
    随机浏览: [
      {
        type: "textarea",
        title: "随机浏览的范围，通过 SQL 限定",
        description: "",
        key: "rangeSQL",
        value: "SELECT id FROM blocks WHERE type = 'd'",
        placeholder: "SELECT id FROM blocks WHERE type = 'd'",
      },
      {
        type: "number",
        title: "缓存数量",
        description: "",
        key: "limitNum",
        value: 30,
        placeholder: "默认一次查询 30 条缓存",
      },
    ],
  },
};
