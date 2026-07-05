import { PluginMetadata } from "@/types/plugin";

const pluginMetadata: PluginMetadata = {
  name: "nav-helper",
  displayName: "lets-nav-helper.displayName",
  description: "lets-nav-helper.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "select",
      title: "lets-nav-helper.enableBottomNav",
      description: "lets-nav-helper.enableBottomNavDesc",
      key: "enableBottomNav",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
      },
    },
    {
      type: "checkbox",
      title: "lets-nav-helper.navJustInMain",
      description: "lets-nav-helper.navJustInMainDesc",
      key: "navJustInMain",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-nav-helper.hideSubmenu",
      description: "lets-nav-helper.hideSubmenuDesc",
      key: "hideSubmenu",
      value: false,
    },
    {
      type: "select",
      title: "lets-nav-helper.showBackButton",
      description: "lets-nav-helper.showBackButtonDesc",
      key: "showBackButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "textinput",
      title: "lets-nav-helper.noteBookID",
      description: "lets-nav-helper.noteBookIDDesc",
      key: "noteBookID",
      value: "20240330144726-gs2xey6",
      placeholder: "",
    },
    {
      type: "select",
      title: "lets-nav-helper.showForwardButton",
      description: "lets-nav-helper.showForwardButtonDesc",
      key: "showForwardButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "select",
      title: "lets-nav-helper.showDashBoard",
      description: "lets-nav-helper.showDashBoardDesc",
      key: "showDashBoard",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "textarea",
      title: "lets-nav-helper.dashBoardLink",
      description: "lets-nav-helper.dashBoardLinkDesc",
      key: "dashBoardLink",
      value: "siyuan://plugins/siyuan-hqweay-go/open",
      placeholder: "siyuan://plugins/siyuan-hqweay-go/open",
      height: "100px",
    },
    {
      type: "select",
      title: "lets-nav-helper.showRandomButton",
      description: "lets-nav-helper.showRandomButtonDesc",
      key: "showRandomButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "select",
      title: "lets-nav-helper.showCustomLinksButton",
      description: "lets-nav-helper.showCustomLinksButtonDesc",
      key: "showCustomLinksButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "select",
      title: "lets-nav-helper.showDailyNoteButton",
      description: "lets-nav-helper.showDailyNoteButtonDesc",
      key: "showDailyNoteButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "select",
      title: "lets-nav-helper.showNavigationMenuButton",
      description: "lets-nav-helper.showNavigationMenuButtonDesc",
      key: "showNavigationMenuButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },
    {
      type: "select",
      title: "lets-nav-helper.showContextButton",
      description: "lets-nav-helper.showContextButtonDesc",
      key: "showContextButton",
      value: "both",
      options: {
        mobile: "移动端",
        pc: "PC 端",
        both: "移动端、PC 端",
        none: "不显示",
      },
    },

    {
      type: "list",
      title: "lets-nav-helper.customLinks",
      description: "lets-nav-helper.customLinksDesc",
      key: "customLinks",
      value: [
        { title: "养恐龙", url: "https://leay.net/", icon: "#iconLink" },
        { title: "日记随机", url: "select * from blocks where path like '%/20250126213235-a3tnoqb/%' and type='d'", icon: "#iconRefresh" },
        { title: "草稿随机", url: "select * from blocks where path like '%/20240406015842-137jie3/%' and type='d'", icon: "#iconRefresh" },
        { title: "添加到写作数据库", url: "20250914152140-n10qdtt", icon: "#iconDatabase" }
      ],
      columns: [
        { key: "icon", title: "图标", type: "text", width: "60px" },
        { key: "title", title: "标题", type: "text", width: "120px" },
        { key: "url", title: "链接/ID", type: "text" }
      ]
    },
  ],
};

export default pluginMetadata;
