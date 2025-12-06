import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "quickAttr",
  displayName: "属性",
  description:
    "标题下展示属性值；支持快捷添加属性：默认支持转换列表为表格等视图；注册快捷添加属性添加至slash",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "标题下展示属性配置",
      description: "这里配置的属性的值会在标题下展示",
      key: "customProperties",
      value: `custom-createdAt|创建时间\ncustom-updatedAt\ncustom-diary-weather-type
custom-diary-temperature
custom-diary-air-quality
custom-diary-wind-power
custom-diary-pm25`,
      placeholder: `custom-createdAt|创建时间\ncustom-updatedAt`,
    },
    {
      type: "textarea",
      title: "快捷添加属性配置",
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
      title: "碎碎念-配置块/文档 ID-引用下的子项将在右上角展示时间",
      description: `多个 ID 换行分隔<br/>如下配置 memo 的 ID 后，hello 的右上角将展示（由块 ID 截取生成的）创建时间<br/>
              - [[memo]]<br/>
              - - hello`,
      key: "memoIds",
      placeholder: `20250126213235-a3tnoqb`,
      value: `20250126213235-a3tnoqb`,
    },
    {
      type: "checkbox",
      title: "碎碎念-该文档下的元素也展示创建时间？",
      description: "文档本身下面的子项也展示创建时间",
      key: "activeDoc",
      value: true,
    },
  ],
};

export default pluginMetadata;
