<script lang="ts">
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-epub-reader");
  import { isMobile, plugin } from "@/utils";
  import ePub from "epubjs";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { sql, updateBlock } from "../api";
  import { AnnotationManager } from "./annotation-manager";
  import {
    bindDocToEpub,
    copyToClipboard,
    generateAnnotationId,
    getBoundDocId,
    getReadingProgress,
    insertAnnotation,
    removeAnnotation,
    saveReadingProgress,
    updateAnnotationColor,
  } from "./annotation-service";
  import SelectionToolbar from "./SelectionToolbar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import type {
    Annotation,
    HighlightColor,
    SelectionRect,
    SidebarTab,
    TocItem,
    TocPosition,
  } from "./types";
  import { HIGHLIGHT_COLORS } from "./types";
  import {
    getCfiFromSelection,
    hasValidSelection,
    parseLocationFromUrl,
  } from "./utils";
  import { extractChapterIdFromCfi } from "./epub-utils";

  // Props
  export let src: string | File | ArrayBuffer | null = null;
  export let url: string | null = null;
  export let initialCfi: string | null = null;
  export let storedKey = "epub-last-location";
  export const width = "100%";
  export const height = "100%";
  export const tocPosition: TocPosition = "left";
  export const highlightStyle = "background: #ffeb3b;";

  const dispatch = createEventDispatcher();

  let containerEl: HTMLDivElement;
  let toc: TocItem[] = [];
  let title = "";
  let progress = 0;
  let book: any = null;
  let rendition: any = null;
  let currentCfi: string | null = null;
  let isReady = false;
  let isLoading = false;
  let loadingProgress = 0;
  let loadingMessage = "";
  let errorMessage = "";
  let fontSize = 100;
  let theme = "light";
  let sidebarVisible = false;
  let sidebarTab: SidebarTab = "toc";
  let selectionToolbarVisible = false;
  let selectionRect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };
  let currentSelection: {
    text: string;
    cfiRange: string;
    range: Range | null;
  } | null = null;
  let showRemoveButton = false;
  let selectedAnnotation: Annotation | null = null;
  let showColorPicker = false;
  let colorPickerAnnotation: Annotation | null = null;
  let colorPickerRect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };

  // View mode: 'paginated' or 'scrolled'
  let viewMode: "paginated" | "scrolled" = "scrolled";

  // Annotation state
  let annotations: Annotation[] = [];
  let boundDocId = "";
  let epubPath = "";
  let annotationManager: AnnotationManager | null = null;

  let fileInput: HTMLInputElement;

  // 阅读进度保存优化 - 节流相关变量
  let lastSavedProgress = 0;
  let lastSavedTime = 0;
  let saveProgressTimer: NodeJS.Timeout | null = null;

  // 配置参数
  const SAVE_PROGRESS_THROTTLE_MS = 2000; // 2秒节流
  const SAVE_PROGRESS_THRESHOLD = 1; // 进度变化阈值1%

  // 阅读体验参数
  const DEFAULT_LINE_HEIGHT = 1.6; // 默认行高

  function jumpTo(cfi: string) {
    if (!rendition) return;

    // 清除 selected / toolbar 状态
    selectionToolbarVisible = false;
    showRemoveButton = false;
    selectedAnnotation = null;

    // formatStyle();

    // 直接跳转到指定 CFI
    rendition.display(cfi).then(() => {
      //log.info("Jumped to new CFI:", cfi);
      // Ensure event listeners are attached after jump
      // setupRenditionEvents();
    });
  }

  function openFile(file: File) {
    if (!file) {
      errorMessage = plugin.i18n["lets-epub-reader.fileNotSelected"];
      return;
    }

    //log.info("File selected:", file);
    //log.info("Selected file:", file.name, "Size:", file.size);

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".epub")) {
      errorMessage = plugin.i18n["lets-epub-reader.selectValidEpub"];
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errorMessage = plugin.i18n["lets-epub-reader.fileTooLarge"];
      return;
    }

    // log.info(
    //   "开始读取文件:",
    //   file.name,
    //   "大小:",
    //   (file.size / 1024 / 1024).toFixed(2),
    //   "MB"
    // );

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer) {
        await openBook(arrayBuffer);
      } else {
        errorMessage = plugin.i18n["lets-epub-reader.fileReadFailed"];
      }
    };
    reader.onerror = () => {
      errorMessage = plugin.i18n["lets-epub-reader.fileReadFailed"];
      log.error("文件读取错误:", reader.error);
    };
    reader.readAsArrayBuffer(file);
  }

  async function openBook(source: any) {
    try {
      // Reset states
      isLoading = true;
      isReady = false;
      errorMessage = "";
      loadingProgress = 0;
      loadingMessage = plugin.i18n["lets-epub-reader.initReader"];

      // 重置阅读进度跟踪变量
      lastSavedProgress = 0;
      lastSavedTime = 0;
      if (saveProgressTimer) {
        clearTimeout(saveProgressTimer);
        saveProgressTimer = null;
      }

      // Cleanup previous book
      if (rendition) {
        try {
          rendition.destroy();
        } catch (e) {
          log.warn("清理之前的渲染器失败:", e);
        }
        rendition = null;
      }
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          log.warn("清理之前的书籍失败:", e);
        }
        book = null;
      }

      //log.info("开始加载EPUB书籍...");
      loadingMessage = plugin.i18n["lets-epub-reader.parsingEpub"];
      loadingProgress = 20;

      // Create book instance - handle URLs with fragments
      let bookSource = source;
      if (typeof source === "string" && source.includes("#")) {
        bookSource = source.split("#")[0];
      }
      book = ePub(bookSource);

      loadingMessage = plugin.i18n["lets-epub-reader.preparingRender"];
      loadingProgress = 40;

      // Create rendition with view mode
      const renderOptions: any = {
        width: "100%",
        height: "100%",
      };

      if (viewMode === "scrolled") {
        renderOptions.flow = "scrolled";
        renderOptions.manager = "continuous";
      } else {
        renderOptions.spread = "auto";
      }

      // Create rendition
      rendition = book.renderTo(containerEl, renderOptions);

      // 遍历书籍生成百分比，会卡顿一会
      await book.ready;
      await book.locations.generate();

      // Register themes
      loadingMessage = plugin.i18n["lets-epub-reader.loadingTheme"];
      loadingProgress = 50;

      rendition.themes.register("light", {
        body: { background: "#ffffff", color: "#111" },
      });
      rendition.themes.register("dark", {
        body: { background: "#0b0b0b", color: "#eee" },
      });

      // Register highlight styles for each color
      rendition.themes.default({
        "::selection": {
          background: "rgba(255, 235, 59, 0.4)",
        },
        ".epubjs-hl": {
          fill: "yellow",
          "fill-opacity": "0.3",
          "mix-blend-mode": "multiply",
        },
      });

      rendition.themes.select(theme);
      rendition.themes.fontSize(`${fontSize}%`);

      // Load navigation
      loadingMessage = plugin.i18n["lets-epub-reader.loadingToc"];
      loadingProgress = 60;

      book.loaded.navigation
        .then((nav: any) => {
          toc = nav.toc || [];
          //log.info("目录加载成功:", toc.length, "项");
        })
        .catch((err) => {
          log.warn("加载目录失败:", err);
          toc = [];
        });

      // Load metadata
      loadingMessage = plugin.i18n["lets-epub-reader.readingBookInfo"];
      loadingProgress = 70;

      book.loaded.metadata
        .then((meta: any) => {
          title = meta.title || "";
          //log.info("书籍标题:", title);
        })
        .catch((err) => {
          log.warn("读取书籍信息失败:", err);
          title = "";
        });

      //log.info("开始加载书籍标题..");
      // Load bound document
      await loadBoundDoc();
      // Get starting position
      let saved = null;
      if (boundDocId) {
        try {
          const progressData = await getReadingProgress(boundDocId);
          //log.info("📚 [阅读进度] 从数据库读取位置:", progressData);
          if (progressData && progressData.epubPath === epubPath) {
            saved = progressData.cfi;
            //log.info("📚 [阅读进度] 从文档属性读取位置:", saved);
          }
        } catch (e) {
          log.warn("读取保存位置失败:", e);
        }
      }
      const start = initialCfi || saved || undefined;

      // Display the book
      loadingMessage = plugin.i18n["lets-epub-reader.renderingContent"];
      loadingProgress = 80;

      // Set up event listeners
      if (rendition) {
        setupRenditionEvents();
      }
      // formatStyle();
      //log.info("开始显示书籍，初始位置:", start);
      await rendition.display(start);

      loadingMessage = plugin.i18n["lets-epub-reader.completingInit"];
      loadingProgress = 90;

      // Initialize annotation manager
      annotationManager = new AnnotationManager(rendition);

      //log.info("书籍显示完成，开始加载标注...");
      await loadAnnotations();

      // Apply highlights after a delay to ensure everything is ready
      setTimeout(() => {
        //log.info("开始应用标注...");
        loadAndApplyAnnotations();
      }, 500);

      isReady = true;
      isLoading = false;
      loadingProgress = 100;
      //log.info("✅ EPUB阅读器初始化完成");
    } catch (error) {
      log.error("❌ 加载EPUB失败:", error);
      isLoading = false;
      isReady = false;
      errorMessage = `${plugin.i18n["lets-epub-reader.loadingFailed"]}: ${error instanceof Error ? error.message : plugin.i18n["lets-epub-reader.unknownError"]}`;

      // Show error to user
      // if (typeof window !== "undefined" && window.siyuan?.showMessage) {
      //   window.siyuan.showMessage(errorMessage, 5000);
      // }
    }
  }

  function formatStyle() {
    // Hook to inject highlight styles into each content document
    rendition.hooks.content.register((contents: any) => {
      const doc = contents.document;

      // Remove existing highlight styles if any
      const existingStyles = doc.querySelectorAll("style[data-epub-hl]");
      existingStyles.forEach((style) => style.remove());

      const style = doc.createElement("style");
      style.setAttribute("data-epub-hl", "true");
      style.textContent = `
        /* Base highlight styles */
        .epub-hl {
          cursor: pointer;
          border-radius: 2px;
          padding: 1px 2px;
          transition: background-color 0.2s ease;
        }
        
        /* Color-specific highlight styles */
        .epub-hl-yellow { 
          background: linear-gradient(to top, #00c9ff 0, #92fe9d 30%, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0) 100%);
          color: unset;
        }
        .epub-hl-green { 
          background-color: rgba(165, 214, 167, 0.3) !important; 
        }
        .epub-hl-blue { 
          background-color: rgba(144, 202, 249, 0.3) !important; 
        }
        .epub-hl-pink { 
          background-color: rgba(244, 143, 177, 0.3) !important; 
        }
        .epub-hl-orange { 
          background-color: rgba(255, 204, 128, 0.3) !important; 
        }
        
        /* Hover effect for highlights */
        .epub-hl:hover {
          opacity: 0.8;
        }
        
        /* Selection styles */
        ::selection {
          background-color: rgba(255, 235, 59, 0.4) !important;
        }
        
        /* Line height configuration */
        body, body p, body div {
          line-height: ${DEFAULT_LINE_HEIGHT} !important;
        }
      `;
      doc.head.appendChild(style);
    });
  }
  /**
   * 优化的阅读进度保存函数 - 带节流和阈值检查
   *
   * 优化策略：
   * 1. 时间节流：至少间隔2秒才保存一次，避免频繁写入数据库
   * 2. 进度阈值：进度变化超过1%才保存，避免微小变化触发保存
   * 3. UI响应：始终派发relocated事件以保持UI实时更新
   *
   * 这样既保证了阅读位置的准确性，又大幅减少了数据库写入频率
   */

  // 优化的阅读进度保存函数 - 带节流和阈值检查
  function saveReadingProgressOptimized() {
    if (!boundDocId || !currentCfi) return;

    const now = Date.now();
    const progressDiff = Math.abs(progress - lastSavedProgress);

    // 检查是否需要保存：时间间隔超过2秒且进度变化超过1%
    const shouldSave =
      now - lastSavedTime >= SAVE_PROGRESS_THROTTLE_MS &&
      progressDiff >= SAVE_PROGRESS_THRESHOLD;

    if (shouldSave) {
      try {
        saveReadingProgress(boundDocId, epubPath, currentCfi!, progress, title);
        lastSavedProgress = progress;
        lastSavedTime = now;
        //log.info(
        //   `📚 [优化保存] 进度: ${progress}%, CFI: ${currentCfi!.substring(0, 20)}...`
        // );
      } catch (e) {
        log.warn("保存阅读位置失败:", e);
      }
    }
  }

  function setupRenditionEvents() {
    if (!rendition) return;

    rendition.on("relocated", (location: any) => {
      currentCfi = location.start.cfi;
      const cfi = location.start.cfi;
      const percentage = book.locations.percentageFromCfi(cfi);
      progress = Math.round(percentage * 100);
      // 使用优化的保存函数
      saveReadingProgressOptimized();
      // 总是派发事件以更新UI
      dispatch("relocated", { cfi: currentCfi, progress });
    });

    rendition.on("rendered", (section: any) => {
      const contents = rendition.getContents();
      for (let content of contents) {
        content.document.addEventListener("selectionchange", handleSelection);
        content.document.addEventListener("mouseup", handleSelectionEnd);
        content.document.addEventListener("keyup", handleSelection);
      }

      // Re-apply highlights after render (only for current chapter)
      if (annotations.length > 0 && annotationManager) {
        //log.info(
        //   "页面渲染完成，重新应用标注，标注数量:",
        //   annotations.length
        // );
        setTimeout(() => {
          // Use chapter-specific rendering for better performance
          const createClickHandler = (annotation: Annotation) => {
            return (e: any) => handleHighlightClick(annotation, e);
          };

          const result = annotationManager.applyCurrentChapterHighlights(
            annotations,
            createClickHandler
          );
          //log.info(
          //   "✅ [章节渲染] 完成 - 成功应用:",
          //   result.success,
          //   "失败:",
          //   result.failed
          // );
        }, 100); // Small delay to ensure DOM is ready
      }

      dispatch("rendered", { section });
    });

    rendition.on("started", () => {
      //log.info("渲染开始");
      dispatch("started");
    });

    rendition.on("failed", (error: any) => {
      log.error("渲染失败:", error);
      errorMessage = `${plugin.i18n["lets-epub-reader.loadingFailed"]}: ${error.message || error}`;
      isLoading = false;
    });

    formatStyle();
    // Add global event listeners
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleGlobalClick);
  }

  async function loadBoundDoc() {
    //log.info("Loading bound document for EPUB:", epubPath);
    if (epubPath) {
      const docId = await getBoundDocId(epubPath);
      if (docId) {
        boundDocId = docId;
      }
    }
  }

  async function loadAnnotations() {
    // Use hardcoded docId as requested

    try {
      //log.info("Loading annotations for docId:", boundDocId);

      // Query all blocks containing 标注
      const blocks = await sql(
        `SELECT id, markdown FROM blocks WHERE root_id='${boundDocId}' AND type = 'p' AND markdown LIKE '%epub#epubcfi(%'`
      );

      //log.info("Found blocks with annotations:", blocks?.length || 0);

      // Parse annotations from blocks
      const loadedAnnotations: Annotation[] = [];
      for (const block of blocks || []) {
        const annotation = parseAnnotationFromMarkdown(
          block.id,
          block.markdown
        );
        if (annotation) {
          loadedAnnotations.push(annotation);
        }
      }

      annotations = loadedAnnotations;
      //log.info("Loaded annotations:", annotations);
    } catch (e) {
      log.error("Failed to load annotations:", e);
      annotations = [];
    }
  }

  /**
   * Load and apply all annotations for the current book
   */
  function loadAndApplyAnnotations() {
    if (!annotationManager || !annotations.length) {
      //log.info("📋 [标注加载] 跳过：没有管理器或标注");
      return;
    }

    //log.info("📋 [标注加载] 开始应用标注，数量:", annotations.length);

    // Create click handler for annotations
    const createClickHandler = (annotation: Annotation) => {
      return (e: any) => handleHighlightClick(annotation, e);
    };

    // Use chapter-specific rendering for better performance
    const result = annotationManager.applyCurrentChapterHighlights(
      annotations,
      createClickHandler
    );
    //log.info(
    //   "✅ [标注加载] 完成 - 成功应用:",
    //   result.success,
    //   "失败:",
    //   result.failed
    // );
  }

  function handleHighlightClick(annotation: Annotation, e: MouseEvent) {
    //log.info("📍 [点击标注] 处理点击事件", {
    //   annotationId: annotation.id,
    //   annotationText: annotation.text,
    //   annotationColor: annotation.color,
    //   hasBlockId: !!annotation.blockId,
    // });

    colorPickerAnnotation = annotation;
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Find the iframe element and get its position
    const iframe = containerEl?.querySelector("iframe");
    let iframeOffset = { top: 0, left: 0 };
    if (iframe) {
      const iframeRect = iframe.getBoundingClientRect();
      iframeOffset = { top: iframeRect.top, left: iframeRect.left };
    }

    // 计算颜色选择器位置 - 在点击位置上方
    colorPickerRect = {
      top: rect.top, //+ iframeOffset.top - 80,
      left: rect.left + rect.width / 2 - 100, //+ iframeOffset.left + rect.width / 2 - 100,
      width: 200,
      height: 60,
    };

    showColorPicker = true;
    //log.info("🎨 [颜色选择器] 显示在位置", colorPickerRect);

    // 隐藏其他工具栏
    selectionToolbarVisible = false;
    showRemoveButton = false;
    selectedAnnotation = null;

    // 创建关闭颜色选择器的函数
    const closeColorPicker = () => {
      showColorPicker = false;
      document.removeEventListener("click", closeColorPickerHandler);

      // 移除iframe监听器
      const iframes = containerEl.querySelectorAll("iframe");
      iframes.forEach((iframe) => {
        try {
          if (iframe.contentDocument) {
            iframe.contentDocument.removeEventListener(
              "click",
              closeColorPickerHandler
            );
          }
        } catch (e) {
          //log.info("无法移除iframe监听器:", e);
        }
      });
    };

    // 创建事件处理函数
    const closeColorPickerHandler = (event: MouseEvent) => {
      const target = event.target as Element;
      const isColorPicker = target.closest(".hover-color-picker");

      if (!isColorPicker) {
        closeColorPicker();
      }
    };

    // 添加主文档监听器
    document.addEventListener("click", closeColorPickerHandler);

    // 添加iframe监听器
    const iframes = containerEl.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        if (iframe.contentDocument) {
          iframe.contentDocument.addEventListener(
            "click",
            closeColorPickerHandler
          );
        }
      } catch (e) {
        //log.info("无法访问iframe内容:", e);
      }
    });
  }

  async function handleColorChange(
    event: CustomEvent<{ color: HighlightColor }>
  ) {
    if (!colorPickerAnnotation || !colorPickerAnnotation.blockId) {
      log.error("❌ [颜色更改] 缺少标注信息", { colorPickerAnnotation });
      return;
    }

    const { color } = event.detail;
    //log.info("🎨 [颜色更改] 开始处理", {
    //   annotationId: colorPickerAnnotation.id,
    //   newColor: color,
    //   blockId: colorPickerAnnotation.blockId,
    // });

    try {
      const annotation = annotations.find(
        (a) => a.id === colorPickerAnnotation.id
      );
      annotation.color = color;

      // 只更新当前标注的高亮
      if (annotationManager && annotation) {
        // 移除旧的高亮
        annotationManager.removeHighlightByCfi(annotation.cfiRange);
        // 创建新的点击处理器
        const clickHandler = (e: any) => handleHighlightClick(annotation, e);
        // 应用新的高亮
        annotationManager.applyHighlight(annotation, clickHandler);
        //log.info("✅ [颜色更改] 高亮更新已触发");
      }

      //log.info("✅ [颜色更改] 本地状态已更新");

      // 更新数据库中的标注
      await updateAnnotationInDatabase(annotation.blockId, color);
      //log.info("✅ [颜色更改] 数据库已更新");

      //log.info(
      //   "🎉 [颜色更改] 标注颜色已更新完成:",
      //   colorPickerAnnotation.id,
      //   color
      // );
    } catch (e) {
      log.error("❌ [颜色更改] 更新标注颜色失败:", e);
    }

    // showColorPicker = false;
    // colorPickerAnnotation = null;
  }

  async function updateAnnotationInDatabase(
    blockId: string,
    newColor: HighlightColor
  ) {
    return updateAnnotationColor(blockId, newColor);
  }

  function handleGlobalClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Handle global clicks if needed in the future
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isReady) return;
    if (viewMode === "paginated") {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        next();
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        prev();
        e.preventDefault();
      }
    }
  }

  function next() {
    if (!rendition) return;
    rendition.next();
  }

  function prev() {
    if (!rendition) return;
    rendition.prev();
  }

  function goToToc(item: TocItem) {
    if (!item || !item.href) return;
    rendition.display(item.href);
  }

  function goToAnnotation(annotation: Annotation) {
    if (!rendition || !annotation.cfiRange) return;
    rendition.display(annotation.cfiRange);
  }

  function setFontSize(percent: string | number) {
    fontSize = Number(percent);
    if (rendition) rendition.themes.fontSize(`${fontSize}%`);
  }

  function handleFontSizeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    setFontSize(target.value);
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) openFile(file);
  }

  function toggleTheme() {
    theme = theme === "light" ? "dark" : "light";
    if (rendition) rendition.themes.select(theme);
  }

  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
  }

  function toggleViewMode() {
    viewMode = viewMode === "paginated" ? "scrolled" : "paginated";
    // Re-open book with new view mode
    if (book && src) {
      const currentLocation = currentCfi;
      if (src instanceof File) {
        openFile(src);
      } else if (src instanceof ArrayBuffer) {
        openBook(src);
      } else {
        openBook(src);
      }
      // Navigate to previous location after reload
      if (currentLocation) {
        setTimeout(() => {
          rendition?.display(currentLocation);
        }, 500);
      }
    }
  }

  function handleSelection() {
    if (!rendition) return;
    const contents = rendition.getContents();
    let hasSelection = false;

    for (let content of contents) {
      const selection = content.window.getSelection();
      if (hasValidSelection(selection)) {
        hasSelection = true;
        const range = selection.getRangeAt(0);
        const text = selection.toString();
        const cfiRange = getCfiFromSelection(book, content, selection);

        currentSelection = { text, cfiRange, range };

        // Get selection rect - need to adjust for iframe position
        const rect = range.getBoundingClientRect();

        // Find the iframe element and get its position
        const iframe = containerEl?.querySelector("iframe");
        let iframeOffset = { top: 0, left: 0 };
        if (iframe) {
          const iframeRect = iframe.getBoundingClientRect();
          iframeOffset = { top: iframeRect.top, left: iframeRect.left };
        }

        selectionRect = {
          top: rect.top + iframeOffset.top,
          left: rect.left + iframeOffset.left,
          width: rect.width,
          height: rect.height,
        };

        showRemoveButton = false;
        selectedAnnotation = null;
        break;
      }
    }

    selectionToolbarVisible = hasSelection;
  }

  function handleSelectionEnd() {
    // Small delay to ensure selection is complete
    setTimeout(handleSelection, 50);
  }

  async function handleHighlight(
    event: CustomEvent<{ color: HighlightColor }>
  ) {
    if (!currentSelection || !boundDocId) {
      if (!boundDocId) {
        alert(plugin.i18n["lets-epub-reader.bindDoc"]);
        sidebarTab = "settings";
        sidebarVisible = true;
      }
      return;
    }

    const { color } = event.detail;

    // Extract chapter ID from CFI for efficient rendering
    const chapterId = book
      ? extractChapterIdFromCfi(book, currentSelection.cfiRange)
      : null;

    const annotation: Annotation = {
      id: generateAnnotationId(),
      type: "highlight",
      text: currentSelection.text,
      cfiRange: currentSelection.cfiRange,
      epubCfi: currentSelection.cfiRange,
      color,
      chapterId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Apply highlight using annotation manager with click handler
    if (annotationManager) {
      const clickHandler = (e: any) => handleHighlightClick(annotation, e);
      const success = annotationManager.applyHighlight(
        annotation,
        clickHandler
      );
      if (!success) {
        log.warn(
          "Failed to apply highlight using annotation manager:",
          annotation.id
        );
      }
    }

    // Insert into Siyuan document
    const blockId = await insertAnnotation(annotation, epubPath, boundDocId);
    if (blockId) {
      annotation.blockId = blockId;
      annotations = [...annotations, annotation];
      //log.info("Annotation saved to Siyuan:", annotation.id);
    }

    selectionToolbarVisible = false;
    clearSelection();
  }

  async function handleNote(event: CustomEvent<{ color: HighlightColor }>) {
    if (!currentSelection || !boundDocId) {
      if (!boundDocId) {
        alert(plugin.i18n["lets-epub-reader.bindDoc"]);
        sidebarTab = "settings";
        sidebarVisible = true;
      }
      return;
    }

    const { color } = event.detail;

    // Extract chapter ID from CFI for efficient rendering
    const chapterId = book
      ? extractChapterIdFromCfi(book, currentSelection.cfiRange)
      : null;

    const annotation: Annotation = {
      id: generateAnnotationId(),
      type: "note",
      text: currentSelection.text,
      cfiRange: currentSelection.cfiRange,
      epubCfi: currentSelection.cfiRange,
      color,
      chapterId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Apply highlight using annotation manager with click handler
    if (annotationManager) {
      const clickHandler = (e: any) => handleHighlightClick(annotation, e);
      const success = annotationManager.applyHighlight(
        annotation,
        clickHandler
      );
      if (!success) {
        log.warn(
          "Failed to apply note highlight using annotation manager:",
          annotation.id
        );
      }
    }

    // Insert into Siyuan document
    const blockId = await insertAnnotation(annotation, epubPath, boundDocId);
    if (blockId) {
      annotation.blockId = blockId;
      annotations = [...annotations, annotation];
      //log.info("Note annotation saved to Siyuan:", annotation.id);

      // Open float layer for note editing
      setTimeout(() => {
        openFloatLayer(blockId);
      }, 300);
    }

    selectionToolbarVisible = false;
    clearSelection();
  }

  function openFloatLayer(blockId: string) {
    if (plugin && plugin.addFloatLayer) {
      try {
        plugin.addFloatLayer({
          refDefs: [{ refID: blockId }],
          x: window.innerWidth - 768 - 120,
          y: 100,
          isBacklink: false,
        });
      } catch (e2) {
        log.warn("Fallback float layer also failed:", e2);
      }
    }
  }

  async function handleCopy() {
    if (!currentSelection) return;
    await copyToClipboard(currentSelection.text);
    selectionToolbarVisible = false;
    clearSelection();
  }

  async function handleCopyAnnotation() {
    if (colorPickerAnnotation) {
      await copyToClipboard(colorPickerAnnotation.text);
    }
  }

  /**
   * Handles quick highlight functionality with improved iOS compatibility
   * and enhanced error handling
   */
  function handleQuickHighlight() {
    try {
      // Validate basic prerequisites
      if (!isReady) {
        log.warn("📖 Reader is not ready yet");
        return;
      }

      if (!boundDocId) {
        log.warn("📝 Please bind a document first");
        this?.showMessage?.(plugin.i18n["lets-epub-reader.bindDoc"], "warning");
        return;
      }

      // Get selection with iOS compatibility fallback
      const selectionInfo = getSelectionInfo();

      if (!selectionInfo.isValid) {
        //log.info("📝 Please select text first");
        if (selectionInfo.error) {
          log.warn("Selection error:", selectionInfo.error);
        }
        return;
      }

      // Update currentSelection state for consistency
      currentSelection = {
        text: selectionInfo.text,
        cfiRange: selectionInfo.cfiRange,
        range: selectionInfo.range,
      };

      // Validate selection content
      if (!selectionInfo.text || selectionInfo.text.trim().length === 0) {
        log.warn("📝 Selected text is empty");
        return;
      }

      // Validate CFI range
      if (!selectionInfo.cfiRange) {
        log.warn("📍 Could not get CFI range for selection");
        return;
      }

      // Trigger highlight with default color using native event
      const highlightEvent = new CustomEvent("highlight", {
        detail: {
          color: HIGHLIGHT_COLORS[0],
          selection: selectionInfo, // Pass selection info for debugging
        },
        bubbles: true,
        cancelable: true,
      });

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        handleHighlight(highlightEvent);
      });
    } catch (error) {
      log.error("❌ Error in handleQuickHighlight:", error);
      // Optionally show user-friendly error message
      this?.showMessage?.(plugin.i18n["lets-epub-reader.quickHighlightError"], "error");
    }
  }

  /**
   * Gets selection information with iOS compatibility
   * Falls back to native selection if currentSelection is unavailable
   */
  function getSelectionInfo(): {
    isValid: boolean;
    text: string;
    cfiRange: string;
    range: Range | null;
    error?: string;
  } {
    // Primary method: Use currentSelection state
    if (currentSelection && currentSelection.text) {
      return {
        isValid: true,
        text: currentSelection.text,
        cfiRange: currentSelection.cfiRange,
        range: currentSelection.range,
      };
    }

    // Fallback method: Check native selection directly (for iOS compatibility)
    try {
      if (!rendition) {
        return {
          isValid: false,
          text: "",
          cfiRange: "",
          range: null,
          error: "No rendition available",
        };
      }

      const contents = rendition.getContents();

      for (const content of contents) {
        const selection = content.window.getSelection();

        if (hasValidSelection(selection)) {
          const range = selection.getRangeAt(0);
          const text = selection.toString();
          const cfiRange = getCfiFromSelection(book, content, selection);

          return {
            isValid: true,
            text,
            cfiRange,
            range,
          };
        }
      }

      return {
        isValid: false,
        text: "",
        cfiRange: "",
        range: null,
        error: "No valid selection found",
      };
    } catch (error) {
      log.warn("Error getting native selection:", error);
      return {
        isValid: false,
        text: "",
        cfiRange: "",
        range: null,
        error:
          error instanceof Error ? error.message : "Unknown selection error",
      };
    }
  }

  /**
   * Handles quick note functionality with improved iOS compatibility
   * and enhanced error handling
   */
  function handleQuickNote() {
    try {
      // Validate basic prerequisites
      if (!isReady) {
        log.warn("📖 Reader is not ready yet");
        return;
      }

      if (!boundDocId) {
        log.warn("📝 Please bind a document first");
        this?.showMessage?.(plugin.i18n["lets-epub-reader.bindDoc"], "warning");
        return;
      }

      // Get selection with iOS compatibility fallback
      const selectionInfo = getSelectionInfo();

      if (!selectionInfo.isValid) {
        //log.info("📝 Please select text first");
        if (selectionInfo.error) {
          log.warn("Selection error:", selectionInfo.error);
        }
        return;
      }

      // Update currentSelection state for consistency
      currentSelection = {
        text: selectionInfo.text,
        cfiRange: selectionInfo.cfiRange,
        range: selectionInfo.range,
      };

      // Validate selection content
      if (!selectionInfo.text || selectionInfo.text.trim().length === 0) {
        log.warn("📝 Selected text is empty");
        return;
      }

      // Validate CFI range
      if (!selectionInfo.cfiRange) {
        log.warn("📍 Could not get CFI range for selection");
        return;
      }

      // Trigger note with default color using native event
      const noteEvent = new CustomEvent("note", {
        detail: {
          color: HIGHLIGHT_COLORS[0],
          selection: selectionInfo, // Pass selection info for debugging
        },
        bubbles: true,
        cancelable: true,
      });

      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        handleNote(noteEvent);
      });
    } catch (error) {
      log.error("❌ Error in handleQuickNote:", error);
      // Optionally show user-friendly error message
      this?.showMessage?.(plugin.i18n["lets-epub-reader.quickNoteError"], "error");
    }
  }

  async function handleRemove() {
    //log.info("Removing annotation:", colorPickerAnnotation);
    if (colorPickerAnnotation && colorPickerAnnotation.blockId) {
      const success = await removeAnnotation(colorPickerAnnotation.blockId);
      if (success) {
        annotationManager.removeHighlight(colorPickerAnnotation);
        // Remove from local state
        // annotations = annotations.filter(
        //   (a) => a.id !== colorPickerAnnotation!.id
        // );

        // // Remove highlight using annotation manager
        // if (annotationManager) {
        //   annotationManager.removeHighlightByCfi(colorPickerAnnotation.cfiRange);
        // }
      }
    }

    selectionToolbarVisible = false;
    selectedAnnotation = null;
    showRemoveButton = false;
  }

  function parseAnnotationFromMarkdown(
    blockId: string,
    markdown: string
  ): Annotation | null {
    try {
      //log.info("=== PARSING ANNOTATION ===");
      //log.info("Block ID:", blockId);
      //log.info("Markdown:", markdown);

      // Extract link from the markdown
      const linkMatch = markdown.match(
        /(.*)\[(.*)\]\(((?:[^()]|\([^()]*\))*)\)(.*)/
      );
      if (!linkMatch) {
        log.warn("❌ No link found in markdown");
        return null;
      }

      const link = linkMatch[3];
      //log.info("✅ Extracted link:", link);

      // Parse location string to get CFI, blockId and bgColor
      const parsedLocation = parseLocationFromUrl(link);
      if (!parsedLocation) {
        log.warn("❌ Failed to parse location string:", link);
        return null;
      }

      const { cfiRange, blockId: annotationId, bgColor } = parsedLocation;
      //log.info(
      //   "✅ Extracted CFI:",
      //   cfiRange,
      //   "annotationId:",
      //   annotationId,
      //   "bgColor:",
      //   bgColor
      // );

      // Validate CFI format
      if (!cfiRange || cfiRange.length === 0) {
        log.error("❌ CFI is empty or invalid");
        return null;
      }

      // Extract text - everything before the link, plain text
      // const text = markdown.split("[◎]")[0].replace(/^-\s*/, "").trim();
      const text = linkMatch[1]
        ?.replace(/^-\s*/, "")
        .trim()
        .concat(linkMatch[4]?.replace(/^-\s*/, "").trim());
      //log.info("✅ Extracted text:", text);

      // Get color from bgColor or default
      const color = bgColor
        ? HIGHLIGHT_COLORS.find((c) => c.bgColor === bgColor) || {
            name: "lets-epub-reader.customColor",
            color: "#000",
            bgColor: bgColor,
          }
        : HIGHLIGHT_COLORS[0];
      //log.info("✅ Matched color:", color);

      // Extract chapter ID from CFI for efficient rendering
      const chapterId = extractChapterIdFromCfi(book, cfiRange);
      //log.info("✅ Extracted chapter ID:", chapterId);

      const annotation = {
        id: annotationId || blockId,
        type: "highlight" as const,
        text,
        cfiRange,
        epubCfi: cfiRange,
        color,
        blockId,
        chapterId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      //log.info("🎉 Final annotation object:", annotation);
      //log.info("=== PARSING COMPLETE ===");
      return annotation;
    } catch (e) {
      log.error("❌ Failed to parse annotation from markdown:", e);
      return null;
    }
  }

  function clearSelection() {
    const contents = rendition?.getContents() || [];
    for (let content of contents) {
      content.window.getSelection()?.removeAllRanges();
    }
    currentSelection = null;
  }

  async function handleBindDoc(event: CustomEvent<{ docId: string }>) {
    const { docId } = event.detail;
    const success = await bindDocToEpub(docId, epubPath);
    if (success) {
      boundDocId = docId;
      await loadAnnotations();
    }
  }

  function handleGoToToc(event: CustomEvent<{ item: TocItem }>) {
    goToToc(event.detail.item);
  }

  function handleGoToAnnotation(
    event: CustomEvent<{ annotation: Annotation }>
  ) {
    goToAnnotation(event.detail.annotation);
  }

  async function handleDeleteAnnotation(
    event: CustomEvent<{ annotation: Annotation }>
  ) {
    const { annotation } = event.detail;
    if (annotation.blockId) {
      const success = await removeAnnotation(annotation.blockId);
      if (success) {
        annotations = annotations.filter((a) => a.id !== annotation.id);

        // Remove highlight using annotation manager
        if (annotationManager) {
          annotationManager.removeHighlightByCfi(annotation.cfiRange);
        }
      }
    }
  }

  function handleJumpToBlock() {
    if (colorPickerAnnotation && colorPickerAnnotation.blockId) {
      openFloatLayer(colorPickerAnnotation.blockId);
      //log.info(colorPickerAnnotation);
      // showColorPicker = false;
      // colorPickerAnnotation = null;
    }
  }

  export function display(cfiOrHref: string) {
    if (!rendition) return;
    rendition.display(cfiOrHref);
  }

  export function getCurrentCfi() {
    return currentCfi;
  }

  /**
   * 获取阅读进度信息 - 用于销毁时保存
   */
  export function getReadingProgressInfo() {
    return {
      cfi: currentCfi,
      progress,
      boundDocId,
      epubPath,
      title,
      isReady,
    };
  }

  let prevUrl;
  $: {
    if (url && url !== prevUrl) {
      prevUrl = url;
      //log.info("url changed", url);
      const parsed = parseLocationFromUrl(url);
      if (parsed && parsed.epubPath === epubPath) {
        if (isReady) {
          //log.info("Same EPUB, jump to CFI directly:", parsed.cfiRange);
          jumpTo(parsed.cfiRange);
        } else {
          initialCfi = parsed.cfiRange;
        }
      } else {
        epubPath = parsed.epubPath;
        initialCfi = parsed.cfiRange;
        if (src) {
          if (src instanceof File) {
            openFile(src);
          } else if (src instanceof ArrayBuffer) {
            openBook(src);
          } else {
            openBook(src);
          }
        }
      }
    }
  }

  onMount(() => {
    //log.info("Reader mounted with src:", src);
    // const parsed = parseLocationFromUrl(url);
    // if (parsed && parsed.epubPath === epubPath) {
    //   if (isReady) {
    //     //log.info("Same EPUB, jump to CFI directly:", parsed.cfiRange);
    //     jumpTo(parsed.cfiRange);
    //   } else {
    //     // 书尚未 ready 的第一次加载，正常流程
    //     initialCfi = parsed.cfiRange;
    //   }
    // } else {
    //   // 不同 epub，正常 openBook
    //   epubPath = parsed.epubPath;
    //   initialCfi = parsed.cfiRange;
    //   if (src) {
    //     openBook(src);
    //   }
    // }
    // if (src) {
    //   if (src instanceof File) {
    //     openFile(src);
    //   } else if (src instanceof ArrayBuffer) {
    //     openBook(src);
    //   } else {
    //     openBook(src);
    //   }
    // }

    return () => {
      if (rendition)
        try {
          rendition.destroy();
        } catch (e) {}
      if (book)
        try {
          book.destroy();
        } catch (e) {}
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleGlobalClick);
    };
  });

  onDestroy(() => {
    try {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("click", handleGlobalClick);
      // 清理保存进度的定时器
      if (saveProgressTimer) {
        clearTimeout(saveProgressTimer);
        saveProgressTimer = null;
      }
    } catch (e) {}
  });
</script>

<div class="reader-root">
  <div class="toolbar">
    <button class="toolbar-btn" on:click={toggleSidebar} title={plugin.i18n["lets-epub-reader.toggleSidebar"]}>
      {sidebarVisible ? "◀" : "▶"}
    </button>

    {#if isMobile}
      <button
        class="toolbar-btn"
        on:click={handleQuickHighlight}
        title={plugin.i18n["lets-epub-reader.highlight"]}
        disabled={!isReady}>🖍️</button
      >

      <button
        class="toolbar-btn"
        on:click={handleQuickNote}
        title={plugin.i18n["lets-epub-reader.note"]}
        disabled={!isReady}>📝</button
      >
    {/if}

    {#if viewMode === "paginated"}
      <button
        class="toolbar-btn"
        on:click={prev}
        disabled={!isReady}
        title={plugin.i18n["lets-epub-reader.prevPage"]}>◀</button
      >
      <button
        class="toolbar-btn"
        on:click={next}
        disabled={!isReady}
        title={plugin.i18n["lets-epub-reader.nextPage"]}>▶</button
      >
    {/if}

    <!-- <div class="toolbar-group">
      <label class="toolbar-label" for="font-size">字号</label>
      <input
        id="font-size"
        type="range"
        min="60"
        max="200"
        bind:value={fontSize}
        on:input={handleFontSizeChange}
        class="font-slider"
      />
      <span class="toolbar-label">{fontSize}%</span>
    </div> -->

    <!-- <button class="toolbar-btn" on:click={toggleTheme} title="切换主题">
      {theme === "light" ? "🌙" : "☀️"}
    </button> -->

    <!-- <button class="toolbar-btn" on:click={toggleViewMode} title="切换阅读模式">
      {viewMode === "scrolled" ? "📄" : "📜"}
      <span class="btn-text">{viewMode === "scrolled" ? "翻页" : "滚动"}</span>
    </button> -->

    <div class="toolbar-spacer"></div>

    <!-- <div class="title-text" {title}>{title}</div> -->

    <div class="progress-wrapper">
      <div class="progress-bar" title="{plugin.i18n["lets-epub-reader.progress"]} {progress}%">
        <div class="progress-fill" style="width:{progress}%"></div>
      </div>
      <span class="progress-text">{progress}%</span>
    </div>

    <!-- <input
      bind:this={fileInput}
      type="file"
      accept=".epub"
      style="display:none"
      on:change={handleFileChange}
    />
    <button
      class="toolbar-btn"
      on:click={() => fileInput.click()}
      title="打开文件">📂</button
    > -->
  </div>

  <div class="main-content">
    <div class="viewer" bind:this={containerEl}></div>

    <!-- Loading overlay -->
    {#if isLoading}
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="loading-spinner">📖</div>
          <div class="loading-message">{loadingMessage}</div>
          <div class="loading-progress">
            <div class="progress-bar" style="width: {loadingProgress}%"></div>
          </div>
          <div class="loading-percentage">{loadingProgress}%</div>
        </div>
      </div>
    {/if}

    <!-- Error display -->
    {#if errorMessage}
      <div class="error-overlay">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-message">{errorMessage}</div>
          <button class="error-btn" on:click={() => (errorMessage = "")}
            >{plugin.i18n["lets-epub-reader.close"]}</button
          >
        </div>
      </div>
    {/if}

    <Sidebar
      {toc}
      {annotations}
      activeTab={sidebarTab}
      {epubPath}
      {boundDocId}
      visible={sidebarVisible}
      on:goToToc={handleGoToToc}
      on:goToAnnotation={handleGoToAnnotation}
      on:deleteAnnotation={handleDeleteAnnotation}
      on:bindDoc={handleBindDoc}
      on:close={() => (sidebarVisible = false)}
    />
  </div>

  <SelectionToolbar
    visible={selectionToolbarVisible || showColorPicker}
    rect={showColorPicker ? colorPickerRect : selectionRect}
    showRemove={showRemoveButton}
    {showColorPicker}
    on:highlight={handleHighlight}
    on:note={handleNote}
    on:copy={handleCopy}
    on:remove={handleRemove}
    on:colorChange={handleColorChange}
    on:jumpToBlock={handleJumpToBlock}
    on:removeAnnotationBlock={handleRemove}
    on:copyAnnotation={handleCopyAnnotation}
  />
</div>

<style>
  .reader-root {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 40px);
    width: 100%;
    position: relative;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 8px 12px;
    min-height: 44px;
    border-bottom: 1px solid var(--b3-border-color, #e1e5e9);
    background: var(--b3-theme-background, #fff);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: none;
    border-radius: 4px;
    background: var(--b3-theme-surface, #f3f4f6);
    color: var(--b3-theme-on-surface, #374151);
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--b3-theme-primary-light, #e5e7eb);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-text {
    font-size: 12px;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .toolbar-label {
    font-size: 12px;
    color: var(--b3-theme-on-surface, #6b7280);
  }

  .font-slider {
    width: 80px;
    accent-color: var(--b3-theme-primary, #3b82f6);
  }

  .toolbar-spacer {
    flex: 1;
    min-width: 20px;
  }

  .title-text {
    max-width: 200px;
    font-size: 13px;
    color: var(--b3-theme-on-surface, #6b7280);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .progress-bar {
    width: 100px;
    height: 6px;
    background: var(--b3-theme-surface, #e1e5e9);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 11px;
    color: var(--b3-theme-on-surface, #6b7280);
    min-width: 32px;
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
    position: relative;
  }

  .viewer {
    flex: 1;
    min-width: 0;
    min-height: 0;
    background: var(--b3-theme-background, white);
    overflow: hidden;
  }

  /* Ensure epub.js container fills the viewer */
  .viewer :global(.epub-container) {
    height: 100% !important;
  }

  .viewer :global(iframe) {
    border: none !important;
  }

  /* Loading overlay styles */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .loading-content {
    text-align: center;
    padding: 32px;
    background: var(--b3-theme-background, white);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--b3-border-color, #e1e5e9);
    min-width: 280px;
  }

  .loading-spinner {
    font-size: 48px;
    margin-bottom: 16px;
    animation: bounce 1.5s infinite;
  }

  @keyframes bounce {
    0%,
    20%,
    50%,
    80%,
    100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  .loading-message {
    font-size: 16px;
    color: var(--b3-theme-on-background, #333);
    margin-bottom: 20px;
    font-weight: 500;
  }

  .loading-progress {
    width: 100%;
    height: 8px;
    background: var(--b3-theme-surface, #f3f4f6);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .loading-progress .progress-bar {
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--b3-theme-primary, #3b82f6),
      var(--b3-theme-primary-light, #60a5fa)
    );
    border-radius: 4px;
    transition: width 0.3s ease;
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: 200px 0;
    }
  }

  .loading-percentage {
    font-size: 14px;
    color: var(--b3-theme-on-surface, #666);
    font-weight: 500;
  }

  /* Error overlay styles */
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    backdrop-filter: blur(4px);
  }

  .error-content {
    text-align: center;
    padding: 32px;
    background: var(--b3-theme-background, white);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--b3-theme-error, #dc3545);
    min-width: 320px;
    max-width: 400px;
  }

  .error-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .error-message {
    font-size: 16px;
    color: var(--b3-theme-error, #dc3545);
    margin-bottom: 24px;
    line-height: 1.5;
    font-weight: 500;
  }

  .error-btn {
    padding: 12px 24px;
    background: var(--b3-theme-error, #dc3545);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s;
  }

  .error-btn:hover {
    background: var(--b3-theme-error-light, #c82333);
  }
</style>
