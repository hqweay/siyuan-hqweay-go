import { getBlockByID, listDocsByPath } from "@/api";

import { getCurrentDocId, openBlockByID } from "@/myscripts/syUtils";
import { PluginRegistry } from "@/plugin-registry";
import { settings } from "@/settings";
import { plugin } from "@/utils";
import { showMessage } from "siyuan";
import pluginMetadata from "./plugin";
import { isMobile, mobileUtils } from "./utils";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-nav-helper");

/**
 * 移动端导航类
 */
class MobileNavigation {
  private historyInitialized = false;
  private forwardStack: string[] = [];
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;
  /**
   * 初始化导航历史
   */
  init(): void {
    if (this.historyInitialized) return;

    log.info("移动端导航初始化");
    this.historyInitialized = true;

    // 监听文档切换事件
    this.setupNavigationListeners();
  }

  /**
   * 销毁导航监听，防止内存泄漏
   */
  destroy(): void {
    if (!this.historyInitialized) return;
    
    if (this.keydownListener) {
      window.removeEventListener("keydown", this.keydownListener);
      this.keydownListener = null;
    }
    this.historyInitialized = false;
    log.info("移动端导航销毁");
  }

  /**
   * 设置导航事件监听
   */
  private setupNavigationListeners(): void {
    // 监听键盘事件
    this.keydownListener = (e: KeyboardEvent) => {
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
    };
    window.addEventListener("keydown", this.keydownListener);
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
      const currentDocId = getCurrentDocId();
      if (!currentDocId) {
        showMessage(plugin.i18n["lets-nav-helper.cannotGetDocId"]);
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const parentDoc = await this.getParentDocument(currentDoc.path);

      if (!parentDoc) {
        showMessage(plugin.i18n["lets-nav-helper.noParentDoc"]);
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      // 跳转到父文档
      openBlockByID(parentDoc.id);
      mobileUtils.vibrate(50);
    } catch (error) {
      log.error("跳转到父文档失败:", error);
      showMessage(plugin.i18n["lets-nav-helper.jumpToParentFailed"]);
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 跳转到子文档
   */
  async goToChild(): Promise<void> {
    try {
      const currentDocId = getCurrentDocId();
      if (!currentDocId) {
        showMessage(plugin.i18n["lets-nav-helper.cannotGetDocId"]);
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const children = await this.listChildDocs(currentDoc);

      if (children.length === 0) {
        showMessage(plugin.i18n["lets-nav-helper.noChildDoc"]);
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      // 跳转到第一个子文档
      openBlockByID(children[0].id);
      mobileUtils.vibrate(50);
    } catch (error) {
      log.error("跳转到子文档失败:", error);
      showMessage(plugin.i18n["lets-nav-helper.jumpToChildFailed"]);
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 跳转到兄弟文档
   */
  async goToSibling(delta: -1 | 1): Promise<void> {
    try {
      const currentDocId = getCurrentDocId();
      if (!currentDocId) {
        showMessage(plugin.i18n["lets-nav-helper.cannotGetDocId"]);
        return;
      }

      const currentDoc = await getBlockByID(currentDocId);
      const siblings = await this.getSibling(currentDoc.path, currentDoc.box);

      if (siblings.length <= 1) {
        showMessage(plugin.i18n["lets-nav-helper.noSiblingDoc"]);
        mobileUtils.vibrate([100, 50, 100]);
        return;
      }

      const currentIndex = siblings.findIndex((s) => s.id === currentDocId);
      let newIndex = currentIndex + delta;

      // 边界处理
      if (newIndex < 0) {
        newIndex = siblings.length - 1;
        showMessage(plugin.i18n["lets-nav-helper.jumpedToLast"]);
      } else if (newIndex >= siblings.length) {
        newIndex = 0;
        showMessage(plugin.i18n["lets-nav-helper.jumpedToFirst"]);
      } else {
        const direction = delta > 0 ? plugin.i18n["lets-nav-helper.next"] : plugin.i18n["lets-nav-helper.prev"];
        showMessage(plugin.i18n["lets-nav-helper.jumpedToDirection"].replace("{direction}", direction));
      }

      // 跳转到目标兄弟文档
      openBlockByID(siblings[newIndex].id);
      mobileUtils.vibrate(50);
    } catch (error) {
      log.error("跳转到兄弟文档失败:", error);
      showMessage(plugin.i18n["lets-nav-helper.jumpToSiblingFailed"]);
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 回到上一个文档
   */
  goBack(): void {
    if (window.siyuan?.backStack?.length <= 0) {
      showMessage(plugin.i18n["lets-nav-helper.atTopmost"]);
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }
    this.forwardStack.push(getCurrentDocId());
    (window as any).goBack();
    showMessage(plugin.i18n["lets-nav-helper.backToPrev"]);
    mobileUtils.vibrate(50);
  }

  /**
   * 前进到下一个文档
   */
  goForward(): void {
    if (this.forwardStack.length <= 0) {
      showMessage(plugin.i18n["lets-nav-helper.atLatest"]);
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }

    const nextId = this.forwardStack.pop();
    if (nextId) {
      openBlockByID(nextId);
    }
    showMessage(plugin.i18n["lets-nav-helper.forwardToNext"]);
    mobileUtils.vibrate(50);
  }

  /**
   * 回到首页（仪表盘）
   */
  goToHome(): void {
    try {
      const link = settings.getBySpace(pluginMetadata.name, "dashBoardLink");
      log.info("尝试打开仪表盘:", link);
      // 尝试打开仪表盘
      PluginRegistry.getInstance()
        .getPlugin("dashBoard")
        .openSiyuanUrlPluginEvent({
          detail: {
            url: link ? link : "siyuan://plugins/siyuan-hqweay-go/open",
          },
        });
    } catch (error) {
      log.error("打开仪表盘失败:", error);
      showMessage(plugin.i18n["lets-nav-helper.openDashFailed"]);
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
      log.error("获取子文档列表失败:", error);
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
      log.error("获取兄弟文档列表失败:", error);
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
      log.error("获取父文档失败:", error);
      return null;
    }
  }
}

// 创建全局实例
export const navigation = new MobileNavigation();
