import { settings } from "@/settings";
import { isMobile, plugin } from "@/utils";
import { Dialog, Menu, openMobileFileById, openTab, showMessage } from "siyuan";
import { SubPlugin } from "@/types/plugin";
import { createDailynote } from "@frostime/siyuan-plugin-kits";
// import MobileNavigation from "./components/MobileNavigation.svelte";
import { navigation } from "./navigation";
import { openByMobile } from "@/myscripts/utils";
import {
  getCurrentDocId,
  isBlockID,
  openBlockByID,
  openByUrl,
} from "@/myscripts/syUtils";
import { createSiyuanAVHelper } from "@/myscripts/dbUtil";
import { goToRandomBlock } from "@/myscripts/randomDocCache";
import { mobileUtils } from "./utils";
import pluginMetadata from "./plugin";
export default class NavHelper implements SubPlugin {
  private navigationElement: HTMLElement | null = null;
  private desktopNavigationElement: HTMLElement | null = null;
  private isNavigationVisible = false;
  private submenuElement: HTMLElement | null = null;

  onload(): void {
    // 初始化移动端工具
    mobileUtils.init();
  }

  async onLayoutReady(): Promise<void> {
    console.log("导航助手 - 初始化导航功能");

    // 设置移动端全局变量
    this.setupMobileGlobals();

    // 创建底部导航栏（自适应设备类型）
    if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
      this.createAdaptiveNavigation();
    }

    // 注册事件监听器
    this.registerEventListeners();
  }

  onunload(): void {
    // 清理移动端导航栏
    if (this.navigationElement) {
      this.navigationElement.remove();
      this.navigationElement = null;
    }

    // 清理桌面端导航栏
    if (this.desktopNavigationElement) {
      this.desktopNavigationElement.remove();
      this.desktopNavigationElement = null;
    }

    // 清理子菜单和外部点击监听器
    this.hideSubmenu();

    // 清理事件监听器
    this.unregisterEventListeners();

    // 清理移动端工具
    mobileUtils.destroy();
  }

  // 移动端键盘显示事件
  mobilekeyboardshowEvent(eventData: any): void {
    console.log("移动端键盘显示", eventData);
    // 隐藏底部导航栏以避免遮挡
    this.hideNavigation();
  }

  // 移动端键盘隐藏事件
  mobilekeyboardhideEvent(eventData: any): void {
    console.log("移动端键盘隐藏", eventData);
    // 恢复底部导航栏
    if (
      settings.getBySpace(pluginMetadata.name, "enableBottomNav") === "mobile"
    ) {
      this.showNavigation();
    }
  }

  // 设置移动端全局变量
  private setupMobileGlobals(): void {
    // 设置全局移动端工具对象
    (window as any).mobileHelper = {
      plugin: plugin,
      isMobile: isMobile,
      navigation: navigation,
      utils: mobileUtils,
      openMobileFileById: openMobileFileById,
      showMessage: showMessage,
    };
  }

  private showInMobile(): boolean {
    return (
      settings.getBySpace(pluginMetadata.name, "enableBottomNav") ===
        "mobile" ||
      settings.getBySpace(pluginMetadata.name, "enableBottomNav") === "both"
    );
  }
  private showInPC(): boolean {
    return (
      settings.getBySpace(pluginMetadata.name, "enableBottomNav") === "pc" ||
      settings.getBySpace(pluginMetadata.name, "enableBottomNav") === "both"
    );
  }
  // 创建自适应导航（根据设备类型选择移动端或桌面端）
  private createAdaptiveNavigation(): void {
    if (isMobile && this.showInMobile()) {
      this.createMobileNavigation();
    } else if (this.showInPC()) {
      this.createDesktopNavigation();
    }
  }

  // 创建移动端底部导航栏
  private createMobileNavigation(): void {
    if (this.desktopNavigationElement) {
      this.desktopNavigationElement.remove();
      this.desktopNavigationElement = null;
    }

    if (this.navigationElement) {
      this.navigationElement.remove();
    }

    const config = {
      height:
        settings.getBySpace(pluginMetadata.name, "navBarHeight") || "60px",
      backgroundColor:
        settings.getBySpace(pluginMetadata.name, "backgroundColor") ||
        "#ffffff",
      buttonColor:
        settings.getBySpace(pluginMetadata.name, "buttonColor") || "#333333",
      activeButtonColor:
        settings.getBySpace(pluginMetadata.name, "activeButtonColor") ||
        "#007aff",
    };

    // 创建导航栏容器
    this.navigationElement = document.createElement("div");
    this.navigationElement.id = "mobile-helper-navigation";
    this.navigationElement.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${config.height};
      background-color: ${config.backgroundColor};
      border-top: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-around;
      z-index: 1000;
      padding: 0 10px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    `;

    // 创建导航按钮
    this.createNavButtons();

    // 添加到页面
    document.body.appendChild(this.navigationElement);
    this.isNavigationVisible = true;

    // 调整页面底部padding以避免内容被遮挡
    this.adjustPagePadding();
  }

  // 创建桌面端悬浮导航栏
  private createDesktopNavigation(): void {
    if (this.navigationElement) {
      this.navigationElement.remove();
      this.navigationElement = null;
    }

    // 清理之前的桌面端导航
    if (this.desktopNavigationElement) {
      this.desktopNavigationElement.remove();
    }

    // 创建桌面端导航容器
    this.desktopNavigationElement = document.createElement("div");
    this.desktopNavigationElement.id = "desktop-helper-navigation";
    this.desktopNavigationElement.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: calc(50% - 200px);
      width: 280px;
      height: 50px;
      background: rgba(248, 249, 250, 0.95);
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(233, 236, 239, 0.8);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 4px 3px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    // 添加桌面端导航按钮
    this.createDesktopNavButtons();

    // 添加到页面
    document.body.appendChild(this.desktopNavigationElement);
    this.isNavigationVisible = true;

    // 添加悬浮效果
    this.addDesktopHoverEffects();

    // 响应式调整
    this.adjustDesktopNavigationForScreenSize();
  }

  // 根据屏幕尺寸调整桌面端导航
  private adjustDesktopNavigationForScreenSize(): void {
    const screenWidth = window.innerWidth;

    if (screenWidth < 768) {
      // 小屏幕隐藏桌面端导航
      this.hideNavigation();
    } else if (screenWidth < 1024) {
      // 中等屏幕调整位置和大小
      if (this.desktopNavigationElement) {
        this.desktopNavigationElement.style.width = "240px";
        this.desktopNavigationElement.style.right = "calc(50% - 180px)";
      }
    } else {
      // 大屏幕保持默认设置
      if (this.desktopNavigationElement) {
        this.desktopNavigationElement.style.width = "280px";
        this.desktopNavigationElement.style.right = "calc(50% - 200px)";
      }
    }
  }

  // 创建导航按钮
  private createNavButtons(): void {
    const buttons = [
      {
        key: "showBackButton",
        icon: "←",
        label: "返回",
        action: () => navigation.goBack(),
      },
      {
        key: "showDailyNoteButton",
        icon: "📅",
        label: "今日",
        action: () => this.createDailyNote(),
      },
      {
        key: "showNavigationMenuButton",
        icon: "🧭",
        label: "导航",
        action: () => this.showNavigationSubmenu(),
        hasSubmenu: true,
      },
      {
        key: "showForwardButton",
        icon: "→",
        label: "前进",
        action: () => navigation.goForward(),
      },
      {
        key: "showDashBoard",
        icon: "🏠",
        label: "首页",
        action: () => navigation.goToHome(),
      },
      // {
      //   key: "showRandomButton",
      //   icon: "🎲",
      //   label: "随机",
      //   action: async () =>
      //     goToRandomBlock("SELECT * FROM blocks WHERE type = 'd'"),
      // },
      {
        key: "showCustomLinksButton",
        icon: "🔗",
        label: "链接",
        action: () => this.showCustomLinksSubmenu(),
        hasSubmenu: true,
      },
      // {
      //   key: "showContextButton",
      //   icon: "☰",
      //   label: "导航",
      //   action: () => this.showContextNavigationSubmenu(),
      //   hasSubmenu: true,
      // },
    ];

    buttons.forEach((btn) => {
      if (settings.getBySpace(pluginMetadata.name, btn.key)) {
        // console.log(btn.key);
        if (isMobile) {
          this.createNavButton(btn.icon, btn.label, btn.action, btn.hasSubmenu);
        } else {
          this.createDesktopNavButton(
            btn.icon,
            btn.label,
            btn.action,
            btn.hasSubmenu
          );
        }
      }
    });
  }

  // 创建桌面端导航按钮 直接复用移动端
  private createDesktopNavButtons(): void {
    this.createNavButtons();
  }

  // 创建桌面端单个导航按钮
  private createDesktopNavButton(
    icon: string,
    label: string,
    action: () => void,
    hasSubmenu: boolean = false
  ): void {
    const button = document.createElement("button");
    button.style.cssText = `
      background: transparent;
      border: 1px solid rgba(89, 130, 246, 0.2);
      color: #495057;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      transition: all 0.3s ease;
      font-family: inherit;
      min-width: 45px;
      min-height: 38px;
    `;

    button.innerHTML = `
      <span style="font-size: 14px;">${icon}</span>
      <span style="font-size: 10px; font-weight: 500; color: #6c757d;">${label}</span>
    `;

    if (hasSubmenu) {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        action();
      });
    } else {
      button.addEventListener("click", action);
    }

    button.addEventListener("mouseenter", () => {
      button.style.background = "rgba(59, 130, 246, 0.12)";
      button.style.borderColor = "rgba(59, 130, 246, 0.3)";
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.background = "transparent";
      button.style.borderColor = "rgba(89, 130, 246, 0.2)";
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "none";
    });

    this.desktopNavigationElement?.appendChild(button);
  }

  // 添加桌面端悬浮效果
  private addDesktopHoverEffects(): void {
    if (!this.desktopNavigationElement) return;

    // 添加主容器悬浮效果
    this.desktopNavigationElement.addEventListener("mouseenter", () => {
      this.desktopNavigationElement!.style.transform = "translateY(-2px)";
      this.desktopNavigationElement!.style.boxShadow =
        "0 6px 20px rgba(0, 0, 0, 0.15)";
    });

    this.desktopNavigationElement.addEventListener("mouseleave", () => {
      this.desktopNavigationElement!.style.transform = "translateY(0)";
      this.desktopNavigationElement!.style.boxShadow =
        "0 4px 16px rgba(0, 0, 0, 0.1)";
    });
  }

  // 创建单个导航按钮（移动端）
  private createNavButton(
    icon: string,
    label: string,
    action: () => void,
    hasSubmenu: boolean = false
  ): void {
    const button = document.createElement("button");
    button.style.cssText = `
      background: none;
      border: none;
      color: ${
        settings.getBySpace(pluginMetadata.name, "buttonColor") || "#333333"
      };
      font-size: 18px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 50px;
      transition: all 0.2s ease;
      position: relative;
    `;

    button.innerHTML = `
      <span style="font-size: 20px; margin-bottom: 2px;">${icon}</span>
      <span style="font-size: 10px;">${label}</span>
    
    `;

    if (hasSubmenu) {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        action();
      });
    } else {
      button.addEventListener("click", action);
    }

    button.addEventListener("touchstart", () => {
      button.style.color =
        settings.getBySpace(pluginMetadata.name, "activeButtonColor") ||
        "#007aff";
      button.style.backgroundColor = "rgba(0, 122, 255, 0.1)";
    });
    button.addEventListener("touchend", () => {
      setTimeout(() => {
        button.style.color =
          settings.getBySpace(pluginMetadata.name, "buttonColor") || "#333333";
        button.style.backgroundColor = "transparent";
      }, 150);
    });

    this.navigationElement?.appendChild(button);
  }

  // 创建今日笔记
  private async createDailyNote(): Promise<void> {
    try {
      const noteBookID = settings.getBySpace(pluginMetadata.name, "noteBookID");
      const today = new Date();

      // 使用frostime/siyuan-plugin-kits库创建今日笔记
      const dailyNoteId = await createDailynote(
        noteBookID || "20210926105749-l6jquz7",
        today
      );

      if (dailyNoteId) {
        openBlockByID(dailyNoteId);
        showMessage("今日笔记已创建并打开");
        mobileUtils.vibrate(50);
      } else {
        showMessage("创建今日笔记失败");
        mobileUtils.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.error("创建今日笔记失败:", error);
      showMessage("创建今日笔记失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  // 隐藏导航栏
  private hideNavigation(): void {
    // 隐藏移动端导航
    if (this.navigationElement && this.isNavigationVisible) {
      this.navigationElement.style.transform = "translateY(100%)";
      this.navigationElement.style.transition = "transform 0.3s ease";
    }

    // 隐藏桌面端导航
    if (this.desktopNavigationElement && this.isNavigationVisible) {
      this.desktopNavigationElement.style.opacity = "0";
      this.desktopNavigationElement.style.transform =
        "translateY(20px) scale(0.9)";
      this.desktopNavigationElement.style.transition = "all 0.3s ease";
    }

    this.isNavigationVisible = false;
  }

  // 显示导航栏
  private showNavigation(): void {
    // 显示移动端导航
    if (this.navigationElement && !this.isNavigationVisible) {
      this.navigationElement.style.transform = "translateY(0)";
      this.isNavigationVisible = true;
    }

    // 显示桌面端导航
    if (this.desktopNavigationElement && !this.isNavigationVisible) {
      this.desktopNavigationElement.style.opacity = "1";
      this.desktopNavigationElement.style.transform = "translateY(0) scale(1)";
      this.isNavigationVisible = true;
    }
  }

  // 调整页面底部padding
  private adjustPagePadding(): void {
    const navHeight = parseInt(
      settings.getBySpace(pluginMetadata.name, "navBarHeight") || "60px"
    );
    const editor = document.querySelector("#editor");
    if (editor) {
      (editor as HTMLElement).style.paddingBottom = `${navHeight + 20}px`;
    }
  }

  // 注册事件监听器
  private registerEventListeners(): void {
    // 监听页面可见性变化
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.hideNavigation();
      } else {
        if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
          this.showNavigation();
        }
      }
    });

    // 监听窗口大小变化（响应式处理）
    let resizeTimeout: NodeJS.Timeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleDeviceChange();
      }, 300);
    });

    // 监听设置变化
    plugin.eventBus.on("ws-main", (event) => {
      if (event.detail.data?.data?.appData?.plugins) {
        this.handleSettingsChange();
      }
    });
  }

  // 处理设备类型变化
  private handleDeviceChange(): void {
    // 重新创建导航以适应新的设备类型
    if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
      this.createAdaptiveNavigation();
    }
  }

  // 处理设置变化
  private handleSettingsChange(): void {
    // 重新创建导航以应用新设置
    if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
      this.createAdaptiveNavigation();
    } else {
      this.hideNavigation();
    }
  }

  // 注销事件监听器
  private unregisterEventListeners(): void {
    document.removeEventListener("visibilitychange", () => {});
    window.removeEventListener("resize", () => {});
  }

  // 显示自定义链接子菜单
  private showCustomLinksSubmenu(): void {
    this.hideSubmenu(); // 先隐藏之前的子菜单

    const linksConfig =
      settings.getBySpace(pluginMetadata.name, "customLinks") || "";
    const links = linksConfig.split("\n").filter((line) => line.trim());

    if (links.length === 0) {
      showMessage("暂无自定义链接配置");
      return;
    }

    // 创建子菜单元素
    this.submenuElement = document.createElement("div");
    this.submenuElement.id = "mobile-helper-submenu";
    this.submenuElement.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 60%;
      transform: translateX(-50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      min-width: 200px;
    `;

    // 创建子菜单内容
    const content = document.createElement("div");
    content.style.cssText = "padding: 10px;";

    links.forEach((link) => {
      const [title, url] = link.split("====");
      if (title && url) {
        const item = document.createElement("div");
        item.style.cssText = `
          padding: 12px 15px;
          border-bottom: 1px solid #f0f0f0;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        `;

        item.innerHTML = `
          <span style="margin-right: 10px;">🔗</span>
          <span style="flex: 1; color: #333;">${title.trim()}</span>
          <span style="font-size: 12px; color: #666;">→</span>
        `;

        item.addEventListener("click", async () => {
          if (title.startsWith("💾") || title.includes("数据库")) {
            try {
              const avHelper = await createSiyuanAVHelper(url);
              await avHelper.addBlocks([getCurrentDocId()]);
            } catch (error) {
              console.error("初始化或操作失败:", error);
            }
          } else {
            openByUrl(url);
          }

          // 不隐藏，方便快速浏览
          // this.hideSubmenu();
        });

        item.addEventListener("mouseenter", () => {
          item.style.backgroundColor = "#f8f9fa";
        });
        item.addEventListener("mouseleave", () => {
          item.style.backgroundColor = "transparent";
        });

        content.appendChild(item);
      }
    });

    this.submenuElement.appendChild(content);
    document.body.appendChild(this.submenuElement);

    // 点击其他地方关闭子菜单
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);
  }

  // 显示导航子菜单
  private showNavigationSubmenu(): void {
    this.hideSubmenu(); // 先隐藏之前的子菜单

    // 创建子菜单元素
    this.submenuElement = document.createElement("div");
    this.submenuElement.id = "mobile-helper-submenu";
    this.submenuElement.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      min-width: 200px;
    `;

    // 创建子菜单内容
    const content = document.createElement("div");
    content.style.cssText = "padding: 10px;";

    // 添加导航操作项；点击后不隐藏，方便快速浏览
    const navItems = [
      {
        icon: "⬆️",
        label: "跳转到父文档",
        action: async () => {
          await navigation.goToParent();
          // this.hideSubmenu();
        },
      },

      {
        icon: "⤴️",
        label: "跳转到上一个文档",
        action: async () => {
          await navigation.goToSibling(-1);
          // this.hideSubmenu();
        },
      },
      {
        key: "showRandomButton",
        icon: "🎲",
        label: "随机",
        action: async () =>
          goToRandomBlock("SELECT * FROM blocks WHERE type = 'd'"),
      },
      {
        icon: "⤵️",
        label: "跳转到下一个文档",
        action: async () => {
          await navigation.goToSibling(1);
          // this.hideSubmenu();
        },
      },
      {
        icon: "⬇️",
        label: "跳转到子文档",
        action: async () => {
          await navigation.goToChild();
          // this.hideSubmenu();
        },
      },
    ];

    navItems.forEach((item) => {
      const menuItem = this.createSubmenuItem(
        item.icon,
        item.label,
        item.action
      );
      content.appendChild(menuItem);
    });

    this.submenuElement.appendChild(content);
    document.body.appendChild(this.submenuElement);

    // 点击其他地方关闭子菜单
    setTimeout(() => {
      document.addEventListener("click", this.handleOutsideClick);
    }, 0);
  }

  // 创建子菜单项
  private createSubmenuItem(
    icon: string,
    label: string,
    action: () => void
  ): HTMLElement {
    const item = document.createElement("div");
    item.style.cssText = `
      padding: 12px 15px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background 0.2s;
    `;

    item.innerHTML = `
      <span style="margin-right: 10px;">${icon}</span>
      <span style="flex: 1; color: #333;">${label}</span>
    `;

    item.addEventListener("click", action);

    item.addEventListener("mouseenter", () => {
      item.style.backgroundColor = "#f8f9fa";
    });
    item.addEventListener("mouseleave", () => {
      item.style.backgroundColor = "transparent";
    });

    return item;
  }

  // 隐藏子菜单
  private hideSubmenu(): void {
    if (this.submenuElement) {
      this.submenuElement.remove();
      this.submenuElement = null;
      document.removeEventListener("click", this.handleOutsideClick);
    }
  }

  // 处理外部点击
  private handleOutsideClick = (event: Event): void => {
    if (
      this.submenuElement &&
      !this.submenuElement.contains(event.target as Node)
    ) {
      this.hideSubmenu();
    }
  };
}
