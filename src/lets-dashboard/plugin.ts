import { PluginMetadata } from "@/types/plugin";

const pluginMetadata: PluginMetadata = {
  name: "dashBoard",
  displayName: "【实验】仪表盘",
  description:
    "提供一个仪表盘，主要为了复刻日记软件的流程；支持通过链接单独打开文档流、图片流",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "添加到 Dock",
      description:
        "LeftTop | LeftBottom | RightTop | RightBottom | BottomLeft | BottomRight",
      key: "addToDock",
      value: "",
      placeholder: "为空不添加",
    },
    {
      type: "textarea",
      title: "文档流/图片流模式",
      description: "提供一个面板通过输入的 SQL 查询……",
      key: "flowMode",
      value: `[
        {
          name: "文档查询",
          examples: [
            { name: "随机所有文档", sql: "SELECT * FROM blocks WHERE type = 'd' ORDER BY RANDOM()" },
            { name: "随机内容搜索", sql: "SELECT * FROM blocks WHERE content LIKE '%关键词%' ORDER BY RANDOM()" },
            { name: "路径筛选", sql: "SELECT * FROM blocks WHERE path LIKE '%2024%' ORDER BY created DESC LIMIT 15" },
          ],
        },
        {
          name: "图片查询",
          examples: [
            { name: "JPG图片", sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id WHERE assets.path LIKE '%.jpg' LIMIT 20" },
            { name: "PNG图片", sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id WHERE assets.path LIKE '%.png' LIMIT 20" },
            { name: "按时间排序", sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id ORDER BY created DESC LIMIT 30" },
          ],
        },
        {
          name: "时间范围",
          examples: [
            { name: "日期区间", sql: "SELECT * FROM blocks WHERE type = 'd' AND created >= '20241201000000' AND created <= '20241231235959'" },
            { name: "按月查询", sql: "SELECT * FROM blocks WHERE substr(created, 1, 6) = '202412' ORDER BY created DESC" },
            { name: "近30天", sql: "SELECT * FROM blocks WHERE created >= date('now', '-30 days') ORDER BY created DESC LIMIT 20" },
          ],
        },
      ]`,
      placeholder: "",
    },
    {
      type: "textarea",
      title: "仪表盘配置",
      description: "参考默认配置……",
      key: "configs",
      value: `[
    {
      //配置名
      name: "所有文档！",
      //主页总数 label
      indexLabel: "文档数量",
      //进入时是否加载列表
      showEntries: true,
      //进入时是否加载图片
      showMedia: true,
      //控制是否展示 主统计信息
      showMainStatics: true,
      //控制是否展示 那年、那月、那周今日
      showOnThisDay: true,
      //控制是否展示 热力图
      showHeatmap: true,
      //控制是否展示 自定义卡片
      showcustomCards: [
        {
          id: "random",
          type: "text",
          label: "select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1",
          onClick: () => {
            loadCards("random").then((res) => {
              customCards = customCards.map((card) => {
                const matchedRes = res.find((item) => item.id === card.id);
                return matchedRes ? matchedRes : card;
              });
              window.diaryTools.updateCustomCards(customCards);
            });
          },
        },
        {
          type: "text",
          label: "select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1",
          onClick: (card) => {
            if (window.diaryTools.isMobile) {
              window.diaryTools.openMobileFileById(window.diaryTools.plugin.app, card.labelBlocks[0]?.id);
            } else {
              window.open("siyuan://blocks/" + card.labelBlocks[0]?.id);
            }
          },
        },
        {
          type: "icon-stat",
          label: "距离 2026 年还有",
          number: () => {
            const targetDate = new Date("2026-01-01").getTime();
            const currentDate = new Date().getTime();
            const timeDiff = targetDate - currentDate;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            return daysDiff;
          },
          text: "天",
        },
      ],
      //主SQL
      mainSQL: "select blocks.* from blocks where type = 'd'",
      //可选：图片SQL。若为 null，则通过 mainSQL 关联查询
      imgSQL: null,
    },
    {
      name: "🎲 随机！",
      indexLabel: "随机文档",
      showEntries: true,
      showMedia: false,
      showMainStatics: true,
      showOnThisDay: true,
      showHeatmap: true,
      mainSQL: "select blocks.* from blocks where type = 'd' ORDER BY RANDOM() LIMIT " + (Math.floor(Math.random() * 51) + 50),
    },
    {
      name: "Daily Notes",
      indexLabel: "Daily Notes",
      showEntries: true,
      showMedia: false,
      showMainStatics: false,
      showOnThisDay: false,
      showHeatmap: false,
      mainSQL: "select blocks.* from blocks join attributes on blocks.id = attributes.block_id where attributes.name like 'custom-dailynote%' order by attributes.value desc",
    },
  ]`,
      placeholder: "参考默认配置……",
    },
  ],
};

export default pluginMetadata;
