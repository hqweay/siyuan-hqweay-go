<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import ePub from "epubjs";
  import { appendBlock, deleteBlock, sql } from "../api";
  import Toc from "./Toc.svelte";
  import SelectionToolbar from "./SelectionToolbar.svelte";
  import Sidebar from "./Sidebar.svelte";
  import type {
    TocItem,
    SelectionRect,
    TocPosition,
    Annotation,
    HighlightColor,
    SidebarTab,
  } from "./types";
  import { HIGHLIGHT_COLORS } from "./types";
  import {
    getSelectionRect,
    hasValidSelection,
    applyHighlightStyle,
    getCfiFromSelection,
    parseLocationFromUrl,
  } from "./utils";
  import {
    generateAnnotationId,
    insertAnnotation,
    removeAnnotation,
    getBoundDocId,
    bindDocToEpub,
    queryAnnotations,
    copyToClipboard,
    buildLocationString,
  } from "./annotation-service";
  import { plugin } from "@/utils";

  // Props
  export let src: string | File | ArrayBuffer | null = null;
  export let url: string | null = null;
  export let initialCfi: string | null = null;
  export let storedKey = "epub-last-location";
  export let width = "100%";
  export let height = "100%";
  export let tocPosition: TocPosition = "left";
  export let highlightStyle = "background: #ffeb3b;";

  const dispatch = createEventDispatcher();

  let containerEl: HTMLDivElement;
  let toc: TocItem[] = [];
  let title = "";
  let progress = 0;
  let book: any = null;
  let rendition: any = null;
  let currentCfi: string | null = null;
  let isReady = false;
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

  // View mode: 'paginated' or 'scrolled'
  let viewMode: "paginated" | "scrolled" = "scrolled";

  // Annotation state
  let annotations: Annotation[] = [];
  let boundDocId = "";
  let epubPath = "";
  let highlightsApplied = false;

  let fileInput: HTMLInputElement;

  // Parse initial CFI from URL if present
  // $: if (url && typeof url === "string") {
  //   console.log("Parsing URL:", url);
  //   const parsed = parseLocationFromUrl(url);
  //   if (parsed) {
  //     epubPath = parsed.epubPath;
  //     // if (parsed.cfiRange && !initialCfi) {
  //     if (parsed.cfiRange) {
  //       initialCfi = parsed.cfiRange;
  //     }
  //   } else {
  //     epubPath = url;
  //   }
  // }
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

    // 直接 jump，而不是 openBook()
    rendition.display(cfi).then(() => {
      console.log("Jumped to new CFI:", cfi);

      // re-apply highlights (必要)
      highlightsApplied = false;
      setTimeout(applyStoredHighlights, 300);
    });
  }

  function openFile(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      await openBook(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  async function openBook(source: any) {
    // Reset highlights applied flag when opening new book
    console.log("openBook");
    highlightsApplied = false;

    if (rendition) {
      try {
        rendition.destroy();
      } catch (e) {}
      rendition = null;
    }
    if (book) {
      try {
        book.destroy();
      } catch (e) {}
      book = null;
    }

    book = ePub(source);

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

    rendition = book.renderTo(containerEl, renderOptions);

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

    book.loaded.navigation
      .then((nav: any) => {
        toc = nav.toc || [];
      })
      .catch(() => {
        toc = [];
      });

    book.loaded.metadata
      .then((meta: any) => {
        title = meta.title || "";
      })
      .catch(() => {});

    let saved = null;
    try {
      saved = localStorage.getItem(storedKey);
    } catch (e) {}
    const start = initialCfi || saved || undefined;

    console.log("Displaying book with start:", start);
    rendition.display(start).then(async () => {
      isReady = true;
      // Load bound document
      await loadBoundDoc();

      console.log("Book displayed, loading annotations...");
      await loadAnnotations();

      // Apply highlights after a longer delay to ensure everything is ready
      setTimeout(() => {
        console.log("Applying highlights after extended delay...");
        applyStoredHighlights();
      }, 1000);
    });

    rendition.on("relocated", (location: any) => {
      currentCfi = location.start.cfi;
      const at = location.start.percentage || 0;
      progress = Math.round(at * 100);
      try {
        localStorage.setItem(storedKey, currentCfi!);
      } catch (e) {}
      dispatch("relocated", { cfi: currentCfi, progress });

      // Re-apply highlights when navigating to ensure they're visible
      if (annotations.length > 0 && !highlightsApplied) {
        setTimeout(() => {
          applyStoredHighlights();
        }, 300); // Delay to ensure page content is rendered
      }
    });

    rendition.on("rendered", (section: any) => {
      const contents = rendition.getContents();
      for (let content of contents) {
        content.document.addEventListener("selectionchange", handleSelection);
        content.document.addEventListener("mouseup", handleSelectionEnd);
        content.document.addEventListener("keyup", handleSelection);
      }

      // Re-apply highlights after render - but only if we have annotations to apply and haven't applied yet
      if (annotations.length > 0 && !highlightsApplied) {
        console.log(
          "Re-applying highlights after render, annotations count:",
          annotations.length
        );
        setTimeout(() => {
          applyStoredHighlights();
        }, 100); // Small delay to ensure DOM is ready
      }

      dispatch("rendered", { section });
    });

    rendition.on("started", () => {
      dispatch("started");
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

    window.addEventListener("keydown", handleKeydown);
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

      // Query all blocks containing ◎ symbol
      const blocks = await sql(
        `SELECT id, markdown FROM blocks WHERE root_id='${boundDocId}' AND type = 'p' AND markdown LIKE '%◎%'`
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

  function applyStoredHighlights() {
    if (!rendition || !annotations.length) {
      console.log(
        "Cannot apply highlights: rendition or annotations not ready"
      );
      return;
    }

    // Prevent duplicate application
    if (highlightsApplied) {
      console.log("Highlights already applied, skipping...");
      return;
    }

    console.log("Applying stored highlights, count:", annotations.length);

    // Wait for all content to be ready
    const contents = rendition.getContents();
    if (contents.length === 0) {
      console.log("No contents available, retrying in 100ms");
      setTimeout(applyStoredHighlights, 100);
      return;
    }

    // Clear existing highlights first to prevent duplicates
    try {
      // Remove all existing highlights using both CSS selectors
      const existingHighlights1 =
        contents[0]?.document.querySelectorAll(".epub-hl");
      const existingHighlights2 =
        contents[0]?.document.querySelectorAll('[class*="epub-hl"]');

      const allHighlights = new Set([
        ...existingHighlights1,
        ...existingHighlights2,
      ]);

      allHighlights.forEach((el) => {
        const textNode = contents[0].document.createTextNode(
          el.textContent || ""
        );
        el.parentNode?.replaceChild(textNode, el);
      });

      console.log(`Cleared ${allHighlights.size} existing highlights`);
    } catch (e) {
      console.warn("Failed to clear existing highlights:", e);
    }

    // Apply highlights from stored annotations using epub.js annotations API
    let appliedCount = 0;
    for (const annotation of annotations) {
      console.log(
        "Applying highlight for annotation:",
        annotation.id,
        "cfi:",
        annotation.cfiRange
      );
      try {
        applyHighlightToEpub(annotation);
        appliedCount++;
      } catch (e) {
        console.error(
          "Failed to apply highlight for annotation:",
          annotation.id,
          e
        );
      }
    }

    console.log(
      "Applied",
      appliedCount,
      "out of",
      annotations.length,
      "highlights"
    );
    highlightsApplied = true;
  }

  function applyHighlightToEpub(annotation: Annotation) {
    if (!rendition || !annotation.cfiRange) return;

    // Check if this highlight is already applied
    const contents = rendition.getContents();
    const existingHighlight = contents[0]?.document.querySelector(
      `.epub-hl-${annotation.id}`
    );
    if (existingHighlight) {
      console.log("Highlight already applied for annotation:", annotation.id);
      return;
    }

    // Map bgColor to CSS class name
    const getColorClass = (bgColor: string): string => {
      const colorMap: { [key: string]: string } = {
        "#ffeb3b": "epub-hl-yellow",
        "#a5d6a7": "epub-hl-green",
        "#90caf9": "epub-hl-blue",
        "#f48fb1": "epub-hl-pink",
        "#ffcc80": "epub-hl-orange",
      };
      return colorMap[bgColor] || "epub-hl-yellow"; // Default to yellow
    };

    const colorClass = getColorClass(annotation.color.bgColor);
    // const className = `epub-hl epub-hl-${annotation.id} ${colorClass}`;
    const className = `epub-hl-${annotation.id}`;
    rendition.annotations.highlight(
      annotation.cfiRange,
      { id: annotation.id },
      (e: any) => handleHighlightClick(annotation, e),
      className,
      {
        fill: annotation.color.bgColor,
        "fill-opacity": "0.4",
      }
    );
    console.log(
      "Highlight applied successfully using method 3:",
      annotation.id
    );
  }

  function handleHighlightClick(annotation: Annotation, e: MouseEvent) {
    selectedAnnotation = annotation;
    showRemoveButton = true;
    selectionRect = {
      top: e.clientY,
      left: e.clientX,
      width: 0,
      height: 0,
    };
    selectionToolbarVisible = true;
  }

  function applyHighlightDirectly(annotation: Annotation) {
    if (!rendition) return;

    try {
      const contents = rendition.getContents();
      for (let content of contents) {
        const doc = content.document;
        const cfi = annotation.cfiRange;

        // Find the range using CFI
        const range = content.getRange(cfi);
        if (range) {
          const highlightEl = doc.createElement("span");
          highlightEl.className = `epub-hl epub-hl-${annotation.id}`;
          highlightEl.style.cssText = `
            background-color: ${annotation.color.bgColor};
            background-opacity: 0.3;
            cursor: pointer;
          `;

          // Wrap the range contents
          const fragment = range.extractContents();
          highlightEl.appendChild(fragment);
          range.insertNode(highlightEl);

          // Add click handler
          highlightEl.addEventListener("click", (e) => {
            handleHighlightClick(annotation, e as MouseEvent);
          });

          console.log("Direct DOM highlight applied:", annotation.id);
          break;
        }
      }
    } catch (e) {
      console.error("Direct DOM highlight failed:", e);
    }
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
    const annotation: Annotation = {
      id: generateAnnotationId(),
      type: "highlight",
      text: currentSelection.text,
      cfiRange: currentSelection.cfiRange,
      epubCfi: currentSelection.cfiRange,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // First, apply highlight to epub
    try {
      rendition.annotations.add(
        "highlight",
        annotation.cfiRange,
        { id: annotation.id },
        (e: any) => handleHighlightClick(annotation, e),
        `epub-hl epub-hl-${annotation.id}`,
        {
          fill: color.bgColor,
          "fill-opacity": "0.3",
          "mix-blend-mode": "multiply",
        }
      );
      console.log("Highlight applied to epub successfully:", annotation.id);
    } catch (e) {
      console.warn("Failed to apply highlight to epub:", e);
      try {
        applyHighlightToEpub(annotation);
      } catch (e2) {
        console.warn("Fallback highlight also failed:", e2);
      }
    }

    // Then insert into Siyuan document
    const blockId = await insertAnnotation(annotation, epubPath, boundDocId);
    if (blockId) {
      annotation.blockId = blockId;
      annotations = [...annotations, annotation];
      console.log("Annotation saved to Siyuan:", annotation.id);

      // Reset highlights applied flag to allow re-application
      highlightsApplied = false;
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
    const annotation: Annotation = {
      id: generateAnnotationId(),
      type: "note",
      text: currentSelection.text,
      cfiRange: currentSelection.cfiRange,
      epubCfi: currentSelection.cfiRange,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // First, apply highlight to epub
    try {
      rendition.annotations.add(
        "highlight",
        annotation.cfiRange,
        { id: annotation.id },
        (e: any) => handleHighlightClick(annotation, e),
        `epub-hl epub-hl-${annotation.id}`,
        {
          fill: color.bgColor,
          "fill-opacity": "0.3",
          "mix-blend-mode": "multiply",
        }
      );
      console.log(
        "Note highlight applied to epub successfully:",
        annotation.id
      );
    } catch (e) {
      console.warn("Failed to apply note highlight to epub:", e);
      try {
        applyHighlightToEpub(annotation);
      } catch (e2) {
        console.warn("Fallback note highlight also failed:", e2);
      }
    }

    // Then insert into Siyuan document
    const blockId = await insertAnnotation(annotation, epubPath, boundDocId);
    if (blockId) {
      annotation.blockId = blockId;
      annotations = [...annotations, annotation];
      console.log("Note annotation saved to Siyuan:", annotation.id);

      // Reset highlights applied flag to allow re-application
      highlightsApplied = false;

      // Open float layer for note editing with delay to ensure it stays
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
          ids: [blockId],
          defIds: [],
          x: window.innerWidth - 768 - 120,
          y: 100,
          isBacklink: false,
        });
      } catch (e) {
        console.warn("Failed to open float layer:", e);
        // Fallback: try alternative API
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
  }

  async function handleCopy() {
    if (!currentSelection) return;
    await copyToClipboard(currentSelection.text);
    selectionToolbarVisible = false;
    clearSelection();
  }

  async function handleRemove() {
    if (selectedAnnotation && selectedAnnotation.blockId) {
      const success = await removeAnnotation(selectedAnnotation.blockId);
      if (success) {
        // Remove from local state
        annotations = annotations.filter(
          (a) => a.id !== selectedAnnotation!.id
        );

        // Remove highlight from epub
        try {
          rendition.annotations.remove(
            selectedAnnotation.cfiRange,
            "highlight"
          );
          console.log("Highlight removed using annotations.remove");
        } catch (e) {
          console.warn(
            "Failed to remove highlight with annotations.remove:",
            e
          );
          // Fallback: try to remove by ID
          try {
            rendition.annotations.remove(selectedAnnotation.id);
            console.log("Highlight removed using ID");
          } catch (e2) {
            console.warn("Failed to remove highlight by ID:", e2);
            // Last resort: try to remove from DOM
            removeHighlightFromDOM(selectedAnnotation);
          }
        }
      }
    }

    selectionToolbarVisible = false;
    selectedAnnotation = null;
    showRemoveButton = false;
  }

  function removeHighlightFromDOM(annotation: Annotation) {
    try {
      const contents = rendition?.getContents() || [];
      for (let content of contents) {
        const doc = content.document;
        const highlightEl = doc.querySelector(`.epub-hl-${annotation.id}`);
        if (highlightEl) {
          // Replace the highlight element with its text content
          const textNode = doc.createTextNode(highlightEl.textContent || "");
          highlightEl.parentNode?.replaceChild(textNode, highlightEl);
          console.log("Highlight removed from DOM:", annotation.id);
          break;
        }
      }
    } catch (e) {
      console.warn("Failed to remove highlight from DOM:", e);
    }
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
      const linkMatch = markdown.match(/\[◎\]\(((?:[^()]|\([^()]*\))*)\)/);
      if (!linkMatch) {
        console.warn("❌ No link found in markdown");
        return null;
      }

      const link = linkMatch[1];
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
      const text = markdown.split("[◎]")[0].replace(/^-\s*/, "").trim();
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

      const annotation = {
        id: annotationId || blockId,
        type: "highlight" as const,
        text,
        cfiRange,
        epubCfi: cfiRange,
        color,
        blockId,
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
        try {
          rendition.annotations.remove(annotation.cfiRange, "highlight");
        } catch (e) {}
      }
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
    };
  });

  onDestroy(() => {
    try {
      window.removeEventListener("keydown", handleKeydown);
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
    visible={selectionToolbarVisible}
    rect={selectionRect}
    showRemove={showRemoveButton}
    on:highlight={handleHighlight}
    on:note={handleNote}
    on:copy={handleCopy}
    on:remove={handleRemove}
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
</style>
