import { PluginMetadata } from "@/types/plugin";

const pluginMetadata: PluginMetadata = {
  name: "backlink-panel",
  displayName: "反链面板",
  description: "在文档底部显示反链列表，支持自定义SQL查询和动态加载",
  version: "1.0.0",
  author: "hqweay",
  enabled: true,
  settings: [
    {
      type: "checkbox",
      title: "启用反链面板",
      description: "在文档底部显示反链面板",
      key: "enabled",
      value: true,
    },
    {
      type: "select",
      title: "显示位置",
      description: "反链面板在文档中的显示位置",
      key: "position",
      value: "bottom",
      options: {
        bottom: "文档底部",
        top: "文档顶部",
      },
    },
    {
      type: "checkbox",
      title: "自动展开",
      description: "页面加载时自动展开反链面板",
      key: "autoExpand",
      value: false,
    },
    {
      type: "number",
      title: "初始加载数量",
      description: "首次加载的反链数量",
      key: "initialLoadCount",
      value: 20,
    },
    {
      type: "number",
      title: "每次滚动加载数量",
      description: "滚动到底部时每次加载的数量",
      key: "scrollLoadCount",
      value: 10,
    },
    {
      type: "checkbox",
      title: "显示文档标题",
      description: "在反链列表中显示引用文档的标题",
      key: "showDocTitle",
      value: true,
    },
    {
      type: "checkbox",
      title: "显示引用上下文",
      description: "显示引用内容的上下文预览",
      key: "showContext",
      value: true,
    },
    {
      type: "number",
      title: "上下文预览长度",
      description: "引用上下文预览的最大字符数",
      key: "contextLength",
      value: 100,
    },
    {
      type: "textarea",
      title: "默认自定义SQL",
      description: "自定义SQL查询的默认模板（可选）",
      key: "defaultSql",
      value: "",
      placeholder: "SELECT * FROM blocks WHERE id LIKE '%ref%' LIMIT 10",
      height: "80px",
    },
    {
      type: "checkbox",
      title: "启用自定义SQL标签页",
      description: "是否启用自定义SQL查询功能",
      key: "enableCustomSql",
      value: true,
    },
  ],
};

export default pluginMetadata;
