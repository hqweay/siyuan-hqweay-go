export default {
  name: "diaryTools",
  displayName: "日记相关工具",
  description: "提供日记相关的工具，包括仪表盘、天气信息插入等功能",
  version: "1.0.0",
  author: "hqweay",
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
        value: "[]",
        placeholder: "参考默认配置……",
      },
    ],
    日记相关工具: [
      {
        type: "textinput",
        title: "创建日记的笔记本id",
        description: "",
        key: "noteBookID",
        value: "",
        placeholder: "20240330144726-gs2xey6",
      },
      {
        type: "checkbox",
        title:
          "slash 新增「cdn/创建日记引用」提供日历选择器快捷创建指定日期的日记并插入块引",
        description: "",
        key: "slashDiaryNote",
        value: true,
      },
      {
        type: "checkbox",
        title: "快捷小窗录入日记（默认快捷键F10）",
        description: "",
        key: "quickInput",
        value: true,
      },
      {
        type: "checkbox",
        title: "顶栏按钮快捷操作",
        description: "",
        key: "topBar",
        value: false,
      },
      {
        type: "textinput",
        title: "顶栏-获取天气并插入当前文档属性",
        description: "https://www.sojson.com/blog/305.html",
        key: "getWeatherSetAttrs",
        value: "",
        placeholder: "配置城市代码，如：101270101",
      },
    ],
  },
};
