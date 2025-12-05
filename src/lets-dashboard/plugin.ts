export default {
  name: "dashBoard",
  displayName: "仪表盘",
  description: "仪表盘",
  version: "1.0.0",
  author: "hqweay",
  defaultConfig: {
    enabled: false,
    addToDock: false,
    configs: `[
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
  },
  settings: {
    仪表盘: [
      {
        type: "textinput",
        title: "添加到 Dock",
        description:
          "LeftTop | LeftBottom | RightTop | RightBottom | BottomLeft | BottomRight",
        key: "addToDock",
        value: false,
        placeholder: "为空不添加",
      },
      {
        type: "textarea",
        title: "仪表盘配置",
        description: "参考默认配置……",
        key: "configs",
        value: "",
        placeholder: "参考默认配置……",
      },
    ],
  },
};
