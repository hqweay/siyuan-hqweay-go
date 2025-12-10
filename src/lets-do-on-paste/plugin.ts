import { settings } from "@/settings";
import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "doOnPaste",
  displayName: "粘贴时对数据预处理",
  description:
    "在粘贴内容时自动进行数据预处理和格式化，目前支持自动获取标题链接、矩形标注粘贴时转为 OCR 文本等",
  version: "1.0.0",
  settings: [
    {
      type: "checkbox",
      title: "自动获取标题链接",
      description: "",
      key: "titleLink",
      value: false,
    },
    {
      type: "select",
      title: "矩形标注粘贴时转为：支持 OCR 粘贴文本",
      description: "粘贴 OCR 文本需要配合 OCR 图片识别 功能使用",
      key: "recAnno",
      value: "ocrTextPin",
      options: {
        ocrText: "OCR文本",
        imgPin: "图片📌",
        pinImg: "📌图片",
        ocrTextPin: "📌OCR文本",
        pinOcrText: "OCR文本📌",
      },
    },
    {
      type: "checkbox",
      title: "![]()格式的图片自动缩小为 50%",
      description: "![]()格式的图片自动缩小为 50%",
      key: "resizeAndCenterImg",
      value: false,
    },
  ],
};

export default pluginMetadata;
