import { SubPlugin } from "@/types/plugin";
import { settings } from "@/settings";
import { plugin } from "@/utils";
import { request } from "@/api";
import pluginMetadata from "./plugin";
import BacklinkPanel from "./BacklinkPanel.svelte";

export default class BacklinkPanelPlugin implements SubPlugin {
  private panelInstance: any = null;
  private currentDocId: string = "";
  private isPanelVisible: boolean = false;

  onload(): void {
    console.log("反链面板插件 - 初始化");
  }

  async onLayoutReady(): Promise<void> {
    console.log("反链面板插件 - 布局就绪");

    // 监听文档切换事件
    this.setupEventListeners();

    // 如果当前有打开的文档，初始化面板
    this.initializeForCurrentDoc();
  }

  onunload(): void {
    console.log("反链面板插件 - 卸载");

    // 清理事件监听器
    this.removeEventListeners();

    // 销毁面板实例
    if (this.panelInstance) {
      this.panelInstance.$destroy();
      this.panelInstance = null;
    }
  }

  // 监听文档切换和加载事件
  private setupEventListeners(): void {
    // 监听文档切换
    plugin.eventBus.on("switch-protyle", (event) => {
      this.handleProtyleSwitch(event);
    });

    // 监听文档加载完成
    plugin.eventBus.on("loaded-protyle-static", (event) => {
      this.handleProtyleLoaded(event);
    });
  }

  private removeEventListeners(): void {
    plugin.eventBus.off("switch-protyle", (event) => {
      this.handleProtyleSwitch(event);
    });

    plugin.eventBus.off("loaded-protyle-static", (event) => {
      this.handleProtyleLoaded(event);
    });
  }

  // 处理文档切换
  private handleProtyleSwitch(event: any): void {
    console.log("文档切换事件:", event);
    const newDocId = this.getCurrentDocId();
    if (newDocId && newDocId !== this.currentDocId) {
      this.currentDocId = newDocId;
      this.updatePanelForDoc(newDocId);
    }
  }

  // 处理文档加载
  private handleProtyleLoaded(event: any): void {
    console.log("文档加载完成:", event);
    const docId = this.getCurrentDocId();
    if (docId && docId !== this.currentDocId) {
      this.currentDocId = docId;
      this.initializeForCurrentDoc();
    }
  }

  // 为当前文档初始化面板
  private async initializeForCurrentDoc(): Promise<void> {
    const enabled = settings.getBySpace(pluginMetadata.name, "enabled");
    if (!enabled) {
      return;
    }

    const docId = this.getCurrentDocId();
    if (!docId) {
      return;
    }

    this.currentDocId = docId;

    // 延迟创建面板，确保文档DOM已完全加载
    setTimeout(() => {
      this.createOrUpdatePanel();
    }, 100);
  }

  // 更新面板内容
  private updatePanelForDoc(docId: string): void {
    if (this.panelInstance && typeof this.panelInstance.updateDocId === 'function') {
      this.panelInstance.updateDocId(docId);
    } else {
      // 如果面板实例不存在或方法不可用，重新初始化
      console.log('面板实例不存在，重新初始化:', docId);
      this.initializeForCurrentDoc();
    }
  }

  // 获取当前文档ID
  private getCurrentDocId(): string {
    try {
      // 优先通过DOM查询获取当前文档ID
      const activeProtyle = document.querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      );

      if (activeProtyle) {
        const docId = activeProtyle.getAttribute("data-node-id");
        if (docId) {
          return docId;
        }
      }

      // 备用方法：通过protyle实例获取
      const protyle = (window as any).siyuan?.protyle?.getCurrentProtyle?.();
      if (protyle?.block?.rootID) {
        return protyle.block.rootID;
      }

      return "";
    } catch (error) {
      console.error("获取当前文档ID失败:", error);
      return "";
    }
  }

  // 创建或更新面板
  private createOrUpdatePanel(): void {
    if (!this.currentDocId) {
      return;
    }

    // 检查面板是否已存在
    const existingPanel = document.querySelector(
      `[data-backlink-panel="${this.currentDocId}"]`
    );

    if (existingPanel && this.panelInstance) {
      // 面板已存在，更新内容
      this.panelInstance.refresh();
      return;
    }

    // 移除旧面板
    this.removeOldPanels();

    // 创建新面板
    this.createPanel();
  }

  // 移除旧面板
  private removeOldPanels(): void {
    const oldPanels = document.querySelectorAll("[data-backlink-panel]");
    oldPanels.forEach((panel) => {
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
    });

    if (this.panelInstance) {
      this.panelInstance.$destroy();
      this.panelInstance = null;
    }
  }

  // 创建面板
  private async createPanel(): Promise<void> {
    const enabled = settings.getBySpace(pluginMetadata.name, "enabled");
    if (!enabled) {
      return;
    }

    try {
      // 查找文档容器
      const docContainer = this.findDocContainer();
      if (!docContainer) {
        console.warn("未找到文档容器，无法创建反链面板");
        return;
      }

      // 创建面板容器
      const panelContainer = document.createElement("div");
      panelContainer.setAttribute("data-backlink-panel", this.currentDocId);
      panelContainer.className = "backlink-panel-container";

      // 根据设置确定插入位置
      const position =
        settings.getBySpace(pluginMetadata.name, "position") || "bottom";

      if (position === "top") {
        docContainer.insertBefore(panelContainer, docContainer.firstChild);
      } else {
        docContainer.appendChild(panelContainer);
      }

      // 创建Svelte组件实例
      this.panelInstance = new (BacklinkPanel as any)({
        target: panelContainer,
        props: {
          docId: this.currentDocId,
          plugin: this,
        },
      });

      this.isPanelVisible = true;
      console.log("反链面板创建成功:", this.currentDocId);
    } catch (error) {
      console.error("创建反链面板失败:", error);
    }
  }

  // 查找文档容器
  private findDocContainer(): HTMLElement | null {
    // 优先查找活动文档的编辑器区域
    const activeDoc = document.querySelector(
      ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none)"
    );

    if (activeDoc) {
      return activeDoc as HTMLElement;
    }

    // 备用：查找任何文档编辑器
    const docEditor = document.querySelector(".protyle.fn__flex-1");
    if (docEditor) {
      return docEditor as HTMLElement;
    }

    return null;
  }

  // 获取反链数据
  async getBacklinks(
    docId: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // 第一步：获取当前文档的定义块（使用与原版相同的逻辑）
      const getDefBlockSql = `
        SELECT * ,
            (SELECT count(refs.def_block_id) FROM refs WHERE refs.def_block_id = blocks.id 
            ) AS refCount,
            ( SELECT GROUP_CONCAT( refs.block_id ) FROM refs WHERE refs.def_block_id = blocks.id 
            ) AS backlinkBlockIdConcat
        FROM blocks
        WHERE id in (
          SELECT DISTINCT def_block_id 
          FROM refs
          WHERE def_block_root_id = '${docId}'
        )
        LIMIT 999999999;
      `;
      
      const defBlocks = await request("/api/query/sql", { stmt: getDefBlockSql });
      if (!defBlocks || defBlocks.length === 0) {
        return [];
      }
      
      const defBlockIds = defBlocks.map((block: any) => block.id) as string[];
      
      // 第二步：获取引用这些定义块的块（使用与原版相同的逻辑）
      const defBlockIdSql = this.generateAndInConditions("def_block_id", defBlockIds);
      const getBacklinkSql = `
        SELECT b.*
        FROM blocks b
        WHERE 1 = 1 
            AND b.id IN ( 
                SELECT block_id 
                FROM refs 
                WHERE 1 = 1 ${defBlockIdSql}
            )
        ORDER BY b.updated DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const backlinks = await request("/api/query/sql", { stmt: getBacklinkSql });
      
      // 第三步：获取反链块所在文档的信息
      const backlinkRootIds = [...new Set(backlinks?.map((b: any) => b.root_id) || [])] as string[];
      const docSql = `
        SELECT b.*
        FROM blocks b
        WHERE 1 = 1 ${this.generateAndInConditions("id", backlinkRootIds)}
        AND b.type = 'd'
        LIMIT 999999999;
      `;
      
      const documents = await request("/api/query/sql", { stmt: docSql });
      const docMap = new Map(documents?.map((doc: any) => [doc.id, doc]) || []);
      
      // 组合数据
      return (backlinks || []).map((backlink: any) => ({
        ...backlink,
        documentBlock: docMap.get(backlink.root_id),
        // 计算引用上下文（简化版）
        context: this.extractContext(backlink.markdown || backlink.content)
      }));
      
    } catch (error) {
      console.error("获取反链数据失败:", error);
      return [];
    }
  }
  
  // 生成 AND IN 条件（与原版相同的逻辑）
  private generateAndInConditions(fieldName: string, params: string[]): string {
    if (!params || params.length === 0) {
      return " ";
    }
    let result = ` AND ${fieldName} IN (`;
    const conditions = params.map((param) => ` '${param}' `);
    result = result + conditions.join(", ") + ") ";
    return result;
  }
  
  // 提取引用上下文
  private extractContext(content: string): string {
    if (!content) return '';
    
    // 移除HTML标签
    const textContent = content.replace(/<[^>]*>/g, '');
    
    // 查找引用模式 ((block_id 'anchor'))
    const refMatches = textContent.match(/\(\([^)]*\)\)/g);
    if (refMatches && refMatches.length > 0) {
      // 提取引用附近的内容作为上下文
      const refIndex = textContent.indexOf(refMatches[0]);
      const start = Math.max(0, refIndex - 50);
      const end = Math.min(textContent.length, refIndex + refMatches[0].length + 50);
      return textContent.substring(start, end).trim();
    }
    
    // 如果没有找到引用，返回内容的前100个字符
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
  }

  // 执行自定义SQL查询
  async executeCustomSql(
    sql: string,
    offset: number = 0,
    limit: number = 20
  ): Promise<any[]> {
    try {
      // 添加分页
      let paginatedSql = sql;
      if (!sql.toLowerCase().includes("limit")) {
        paginatedSql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
      }

      const result = await request("/api/query/sql", { stmt: paginatedSql });
      return result || [];
    } catch (error) {
      console.error("执行自定义SQL失败:", error);
      return [];
    }
  }

  // 跳转到指定块
  async openBlock(blockId: string): Promise<void> {
    try {
      const { openTab } = await import("siyuan");
      await openTab({
        app: plugin.app,
        doc: {
          id: blockId,
        },
      });
    } catch (error) {
      console.error("打开块失败:", error);
    }
  }

  // 切换面板显示状态
  togglePanel(): void {
    this.isPanelVisible = !this.isPanelVisible;

    if (this.panelInstance && typeof this.panelInstance.setVisible === 'function') {
      this.panelInstance.setVisible(this.isPanelVisible);
    }
  }

  // 刷新面板数据
  refreshPanel(): void {
    if (this.panelInstance && typeof this.panelInstance.refresh === 'function') {
      this.panelInstance.refresh();
    }
  }
}
