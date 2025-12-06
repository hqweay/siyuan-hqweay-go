import { getRandomDocId } from "../myscripts/randomDocCache";
import { getBlockByID, listDocsByPath, sql } from "@/api";
import { plugin } from "@/utils";
import { openMobileFileById, openTab, showMessage } from "siyuan";
import { mobileUtils, isMobile } from "./utils";
import { PluginRegistry } from "@/plugin-registry";
import { getCurrentDocId, openBlockByID } from "@/myscripts/syUtils";

/**
 * 移动端导航类
 */
class MobileNavigation {
  private historyInitialized = false;
  private forwardStack: string[] = [];
  /**
   * 初始化导航历史
   */
  init(): void {
    if (this.historyInitialized) return;

    console.log("移动端导航初始化");
    this.historyInitialized = true;

    // 监听文档切换事件
    this.setupNavigationListeners();
  }

  /**
   * 设置导航事件监听
   */
  private setupNavigationListeners(): void {
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

      // 跳转到父文档
      openBlockByID(parentDoc.id);
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
      const currentDocId = getCurrentDocId();
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

      // 跳转到第一个子文档
      openBlockByID(children[0].id);
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
      const currentDocId = getCurrentDocId();
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

      // 跳转到目标兄弟文档
      openBlockByID(siblings[newIndex].id);
      mobileUtils.vibrate(50);
    } catch (error) {
      console.error("跳转到兄弟文档失败:", error);
      showMessage("跳转到兄弟文档失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  /**
   * 回到上一个文档
   */
  goBack(): void {
    if (window.siyuan?.backStack?.length <= 0) {
      showMessage("已到达最顶层文档");
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }
    this.forwardStack.push(getCurrentDocId());
    (window as any).goBack();
    showMessage("已返回上一页");
    mobileUtils.vibrate(50);
  }

  /**
   * 前进到下一个文档
   */
  goForward(): void {
    if (this.forwardStack.length <= 0) {
      showMessage("已到达最新文档");
      mobileUtils.vibrate([100, 50, 100]);
      return;
    }

    const nextId = this.forwardStack.pop();
    if (nextId) {
      openBlockByID(nextId);
    }
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
}

// 创建全局实例
export const navigation = new MobileNavigation();
