import { SubPlugin } from "@/types/plugin";
import { isMobile, mobileUtils } from "./utils";
import { navigation } from "./navigation";
import pluginMetadata from "./plugin";
import { settings } from "@/settings";
import { plugin } from "@/utils";

import NavigationContainer from "./components/NavigationContainer.svelte";

export default class NavHelper implements SubPlugin {
  private mobileNavigationInstance: any = null;
  private desktopNavigationInstance: any = null;

  onload(): void {
    console.log("导航助手 - 初始化移动端工具");
    // 初始化移动端工具
    mobileUtils.init();
  }

  async onLayoutReady(): Promise<void> {
    console.log("导航助手 - 初始化导航功能");

    // 设置移动端全局变量
    this.setupMobileGlobals();

    // 创建自适应导航栏（根据设备类型选择移动端或桌面端）
    if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
      this.createAdaptiveNavigation();
    }

    // 注册键盘事件监听器
    this.registerEventListeners();
  }

  onunload(): void {
    console.log("导航助手 - 清理资源");

    // 清理移动端导航栏实例
    if (this.mobileNavigationInstance) {
      this.mobileNavigationInstance.$destroy();
      this.mobileNavigationInstance = null;
    }

    // 清理桌面端导航栏实例
    if (this.desktopNavigationInstance) {
      this.desktopNavigationInstance.$destroy();
      this.desktopNavigationInstance = null;
    }

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
    if (this.showInMobile()) {
      this.showNavigation();
    }
  }

  // 设置移动端全局变量
  private setupMobileGlobals(): void {
    // 设置全局移动端工具对象
    (window as any).mobileHelper = {
      plugin: pluginMetadata,
      isMobile: isMobile,
      navigation: navigation,
      utils: mobileUtils,
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
  private async createMobileNavigation(): Promise<void> {
    try {
      // 清理桌面端导航
      if (this.desktopNavigationInstance) {
        this.desktopNavigationInstance.$destroy();
        this.desktopNavigationInstance = null;
      }

      // 清理之前的移动端导航
      if (this.mobileNavigationInstance) {
        this.mobileNavigationInstance.$destroy();
        this.mobileNavigationInstance = null;
      }

      // 创建组件实例
      this.mobileNavigationInstance = new NavigationContainer({
        target: document.body,
        props: {
          deviceType: "mobile",
          isVisible: true,
        },
      });

      // 调整页面底部padding以避免内容被遮挡
      this.adjustPagePadding();
    } catch (error) {
      console.error("创建移动端导航失败:", error);
    }
  }

  // 创建桌面端悬浮导航栏
  private async createDesktopNavigation(): Promise<void> {
    try {
      // 清理移动端导航
      if (this.mobileNavigationInstance) {
        this.mobileNavigationInstance.$destroy();
        this.mobileNavigationInstance = null;
      }

      // 清理之前的桌面端导航
      if (this.desktopNavigationInstance) {
        this.desktopNavigationInstance.$destroy();
        this.desktopNavigationInstance = null;
      }

      // 动态导入Svelte组件

      // 创建组件实例
      this.desktopNavigationInstance = new NavigationContainer({
        target: document.body,
        props: {
          deviceType: "desktop",
          isVisible: true,
        },
      });
    } catch (error) {
      console.error("创建桌面端导航失败:", error);
    }
  }

  // 隐藏导航栏
  private hideNavigation(): void {
    if (this.mobileNavigationInstance) {
      this.mobileNavigationInstance.$set({ isVisible: false });
    }
    if (this.desktopNavigationInstance) {
      this.desktopNavigationInstance.$set({ isVisible: false });
    }
  }

  // 显示导航栏
  private showNavigation(): void {
    if (this.mobileNavigationInstance) {
      this.mobileNavigationInstance.$set({ isVisible: true });
    }
    if (this.desktopNavigationInstance) {
      this.desktopNavigationInstance.$set({ isVisible: true });
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
}
