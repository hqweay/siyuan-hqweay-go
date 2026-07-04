import { settings } from "@/settings";
import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "doOnPaste",
  displayName: "lets-do-on-paste.displayName",
  description: "lets-do-on-paste.description",
  version: "1.0.0",
  settings: [
    {
      type: "checkbox",
      title: "lets-do-on-paste.titleLink",
      description: "lets-do-on-paste.titleLinkDesc",
      key: "titleLink",
      value: false,
    },
    {
      type: "select",
      title: "lets-do-on-paste.recAnno",
      description: "lets-do-on-paste.recAnnoDesc",
      key: "recAnno",
      value: "ocrTextPin",
      options: {
        ocrText: "lets-do-on-paste.optionOcrText",
        imgPin: "lets-do-on-paste.optionImgPin",
        pinImg: "lets-do-on-paste.optionPinImg",
        ocrTextPin: "lets-do-on-paste.optionOcrTextPin",
        pinOcrText: "lets-do-on-paste.optionPinOcrText",
        calloutPinText: "lets-do-on-paste.optionCalloutPinText",
      },
    },
    {
      type: "checkbox",
      title: "lets-do-on-paste.resizeAndCenterImg",
      description: "lets-do-on-paste.resizeAndCenterImgDesc",
      key: "resizeAndCenterImg",
      value: false,
    },
  ],
};

export default pluginMetadata;
