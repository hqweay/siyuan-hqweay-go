import {
  Dialog,
  fetchSyncPost,
  Menu,
  openTab,
  Plugin,
  showMessage,
} from "siyuan";

import { SubPluginBase } from "@/libs/sub-plugin-base";

import Reader from "./Reader.svelte";

import { isMobile, plugin } from "@/utils";
import { parseLocationFromUrl } from "./utils";
import { saveReadingProgress } from "./annotation-service";

export default class EpubReaderPlugin extends SubPluginBase {
  private _isEnabled = false;

  id = "hqweay-epub-reader";
  get label() { return this.t("lets-epub-reader.displayName"); }
  icon = "📖";
  type = "barMode";

  private epubReaderInstance: any = null;

  private globalReaderState = {
    currentFile: null as File | null,
    currentUrl: "" as string,
  };

  constructor() {
    super();
    this.id = "hqweay-epub-reader";
    this.icon = "📖";
    this.type = "barMode";
  }

  async exec() {
    // 打开 EPUB 文件选择对话框
    this.openEpubFileSelector();
  }

  override async onload() {
    const that = this;

    // 设置 EPUB 点击监听
    this.setupEpubClickHandler();
  }
  onLayoutReady(): void {}

  override onunload() {
    // 清理资源
    if (this.epubReaderInstance) {
      this.epubReaderInstance.$destroy();
      this.epubReaderInstance = null;
    }

    // 清理事件监听器
    if ((this as any).epubClickHandler) {
      window.removeEventListener("click", (this as any).epubClickHandler, true);
      window.removeEventListener(
        "click",
        (this as any).epubClickHandler,
        false
      );
      (this as any).epubClickHandler = null;
    }

    // 清理更新事件监听器
    if ((this as any).updateListener) {
      window.removeEventListener(
        "epub-reader-update",
        (this as any).updateListener as EventListener
      );
      (this as any).updateListener = null;
    }
  }

  /**
   * 设置 EPUB 点击监听
   */
  private setupEpubClickHandler() {
    // 监听文档点击事件 - 使用捕获阶段以确保优先处理
    // console.log("设置 EPUB 点击监听");

    // 使用捕获阶段并确保在冒泡阶段也能捕获
    const handleClick = (e: MouseEvent) => {
      // console.log("EPUB 点击事件被触发");
      this.handleEpubClick(e);
    };

    // 添加到捕获阶段
    window.addEventListener("click", handleClick, true);

    // 也添加到冒泡阶段以确保兼容性
    window.addEventListener("click", handleClick, false);

    // 存储引用以便后续清理
    (this as any).epubClickHandler = handleClick;
  }

  /**
   * 处理 EPUB 点击事件
   * @param e 点击事件
   */
  private async handleEpubClick(e: MouseEvent) {
    // console.log("处理 EPUB 点击事件 - 开始");
    // console.log("事件目标:", e.target);
    // console.log("当前目标:", e.currentTarget);

    const target = e.target as HTMLElement;

    // 匹配用户指定的模式
    const linkEl = target.matches('span[data-type="a"]')
      ? target
      : target.closest('a[href], [data-href], span[data-type="a"]');

    // console.log("找到的链接元素:", linkEl);

    const url =
      linkEl?.getAttribute("data-href") || linkEl?.getAttribute("href");

    if (!url) {
      // console.log("没有找到 URL");
      return;
    }

    // console.log("提取的 URL:", url);
    // console.log("提取的 URL:", url);
    // console.log("是否为 EPUB 文件:", this.isEpubFileUrl(url));

    if (!url || !this.isEpubFileUrl(url)) {
      // console.log("不是 EPUB 文件，跳过处理");
      return;
    }

    // console.log("阻止默认行为和事件传播");
    e.preventDefault();
    e.stopPropagation();

    if (url) {
      // console.log("打开阅读器标签页");
      //通过url获取真实的filePath
      const parsed = parseLocationFromUrl(url);
      const file = await this.fetchFile(parsed.epubPath);

      // 更新全局状态
      // this.globalReaderState.currentFile = file;
      // this.globalReaderState.currentUrl = url;
      // console.log(this.globalReaderState.currentUrl);

      let fileName = parsed.epubPath
        ?.replace("assets/", "")
        ?.replace(".epub", "");
      fileName =
        fileName?.length > 10 ? fileName?.slice(0, 10) + "…" : fileName;

      if (isMobile) {
        let dialog = new Dialog({
          // 如果大于10位，截断
          title: fileName,
          content: `<div id="hqweay-epub-reader-container" style="height: 700px;"></div>`,
          width: "400px",
          destroyCallback: (options) => {
            // 保存阅读进度
            try {
              const progressInfo = pannel.getReadingProgressInfo();
              if (progressInfo.isReady && progressInfo.boundDocId && progressInfo.cfi) {
                saveReadingProgress(
                  progressInfo.boundDocId,
                  progressInfo.epubPath,
                  progressInfo.cfi,
                  progressInfo.progress,
                  progressInfo.title
                );
              }
            } catch (e) {
              console.warn("保存阅读进度失败:", e);
            }
            pannel.$destroy();
          },
        });
        // 创建Reader组件，使用全局状态
        let pannel = new Reader({
          target: dialog.element.querySelector("#hqweay-epub-reader-container"),
          props: {
            src: file,
            url: url,
          },
        });
      } else {
        if (this.epubReaderInstance) {
          this.epubReaderInstance.$set({
            src: file,
            url: url,
          });
        } else {
          let that = this;
          plugin.addTab({
            type: "_epub_reader_tab",
            init() {
              let tabDiv = document.createElement("div");
              tabDiv.setAttribute("id", "hqweay-epub-reader-container");
              const reader = new Reader({
                target: tabDiv,
                props: {
                  src: file,
                  url: url,
                },
              });
              that.epubReaderInstance = reader;
              this.element.appendChild(tabDiv);
            },
            destroy() {
              // 保存阅读进度
              try {
                const progressInfo = that.epubReaderInstance?.getReadingProgressInfo();
                if (progressInfo?.isReady && progressInfo?.boundDocId && progressInfo?.cfi) {
                  saveReadingProgress(
                    progressInfo.boundDocId,
                    progressInfo.epubPath,
                    progressInfo.cfi,
                    progressInfo.progress,
                    progressInfo.title
                  );
                }
              } catch (e) {
                console.warn("保存阅读进度失败:", e);
              }
              that.epubReaderInstance.$destroy();
              that.epubReaderInstance = null;
            },
          });
          await openTab({
            app: plugin.app,
            custom: {
              icon: "📖",
              title: `${parsed.epubPath}`,
              data: {},
              id: `${plugin.name}_epub_reader_tab`,
            },
            position: "right",
          });
        }
      }
    } else {
      console.log("无法获取文件对象");
    }
  }

  /**
   * 加载嵌入式阅读器
   * @param block 块元素
   * @param url EPUB URL
   */
  private async loadEmbeddedReader(block: HTMLElement, url: string) {
    try {
      // 这里可以实现嵌入式阅读器加载逻辑
      console.log("加载嵌入式阅读器:", url);

      // 创建嵌入式阅读器容器
      const container = document.createElement("div");
      container.className = "embedded-epub-reader";
      block.appendChild(container);

      // 创建 EPUB 阅读器组件 - 传递完整路径
      const fullEpubPath = this.getFullAssetPath(url);
      console.log("嵌入式阅读器完整 EPUB 路径:", fullEpubPath);

      // const embeddedReader = new EpubReader({
      //   target: container,
      //   props: {
      //     epubPath: fullEpubPath, // 传递完整路径
      //     onClose: () => {
      //       container.remove();
      //     },
      //   },
      // });
      const embeddedReader = new Reader({
        target: container,
        props: {
          src: fullEpubPath, // 传递完整路径
        },
      });
    } catch (error) {
      console.error("加载嵌入式阅读器失败:", error);
      showMessage(this.t("lets-epub-reader.loadEmbeddedFailed"), 3000);
    }
  }

  /**
   * 检查是否为 EPUB 文件 URL
   * @param url URL 地址
   * @returns 是否为 EPUB 文件
   */
  private isEpubFileUrl(url: string): boolean {
    // 清理 URL，移除查询参数和片段标识符
    const cleanUrl = url.split(/[?#]/)[0];

    // 检查是否包含 assets/ 路径（支持 assets/ 或 assets/assets/ 等情况）
    const hasAssetsPath = cleanUrl.includes("assets/");

    // 检查是否以 .epub 结尾
    const isEpubExtension = cleanUrl.toLowerCase().endsWith(".epub");

    return hasAssetsPath && isEpubExtension;
  }

  /**
   * 打开 EPUB 文件选择器
   */
  private async openEpubFileSelector() {
    try {
      // 获取所有 EPUB 文件列表
      const epubFiles = await this.getEpubFilesFromAssets();

      if (epubFiles.length === 0) {
        showMessage(this.t("lets-epub-reader.noEpubFiles"), 3000);
        return;
      }

      // 创建菜单显示 EPUB 文件列表
      const menu = new Menu("hqweay-epub-menu");

      epubFiles.forEach((file) => {
        menu.addItem({
          label: this.getDisplayName(file.path),
          click: () => {
            this.openEpubInNewTab(file.path);
          },
        });
      });

      // 显示菜单
      const btn = document.getElementById(this.id);
      if (btn) {
        const rect = btn.getBoundingClientRect();
        menu.open({
          x: rect.left,
          y: rect.bottom,
        });
      }
    } catch (error) {
      console.error("获取 EPUB 文件列表失败:", error);
      showMessage(this.t("lets-epub-reader.fetchEpubFailed"), 3000);
    }
  }

  /**
   * 获取所有 EPUB 文件列表
   * @returns EPUB 文件列表
   */
  private async getEpubFilesFromAssets(): Promise<
    Array<{ path: string; name: string }>
  > {
    try {
      // 查询所有 EPUB 文件
      const result = await fetchSyncPost("/api/sql/getSql", {
        stmt: `SELECT path, name FROM assets WHERE path LIKE '%.epub' ORDER BY name COLLATE NOCASE`,
      });

      return result.data || [];
    } catch (error) {
      console.error("查询 EPUB 文件失败:", error);
      return [];
    }
  }

  /**
   * 获取显示名称
   * @param path 文件路径
   * @returns 显示名称
   */
  private getDisplayName(path: string): string {
    // 提取文件名
    const parts = path.split("/");
    const filename = parts[parts.length - 1];

    // 移除文件扩展名和时间戳
    return filename.replace(/\.epub$/, "").replace(/-\d{14}-\w+$/, "");
  }

  /**
   * 在新标签页中打开 EPUB 文件
   * @param epubPath EPUB 文件路径
   */
  private async openEpubInNewTab(epubPath: string) {
    try {
      // 获取当前工作区
      const workspace = window.siyuan.workspace;

      // 创建新标签页
      const tab = workspace.createTab({
        app: {
          id: "hqweay-epub-reader",
          name: this.t("lets-epub-reader.tabName"),
          icon: "📖",
        },
        data: {
          epubPath: epubPath,
        },
      });

      // 在新标签页中渲染 EPUB 阅读器
      await this.renderEpubReader(tab, epubPath);

      showMessage(`${this.t("lets-epub-reader.openingEpub")}${this.getDisplayName(epubPath)}`, 3000);
    } catch (error) {
      console.error("打开 EPUB 文件失败:", error);
      showMessage(this.t("lets-epub-reader.openFailed"), 3000);
    }
  }

  /**
   * 渲染 EPUB 阅读器
   * @param tab 标签页对象
   * @param epubPath EPUB 文件路径
   */
  private async renderEpubReader(tab: any, epubPath: string) {
    try {
      // 获取标签页容器
      const tabContainer = tab.element.querySelector(".layout__tab");

      if (!tabContainer) {
        throw new Error("无法找到标签页容器");
      }

      // 清空容器
      tabContainer.innerHTML = "";

      // 创建 EPUB 阅读器组件 - 传递完整路径
      const fullEpubPath = this.getFullAssetPath(epubPath);
      console.log("完整 EPUB 路径:", fullEpubPath);

      this.epubReaderInstance = new Reader({
        target: tabContainer,
        props: {
          src: fullEpubPath, // 传递完整路径
        },
      });
    } catch (error) {
      console.error("渲染 EPUB 阅读器失败:", error);
      showMessage(this.t("lets-epub-reader.renderEpubFailed"), 3000);
    }
  }

  /**
   * 加载 EPUB 文件
   * @param epubPath EPUB 文件路径
   */
  private async loadEpubFile(epubPath: string) {
    try {
      // 获取 EPUB 文件的完整路径
      const fullPath = this.getFullAssetPath(epubPath);

      // 使用 epub.js 加载 EPUB 文件
      const book = (window as any).ePub(fullPath);

      // 渲染 EPUB 内容
      await book.ready;

      // 这里可以添加 EPUB 渲染逻辑
      console.log("EPUB 文件加载成功:", book);

      // 通知组件 EPUB 加载完成
      if (this.epubReaderInstance) {
        this.epubReaderInstance.$set({
          book: book,
          loaded: true,
        });
      }
    } catch (error) {
      console.error("加载 EPUB 文件失败:", error);
      showMessage(this.t("lets-epub-reader.loadEpubFailed"), 3000);
    }
  }

  /**
   * 获取完整的资源路径
   * @param assetPath 资源路径
   * @returns 完整路径
   */
  private getFullAssetPath(assetPath: string): string {
    // 思源笔记的资源存储在工作区的 data 目录下
    const workspaceDir = window.siyuan.config.system.workspaceDir;
    return `${workspaceDir}/data${assetPath}`;
  }

  /**
   * 清理 EPUB 阅读器
   */
  private cleanupEpubReader() {
    if (this.epubReaderInstance) {
      this.epubReaderInstance.$destroy();
      this.epubReaderInstance = null;
    }
  }

  /**
   * 初始化插件
   * @param plugin 插件实例
   */
  public init(plugin: Plugin) {
    // 可以在这里进行一些初始化工作
    console.log("EPUB Reader plugin initialized");

    // 确保 epub.js 已经加载
    this.ensureEpubJsLoaded();
  }

  /**
   * 确保 epub.js 已经加载
   */
  private ensureEpubJsLoaded() {
    // 检查 epub.js 是否已经加载
    if (typeof (window as any).ePub === "undefined") {
      // 动态加载 epub.js
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js";
      script.onload = () => {
        console.log("epub.js 加载成功");
      };
      script.onerror = () => {
        console.error("epub.js 加载失败");
        showMessage(this.t("lets-epub-reader.epubJsLoadFailed"), 5000);
      };
      document.head.appendChild(script);
    }
  }

  public fetchFile = async (url: string) =>
    fetch(url.startsWith("http") || url.startsWith("/") ? url : `/${url}`)
      .then(async (r) =>
        r.ok
          ? new File(
              [await r.blob()],
              url.split("/").pop()?.split("?")[0] || "book"
            )
          : null
      )
      .catch(() => null);
}
