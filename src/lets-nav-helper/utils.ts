import { getFrontend } from "siyuan";
import { getBlockByID } from "@/api";
import { plugin } from "@/utils";
import { getCurrentDocId } from "@/myscripts/syUtils";

/**
 * 移动端环境检测
 */
export const isMobile =
  getFrontend() === "mobile" || getFrontend() === "browser-mobile";

/**
 * PC端环境检测（桌面端）
 */
export const isDesktop = !isMobile;

/**
 * 移动端工具类
 */
class MobileUtils {
  private initialized = false;

  /**
   * 初始化移动端工具
   */
  init(): void {
    if (this.initialized) return;

    console.log("移动端工具初始化");
    this.initialized = true;

    // 设置移动端样式
    this.setupMobileStyles();

    // 监听移动端特定事件
    this.setupMobileEventListeners();
  }

  /**
   * 销毁移动端工具
   */
  destroy(): void {
    if (!this.initialized) return;

    console.log("移动端工具销毁");
    this.initialized = false;
  }

  /**
   * 设置移动端样式
   */
  private setupMobileStyles(): void {
    // 样式已移至Svelte组件中处理
    // 这里保持空实现以保持接口兼容性
  }

  /**
   * 设置移动端事件监听器
   */
  private setupMobileEventListeners(): void {
    // 监听页面可见性变化
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("页面隐藏");
      } else {
        console.log("页面显示");
      }
    });

    // 监听网络状态变化
    if ("navigator" in window && "onLine" in navigator) {
      window.addEventListener("online", () => {
        console.log("网络连接恢复");
      });

      window.addEventListener("offline", () => {
        console.log("网络连接断开");
      });
    }

    // 监听设备方向变化
    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
  }

  /**
   * 处理设备方向变化
   */
  private handleOrientationChange(): void {
    // 设备方向变化处理已移至Svelte组件中
    // 这里保持空实现以保持接口兼容性
  }

  /**
   * 获取当前文档信息
   */
  async getCurrentDoc(): Promise<any> {
    const docId = getCurrentDocId();
    if (!docId) {
      throw new Error("无法获取当前文档ID");
    }

    try {
      return await getBlockByID(docId);
    } catch (error) {
      console.error("获取当前文档信息失败:", error);
      throw error;
    }
  }

  /**
   * 检查是否在主文档界面
   */
  isInMainDocument(): boolean {
    try {
      const currentPath = window.location.pathname;
      return (
        currentPath.includes("/mobile/") ||
        currentPath.includes("/editor/") ||
        isMobile
      );
    } catch (error) {
      console.error("检查主文档界面失败:", error);
      return false;
    }
  }

  /**
   * 显示移动端提示消息
   */
  showMobileMessage(
    message: string,
    type: "info" | "success" | "error" = "info"
  ): void {
    if ((window as any).showMessage) {
      (window as any).showMessage(message);
    } else {
      // 降级到原生 alert
      alert(message);
    }
  }

  /**
   * 振动反馈
   */
  vibrate(pattern: number | number[] = 100): void {
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.warn("振动反馈失败:", error);
      }
    }
  }

  /**
   * 防止默认行为
   */
  preventDefault(e: Event): void {
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  /**
   * 停止传播
   */
  stopPropagation(e: Event): void {
    e.stopPropagation();
  }

  /**
   * 检测触摸设备
   */
  isTouchDevice(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * 获取设备信息
   */
  getDeviceInfo(): {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  } {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
    };
  }

  /**
   * 安全执行函数
   */
  safeExecute(fn: () => void, errorMessage: string = "执行失败"): void {
    try {
      fn();
    } catch (error) {
      console.error(errorMessage, error);
      this.showMobileMessage(errorMessage, "error");
    }
  }

  /**
   * 延迟执行
   */
  delayExecute(fn: () => void, delay: number = 100): NodeJS.Timeout {
    return setTimeout(() => {
      this.safeExecute(fn);
    }, delay);
  }

  /**
   * 节流函数
   */
  throttle(func: Function, delay: number): Function {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    return (...args: any[]) => {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(null, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(null, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * 防抖函数
   */
  debounce(func: Function, delay: number): Function {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
}

// 创建全局实例
export const mobileUtils = new MobileUtils();

// 导出移动端工具类
export { MobileUtils };
