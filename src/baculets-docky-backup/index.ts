// https://github.com/frostime/sy-f-misc/blob/e9117135ae6d351a474dec4830842ee0a4b8d54c/src/func/docky.ts
import { settings } from "@/settings";
import { removeStyleDom, updateStyleDom } from "@frostime/siyuan-plugin-kits";
import { Protyle } from "siyuan";

const initDockPanel = (docky: any, ele: HTMLElement, plugin: any) => {
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
};

const addToDock = (plugin: any, dock: any) => {
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
    init() {
      initDockPanel(dock, this.element, plugin);
    },
  });
};
/**
 * 根据配置规则解析 Protyle
 * @param line e.g. id: xxx, name: xxx, position: xxx, icon?: xxx, hotkey?: xxx
 */
const parseProtyle = (line: string): any => {
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
};

export const loadDocky = (plugin: any) => {
  const rules = settings.getBySpace("docky", "rules");
  if (!rules || rules.trim() === "") {
    return;
  }
  const lines = rules.split("\n");
  lines.forEach((line: string) => {
    line = line.trim();
    let block = parseProtyle(line);
    if (block) {
      addToDock(plugin, block);
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
};

export const unloadDocky = (plugin: any) => {
  removeStyleDom("f-misc-docky-style");
};
