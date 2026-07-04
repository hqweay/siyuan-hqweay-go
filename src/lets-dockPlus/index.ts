import { settings } from "@/settings";
import DockPlugin from "./DockPlugin";
import pluginMetadata from "./plugin";
import { Dock } from "siyuan";
import { SubPluginBase } from "@/libs/sub-plugin-base";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-dockPlus");

export default class DockPlugins extends SubPluginBase {
  private dockPlugins: DockPlugin[] = [];
  override onload(): void {
    const docks = settings.getBySpace(pluginMetadata.name, "docks")?.trim();
    log.info(docks);
    if (!docks) {
      return;
    }
    docks.split("\n").forEach((dock) => {
      const [location, icon, id, label] = dock.split(",");

      this.dockPlugins.push(new DockPlugin(location, icon, id, label));
    });
  }

  override onLayoutReady(): void {
    log.info(this.dockPlugins);
    this.dockPlugins?.forEach((dock) => {
      dock?.onLayoutReady();
    });
  }

  override onunload(): void {
    this.dockPlugins?.forEach((dock) => {
      dock?.onunload();
    });
  }
}
