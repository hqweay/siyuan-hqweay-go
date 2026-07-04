import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "title",
  displayName: "lets-adjust-title.displayName",
  description: "lets-adjust-title.description",
  version: "1.0.0",
  settings: [
    {
      type: "checkbox",
      title: "lets-adjust-title.settingsTitle",
      description: "lets-adjust-title.settingsDescription",
      key: "adjustTitleLevel",
      value: false,
    },
  ],
};

export default pluginMetadata;
