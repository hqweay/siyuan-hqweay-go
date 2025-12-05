<script lang="ts">
  import type { SelectionRect } from './types';

  export let visible = false;
  export let rect: SelectionRect = { top: 0, left: 0, width: 0, height: 0 };
  export let onHighlight: () => void;
</script>

{#if visible}
  <div
    class="selection-toolbar"
    style="top: {rect.top - 50}px; left: {rect.left + rect.width / 2 - 50}px;"
  >
    <button on:click={onHighlight}>高亮</button>
    <!-- Future: Add more buttons like notes, share, etc. -->
  </div>
{/if}

<style>
  .selection-toolbar {
    position: absolute;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 8px;
    z-index: 1000;
    display: flex;
    gap: 8px;
  }
  .selection-toolbar button {
    padding: 4px 8px;
    font-size: 12px;
    background: #f3f4f6;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #374151;
    transition: background 0.2s;
  }
  .selection-toolbar button:hover {
    background: #e5e7eb;
  }
</style>