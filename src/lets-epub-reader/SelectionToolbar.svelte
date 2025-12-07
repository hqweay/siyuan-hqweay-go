<script lang="ts">
  import type { SelectionRect, HighlightColor, ToolbarAction } from './types';
  import { HIGHLIGHT_COLORS } from './types';
  import { createEventDispatcher } from 'svelte';

  export let visible = false;
  export let rect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };
  export let showRemove = false;
  export let selectedColor: HighlightColor = HIGHLIGHT_COLORS[0];

  const dispatch = createEventDispatcher<{
    highlight: { color: HighlightColor };
    note: { color: HighlightColor };
    copy: void;
    remove: void;
  }>();

  let showColorPicker = false;
  let pendingAction: 'highlight' | 'note' | null = null;

  function handleHighlight() {
    pendingAction = 'highlight';
    showColorPicker = true;
  }

  function handleNote() {
    pendingAction = 'note'; 
    showColorPicker = true; 
  }

  function handleCopy() {
    dispatch('copy');
  }

  function handleRemove() {
    dispatch('remove');
  }

  function selectColor(color: HighlightColor) {
    selectedColor = color;
    showColorPicker = false;
    
    if (pendingAction === 'highlight') {
      dispatch('highlight', { color });
    } else if (pendingAction === 'note') {
      dispatch('note', { color });
    }
    
    pendingAction = null;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.selection-toolbar')) {
      if (showColorPicker) {
        showColorPicker = false;
        pendingAction = null;
      }
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
    {#if showColorPicker}
      <div class="color-picker">
        <div class="color-picker-title">选择颜色</div>
        <div class="color-options">
          {#each HIGHLIGHT_COLORS as color}
            <button
              class="color-btn"
              style="background-color: {color.bgColor}"
              title={color.name}
              on:click={() => selectColor(color)}
            >
              {#if selectedColor.bgColor === color.bgColor}
                <span class="check">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="toolbar-actions">
        <button class="action-btn highlight-btn" on:click={handleHighlight} title="标注">
          🖍️
        </button>
        
        <button class="action-btn note-btn" on:click={handleNote} title="笔记">
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
    {/if}
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

  .color-picker {
    padding: 4px;
  }

  .color-picker-title {
    font-size: 11px;
    color: var(--b3-theme-on-surface, #666);
    margin-bottom: 6px;
    text-align: center;
  }

  .color-options {
    display: flex;
    gap: 6px;
    justify-content: center;
  }

  .color-btn {
    width: 28px;
    height: 28px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-btn:hover {
    transform: scale(1.15);
    border-color: var(--b3-theme-primary, #3b82f6);
  }

  .color-btn .check {
    color: #333;
    font-size: 14px;
    font-weight: bold;
  }
</style>
