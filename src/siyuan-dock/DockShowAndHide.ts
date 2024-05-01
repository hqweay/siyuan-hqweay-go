import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";

export default class DockShowAndHide {
  async switchProtyleEvent({ detail }) {
    console.log(window.siyuan.layout.rightDock);

    const items = settings.getBySpace("dockShowAndHideConfig", "items");
    let rightWidth = settings.getBySpace("dockShowAndHideConfig", "rightWidth");
    let leftWidth = settings.getBySpace("dockShowAndHideConfig", "leftWidth");

    rightWidth = rightWidth ? rightWidth : "200px";
    leftWidth = leftWidth ? leftWidth : "200px";

    if (!items) return;

    items.split("\n").forEach((line) => {
      const configs = line.split("====");
      if (configs[0].trim() !== detail.protyle.block.rootID) {
        return;
      }

      if (configs[1] === "show") {
        document
          .querySelector("#barDock")
          .firstElementChild.firstElementChild.setAttribute(
            "xlink:href",
            "#iconHideDock"
          );
        window.siyuan.config.uiLayout.hideDock = true;
        document.querySelectorAll(".dock").forEach((item) => {
          if (item.querySelectorAll(".dock__item").length > 1) {
            item.classList.remove("fn__none");
          }
        });
        if (configs[2].includes("left")) {
          window.siyuan.layout.leftDock.layout.element.style.width = leftWidth;
        }
        if (configs[2].includes("right")) {
          window.siyuan.layout.rightDock.layout.element.style.width =
            rightWidth;
        }
        // if (configs[2].includes("bottom")) {
        //   window.siyuan.layout.bottomDock.layout.element.style.width = "320px";
        // }
      } else {
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
