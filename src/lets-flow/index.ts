import EntryList from "@/lets-dashboard/EntryList.svelte";
import { isMobile, plugin } from "@/utils";
import { Dialog, openTab } from "siyuan";
import { SubPlugin } from "./../types/plugin.d";

class FlowPlugin implements SubPlugin {
  async onload() {}
  onLayoutReady(): void {}
  async onunload() {}

  openSiyuanUrlPluginEvent({ detail }) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "flow") {
      const sqlParam = urlObj.searchParams.get("sql");
      const title = urlObj.searchParams.get("title");

      if (isMobile) {
        let dialog = new Dialog({
          title: title ? title : "Flow",
          content: `<div id="hqweay-diary-dashboard" style="height: 700px;"></div>`,
          width: "400px",
          destroyCallback: (options) => {
            pannel.$destroy();
          },
        });

        let pannel = new EntryList({
          target: dialog.element.querySelector("#hqweay-diary-fow"),
          props: { idSQL: sqlParam, pageSize: 10, fromFlow: true },
        });
      } else {
        let tabDiv = document.createElement("div");
        //设置样式边距
        tabDiv.setAttribute("style", "padding: 15px;");
        tabDiv.setAttribute("id", "hqweay-diary-flow");
        new EntryList({
          target: tabDiv,
          props: { idSQL: sqlParam, pageSize: 10, fromFlow: true },
        });
        plugin.addTab({
          type: "flow",
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
            id: plugin.name + "flow",
          },
        });
      }
    }
  }
}
export default FlowPlugin;
