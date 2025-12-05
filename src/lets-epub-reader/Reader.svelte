<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  // epubjs（安装：npm i epubjs）
  import ePub from "epubjs";
  import { appendBlock } from "../api";
  import Toc from "./Toc.svelte";
  import SelectionToolbar from "./SelectionToolbar.svelte";
  import type { TocItem, SelectionRect, TocPosition } from "./types";
  import {
    getSelectionRect,
    hasValidSelection,
    applyHighlightStyle,
  } from "./utils";

  // Props
  export let src: string | File | ArrayBuffer | null = null; // 可为URL或ArrayBuffer或File
  export let initialCfi: string | null = null; // 可选：开始位置的CFI
  export let storedKey = "epub-last-location"; // localStorage 键
  export let width = "100%";
  export let height = "100%";
  export let tocPosition: TocPosition = "left"; // 'left' | 'right' | 'hidden'
  export let highlightStyle = "background: #ffeb3b;"; // customizable CSS for highlight
  export let docId = "20251127164735-ahnqjux"; // document ID for appending highlights

  const dispatch = createEventDispatcher();

  let containerEl: HTMLDivElement;
  let toc: TocItem[] = [];
  let title = "";
  let progress = 0; // 0-100
  let book: any = null;
  let rendition: any = null;
  let currentCfi: string | null = null;
  let isReady = false;
  let fontSize = 100; // 百分比
  let theme = "light";
  let tocVisible = false;
  let selectionToolbarVisible = false;
  let selectionRect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };

  // 处理打开文件 input
  let fileInput;

  function openFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      await openBook(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  async function openBook(source) {
    // 销毁上一本
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

    // 如果没有container，等挂载
    rendition = book.renderTo(containerEl, {
      width,
      height,
      spread: "auto",
    });

    // 主题样式
    rendition.themes.register("light", {
      body: { background: "#ffffff", color: "#111" },
    });
    rendition.themes.register("dark", {
      body: { background: "#0b0b0b", color: "#eee" },
    });

    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}%`);

    book.loaded.navigation
      .then((nav) => {
        toc = nav.toc || [];
      })
      .catch(() => {
        toc = [];
      });

    // 章节标题
    book.loaded.metadata
      .then((meta) => {
        title = meta.title || "";
      })
      .catch(() => {});

    // 定位：优先 initialCfi -> localStorage -> 默认
    let saved = null;
    try {
      saved = localStorage.getItem(storedKey);
    } catch (e) {}
    const start = initialCfi || saved || undefined;

    // 显示并绑定事件
    rendition.display(start).then(() => {
      isReady = true;
    });

    rendition.on("relocated", (location) => {
      currentCfi = location.start.cfi;
      // 计算进度
      const at = location.start.percentage || 0;
      progress = Math.round(at * 100);
      // 存储位置
      try {
        localStorage.setItem(storedKey, currentCfi);
      } catch (e) {}
      // 触发事件
      dispatch("relocated", { cfi: currentCfi, progress });
    });

    rendition.on("rendered", (section) => {
      // 渲染后可以调整一些样式或注入脚本
      const contents = rendition.getContents();
      for (let content of contents) {
        content.document.addEventListener("selectionchange", handleSelection);
        content.document.addEventListener("mouseup", handleSelection);
        content.document.addEventListener("keyup", handleSelection);
      }
      dispatch("rendered", { section });
    });

    rendition.on("started", () => {
      dispatch("started");
    });

    // 处理键盘翻页
    window.addEventListener("keydown", handleKeydown);
  }

  function handleKeydown(e) {
    if (!isReady) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      next();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      prev();
      e.preventDefault();
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

  function goToToc(item) {
    if (!item || !item.href) return;
    rendition.display(item.href);
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

  function toggleToc() {
    tocVisible = !tocVisible;
  }

  async function highlightSelection() {
    if (!rendition) return;
    const contents = rendition.getContents();
    let selectedText = "";
    let range: Range | null = null;
    for (let content of contents) {
      const selection = content.window.getSelection();
      if (hasValidSelection(selection)) {
        range = selection.getRangeAt(0);
        selectedText = selection.toString();
        break;
      }
    }
    if (!selectedText || !range) return;

    // Apply highlight style
    applyHighlightStyle(range, highlightStyle);

    // Append to Siyuan doc
    try {
      await appendBlock("markdown", `> ${selectedText}`, docId);
    } catch (e) {
      console.error("Failed to append highlight:", e);
    }

    // Hide toolbar
    selectionToolbarVisible = false;
  }

  function handleSelection() {
    if (!rendition) return;
    const contents = rendition.getContents();
    let hasSelection = false;
    for (let content of contents) {
      const selection = content.window.getSelection();
      if (hasValidSelection(selection)) {
        hasSelection = true;
        selectionRect = getSelectionRect(selection);
        break;
      }
    }
    console.log("Selection changed", hasSelection, selectionRect);
    selectionToolbarVisible = hasSelection;
  }

  // 外部控件：跳转到CFI
  export function display(cfiOrHref) {
    if (!rendition) return;
    rendition.display(cfiOrHref);
  }

  // 导出当前位置
  export function getCurrentCfi() {
    return currentCfi;
  }

  onMount(() => {
    if (src) {
      // 如果是File 或 ArrayBuffer，直接传给openBook，否则当作URL
      if (src instanceof File) {
        openFile(src);
      } else if (src instanceof ArrayBuffer) {
        openBook(src);
      } else {
        // 可能是URL
        openBook(src);
      }
    }

    return () => {
      // 清理
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

<div class="reader-root" style="margin-top: 40px;">
  <!-- Adjust for Siyuan top bar -->
  <div class="toolbar">
    <button on:click={toggleToc}>📖 目录</button>
    <button on:click={prev} disabled={!isReady}>上一页</button>
    <button on:click={next} disabled={!isReady}>下一页</button>

    <label class="small" for="font-size">字号</label>
    <input
      id="font-size"
      type="range"
      min="60"
      max="200"
      bind:value={fontSize}
      on:input={handleFontSizeChange}
    />
    <span class="small">{fontSize}%</span>

    <button on:click={toggleTheme}>切换主题（{theme}）</button>

    <div style="flex:1"></div>

    <div class="small">{title}</div>

    <div style="display:flex;align-items:center;gap:8px;margin-left:12px;">
      <div class="progress-bar" title="进度">
        <div class="progress-fill" style="width:{progress}%"></div>
      </div>
      <div class="small">{progress}%</div>
    </div>

    <input
      bind:this={fileInput}
      type="file"
      accept=".epub"
      style="display:none"
      on:change={handleFileChange}
    />
    <button on:click={() => fileInput.click()}>打开本地 EPUB</button>
  </div>

  <div class="viewer-wrapper">
    {#if tocVisible && tocPosition !== "hidden"}
      <Toc {toc} onGoToToc={goToToc} />
    {/if}
    <div class="viewer" bind:this={containerEl}></div>
  </div>
  <div class="viewer-wrapper">
    <div class="viewer" bind:this={containerEl}></div>
    <div class="toc">
      <div class="small">目录</div>
      {#if toc.length === 0}
        <div class="small">(无目录或加载中)</div>
      {/if}
      <ul>
        {#each toc as item}
          <li style="margin:4px 0">
            <a href="#" on:click|preventDefault={() => goToToc(item)}
              >{item.label}</a
            >
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <SelectionToolbar
    visible={selectionToolbarVisible}
    rect={selectionRect}
    onHighlight={highlightSelection}
  />
</div>

<style>
  .reader-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    /* font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
    background: #f8f9fa; */
  }
  .toolbar {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 16px;
    /* background: white;
    border-bottom: 1px solid #e1e5e9;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 0 0 8px 8px;
    margin-bottom: 8px; */
  }
  .viewer-wrapper {
    flex: 1 1 auto;
    display: flex;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    /* min-height: 500px; */
  }
  .viewer-wrapper.reverse {
    /* flex-direction: row-reverse; */
  }
  .viewer-wrapper.reverse .toc {
    border-left: none;
    border-right: 1px solid #e1e5e9;
  }
  .viewer {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    background: white;
    border-radius: 8px;
  }
  .progress-bar {
    width: 140px;
    height: 8px;
    background: #e1e5e9;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    width: 0%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .small {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }
  /* button {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: #f3f4f6;
    color: #374151;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  button:hover {
    background: #e5e7eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  input[type="range"] {
    accent-color: #3b82f6;
  } */
</style>
