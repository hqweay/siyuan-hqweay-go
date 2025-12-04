import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { isMobile } from "@/utils";

export default class DockShowAndHide {
  leftWidthRegex = /left\[(.*?)\]/;
  rightWidthRegex = /right\[(.*?)\]/;

  originHideDock;
  originLeftWidth;
  originRightWidth;

  usedFlag = false;

  onLayoutReady() {
    if (!isMobile) {
      this.originHideDock = window?.siyuan?.config?.uiLayout?.hideDock;
      this.originLeftWidth =
        window?.siyuan?.layout?.leftDock?.layout?.element?.style?.width;
      this.originRightWidth =
        window?.siyuan?.layout?.rightDock?.layout?.element?.style?.width;
    }
  }

  async switchProtyleEvent({ detail }) {
    const returnIfSplit = settings.getBySpace(
      "dockShowAndHideConfig",
      "returnIfSplit"
    );

    if (
      returnIfSplit &&
      document.querySelectorAll("[data-type=wnd]").length > 7
    ) {
      //分屏默认不操作
      return;
    }
    const items = settings.getBySpace("dockShowAndHideConfig", "items");

    if (!items) return;

    //正常调整边栏宽度（进入没有配置id的文档）后记录一下
    if (!this.usedFlag) {
      this.originHideDock = window.siyuan.config.uiLayout.hideDock;
      this.originLeftWidth =
        window.siyuan.layout.leftDock.layout.element.style.width;
      this.originRightWidth =
        window.siyuan.layout.rightDock.layout.element.style.width;
    }

    let rightWidth = settings.getBySpace("dockShowAndHideConfig", "rightWidth");
    let leftWidth = settings.getBySpace("dockShowAndHideConfig", "leftWidth");
    let hideDock = settings.getBySpace("dockShowAndHideConfig", "hideDock");

    rightWidth = rightWidth ? rightWidth : "200px";
    leftWidth = leftWidth ? leftWidth : "200px";

    let configFlag = false;
    items.split("\n").forEach((line) => {
      const configs = line.split("====");
      if (configs[0].trim() !== detail.protyle.block.rootID) {
        return;
      }
      configFlag = true;
      this.usedFlag = true;

      if (configs[1] === "show") {
        if (hideDock) {
          document
            .querySelector("#barDock")
            .firstElementChild.firstElementChild.setAttribute(
              "xlink:href",
              "#iconHideDock"
            );
          window.siyuan.config.uiLayout.hideDock = false;
          document.querySelectorAll(".dock").forEach((item) => {
            if (item.querySelectorAll(".dock__item").length > 1) {
              item.classList.remove("fn__none");
            }
          });
        }

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
        // document
        //   .querySelector(".layout__dockl > .fn__flex-1 .fn__flex")
        //   .setAttribute("class", "fn__flex-1 fn__flex fn__none");
        // if (configs[2].includes("bottom")) {
        //   window.siyuan.layout.bottomDock.layout.element.style.width = "0px";
        // }

        //  window.siyuan.layout.leftDock.hideDock(true);
      }
    });

    //执行到这说明：已经进入过配置了的文档；该文档未配置；因此尝试恢复。
    if (!configFlag && this.usedFlag) {
      let otherDocs = settings.getBySpace("dockShowAndHideConfig", "otherDocs");
      //保持当前配置
      if (otherDocs === "恢复上次使用配置") {
        window.siyuan.config.uiLayout.hideDock = this.originHideDock;
        window.siyuan.layout.leftDock.layout.element.style.width =
          this.originLeftWidth;
        window.siyuan.layout.rightDock.layout.element.style.width =
          this.originRightWidth;
      }
      this.usedFlag = false;
    }
  }
}
