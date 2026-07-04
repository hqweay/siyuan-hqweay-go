import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "quick-bookmark",
  displayName: "lets-bookmark.displayName",
  description: "lets-bookmark.description",
  version: "1.0.0",
  settings: [
    {
      type: "textarea",
      title: "lets-bookmark.settingsTitle",
      description: "lets-bookmark.settingsDescription",
      key: "items",
      value: `读到这里啦\n好句子`,
      placeholder: "读到这里啦",
    },
  ],
};

export default pluginMetadata;
