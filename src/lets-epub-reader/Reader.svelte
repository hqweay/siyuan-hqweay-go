<script lang="ts">
  import { plugin } from "@/utils";
  import ePub from "epubjs";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { sql, updateBlock } from "../api";
  import { AnnotationManager } from "./annotation-manager";
  import {
    bindDocToEpub,
    copyToClipboard,
    generateAnnotationId,
    getBoundDocId,
    insertAnnotation,
    removeAnnotation,
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

  // 当 url 变化时，判断是同一本书还是新的书
  $: if (url) {
    console.log("Parsing URL:", url);
    if (url) {
      const parsed = parseLocationFromUrl(url);

      console.log("parsed:", parsed);
      console.log("epubPath:", epubPath);
      console.log("isReady:", isReady);
      if (parsed && parsed.epubPath === epubPath) {
        // 同一本书 → 不 openBook，直接跳转
        console.log("111111");
        if (isReady) {
          console.log("Same EPUB, jump to CFI directly:", parsed.cfiRange);
          jumpTo(parsed.cfiRange);
        } else {
          // 书尚未 ready 的第一次加载，正常流程
          initialCfi = parsed.cfiRange;
        }
      } else {
        // 不同 epub，正常 openBook
        epubPath = parsed.epubPath;
        initialCfi = parsed.cfiRange;
        if (src) openBook(src);
      }
    }
  }
  function jumpTo(cfi: string) {
    if (!rendition) return;

    // 清除 selected / toolbar 状态
    selectionToolbarVisible = false;
    showRemoveButton = false;
    selectedAnnotation = null;

    // 直接跳转到指定 CFI
    rendition.display(cfi).then(() => {
      console.log("Jumped to new CFI:", cfi);
      // Ensure event listeners are attached after jump
      setupRenditionEvents();
    });
  }

  function openFile(file: File) {
    if (!file) {
      errorMessage = "未选择文件";
      return;
    }

    console.log("File selected:", file);
    console.log("Selected file:", file.name, "Size:", file.size);

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".epub")) {
      errorMessage = "请选择有效的EPUB文件";
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errorMessage = "文件过大，请选择小于100MB的EPUB文件";
      return;
    }

    console.log(
      "开始读取文件:",
      file.name,
      "大小:",
      (file.size / 1024 / 1024).toFixed(2),
      "MB"
    );

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      if (arrayBuffer) {
        await openBook(arrayBuffer);
      } else {
        errorMessage = "文件读取失败";
      }
    };
    reader.onerror = () => {
      errorMessage = "文件读取失败";
      console.error("文件读取错误:", reader.error);
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
      loadingMessage = "正在初始化阅读器...";

      // Cleanup previous book
      if (rendition) {
        try {
          rendition.destroy();
        } catch (e) {
          console.warn("清理之前的渲染器失败:", e);
        }
        rendition = null;
      }
      if (book) {
        try {
          book.destroy();
        } catch (e) {
          console.warn("清理之前的书籍失败:", e);
        }
        book = null;
      }

      console.log("开始加载EPUB书籍...");
      loadingMessage = "正在解析EPUB文件...";
      loadingProgress = 20;

      // Create book instance - handle URLs with fragments
      let bookSource = source;
      if (typeof source === "string" && source.includes("#")) {
        bookSource = source.split("#")[0];
      }
      book = ePub(bookSource);

      loadingMessage = "正在准备渲染...";
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

      // Register themes
      loadingMessage = "正在加载主题...";
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
      loadingMessage = "正在加载目录...";
      loadingProgress = 60;

      book.loaded.navigation
        .then((nav: any) => {
          toc = nav.toc || [];
          console.log("目录加载成功:", toc.length, "项");
        })
        .catch((err) => {
          console.warn("加载目录失败:", err);
          toc = [];
        });

      // Load metadata
      loadingMessage = "正在读取书籍信息...";
      loadingProgress = 70;

      book.loaded.metadata
        .then((meta: any) => {
          title = meta.title || "";
          console.log("书籍标题:", title);
        })
        .catch((err) => {
          console.warn("读取书籍信息失败:", err);
          title = "";
        });

      // Get starting position
      let saved = null;
      try {
        saved = localStorage.getItem(storedKey);
      } catch (e) {
        console.warn("读取保存位置失败:", e);
      }
      const start = initialCfi || saved || undefined;

      // Display the book
      loadingMessage = "正在渲染内容...";
      loadingProgress = 80;

      console.log("开始显示书籍，初始位置:", start);
      await rendition.display(start);

      loadingMessage = "正在完成初始化...";
      loadingProgress = 90;

      isReady = true;
      isLoading = false;
      loadingProgress = 100;

      // Initialize annotation manager
      annotationManager = new AnnotationManager(rendition);

      // Load bound document
      await loadBoundDoc();

      console.log("书籍显示完成，开始加载标注...");
      await loadAnnotations();

      // Apply highlights after a delay to ensure everything is ready
      setTimeout(() => {
        console.log("开始应用标注...");
        loadAndApplyAnnotations();
      }, 1000);

      console.log("✅ EPUB阅读器初始化完成");
    } catch (error) {
      console.error("❌ 加载EPUB失败:", error);
      isLoading = false;
      isReady = false;
      errorMessage = `加载EPUB失败: ${error instanceof Error ? error.message : "未知错误"}`;

      // Show error to user
      if (typeof window !== "undefined" && window.siyuan?.showMessage) {
        window.siyuan.showMessage(errorMessage, 5000);
      }
    }

    // Set up event listeners
    if (rendition) {
      setupRenditionEvents();
    }
  }

  function setupRenditionEvents() {
    if (!rendition) return;

    rendition.on("relocated", (location: any) => {
      currentCfi = location.start.cfi;
      const at = location.start.percentage || 0;
      progress = Math.round(at * 100);
      try {
        localStorage.setItem(storedKey, currentCfi!);
      } catch (e) {
        console.warn("保存阅读位置失败:", e);
      }
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
        console.log(
          "页面渲染完成，重新应用标注，标注数量:",
          annotations.length
        );
        setTimeout(() => {
          // Use chapter-specific rendering for better performance
          const createClickHandler = (annotation: Annotation) => {
            return (e: any) => handleHighlightClick(annotation, e);
          };

          const result = annotationManager.applyCurrentChapterHighlights(
            annotations,
            createClickHandler
          );
          console.log(
            "✅ [章节渲染] 完成 - 成功应用:",
            result.success,
            "失败:",
            result.failed
          );
        }, 100); // Small delay to ensure DOM is ready
      }

      dispatch("rendered", { section });
    });

    rendition.on("started", () => {
      console.log("渲染开始");
      dispatch("started");
    });

    rendition.on("failed", (error: any) => {
      console.error("渲染失败:", error);
      errorMessage = `渲染失败: ${error.message || error}`;
      isLoading = false;
    });

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
          background-color: rgba(255, 235, 59, 0.3) !important; 
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
      `;
      doc.head.appendChild(style);
    });

    // Add global event listeners
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("click", handleGlobalClick);
  }

  async function loadBoundDoc() {
    console.log("Loading bound document for EPUB:", epubPath);
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
      console.log("Loading annotations for docId:", boundDocId);

      // Query all blocks containing 标注
      const blocks = await sql(
        `SELECT id, markdown FROM blocks WHERE root_id='${boundDocId}' AND type = 'p' AND markdown LIKE '%epub#epubcfi(%'`
      );

      console.log("Found blocks with annotations:", blocks?.length || 0);

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
      console.log("Loaded annotations:", annotations);
    } catch (e) {
      console.error("Failed to load annotations:", e);
      annotations = [];
    }
  }

  /**
   * Load and apply all annotations for the current book
   */
  function loadAndApplyAnnotations() {
    if (!annotationManager || !annotations.length) {
      console.log("📋 [标注加载] 跳过：没有管理器或标注");
      return;
    }

    console.log("📋 [标注加载] 开始应用标注，数量:", annotations.length);

    // Create click handler for annotations
    const createClickHandler = (annotation: Annotation) => {
      return (e: any) => handleHighlightClick(annotation, e);
    };

    // Use chapter-specific rendering for better performance
    const result = annotationManager.applyCurrentChapterHighlights(
      annotations,
      createClickHandler
    );
    console.log(
      "✅ [标注加载] 完成 - 成功应用:",
      result.success,
      "失败:",
      result.failed
    );
  }

  function handleHighlightClick(annotation: Annotation, e: MouseEvent) {
    console.log("📍 [点击标注] 处理点击事件", {
      annotationId: annotation.id,
      annotationText: annotation.text,
      annotationColor: annotation.color,
      hasBlockId: !!annotation.blockId,
    });

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
    console.log("🎨 [颜色选择器] 显示在位置", colorPickerRect);

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
          console.log("无法移除iframe监听器:", e);
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
        console.log("无法访问iframe内容:", e);
      }
    });
  }

  async function handleColorChange(
    event: CustomEvent<{ color: HighlightColor }>
  ) {
    if (!colorPickerAnnotation || !colorPickerAnnotation.blockId) {
      console.error("❌ [颜色更改] 缺少标注信息", { colorPickerAnnotation });
      return;
    }

    const { color } = event.detail;
    console.log("🎨 [颜色更改] 开始处理", {
      annotationId: colorPickerAnnotation.id,
      newColor: color,
      blockId: colorPickerAnnotation.blockId,
    });

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
        console.log("✅ [颜色更改] 高亮更新已触发");
      }

      console.log("✅ [颜色更改] 本地状态已更新");

      // 更新数据库中的标注
      await updateAnnotationInDatabase(annotation.blockId, color);
      console.log("✅ [颜色更改] 数据库已更新");

      console.log(
        "🎉 [颜色更改] 标注颜色已更新完成:",
        colorPickerAnnotation.id,
        color
      );
    } catch (e) {
      console.error("❌ [颜色更改] 更新标注颜色失败:", e);
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
        alert("请先在设置中绑定文档");
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
        console.warn(
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
      console.log("Annotation saved to Siyuan:", annotation.id);
    }

    selectionToolbarVisible = false;
    clearSelection();
  }

  async function handleNote(event: CustomEvent<{ color: HighlightColor }>) {
    if (!currentSelection || !boundDocId) {
      if (!boundDocId) {
        alert("请先在设置中绑定文档");
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
        console.warn(
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
      console.log("Note annotation saved to Siyuan:", annotation.id);

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
        console.warn("Fallback float layer also failed:", e2);
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

  async function handleRemove() {
    console.log("Removing annotation:", colorPickerAnnotation);
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
      console.log("=== PARSING ANNOTATION ===");
      console.log("Block ID:", blockId);
      console.log("Markdown:", markdown);

      // Extract link from the markdown
      const linkMatch = markdown.match(
        /(.*)\[(.*)\]\(((?:[^()]|\([^()]*\))*)\)(.*)/
      );
      if (!linkMatch) {
        console.warn("❌ No link found in markdown");
        return null;
      }

      const link = linkMatch[3];
      console.log("✅ Extracted link:", link);

      // Parse location string to get CFI, blockId and bgColor
      const parsedLocation = parseLocationFromUrl(link);
      if (!parsedLocation) {
        console.warn("❌ Failed to parse location string:", link);
        return null;
      }

      const { cfiRange, blockId: annotationId, bgColor } = parsedLocation;
      console.log(
        "✅ Extracted CFI:",
        cfiRange,
        "annotationId:",
        annotationId,
        "bgColor:",
        bgColor
      );

      // Validate CFI format
      if (!cfiRange || cfiRange.length === 0) {
        console.error("❌ CFI is empty or invalid");
        return null;
      }

      // Extract text - everything before the link, plain text
      // const text = markdown.split("[◎]")[0].replace(/^-\s*/, "").trim();
      const text = linkMatch[1]
        ?.replace(/^-\s*/, "")
        .trim()
        .concat(linkMatch[4]?.replace(/^-\s*/, "").trim());
      console.log("✅ Extracted text:", text);

      // Get color from bgColor or default
      const color = bgColor
        ? HIGHLIGHT_COLORS.find((c) => c.bgColor === bgColor) || {
            name: "自定义",
            color: "#000",
            bgColor: bgColor,
          }
        : HIGHLIGHT_COLORS[0];
      console.log("✅ Matched color:", color);

      // Extract chapter ID from CFI for efficient rendering
      const chapterId = extractChapterIdFromCfi(book, cfiRange);
      console.log("✅ Extracted chapter ID:", chapterId);

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

      console.log("🎉 Final annotation object:", annotation);
      console.log("=== PARSING COMPLETE ===");
      return annotation;
    } catch (e) {
      console.error("❌ Failed to parse annotation from markdown:", e);
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
      console.log(colorPickerAnnotation);
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

  onMount(() => {
    console.log("Reader mounted with src:", src);
    if (src) {
      if (src instanceof File) {
        openFile(src);
      } else if (src instanceof ArrayBuffer) {
        openBook(src);
      } else {
        openBook(src);
      }
    }

    // console.log("Initial CFI from URL:", initialCfi);
    // rendition.display(initialCfi);

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
    } catch (e) {}
  });
</script>

<div class="reader-root">
  <div class="toolbar">
    <button class="toolbar-btn" on:click={toggleSidebar} title="切换侧栏">
      {sidebarVisible ? "◀" : "▶"}
    </button>

    {#if viewMode === "paginated"}
      <button
        class="toolbar-btn"
        on:click={prev}
        disabled={!isReady}
        title="上一页">◀</button
      >
      <button
        class="toolbar-btn"
        on:click={next}
        disabled={!isReady}
        title="下一页">▶</button
      >
    {/if}

    <div class="toolbar-group">
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
    </div>

    <button class="toolbar-btn" on:click={toggleTheme} title="切换主题">
      {theme === "light" ? "🌙" : "☀️"}
    </button>

    <button class="toolbar-btn" on:click={toggleViewMode} title="切换阅读模式">
      {viewMode === "scrolled" ? "📄" : "📜"}
      <span class="btn-text">{viewMode === "scrolled" ? "翻页" : "滚动"}</span>
    </button>

    <div class="toolbar-spacer"></div>

    <div class="title-text" {title}>{title}</div>

    <div class="progress-wrapper">
      <div class="progress-bar" title="进度 {progress}%">
        <div class="progress-fill" style="width:{progress}%"></div>
      </div>
      <span class="progress-text">{progress}%</span>
    </div>

    <input
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
    >
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
            >关闭</button
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
    gap: 8px;
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
