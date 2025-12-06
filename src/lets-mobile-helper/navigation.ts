import { getBlockByID, listDocsByPath, sql } from "@/api";
import { plugin } from "@/utils";
import { openMobileFileById, openTab, showMessage } from "siyuan";
import { mobileUtils, isMobile } from "./utils";
import { PluginRegistry } from "@/plugin-registry";

/**
 * 导航历史记录
 */
interface NavigationHistory {
  current: string | null;
  backStack: string[];
  forwardStack: string[];
}

/**
 * 移动端导航类
 */
class MobileNavigation {
  private history: NavigationHistory = {
    current: null,
    backStack: [],
    forwardStack: [],
  };
  private historyInitialized = false;

  /**
   * 初始化导航历史
   */
  init(): void {
    if (this.historyInitialized) return;

    console.log("移动端导航初始化");
    this.historyInitialized = true;

    // 初始化当前文档ID
    this.history.current = mobileUtils.getCurrentDocId();

    // 监听文档切换事件
    this.setupNavigationListeners();
  }

  /**
   * 设置导航事件监听
   */
  private setupNavigationListeners(): void {
    // 监听页面加载完成事件
    if (window.siyuan) {
      window.siyuan.mobile?.editor?.protyle?.block?.id &&
        this.updateCurrentDoc();
    }

    // 监听键盘事件
    window.addEventListener("keydown", (e) => {
      if (!isMobile) return;

      switch (e.key) {
        case "Backspace":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.goBack();
          }
          break;
        case "ArrowLeft":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.goBack();
          }
          break;
        case "ArrowRight":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.goForward();
          }
          break;
      }
    });
  }

  /**
   * 更新当前文档
   */
  private updateCurrentDoc(): void {
    const currentDocId = mobileUtils.getCurrentDocId();
    if (currentDocId && currentDocId !== this.history.current) {
      // 添加到历史记录
      if (this.history.current) {
        this.history.backStack.push(this.history.current);
      }
      this.history.current = currentDocId;
      this.history.forwardStack = []; // 清空前进栈
    }
  }

  /**
   * 获取当前文档ID
   */
  getCurrentDocId(): string | null {
    return mobileUtils.getCurrentDocId();
  }

  /**
   * 获取当前文档
   */
  async getCurrentDoc(): Promise<any> {
    return await mobileUtils.getCurrentDoc();
  }

  /**
   * 跳转到父文档
   */
  async goToParent(): Promise<void> {
    try {
      const currentDocId = mobileUtils.getCurrentDocId();
      if (!currentDocId) {
        showMessage("无法获取当前文档ID");
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const parentDoc = await this.getParentDocument(currentDoc.path);

      if (!parentDoc) {
        showMessage("没有父文档");
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      // 添加到历史记录
      this.addToHistory(currentDocId);

      // 跳转到父文档
      openMobileFileById(plugin.app, parentDoc.id);
      mobileUtils.vibrate(50);
    } catch (error) {
      console.error("跳转到父文档失败:", error);
      showMessage("跳转到父文档失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 跳转到子文档
   */
  async goToChild(): Promise<void> {
    try {
      const currentDocId = mobileUtils.getCurrentDocId();
      if (!currentDocId) {
        showMessage("无法获取当前文档ID");
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const children = await this.listChildDocs(currentDoc);

      if (children.length === 0) {
        showMessage("没有子文档");
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      // 添加到历史记录
      this.addToHistory(currentDocId);

      // 跳转到第一个子文档
      openMobileFileById(plugin.app, children[0].id);
      mobileUtils.vibrate(50);
    } catch (error) {
      console.error("跳转到子文档失败:", error);
      showMessage("跳转到子文档失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 跳转到兄弟文档
   */
  async goToSibling(delta: -1 | 1): Promise<void> {
    try {
      const currentDocId = mobileUtils.getCurrentDocId();
      if (!currentDocId) {
        showMessage("无法获取当前文档ID");
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const siblings = await this.getSibling(currentDoc.path, currentDoc.box);

      if (siblings.length <= 1) {
        showMessage("没有兄弟文档");
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      const currentIndex = siblings.findIndex((s) => s.id === currentDocId);
      let newIndex = currentIndex + delta;

      // 边界处理
      if (newIndex < 0) {
        newIndex = siblings.length - 1;
        showMessage("已跳转到最后一个文档");
      } else if (newIndex >= siblings.length) {
        newIndex = 0;
        showMessage("已跳转到第一个文档");
      } else {
        const direction = delta > 0 ? "下一个" : "上一个";
        showMessage(`跳转到${direction}文档`);
      }

      // 添加到历史记录
      this.addToHistory(currentDocId);

      // 跳转到目标兄弟文档
      openMobileFileById(plugin.app, siblings[newIndex].id);
      mobileUtils.vibrate(50);
    } catch (error) {
      console.error("跳转到兄弟文档失败:", error);
      showMessage("跳转到兄弟文档失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 跳转到随机文档
   */
  async goToRandom(
    sqlParam = "SELECT * FROM blocks WHERE type = 'd'"
  ): Promise<void> {
    try {
      sqlParam = `SELECT id FROM (${sqlParam}) ORDER BY RANDOM() LIMIT 1`;
      const data = await sql(sqlParam);

      if (data && data.length > 0) {
        const randomDocId = data[0].id;

        // 添加到历史记录
        const currentDocId = this.getCurrentDocId();
        if (currentDocId) {
          this.addToHistory(currentDocId);
        }

        openMobileFileById(plugin.app, randomDocId);
        showMessage("已跳转到随机文档");
        mobileUtils.vibrate(50);
      } else {
        showMessage("没有找到可跳转的文档");
        mobileUtils.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.error("跳转到随机文档失败:", error);
      showMessage("跳转到随机文档失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 回到上一个文档
   */
  goBack(): void {
    if (this.history.backStack.length === 0) {
      showMessage("没有可返回的文档");
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }

    const prevDocId = this.history.backStack.pop()!;

    // 添加到前进栈
    const currentDocId = this.getCurrentDocId();
    if (currentDocId) {
      this.history.forwardStack.push(currentDocId);
    }

    // 跳转
    openMobileFileById(plugin.app, prevDocId);
    this.history.current = prevDocId;

    showMessage("已返回上一页");
    mobileUtils.vibrate(50);
  }

  /**
   * 前进到下一个文档
   */
  goForward(): void {
    if (this.history.forwardStack.length === 0) {
      showMessage("没有可前进的文档");
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }

    const nextDocId = this.history.forwardStack.pop()!;

    // 添加到返回栈
    const currentDocId = this.getCurrentDocId();
    if (currentDocId) {
      this.history.backStack.push(currentDocId);
    }

    // 跳转
    openMobileFileById(plugin.app, nextDocId);
    this.history.current = nextDocId;

    showMessage("已前进到下一页");
    mobileUtils.vibrate(50);
  }

  /**
   * 回到首页（仪表盘）
   */
  goToHome(): void {
    try {
      // 尝试打开仪表盘
      PluginRegistry.getInstance()
        .getPlugin("dashBoard")
        .openSiyuanUrlPluginEvent({
          detail: {
            url: "siyuan://plugins/hqweay-diary-tools/open",
          },
        });
    } catch (error) {
      console.error("打开仪表盘失败:", error);
      showMessage("打开仪表盘失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 获取子文档列表
   */
  private async listChildDocs(doc: any): Promise<any[]> {
    try {
      const data = await listDocsByPath(doc.box, doc.path);
      return data?.files || [];
    } catch (error) {
      console.error("获取子文档列表失败:", error);
      return [];
    }
  }

  /**
   * 获取兄弟文档列表
   */
  private async getSibling(path: string, box: string): Promise<any[]> {
    try {
      // 移除文件扩展名
      path = path.replace(".sy", "");
      const parts = path.split("/");

      if (parts.length > 0) {
        parts.pop();
      }

      let parentPath = parts.join("/");
      parentPath = parentPath || "/";

      const siblings = await this.listChildDocs({ path: parentPath, box });
      return siblings;
    } catch (error) {
      console.error("获取兄弟文档列表失败:", error);
      return [];
    }
  }

  /**
   * 获取父文档
   */
  private async getParentDocument(path: string): Promise<any | null> {
    try {
      let pathArr = path.split("/").filter((item) => item !== "");
      pathArr.pop();

      if (pathArr.length === 0) {
        return null;
      } else {
        const id = pathArr[pathArr.length - 1];
        return await getBlockByID(id);
      }
    } catch (error) {
      console.error("获取父文档失败:", error);
      return null;
    }
  }

  /**
   * 添加到历史记录
   */
  private addToHistory(docId: string): void {
    if (this.history.current && this.history.current !== docId) {
      this.history.backStack.push(this.history.current);
    }
    this.history.current = docId;
    this.history.forwardStack = []; // 清空前进栈
  }

  /**
   * 获取导航历史信息
   */
  getHistoryInfo(): {
    backCount: number;
    forwardCount: number;
    current: string | null;
  } {
    return {
      backCount: this.history.backStack.length,
      forwardCount: this.history.forwardStack.length,
      current: this.history.current,
    };
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history.backStack = [];
    this.history.forwardStack = [];
    this.history.current = mobileUtils.getCurrentDocId();
    showMessage("导航历史已清空");
  }
}

// 创建全局实例
export const navigation = new MobileNavigation();

// 导出导航类和工具变量
export { MobileNavigation };
export { mobileUtils, isMobile } from "./utils";
