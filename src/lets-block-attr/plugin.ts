import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "quickAttr",
  displayName: "lets-block-attr.displayName",
  description: "lets-block-attr.description",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "lets-block-attr.customPropertiesTitle",
      description: "lets-block-attr.customPropertiesDescription",
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
      title: "lets-block-attr.attrsTitle",
      description: "lets-block-attr.attrsDescription",
      key: "attrs",
      value: `[
          {
    name: "@测试配置多个属性",
    keyvalues : {
      "key1": "value1",
      "key2": "value2",
      "key3": "value3"
    },
    enabled: true,
  },
  {
    name: "lets-block-attr.menuRestoreEffect",
    key: "f",
    value: "",
    enabled: true,
  },
  {
    name: "lets-block-attr.menuConvertTable",
    key: "f",
    value: "bg",
    enabled: true,
  },
  {
    name: "lets-block-attr.menuConvertMindmap",
    key: "f",
    value: "dt",
    enabled: true,
  },
  {
    name: "lets-block-attr.menuConvertTimeline",
    key: "f",
    value: "timeline",
    enabled: true,
  },
  {
    name: "lets-block-attr.menuConvertKanban",
    key: "f",
    value: "kb",
    enabled: true,
  },
  {
    name: "lets-block-attr.menuConvertTab",
    key: "f",
    value: "list2tab",
    enabled: true,
  },
]`,
      placeholder: ``,
    },
    {
      type: "textarea",
      title: "lets-block-attr.memoIdsTitle",
      description: "lets-block-attr.memoIdsDescription",
      key: "memoIds",
      placeholder: `20250126213235-a3tnoqb`,
      value: `20250126213235-a3tnoqb`,
    },
    {
      type: "checkbox",
      title: "lets-block-attr.activeDocTitle",
      description: "lets-block-attr.activeDocDescription",
      key: "activeDoc",
      value: true,
    },
  ],
};

export default pluginMetadata;
