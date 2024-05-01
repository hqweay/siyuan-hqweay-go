import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";

export default class DockShowAndHide {
  leftWidthRegex = /left\[(.*?)\]/;
  rightWidthRegex = /right\[(.*?)\]/;
  async switchProtyleEvent({ detail }) {
    const items = settings.getBySpace("dockShowAndHideConfig", "items");

    if (!items) return;

    let rightWidth = settings.getBySpace("dockShowAndHideConfig", "rightWidth");
    let leftWidth = settings.getBySpace("dockShowAndHideConfig", "leftWidth");
    let hideDock = settings.getBySpace("dockShowAndHideConfig", "hideDock");

    rightWidth = rightWidth ? rightWidth : "200px";
    leftWidth = leftWidth ? leftWidth : "200px";

    items.split("\n").forEach((line) => {
      const configs = line.split("====");
      if (configs[0].trim() !== detail.protyle.block.rootID) {
        return;
      }

      if (configs[1] === "show") {
        if (hideDock) {
          document
            .querySelector("#barDock")
            .firstElementChild.firstElementChild.setAttribute(
              "xlink:href",
              "#iconHideDock"
            );
          window.siyuan.config.uiLayout.hideDock = true;
        }

        document.querySelectorAll(".dock").forEach((item) => {
          if (item.querySelectorAll(".dock__item").length > 1) {
            item.classList.remove("fn__none");
          }
        });
        if (configs[2].includes("left")) {
          const match = configs[2].match(this.leftWidthRegex);
          if (match) {
            leftWidth = match[1];
          }
          window.siyuan.layout.leftDock.layout.element.style.width = leftWidth;
        }
        if (configs[2].includes("right")) {
          const match = configs[2].match(this.rightWidthRegex);
          if (match) {
            rightWidth = match[1];
          }
          window.siyuan.layout.rightDock.layout.element.style.width =
            rightWidth;
        }
        // if (configs[2].includes("bottom")) {
        //   window.siyuan.layout.bottomDock.layout.element.style.width = "320px";
        // }
      } else {
        if (hideDock) {
          document
            .querySelector("#barDock")
            .firstElementChild.firstElementChild.setAttribute(
              "xlink:href",
              "#iconDock"
            );
          window.siyuan.config.uiLayout.hideDock = true;
          document.querySelectorAll(".dock").forEach((item) => {
            item.classList.add("fn__none");
          });
        }

        if (configs[2].includes("left")) {
          window.siyuan.layout.leftDock.layout.element.style.width = "0px";
        }
        if (configs[2].includes("right")) {
          window.siyuan.layout.rightDock.layout.element.style.width = "0px";
        }
        // if (configs[2].includes("bottom")) {
        //   window.siyuan.layout.bottomDock.layout.element.style.width = "0px";
        // }
      }
    });
  }
}
