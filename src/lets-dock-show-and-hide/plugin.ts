import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "dockShowAndHide",
  displayName: "边栏自动打开、关闭",
  description: "自动控制边栏的显示和隐藏",
  version: "1.0.0",
  defaultConfig: {
    items: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    leftWidth: "200px",
    rightWidth: "200px",
    hideDock: false,
    returnIfSplit: true,
    otherDocs: "恢复上次使用配置",
  },
};

export default pluginMetadata;
