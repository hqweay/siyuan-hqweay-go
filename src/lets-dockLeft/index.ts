import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import DockLeft from "./DockLeft";
import pluginMetadata from "./plugin";

export default class DockLefts implements SubPlugin {
  private dockLefts: DockLeft[] = [];
  onload(): void {
    const docks = settings.getBySpace(pluginMetadata.name, "docks")?.trim();
    if (!docks) {
      return;
    }
    docks.split("\n").forEach((dock) => {
      const [icon, id] = dock.split(",");
      const dockLeft = new DockLeft();
      dockLeft.icon = icon.trim();
      dockLeft.id = id.trim();
      this.dockLefts.push(dockLeft);
    });
  }

  onLayoutReady(): void {
    this.dockLefts.forEach((dockLeft) => {
      dockLeft.onLayoutReady();
    });
  }

  onunload(): void {
    this.dockLefts.forEach((dockLeft) => {
      dockLeft.onunload();
    });
  }
}
