import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { isMobile } from "@/utils";
import { Dialog } from "siyuan";
import { alertInfo } from "./CHANGELOG";

export default class LetsAlert implements SubPlugin {
  onload(): void {}
  onLayoutReady(): void {
    let currentVersion = settings.getBySpace("lets-alert", "version");

    // version
    if (currentVersion && currentVersion > 1) {
      return;
    }

    currentVersion = currentVersion + 1;

    new Dialog({
      title: "恐龙工具箱的更新说明",
      content: `<div class="b3-dialog__content">
    <div class="fn__hr"></div>
    ${alertInfo
      .split("\n")
      .map((line) => `</br><div>${line}</div>`)
      .join("")}
    <div class="fn__hr"></div>
    <div class="fn__hr"></div>
</div>`,
      width: isMobile ? "92vw" : "560px",
      height: "540px",

      destroyCallback: (options) => {
        settings.setBySpace("lets-alert", "version", currentVersion);
      },
    });
  }
  onunload(): void {}
}
