import { sql } from "@/api";
import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { plugin } from "@/utils";
import { showMessage } from "siyuan";
import InlineElements from "./InlineElements.svelte";

interface InlineElement {
  id: string;
  content: string;
  markdown: string;
  context?: string;
  blockType: string;
  created: number;
  updated: number;
}

export default class InlineElementsPlugin implements SubPlugin {
   regexOfHighLight = /==([^=]+?)==/g;

  private currentDocId: string = "";
  private isLoading: boolean = false;
  private isRefreshing: boolean = false;
  private inlineElements: InlineElement[] = [];

  onload(): void {


    plugin.addDock({
      config: {
        position: "RightTop",
        size: { width: 300, height: 0 },
        icon: `iconMark`,
        title: "文档标注",
        hotkey: "⌥⌘W",
      },
      data: { text: "当前文档的行内标注元素" },
      type: "dock_tab" + "_inline_elements",
      resize() {
        //console.log(DOCK_TYPE + " resize");
      },
      update() {
        //console.log(DOCK_TYPE + " update");
      },
      init: (dock) => {
        // 使用闭包来捕获组件实例
        let componentInstance: any;

        // 获取配置选项
        const pageSize =
          parseInt(settings.getBySpace("inline-elements", "pageSize")) || 20;

        // 创建组件实例
        componentInstance = new InlineElements({
          target: dock.element,
          props: {
            inlineElements: this.inlineElements,
            currentDocId: this.currentDocId,
            isLoading: this.isLoading,
            isRefreshing: this.isRefreshing,
            pageSize: pageSize,
          },
        });

        // 初始加载当前文档的标注
        this.loadInlineElements(componentInstance);

        plugin.eventBus.on("switch-protyle", (e: any) => {
          this.loadInlineElements(componentInstance);
        });

        // 监听组件的刷新事件
        componentInstance.$on("refresh", () => {
          this.handleRefresh(componentInstance);
        });

        // 设置文档切换监听
        // this.setupDocumentObserver(componentInstance);
      },
      destroy() {
        //console.log("destroy dock:", DOCK_TYPE);
        // 清理逻辑会在组件销毁时自动处理
      },
    });
  }

  onunload(): void {}

  /**
   * 获取当前活跃文档的ID
   */
  private getCurrentDocId(): string | null {
    try {
      const docElement = document.querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      );
      return docElement?.getAttribute("data-node-id") || null;
    } catch (error) {
      console.error("获取当前文档ID失败:", error);
      return null;
    }
  }

  /**
   * 提取当前文档的行内标注元素
   */
  private async loadInlineElements(componentInstance: any): Promise<void> {
    const docId = this.getCurrentDocId();

    if (!docId) {
      console.warn("未找到当前文档ID");
      return;
    }

    // 如果文档没有变化，不需要重新加载
    if (docId === this.currentDocId) {
      return;
    }

    this.currentDocId = docId;
    this.isLoading = true;
    this.updateComponentProps(componentInstance);

    try {
      const elements = await this.extractInlineElements(docId);
      this.inlineElements = elements;
    } catch (error) {
      console.error("提取行内标注失败:", error);
      this.inlineElements = [];
      showMessage("提取行内标注失败", 3000);
    } finally {
      this.isLoading = false;
      this.updateComponentProps(componentInstance);
    }
  }

  /**
   * 从数据库中提取行内标注元素
   */
  private async extractInlineElements(docId: string): Promise<InlineElement[]> {
    // 使用提供的SQL查询语句
    const extractHighLightSQL = `SELECT * FROM blocks WHERE path LIKE '%/${docId}.sy' 
        AND markdown LIKE '%==%==%' AND  (type = 'p' AND parent_id not in 
        (SELECT id FROM blocks WHERE path LIKE '%/${docId}.sy' AND type = 'i' ) )  
        OR (type = 'i' AND id in (SELECT parent_id FROM blocks WHERE path LIKE '%/${docId}.sy' 
        AND type ='p' AND markdown LIKE '%==%==%' )) ORDER BY created`;

    let res = await sql(extractHighLightSQL);

    if (!res || res.length === 0) {
      return [];
    }

    const elements: InlineElement[] = [];

    for (const block of res) {
      // 提取标注内容（支持多个标注）
      const matches = [...block.markdown.matchAll(this.regexOfHighLight)];

      for (const match of matches) {
        if (match[1]) {
          // 获取上下文（如果需要）
          const context = this.getBlockContext(block.markdown, match[0]);

          elements.push({
            id: block.id,
            content: match[1].trim(),
            markdown: block.markdown,
            context: context,
            blockType: block.type,
            created: block.created,
            updated: block.updated,
          });
        }
      }
    }

    return elements;
  }

  /**
   * 获取块的上下文
   */
  private getBlockContext(
    markdown: string,
    highlightText: string
  ): string | null {
    // 简单的上下文提取：找到标注在markdown中的位置，取前后文本
    const highlightIndex = markdown.indexOf(highlightText);
    if (highlightIndex === -1) return null;

    const contextLength = 50; // 上下文长度
    const start = Math.max(0, highlightIndex - contextLength);
    const end = Math.min(
      markdown.length,
      highlightIndex + highlightText.length + contextLength
    );

    let context = markdown.substring(start, end);

    // 如果超出边界，添加省略号
    if (start > 0) context = "..." + context;
    if (end < markdown.length) context = context + "...";

    return context.trim();
  }

  /**
   * 处理刷新请求
   */
  private async handleRefresh(componentInstance: any): Promise<void> {
    if (!this.currentDocId) {
      return;
    }

    this.isRefreshing = true;
    this.updateComponentProps(componentInstance);

    try {
      const elements = await this.extractInlineElements(this.currentDocId);
      this.inlineElements = elements;
      showMessage(`已刷新，找到 ${elements.length} 个标注`, 2000);
    } catch (error) {
      console.error("刷新标注失败:", error);
      showMessage("刷新标注失败", 3000);
    } finally {
      this.isRefreshing = false;
      this.updateComponentProps(componentInstance);
    }
  }

  /**
   * 更新组件属性
   */
  private updateComponentProps(componentInstance: any): void {
    if (componentInstance) {
      componentInstance.$set({
        inlineElements: this.inlineElements,
        currentDocId: this.currentDocId,
        isLoading: this.isLoading,
        isRefreshing: this.isRefreshing,
      });
    }
  }

  /**
   * 监听文档切换事件
   */
  // private setupDocumentObserver(componentInstance: any): void {
  //   // 监听protyle切换事件
  //   if (window.siyuan?.ws) {
  //     window.siyuan.ws.on("switch-protyle", (event: any) => {
  //       if (event.detail?.protyle?.block?.rootID) {
  //         // 延迟加载，确保DOM更新完成
  //         setTimeout(() => {
  //           this.loadInlineElements(componentInstance);
  //         }, 100);
  //       }
  //     });
  //   }

  //   // 监听DOM变化，检测文档切换
  //   const observer = new MutationObserver((mutations) => {
  //     mutations.forEach((mutation) => {
  //       if (
  //         mutation.type === "attributes" &&
  //         mutation.attributeName === "data-node-id"
  //       ) {
  //         const target = mutation.target as HTMLElement;
  //         if (target.classList.contains("protyle-background")) {
  //           setTimeout(() => {
  //             this.loadInlineElements(componentInstance);
  //           }, 100);
  //         }
  //       }
  //     });
  //   });

  //   // 监听活跃窗口中的protyle背景元素
  //   const activeWindow = document.querySelector(".layout__wnd--active");
  //   if (activeWindow) {
  //     const protyleBackgrounds = activeWindow.querySelectorAll(
  //       ".protyle-background"
  //     );
  //     protyleBackgrounds.forEach((element) => {
  //       observer.observe(element, { attributes: true });
  //     });
  //   }
  // }
}
