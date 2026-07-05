import { SubPluginBase } from "@/libs/sub-plugin-base";
import { isMobile, mobileUtils } from "./utils";
import { navigation } from "./navigation";
import pluginMetadata from "./plugin";
import { settings } from "@/settings";
import { plugin } from "@/utils";
import { goToRandomBlock } from "@/myscripts/randomDocCache";
import { openBlockByID } from "@/myscripts/syUtils";
import { createDailynote } from "@frostime/siyuan-plugin-kits";

import NavigationContainer from "./components/NavigationContainer.svelte";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-nav-helper");

export default class NavHelper extends SubPluginBase {
  private mobileNavigationInstance: any = null;
  private desktopNavigationInstance: any = null;

  // 事件监听器引用
  private visibilityListener: () => void = () => {};
  private resizeListener: () => void = () => {};
  private wsMainListener: (event: any) => void = () => {};
  private resizeTimeout: NodeJS.Timeout | null = null;

  override onload(): void {
    log.info("导航助手 - 初始化移动端工具");
    
    // 数据平滑迁移：将旧的纯文本 customLinks 转换为 JSON Array
    const oldData = settings.getBySpace(pluginMetadata.name, "customLinks");
    if (typeof oldData === "string") {
      log.info("检测到旧版 customLinks，开始数据迁移...");
      const lines = oldData.split("\n").filter(l => l.trim());
      const newData = lines.map(line => {
        const [title, url, icon] = line.split("====");
        return { title: title?.trim() || "", url: url?.trim() || "", icon: icon?.trim() || "🔗" };
      });
      settings.setBySpace(pluginMetadata.name, "customLinks", newData);
      settings.save();
    }
    // 初始化移动端工具
    mobileUtils.init();
    navigation.init();
    
    // 注册全局快捷键
    plugin.addCommand({
      langKey: "lets-nav-helper.cmdRandom",
      hotkey: "⌥⌘R",
      callback: () => {
        let sql = settings.getBySpace(pluginMetadata.name, "randomSql") || "SELECT id FROM blocks WHERE type = 'd'";
        goToRandomBlock(sql);
      }
    });
    
    plugin.addCommand({
      langKey: "lets-nav-helper.cmdDaily",
      hotkey: "⌥⌘D",
      callback: () => {
        const noteBookID = settings.getBySpace(pluginMetadata.name, "noteBookID");
        const today = new Date();
        createDailynote(noteBookID || "20210926105749-l6jquz7", today).then((id) => {
          if (id) {
            openBlockByID(id);
          }
        });
      }
    });
  }

  async onLayoutReady(): Promise<void> {
    log.info("导航助手 - 初始化导航功能");

    // 设置移动端全局变量
    this.setupMobileGlobals();

    // 创建自适应导航栏（根据设备类型选择移动端或桌面端）
    if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
      this.createAdaptiveNavigation();
    }

    // 注册键盘事件监听器
    this.registerEventListeners();
  }

  override onunload(): void {
    log.info("导航助手 - 清理资源");

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

    // 清理移动端工具和导航历史
    mobileUtils.destroy();
    navigation.destroy();
  }

  // 移动端键盘显示事件
  mobilekeyboardshowEvent(eventData: any): void {
    log.info("移动端键盘显示", eventData);
    // 隐藏底部导航栏以避免遮挡
    this.hideNavigation();
  }

  // 移动端键盘隐藏事件
  mobilekeyboardhideEvent(eventData: any): void {
    log.info("移动端键盘隐藏", eventData);
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

  // 创建或更新自适应导航
  private createAdaptiveNavigation(): void {
    const shouldShowMobile = isMobile && this.showInMobile();
    const shouldShowDesktop = !isMobile && this.showInPC();

    if (shouldShowMobile) {
      if (this.mobileNavigationInstance) {
        // 如果实例已存在，只更新 props 而非销毁重建
        this.mobileNavigationInstance.$set({
          deviceType: "mobile",
          isVisible: true,
        });
        this.adjustPagePadding();
      } else {
        this.createMobileNavigation();
      }
    } else if (shouldShowDesktop) {
      if (this.desktopNavigationInstance) {
        // 如果实例已存在，只更新 props
        this.desktopNavigationInstance.$set({
          deviceType: "desktop",
          isVisible: true,
        });
      } else {
        this.createDesktopNavigation();
      }
    } else {
      this.hideNavigation();
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
      log.error("创建移动端导航失败:", error);
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
      log.error("创建桌面端导航失败:", error);
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
    // 现代悬浮栏设计下，由于思源本体在文档末尾通常留有足够的空白，
    // 强制增加 #editor 的 padding 会导致编辑器的白底向下延伸，产生“遮罩”Bug。
    // 因此这里不再强制添加 paddingBottom。
    
    // 如果后续发现某些特定主题下最后一行字被遮挡，可以考虑给 .protyle-content 
    // 添加 margin-bottom，而不是修改 #editor。
  }

  // 注册事件监听器
  private registerEventListeners(): void {
    // 监听页面可见性变化
    this.visibilityListener = () => {
      if (document.hidden) {
        this.hideNavigation();
      } else {
        if (settings.getBySpace(pluginMetadata.name, "enableBottomNav")) {
          this.showNavigation();
        }
      }
    };
    document.addEventListener("visibilitychange", this.visibilityListener);

    // 监听窗口大小变化（响应式处理）
    this.resizeListener = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        this.handleDeviceChange();
      }, 300);
    };
    window.addEventListener("resize", this.resizeListener);

    // 监听设置变化
    this.wsMainListener = (event: any) => {
      if (event.detail.data?.data?.appData?.plugins) {
        this.handleSettingsChange();
      }
    };
    plugin.eventBus.on("ws-main", this.wsMainListener);
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
    document.removeEventListener("visibilitychange", this.visibilityListener);
    window.removeEventListener("resize", this.resizeListener);
    plugin.eventBus.off("ws-main", this.wsMainListener);
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
}
