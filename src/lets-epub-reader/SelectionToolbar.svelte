<script lang="ts">
  import type { SelectionRect, HighlightColor, ToolbarAction } from './types';
  import { HIGHLIGHT_COLORS } from './types';
  import { createEventDispatcher } from 'svelte';

  export let visible = false;
  export let rect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };
  export let showRemove = false;


  const dispatch = createEventDispatcher<{
    highlight: { color: HighlightColor };
    note: { color: HighlightColor };
    copy: void;
    remove: void;
  }>();



  function handleHighlight() {
    // 直接使用默认颜色进行标注
    dispatch('highlight', { color: HIGHLIGHT_COLORS[0] });
  }

  function handleNote() {
    // 直接使用默认颜色进行笔记
    dispatch('note', { color: HIGHLIGHT_COLORS[0] });
  }

  function handleCopy() {
    dispatch('copy');
  }

  function handleRemove() {
    dispatch('remove');
  }



  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.selection-toolbar')) {
      // Toolbar will auto-hide when selection is cleared
    }
  }

  // Calculate toolbar position - directly above the selection
  $: toolbarTop = Math.max(10, rect.top - 50);
  $: toolbarLeft = Math.max(10, Math.min(window.innerWidth - 220, rect.left + rect.width / 2 - 100));
</script>

<svelte:window on:mousedown={handleClickOutside} />

{#if visible}
  <div
    class="selection-toolbar"
    style="top: {toolbarTop}px; left: {toolbarLeft}px;"
    on:mousedown|stopPropagation
  >
    <div class="toolbar-actions">
      <button class="action-btn highlight-btn" on:click={handleHighlight} title="标注（使用默认颜色）">
        🖍️
      </button>
      
      <button class="action-btn note-btn" on:click={handleNote} title="笔记（使用默认颜色）">
        📝
      </button>
      
      <button class="action-btn copy-btn" on:click={handleCopy} title="复制">
        📋
      </button>
      
      {#if showRemove}
        <button class="action-btn remove-btn" on:click={handleRemove} title="删除">
          🗑️
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .selection-toolbar {
    position: fixed;
    background: var(--b3-theme-background, white);
    border: 1px solid var(--b3-border-color, #e1e5e9);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 6px;
    z-index: 10000;
  }

  .toolbar-actions {
    display: flex;
    gap: 2px;
    align-items: center;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    font-size: 18px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn:hover {
    background: var(--b3-theme-surface, #f3f4f6);
    transform: scale(1.1);
  }

  .highlight-btn:hover {
    background: #fff3cd;
  }

  .note-btn:hover {
    background: #d1ecf1;
  }

  .copy-btn:hover {
    background: #d4edda;
  }

  .remove-btn:hover {
    background: #f8d7da;
  }
</style>
