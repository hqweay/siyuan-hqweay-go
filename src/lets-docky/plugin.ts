import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "docky",
  displayName: "lets-docky.displayName",
  description: "lets-docky.description",
  version: "1.0.0",
  reference: "@frotstime",
  settings: [
    {
      type: "number",
      title: "lets-docky.zoomScale",
      description: "lets-docky.zoomScaleDesc",
      key: "zoomScale",
      value: 100,
      placeholder: "100",
    },
    {
      type: "button",
      title: "lets-docky.selectIcon",
      description: "lets-docky.selectIconDesc",
      key: "selectIcon",
      value: "lets-docky.selectIcon",
    },
    {
      type: "textarea",
      title: "lets-docky.config",
      description: "lets-docky.configDesc",
      key: "rules",
      value: `id:20251126002344-r4jzwns,name:haha,position: RightTop`,
      placeholder: `id:20251126002344-r4jzwns,position:RightTop`,
    },
  ],
};

export default pluginMetadata;
