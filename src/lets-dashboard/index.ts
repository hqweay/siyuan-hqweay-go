import { getBlockAttrs, setBlockAttrs } from "@/api";
import { settings } from "@/settings";
import { isMobile, plugin } from "@/utils";
import { Dialog, Menu, openMobileFileById, openTab, showMessage } from "siyuan";
import { SubPlugin } from "@/types/plugin";

import DashboardComponent from "./dashboard.svelte";

const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";
const docks = [
  "LeftTop",
  "LeftBottom",
  "RightTop",
  "RightBottom",
  "BottomLeft",
  "BottomRight",
];

export default class DashBoard implements SubPlugin {
  private id = "hqweay-diary-tools";
  private label = "获取天气并插入当前文档属性";
  private icon = `📝`;
  private thisElement: HTMLElement | null = null;

  addDock() {
    const addToDock = settings.getBySpace("diaryTools", "addToDock");

    console.log("addToDock", addToDock);
    if (docks.includes(addToDock)) {
      plugin.addDock({
        config: {
          position: addToDock,
          size: { width: 200, height: 0 },
          icon: "iconAttr",
          title: "仪表盘",
          hotkey: "⌥⌘W",
        },
        data: { text: "This is my custom dock" },
        type: DOCK_TYPE + "aaa",
        resize() {
          console.log(DOCK_TYPE + " resize");
        },
        update() {
          console.log(DOCK_TYPE + " update");
        },
        init: (dock) => {
          new DashboardComponent({
            target: dock.element,
          });
        },
        destroy() {
          console.log("destroy dock:", DOCK_TYPE);
        },
      });
    }
  }

  onload(): void {}
  async onLayoutReady() {
    console.log("diary-tools onload");
    // Add icon to toolbar
    this.addIconToToolbar();

    // Add dock if configured
    this.addDock();

    // Setup menu for mobile or desktop
    if (isMobile) {
      this.addMenu();
    }
  }

  private addIconToToolbar() {
    this.showMenu();
  }

  private showMenu() {
    console.log("showMenu");
    this.thisElement = plugin.addTopBar({
      icon: "iconBookmark",
      title: "恐龙工具箱",
      position: "right",
      callback: () => {
        if (isMobile) {
          let dialog = new Dialog({
            title: "仪表盘",
            content: `<div id="hqweay-diary-dashboard" style="height: 700px;"></div>`,
            width: "400px",
            destroyCallback: (options) => {
              pannel.$destroy();
            },
          });

          let pannel = new DashboardComponent({
            target: dialog.element.querySelector("#hqweay-diary-dashboard"),
            props: {},
          });
        } else {
          let rect = this.thisElement?.getBoundingClientRect();
          if (!rect || rect.width === 0) {
            rect = document.querySelector("#barMore")?.getBoundingClientRect();
          }
          if (!rect || rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              ?.getBoundingClientRect();
          }
          if (rect) {
            let tabDiv = document.createElement("div");
            tabDiv.setAttribute("id", "hqweay-diary-dashboard");
            new DashboardComponent({
              target: tabDiv,
              props: {},
            });
            plugin.addTab({
              type: TAB_TYPE,
              init() {
                this.element.appendChild(tabDiv);
              },
            });
            openTab({
              app: plugin.app,
              custom: {
                icon: "",
                title: "仪表盘",
                data: {},
                id: plugin.name + TAB_TYPE,
              },
            });
          }
        }
        // diaryTools handles its own menu display
      },
    });
  }

  onunload(): void {
    // 查询所有匹配的元素并删除
    document
      .querySelectorAll('[id^="plugin_siyuan-hqweay-go_"]')
      .forEach((element) => {
        element.remove();
      });
  }

  openSiyuanUrlPluginEvent({ detail }) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "open") {
      const indexParam = urlObj.searchParams.get("index");
      const type = urlObj.searchParams.get("type");

      const index =
        //@ts-ignore
        indexParam && !isNaN(indexParam) ? Number(indexParam) : indexParam || 0;

      if (isMobile) {
        let dialog = new Dialog({
          title: "仪表盘",
          content: `<div id="hqweay-diary-dashboard" style="height: 700px;"></div>`,
          width: "400px",
          destroyCallback: (options) => {
            pannel.$destroy();
          },
        });

        let pannel = new DashboardComponent({
          target: dialog.element.querySelector("#hqweay-diary-dashboard"),
          props: { selectedConfig: index, type },
        });
      } else {
        let tabDiv = document.createElement("div");
        tabDiv.setAttribute("id", "hqweay-diary-dashboard" + index);
        new DashboardComponent({
          target: tabDiv,
          props: { selectedConfig: index, type },
        });
        plugin.addTab({
          type: TAB_TYPE + index,
          init() {
            this.element.appendChild(tabDiv);
          },
        });
        openTab({
          app: plugin.app,
          custom: {
            icon: "",
            title: "仪表盘",
            data: {},
            id: plugin.name + TAB_TYPE + index,
          },
        });
      }
    }
  }
}
