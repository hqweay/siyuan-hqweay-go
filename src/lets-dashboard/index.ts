import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { isMobile, plugin } from "@/utils";
import { Dialog, openTab } from "siyuan";

import DashboardComponent from "./dashboard.svelte";
import EntryList from "./EntryList.svelte";
import FlowBoard from "./flowboard.svelte";
import ImageGallery from "./ImageGallery.svelte";

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
  private icon = `<svg t="1765029926763" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4692" width="128" height="128"><path d="M961.60872 479.928a501.152 501.152 0 0 0-266.304-266.344 497.48 497.48 0 0 0-194.816-39.328 498.448 498.448 0 0 0-194.856 39.376 501.28 501.28 0 0 0-159.112 107.184A494.544 494.544 0 0 0 39.32872 479.968 497.52 497.52 0 0 0 0.00072 674.704h56.6c0-244.736 199.112-443.848 443.896-443.848 244.776 0 443.888 199.112 443.888 443.848h56.592a498.336 498.336 0 0 0-39.368-194.776zM122.83272 883.448h752.984v56.6H122.83272z" fill="#7BC6EF" p-id="4693"></path><path d="M477.96872 804.032l108.568 0.752-0.752-108.52-282.072-174.128 174.256 281.944v-0.048z m51.552-56.216l-19.808-0.12-31.696-51.424 51.384 31.696 0.12 19.848z" fill="#58BB9A" p-id="4694"></path><path d="M106.31272 726.128h78.784v56.64h-78.784zM176.00872 471.296l40.04-40.04 55.68 55.72-40.048 40.04-55.672-55.68zM728.08872 486.976l55.68-55.68 40.04 40.04-55.72 55.68-40.04-40.04zM471.96072 282.032h56.6v78.496h-56.6zM815.29672 726.168h78.744v56.6h-78.744z" fill="#EC6329" p-id="4695"></path></svg>`;
  private thisElement: HTMLElement | null = null;

  addMenuItem(menu) {
    menu.addItem({
      label: "打开仪表盘",
      iconHTML: `<div id="${this.id}-dashboard" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="打开仪表盘" >${this.icon}</div>`,
      click: async () => {
        this.openDashBoard("", "");
      },
    });

    menu.addItem({
      label: "打开 Flow 浏览界面",
      iconHTML: `<div id="${this.id}-flow" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="打开 Flow 浏览界面" >${this.icon}</div>`,
      click: async () => {
        this.openFlowboard("Let it flow ～");
      },
    });

    // menu.addItem({
    //   label: "打开 文档流",
    //   iconHTML: `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="文档流" >${this.icon}</div>`,
    //   click: async () => {
    //     this.openFlowEntry("", "文档流");
    //   },
    // });

    // menu.addItem({
    //   label: "打开 图片流",
    //   iconHTML: `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="图片流" >${this.icon}</div>`,
    //   click: async () => {
    //     this.openFlowImage("", "图片流");
    //   },
    // });
  }

  addDock() {
    const addToDock = settings.getBySpace("diaryTools", "addToDock");

    //console.log("addToDock", addToDock);
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
          //console.log(DOCK_TYPE + " resize");
        },
        update() {
          //console.log(DOCK_TYPE + " update");
        },
        init: (dock) => {
          new DashboardComponent({
            target: dock.element,
          });
        },
        destroy() {
          //console.log("destroy dock:", DOCK_TYPE);
        },
      });
    }
  }

  onload(): void {}
  async onLayoutReady() {
    this.addDock();
  }

  registerFlowBoard(detail) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "flow-board") {
      const title = urlObj.searchParams.get("title") || "SQL 查询面板";
      this.openFlowboard(title);
    }
  }

  openFlowboard(title) {
    if (isMobile) {
      let dialog = new Dialog({
        title: title,
        content: `<div id="hqweay-diary-flow-board" class="hqweay-diary-flow-entry" style="height: 700px;"></div>`,
        width: "400px",
        destroyCallback: (options) => {
          pannel.$destroy();
        },
      });

      let pannel = new FlowBoard({
        target: dialog.element.querySelector(`#hqweay-diary-flow-board`),
        props: {},
      });
    } else {
      let tabDiv = document.createElement("div");
      tabDiv.setAttribute("style", "height: 100%;");
      tabDiv.setAttribute("id", `hqweay-diary-flow-board`);
      tabDiv.setAttribute("class", `hqweay-diary-flow-entry`);
      new FlowBoard({
        target: tabDiv,
        props: {},
      });
      plugin.addTab({
        type: `flow-board-${title}`,
        init() {
          this.element.appendChild(tabDiv);
        },
      });
      openTab({
        app: plugin.app,
        custom: {
          icon: "",
          title: title,
          data: {},
          id: plugin.name + `flow-board-${title}`,
        },
      });
    }
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
    this.registerFlowEntry(detail);
    this.registerFlowImage(detail);
    this.registerFlowBoard(detail);
    this.registerDashBoard(detail);
  }

  registerDashBoard(detail) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "open") {
      const indexParam = urlObj.searchParams.get("index");
      const type = urlObj.searchParams.get("type");

      const index =
        //@ts-ignore
        indexParam && !isNaN(indexParam) ? Number(indexParam) : indexParam || 0;
      this.openDashBoard(index, type);
    }
  }

  openDashBoard(index, type) {
    if (isMobile) {
      let dialog = new Dialog({
        title: typeof index === "string" ? index : "仪表盘",
        content: `<div id="hqweay-diary-dashboard" class="hqweay-diary-flow-entry" style="height: 700px;"></div>`,
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
      tabDiv.setAttribute("class", "hqweay-diary-flow-entry");
      new DashboardComponent({
        target: tabDiv,
        props: { selectedConfig: index, type },
      });
      plugin.addTab({
        type: `lets-dashboard-${index}`,
        init() {
          this.element.appendChild(tabDiv);
        },
      });
      openTab({
        app: plugin.app,
        custom: {
          icon: "",
          title: typeof index === "string" && index !== "" ? index : "仪表盘",
          data: {},
          id: plugin.name + `lets-dashboard-${index}`,
        },
      });
    }
  }

  registerFlowEntry(detail) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "flow-entry") {
      let sqlParam = urlObj.searchParams.get("sql");
      const title = urlObj.searchParams.get("title");

      this.openFlowEntry(sqlParam, title);
    }
  }
  openFlowEntry(sqlParam, title) {
    sqlParam = sqlParam ? sqlParam : 'select * from blocks where type = "d"';
    if (isMobile) {
      let dialog = new Dialog({
        title: title ? title : "Flow",
        content: `<div id="hqweay-diary-flow-entry" class="hqweay-diary-flow-entry" style="height: 700px;"></div>`,
        width: "400px",
        destroyCallback: (options) => {
          pannel.$destroy();
        },
      });

      let pannel = new EntryList({
        target: dialog.element.querySelector(`#hqweay-diary-flow-entry`),
        props: { idSQL: sqlParam, pageSize: 10, fromFlow: true },
      });
    } else {
      let tabDiv = document.createElement("div");
      //设置样式边距
      tabDiv.setAttribute("style", "padding: 15px;");
      tabDiv.setAttribute("id", `hqweay-diary-flow-entry-${title}`);
      tabDiv.setAttribute("class", `hqweay-diary-flow-entry`);
      new EntryList({
        target: tabDiv,
        props: { idSQL: sqlParam, pageSize: 10, fromFlow: true },
      });
      plugin.addTab({
        type: `flow-entry-${title}`,
        init() {
          this.element.appendChild(tabDiv);
        },
      });
      openTab({
        app: plugin.app,
        custom: {
          icon: "",
          title: title ? title : "Flow",
          data: {},
          id: plugin.name + `flow-entry-${title}`,
        },
      });
    }
  }
  registerFlowImage(detail) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "flow-image") {
      let sqlParam = urlObj.searchParams.get("sql");
      const title = urlObj.searchParams.get("title");

      this.openFlowImage(sqlParam, title);
    }
  }

  openFlowImage(sqlParam, title) {
    sqlParam = sqlParam
      ? sqlParam
      : "select blocks.*, assets.PATH as asset_path from assets left join blocks on assets.block_id = blocks.id";
    if (isMobile) {
      let dialog = new Dialog({
        title: title ? title : "Flow",
        content: `<div id="hqweay-diary-flow-image" class="hqweay-diary-flow-entry" style="height: 700px;"></div>`,
        width: "400px",
        destroyCallback: (options) => {
          pannel.$destroy();
        },
      });

      let pannel = new ImageGallery({
        target: dialog.element.querySelector(`#hqweay-diary-flow-image`),
        props: { imgSQL: sqlParam, pageSize: 10, fromFlow: true },
      });
    } else {
      let tabDiv = document.createElement("div");
      //设置样式边距
      tabDiv.setAttribute("style", "padding: 15px;");
      tabDiv.setAttribute("id", "hqweay-diary-flow-image-${title}");
      tabDiv.setAttribute("class", `hqweay-diary-flow-entry`);
      new ImageGallery({
        target: tabDiv,
        props: { imgSQL: sqlParam, pageSize: 10, fromFlow: true },
      });
      plugin.addTab({
        type: `flow-image-${title}`,
        init() {
          this.element.appendChild(tabDiv);
        },
      });
      openTab({
        app: plugin.app,
        custom: {
          icon: "",
          title: title ? title : "Flow",
          data: {},
          id: plugin.name + `flow-image-${title}`,
        },
      });
    }
  }
}
