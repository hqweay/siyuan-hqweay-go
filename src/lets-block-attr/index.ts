import { setBlockAttrs } from "@/api";
import InsertCSS from "@/myscripts/insertCSS";
import { addProtyleSlash } from "@/myscripts/syUtils";
import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";

import ShowCustomPropertiesUnderTitle from "./ShowCustomPropertiesUnderTitle";
import pluginMetadata from "./plugin";

function parseArrayString(str) {
  if (str.trim() == "") return [];
  try {
    return new Function(`return ${str}`)();
  } catch (error) {
    console.error("解析失败:", error);
    return []; 
  }
}

let menus = [];

export default class BlockAttr extends InsertCSS implements SubPlugin {
  private showCustomPropertiesUnderTitle = new ShowCustomPropertiesUnderTitle();
  public blockIconEvent({ detail }: any) {
    detail.menu.addItem({
      iconHTML: "",
      label: "快捷添加属性",
      submenu: menus
        .filter((menu) => menu.enabled)
        .map((menu) => ({
          iconHTML: "",
          label: menu.name,
          click: () => {
            ViewMonitor(detail.blockElements[0], menu);
          },
        })),
    });
  }

  public onLayoutReady() {
    menus = parseArrayString(settings.getBySpace(pluginMetadata.name, "attrs"));
    //初始化还是执行一下，监听就只用处理变动过的数据了
    initList2Tab();
    if (menus.find((menu) => menu.value === "list2tab" && menu.enabled)) {
      setupSimpleObserver();
    }
  }

  onload(): void {
    this.loadSlashOfAttrs();

    settings.getBySpace(pluginMetadata.name, "customProperties") &&
      this.showCustomPropertiesUnderTitle.onload();
  }

  onunload(): void {
    this.showCustomPropertiesUnderTitle.onunload();
  }

  public loadSlashOfAttrs = () => {
    console.log("加载块属性快捷设置 Slash");
    menus = parseArrayString(settings.getBySpace(pluginMetadata.name, "attrs"));
    menus
      .filter((menu) => menu.enabled && menu.name.startsWith("@"))
      .forEach((menu) => {
        console.log(menu);
        addProtyleSlash({
          filter: [`${menu.name}`],
          html: `${menu.name}`,
          id: menu.name,
          callback: async (event, node) => {
            ViewMonitor(node, menu);
            event.insert(window.Lute.Caret, false, false);
          },
        });
      });
  };
}

function ViewMonitor(blockEl, menu) {
  // const blockEl = event.blockElements[0];
  const id = blockEl.dataset.nodeId;
  const prevValue = blockEl.getAttribute("custom-f");

  if (prevValue === "list2tab" && menu.value !== "list2tab") {
    setBlockAttrs(id, { [`custom-${menu.key}`]: menu.value });
    location.reload();
  } else {
    if (menu.keyvalues) {
      const attrsToSet = {};
      for (const [key, value] of Object.entries(menu.keyvalues)) {
        attrsToSet[`custom-${key}`] = value;
      }
      setBlockAttrs(id, attrsToSet);
      return;
    } else {
      setBlockAttrs(id, { [`custom-${menu.key}`]: menu.value });
    }
  }
}

function setupSimpleObserver() {
  let initTimeout: number;
  let lastInitTime = 0;
  const MIN_INTERVAL = 300; // 最小间隔300ms

  const observer = new MutationObserver((mutations) => {
    const now = Date.now();
    if (now - lastInitTime < MIN_INTERVAL) {
      return; // 避免频繁调用
    }

    const changedContainers: Element[] = [];

    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        const target = mutation.target as Element;
        if (target.matches?.('[data-type="NodeList"][custom-f~="list2tab"]')) {
          changedContainers.push(target);
        }
      }
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        if (node.nodeType === 1) {
          const element = node as Element;
          const found = element.matches?.(
            '[data-type="NodeList"][custom-f~="list2tab"]'
          )
            ? [element]
            : Array.from(
                element.querySelectorAll(
                  '[data-type="NodeList"][custom-f~="list2tab"]'
                )
              );
          changedContainers.push(...found);
        }
      }
    }

    if (changedContainers.length) {
      clearTimeout(initTimeout);
      initTimeout = window.setTimeout(() => {
        lastInitTime = Date.now();
        initList2Tab(changedContainers);
      }, 300);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["custom-f"],
  });
}

// 修改 initList2Tab 支持单个 container
function initList2Tab(containers?: Element | Element[]) {
  let containerList: Element[] = [];
  if (!containers) {
    containerList = Array.from(
      document.querySelectorAll('[data-type="NodeList"][custom-f~=list2tab]')
    );
  } else if (Array.isArray(containers)) {
    containerList = containers;
  } else {
    containerList = [containers];
  }

  if (!containerList) return;
  containerList.forEach((container) => {
    if (container.querySelector(".tab-headers")) return;

    //@ts-ignore
    const listId = container.dataset.nodeId;

    const activeTabIndex =
      parseInt(container.getAttribute("custom-activetab") || "1", 10) - 1;

    const tabHeaders = document.createElement("div");
    tabHeaders.className = "tab-headers";

    const tabContents = document.createElement("div");
    tabContents.className = "tab-contents";

    const listItems = container.querySelectorAll(
      ':scope > [data-type="NodeListItem"]'
    );

    listItems.forEach((item, index) => {
      const firstContent = item.querySelector(
        ":scope > .protyle-action + [data-node-id]"
      );
      if (!firstContent) return;

      const tabHeader = document.createElement("div");
      tabHeader.className = "tab-header";
      if (index === activeTabIndex) tabHeader.classList.add("active");

      const titleClone = firstContent.cloneNode(true);
      tabHeader.appendChild(titleClone);

      const tabContent = document.createElement("div");
      tabContent.className = "tab-content";
      if (index === activeTabIndex) tabContent.classList.add("active");

      // 移动除了第一个内容块之外的所有子节点到内容区
      Array.from(item.children).forEach((child) => {
        if (
          child !== firstContent &&
          !child.classList.contains("protyle-action")
        ) {
          tabContent.appendChild(child);
        }
      });

      tabHeader.addEventListener("click", () => {
        const currentIndex = Array.from(tabHeaders.children).indexOf(tabHeader);

        tabHeaders
          .querySelectorAll(".tab-header")
          .forEach((h) => h.classList.remove("active"));
        tabContents
          .querySelectorAll(".tab-content")
          .forEach((c) => c.classList.remove("active"));

        tabHeader.classList.add("active");
        tabContents.children[currentIndex].classList.add("active");

        setBlockAttrs(listId, {
          "custom-activetab": (currentIndex + 1).toString(),
        });
      });

      tabHeaders.appendChild(tabHeader);
      tabContents.appendChild(tabContent);
    });

    // 创建恢复列表按钮
    const restoreButton = document.createElement("div");
    restoreButton.className = "tab-restore-button";
    restoreButton.innerHTML = `<svg class="b3-menu__icon" style="height: 1.2em; width: 1.2em;"><use xlink:href="#iconList"></use></svg>`;
    restoreButton.onclick = () => {
      setBlockAttrs(listId, { "custom-f": "", "custom-activetab": null });
      // 只移除 tab 相关的 DOM，不清空 container
      // container.innerHTML = ""; // 删除这一行
      // 重新渲染原始 list 结构
      // 可以直接刷新页面，或者触发一次 observer，让 initList2Tab 不再处理这个 container
      // 推荐：直接刷新页面
      location.reload();
    };

    const tabHeaderContainer = document.createElement("div");
    tabHeaderContainer.className = "tab-header-container";
    tabHeaderContainer.appendChild(tabHeaders);
    tabHeaderContainer.appendChild(restoreButton);

    container.innerHTML = "";
    container.appendChild(tabHeaderContainer);
    container.appendChild(tabContents);
  });
}
