<script lang="ts">
  import type { SelectionRect, HighlightColor, ToolbarAction } from './types';
  import { HIGHLIGHT_COLORS } from './types';
  import { createEventDispatcher } from 'svelte';

  export let visible = false;
  export let rect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };
  export let showRemove = false;
  export let showColorPicker = false;


  const dispatch = createEventDispatcher<{
    highlight: { color: HighlightColor };
    note: { color: HighlightColor };
    copy: void;
    remove: void;
    colorChange: { color: HighlightColor };
    jumpToBlock: void;
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

  function handleColorChange(color: HighlightColor) {
    dispatch('colorChange', { color });
  }

  function handleJumpToBlock() {
    dispatch('jumpToBlock');
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
    role="toolbar"
    aria-label="EPUB阅读工具栏"
    tabindex="0"
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

      {#if showColorPicker}
        <button class="action-btn jump-btn" on:click={handleJumpToBlock} title="跳转到笔记">
          📍
        </button>
      {/if}

      <!-- 悬浮颜色选择器 -->
      {#if showColorPicker}
        <div class="hover-color-picker">
          <div class="color-picker-title">更改颜色</div>
          <div class="color-options">
            {#each HIGHLIGHT_COLORS as color}
              <button
                class="color-btn"
                style="background-color: {color.bgColor}"
                title={color.name}
                on:click={() => handleColorChange(color)}
              >
                ✓
              </button>
            {/each}
          </div>
        </div>
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

  .jump-btn:hover {
    background: #cce5ff;
  }

  .hover-color-picker {
    position: absolute;
    top: -60px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--b3-theme-background, white);
    border: 1px solid var(--b3-border-color, #e1e5e9);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    padding: 8px;
    z-index: 10001;
    min-width: 120px;
  }

  .hover-color-picker .color-picker-title {
    font-size: 10px;
    color: var(--b3-theme-on-surface, #666);
    margin-bottom: 4px;
    text-align: center;
  }

  .hover-color-picker .color-options {
    display: flex;
    gap: 4px;
    justify-content: center;
  }

  .hover-color-picker .color-btn {
    width: 20px;
    height: 20px;
    border: 1px solid #ddd;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #333;
  }

  .hover-color-picker .color-btn:hover {
    transform: scale(1.2);
    border-color: var(--b3-theme-primary, #3b82f6);
  }
</style>
