<script lang="ts">
  import { app } from "@frostime/siyuan-plugin-kits";
  import { Protyle } from "siyuan";
  import { onDestroy, onMount } from "svelte";

  export let blockId: string;

  let divProtyle: HTMLDivElement;
  let protyle: Protyle | undefined;
  let isPinned = localStorage.getItem("quick-input-pin") === "true";
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      // 使用较短的延迟，或者更好的方法是等待 Protyle 初始化完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      protyle = await initProtyle();

      protyle.focus();

      isLoading = false;
    } catch (err) {
      error = err.message || "未知错误";
      isLoading = false;
    }
  });

  onDestroy(() => {
    protyle?.destroy();
  });

  function togglePin() {
    isPinned = !isPinned;
    localStorage.setItem("quick-input-pin", String(isPinned));
  }

  async function initProtyle() {
    if (!divProtyle) {
      throw new Error("编辑器容器未初始化");
    }

    return new Protyle(app, divProtyle, {
      blockId: blockId,
      action: ["cb-get-focus"],
      render: {
        title: false,
        titleShowTop: false,
        hideTitleOnZoom: false,
        gutter: true,
        scroll: true,
        breadcrumb: true,
        breadcrumbDocName: true,
      },
    });
  }
</script>

<div class="window-container">
  <!-- 顶部工具栏 -->
  <div class="top-bar">
    <div class="drag-handle"></div>

    <div class="tool-group">
      <button
        class="tool-btn {isPinned ? 'active' : ''}"
        on:click={togglePin}
        title={isPinned ? "取消置顶" : "置顶"}
      >
        {#if isPinned}
          📌
        {:else}
          📍
        {/if}
      </button>
    </div>
  </div>

  <!-- 使用更可靠的条件渲染 -->
  {#if isLoading}
    <div class="status-container">
      <div class="loading-spinner"></div>
      <p>编辑器加载中...</p>
    </div>
  {:else if error}
    <div class="status-container">
      <div class="error-icon">⚠️</div>
      <p>加载失败: {error}</p>
      <button class="retry-btn" on:click={() => window.location.reload()}
        >重试</button
      >
    </div>
  {/if}
  <!-- 确保编辑器容器始终存在，但通过 display 控制 -->
  <div
    class="editor-container {isLoading ? 'hidden' : ''}"
    bind:this={divProtyle}
  />
</div>

<style>
  .window-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--b3-theme-background);
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 8px;
    background: var(--b3-theme-surface);
    border-bottom: 1px solid var(--b3-theme-border);
    user-select: none;
    -webkit-app-region: drag;
    height: 32px;
    flex-shrink: 0;
  }

  .drag-handle {
    font-size: 13px;
    font-weight: 500;
    color: var(--b3-theme-on-surface);
  }

  .tool-group {
    display: flex;
    -webkit-app-region: no-drag;
  }

  .tool-btn {
    background: transparent;
    border: none;
    padding: 4px 8px;
    margin-left: 4px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .tool-btn:hover {
    background: var(--b3-theme-surface-light);
  }

  .tool-btn.active {
    background: var(--b3-theme-primary-light);
    color: var(--b3-theme-on-primary);
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .editor-container.hidden {
    display: none;
  }

  .status-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    color: var(--b3-theme-on-surface);
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--b3-theme-surface-light);
    border-top: 3px solid var(--b3-theme-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .error-icon {
    font-size: 32px;
  }

  .retry-btn {
    padding: 8px 16px;
    background: var(--b3-theme-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .retry-btn:hover {
    background: var(--b3-theme-primary-dark);
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
