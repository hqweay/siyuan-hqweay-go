import "./index.scss";

import { SubPlugin } from "@/types/plugin";
import { plugin } from "@/utils";
import { EnvConfig } from "./config/EnvConfig";
import { CUSTOM_ICON_MAP } from "./models/icon-constant";
import { DockService } from "./service/plugin/DockServices";
import { DocumentService } from "./service/plugin/DocumentService";
import { TabService } from "./service/plugin/TabService";
import { TopBarService } from "./service/plugin/TopBarService";
import { SettingService } from "./service/setting/SettingService";

export default class PluginSample implements SubPlugin {
  addMenuItem(menu) {
    TopBarService.ins.init(menu);
  }
  async onload() {
    EnvConfig.ins.init(plugin);
    await SettingService.ins.init();
    DocumentService.ins.init();
    DockService.ins.init();
    TabService.ins.init();

    // 图标的制作参见帮助文档
    for (const key in CUSTOM_ICON_MAP) {
      if (Object.prototype.hasOwnProperty.call(CUSTOM_ICON_MAP, key)) {
        const item = CUSTOM_ICON_MAP[key];
        plugin.addIcons(item.source);
      }
    }

    plugin.eventBus.on("switch-protyle", (e: any) => {
      EnvConfig.ins.lastViewedDocId = e.detail.protyle.block.rootID;
    });
    plugin.eventBus.on("loaded-protyle-static", (e: any) => {
      console.log("index loaded-protyle-static ");
      if (EnvConfig.ins.isMobile && !EnvConfig.ins.lastViewedDocId) {
        EnvConfig.ins.lastViewedDocId = e.detail.protyle.block.rootID;
      }
    });
  }

  onLayoutReady() {}

  async onunload() {
    DocumentService.ins.destory();
  }

  uninstall() {
    // console.log("uninstall");
  }

  //   openSetting(): void {
  //     openSettingsDialog();
  //   }
}
