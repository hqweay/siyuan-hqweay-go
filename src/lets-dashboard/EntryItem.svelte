<script>
  import { copyToClipboard } from "@/lets-epub-reader/annotation-service";
  import { openByUrl } from "@/myscripts/syUtils";
  import { plugin } from "@/utils";
  import { Protyle, showMessage } from "siyuan";
  import { onMount } from "svelte";
  export let blockId;
  export let isExpanded = true;
  export let fixedHeight = true;
  export let showTitle = true;
  export let index = 0; // 当前项的索引
  export let onCollapsed = null; // 关闭时的回调，用于调整滚动位置

  let container;
  let wrapperElement; // wrapper 元素引用

  // 处理折叠按钮点击
  function handleToggleCollapse() {
    isExpanded = !isExpanded;
    if (isExpanded) {
      // 从展开变为关闭，调用回调
      if (onCollapsed) {
        setTimeout(() => {
          onCollapsed(index, wrapperElement);
        }, 500); // 等待动画完成
      }
    }
  }

  onMount(() => {
    try {
      if (Protyle && container) {
        new Protyle(plugin.app, container, {
          blockId: blockId,
          action: ["cb-get-focus"],
          render: {
            title: true,
            titleShowTop: false,
            hideTitleOnZoom: false,
            gutter: true,
            scroll: true,
            breadcrumb: true,
            breadcrumbDocName: true,
          },
        });
      } else {
        // Fallback: show a simple link if Protyle is not available
        if (container) {
          container.innerHTML = `<a href=\"siyuan://blocks/${blockId}\">打开块 ${blockId}</a>`;
        }
      }
    } catch (err) {
      console.error("EntryItem mount error", err);
    }
  });
</script>

<div class="entry-item-wrapper" bind:this={wrapperElement}>
  <div class="entry-item-header sticky">
    <button
      class="toggle-btn"
      on:click={handleToggleCollapse}
      title={isExpanded ? "折叠" : "展开"}
    >
      <span class="arrow">{isExpanded ? "➡️" : "⬇️"}</span>
    </button>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span
      class="entry-id"
      on:click={() => {
        copyToClipboard(blockId);
        showMessage(`id:${blockId}复制到剪贴板～`);
      }}>{blockId}</span
    >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <span
      class="entry-id"
      on:click={() => {
        openByUrl(`${blockId}`);
      }}>🚀</span
    >
    <button
      class="toggle-btn"
      on:click={() => {
        fixedHeight = !fixedHeight;
      }}
      title={fixedHeight ? "固定高度" : "展开"}
    >
      <span class="arrow">{fixedHeight ? "🔒" : "🔧"}</span>
    </button>
  </div>
  <div
    class="entry-item"
    bind:this={container}
    class:expanded={isExpanded}
    class:fixed-height={fixedHeight}
    class:not-show-title={!showTitle}
  />
</div>

<style lang="scss">
  :global(.not-show-title .protyle-title) {
    display: none;
  }

  .entry-item-wrapper {
    position: relative;
    height: 100%;
  }

  .entry-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    // background: rgba(255, 255, 255, 0.06);
    background-color: var(--b3-theme-surface);
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
    margin-bottom: 5px;
    z-index: 10;

    &.sticky {
      position: sticky;
      top: 0;
    }
  }
  .fixed-height {
    max-height: 300px;
    overflow: hidden;
  }

  .entry-item-header:hover {
    // background: rgba(255, 255, 255, 0.1);
  }

  .toggle-btn {
    background: none;
    border: none;
    color: #ffd700;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .arrow {
    font-size: 0.7rem;
    transition: transform 0.2s;
  }

  .arrow.expanded {
    transform: rotate(90deg);
  }

  .entry-id {
    font-size: 0.85rem;
    /* color: rgba(255, 255, 255, 0.7); */
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .entry-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 12px;
    min-height: 60px;
    overflow: hidden;
    transition:
      max-height 0.3s ease,
      opacity 0.3s ease,
      margin-top 0.3s ease;
  }
  .expanded {
    max-height: 0;
    padding: 0 8px;
    margin-top: 0;
    opacity: 0;
    min-height: 0;
  }
  :global(.entry-item .protyle-breadcrumb) {
    background-color: unset;
  }
</style>
