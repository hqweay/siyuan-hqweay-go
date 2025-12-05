import { settings } from "@/settings";
import { removeStyleDom, updateStyleDom } from "@frostime/siyuan-plugin-kits";
import { Protyle } from "siyuan";
import { SubPlugin } from "@/types/plugin";
import { plugin } from "@/utils";

class DockyPlugin implements SubPlugin {
  private _isEnabled = false;

  async onload() {
    this._isEnabled = true;
    this.loadDocky();
  }

  async onunload() {
    this._isEnabled = false;
    this.unloadDocky();
  }

  private loadDocky() {
    const rules = settings.getBySpace("docky", "rules");
    if (!rules || rules.trim() === "") {
      return;
    }
    const lines = rules.split("\n");
    lines.forEach((line: string) => {
      line = line.trim();
      let block = this.parseProtyle(line);
      if (block) {
        this.addToDock(block);
      } else {
        console.warn(`Not a valid protyle rule: ${line}`);
      }
    });

    // 修复侧边栏打开文档时，面包屑栏隐藏的问题
    updateStyleDom(
      "fix-breadcrumb-style",
      `
        .docky-panel-body.protyle .protyle-breadcrumb__bar--hide {
            opacity: unset !important;
        }
        .docky-panel-body.protyle .fn__loading.wysiwygLoading{
          display: none !important;
        }
    `.trim()
    );

    const zoomScale = settings.getBySpace("docky", "zoomScale");
    if (isNaN(zoomScale) || zoomScale <= 0 || zoomScale >= 100) {
      return;
    }
    document.documentElement.style.setProperty(
      "--plugin-docky-zoom",
      `${zoomScale ? zoomScale / 100 : 1}`
    );

    updateStyleDom(
      "f-misc-docky-style",
      `
        .docky-panel-body.protyle {
            zoom: var(--plugin-docky-zoom);
            .protyle-wysiwyg {
                padding-left: 16px !important;
                padding-right: 16px !important;
            }
        }
    `.trim()
    );
  }

  private unloadDocky() {
    removeStyleDom("f-misc-docky-style");
  }

  private initDockPanel(docky: any, ele: HTMLElement) {
    const id: BlockId = docky.id;
    const protyleContainer = document.createElement("div");
    protyleContainer.className = "docky-panel-body";
    protyleContainer.dataset.nodeId = id;
    protyleContainer.style.height = "100%";
    protyleContainer.style.width = "100%";
    new Protyle(plugin.app, protyleContainer, {
      blockId: id,
      action: ["cb-get-all"],
      render: {
        background: false,
        title: false,
        titleShowTop: false,
        hideTitleOnZoom: false,
        // 折叠按钮
        gutter: true,
        scroll: true,
        breadcrumb: true,
        breadcrumbDocName: true,
      },
    });

    ele.appendChild(protyleContainer);
  }

  private addToDock(dock: any) {
    plugin.addDock({
      type: "_docky_" + dock.id,
      config: {
        position: dock.position || "LeftBottom",
        size: {
          width: 200,
          height: 200,
        },
        icon: dock.icon || "iconEmoji",
        title: dock.name || "Docky:" + dock.id,
        hotkey: dock.hotkey || undefined,
      },
      data: {
        blockId: dock.id,
        plugin: this,
      },
      init: () => {
        // initDockPanel will be called with the correct element
        this.initDockPanel(dock, (this as any).element);
      },
    });
  }

  /**
   * 根据配置规则解析 Protyle
   * @param line e.g. id: xxx, name: xxx, position: xxx, icon?: xxx, hotkey?: xxx
   */
  private parseProtyle(line: string): any {
    const tokens = line.split(",");
    const block: any = {
      id: null,
      name: null,
      position: "LeftBottom",
      icon: "iconEmoji",
      hotkey: undefined,
    };
    tokens.forEach((token) => {
      const [key, value] = token.split(":").map((s) => s.trim());
      if (key === "id") {
        if (!value.match(/^\d{14,}-\w{7}$/)) return;
        block.id = value;
      } else if (key === "name") {
        block.name = value;
      } else if (key === "position") {
        if (
          ["LeftTop", "LeftBottom", "RightTop", "RightBottom"].includes(value)
        ) {
          //@ts-ignore
          block.position = value;
        }
      } else if (key === "icon") {
        block.icon = value;
      } else if (key === "hotkey") {
        block.hotkey = value;
      }
    });
    //check
    // if (!block.id || !block.name) {
    if (!block.id) {
      return null;
    }

    return block;
  }
}

export default DockyPlugin;