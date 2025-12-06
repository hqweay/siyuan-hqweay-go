import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "quickAttr",
  displayName: "属性 Plus",
  description:
    "一些属性增强。标题下展示属性；支持快捷添加属性；默认支持转换列表为表格等视图；注册快捷添加至slash",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "标题下展示属性配置",
      description: "这里配置的属性的值会在标题下展示",
      key: "customProperties",
      value: `custom-createdAt|创建时间\ncustom-updatedAt`,
      placeholder: `custom-createdAt|创建时间\ncustom-updatedAt`,
    },
    {
      type: "textarea",
      title: "快捷添加属性配置配置",
      description: "",
      key: "attrs",
      value: `[
          {
    name: "@测试配置多个属性-@开头会注册进slash",
    keyvalues : {
      "key1": "value1",
      "key2": "value2",
      "key3": "value3"
    },
    enabled: true,
  },
  {
    name: "恢复转换效果",
    key: "f",
    value: "",
    enabled: true,
  },
  {
    name: "转换为表格",
    key: "f",
    value: "bg",
    enabled: true,
  },
  {
    name: "转换为导图",
    key: "f",
    value: "dt",
    enabled: true,
  },
  {
    name: "转换为时间线",
    key: "f",
    value: "timeline",
    enabled: true,
  },
  {
    name: "转换为看板",
    key: "f",
    value: "kb",
    enabled: true,
  },
  {
    name: "转换为Tab",
    key: "f",
    value: "list2tab",
    enabled: true,
  },
]`,
      placeholder: ``,
    },
    {
      type: "textarea",
      title: "碎碎念-配置块/文档 ID",
      description: `多个 ID 换行分隔<br/>如下配置 memo 的 ID 后，hello 的右上角将展示（由块 ID 截取生成的）创建时间【若展示有误烦请反馈】<br/>
              - [[memo]]<br/>
              - - hello`,
      key: "memoIds",
      placeholder: `20250126213235-a3tnoqb`,
      value: `20250126213235-a3tnoqb`,
    }, 
    {
      type: "checkbox",
      title: "碎碎念-该文档下的元素也展示创建时间？",
      description:
        "例如：A 同时为标注和粗体，当使用转换标注为文本时，将清除标注样式，保留粗体样式",
      key: "activeDoc",
      value: true,
    },
  ],
};

export default pluginMetadata;
