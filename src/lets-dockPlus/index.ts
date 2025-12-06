import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import DockPlugin from "./DockPlugin";
import pluginMetadata from "./plugin";
import { Dock } from "siyuan";

export default class DockPlugins implements SubPlugin {
  private dockPlugins: DockPlugin[] = [];
  onload(): void {
    const docks = settings.getBySpace(pluginMetadata.name, "docks")?.trim();
    console.log(docks);
    if (!docks) {
      return;
    }
    docks.split("\n").forEach((dock) => {
      const [location, icon, id, label] = dock.split(",");

      this.dockPlugins.push(new DockPlugin(location, icon, id, label));
    });
  }

  onLayoutReady(): void {
    console.log(this.dockPlugins);
    this.dockPlugins?.forEach((dock) => {
      dock?.onLayoutReady();
    });
  }

  onunload(): void {
    this.dockPlugins?.forEach((dock) => {
      dock?.onunload();
    });
  }
}
