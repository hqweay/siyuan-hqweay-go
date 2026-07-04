import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockShowAndHide",
  displayName: "lets-dock-show-and-hide.displayName",
  description: "lets-dock-show-and-hide.description",
  version: "1.0.0",
  settings: [
    {
      type: "textinput",
      title: "lets-dock-show-and-hide.leftWidth",
      description: "lets-dock-show-and-hide.leftWidthDesc",
      key: "leftWidth",
      value: "200px",
      placeholder: "200px",
    },
    {
      type: "textinput",
      title: "lets-dock-show-and-hide.rightWidth",
      description: "lets-dock-show-and-hide.rightWidthDesc",
      key: "rightWidth",
      value: "200px",
      placeholder: "200px",
    },
    {
      type: "checkbox",
      title: "lets-dock-show-and-hide.hideDock",
      description: "lets-dock-show-and-hide.hideDockDesc",
      key: "hideDock",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-dock-show-and-hide.returnIfSplit",
      description: "lets-dock-show-and-hide.returnIfSplitDesc",
      key: "returnIfSplit",
      value: true,
    },
    {
      type: "select",
      title: "lets-dock-show-and-hide.otherDocs",
      description: "lets-dock-show-and-hide.otherDocsDesc",
      key: "otherDocs",
      value: "lets-dock-show-and-hide.restorePrevious",
      options: {
        "lets-dock-show-and-hide.restorePrevious": "lets-dock-show-and-hide.restorePrevious",
        "lets-dock-show-and-hide.keepCurrent": "lets-dock-show-and-hide.keepCurrent",
      },
    },
    {
      type: "textarea",
      title: "lets-dock-show-and-hide.config",
      description: "lets-dock-show-and-hide.configDesc",
      key: "items",
      value: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
      placeholder: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    },
  ],
};

export default pluginMetadata;
