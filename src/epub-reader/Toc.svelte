<script lang="ts">
  import type { TocItem } from './types';

  export let toc: TocItem[] = [];
  export let onGoToToc: (item: TocItem) => void;
</script>

<div class="toc">
  <div class="toc-title">目录</div>
  {#if toc.length === 0}
    <div class="toc-empty">(无目录或加载中)</div>
  {/if}
  <ul class="toc-list">
    {#each toc as item}
      <li class="toc-item">
        <button class="toc-link" on:click={() => onGoToToc(item)}>
          {item.label}
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .toc {
    width: 280px;
    overflow: auto;
    background: white;
    border-left: 1px solid #e1e5e9;
    padding: 16px;
    box-shadow: inset 0 0 4px rgba(0,0,0,0.05);
  }

  .toc-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 12px;
  }

  .toc-empty {
    font-size: 13px;
    color: #6b7280;
    font-style: italic;
  }

  .toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item {
    margin: 8px 0;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .toc-item:hover {
    background: #f3f4f6;
  }

  .toc-link {
    color: #3b82f6;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-size: 14px;
    padding: 0;
    line-height: 1.4;
  }

  .toc-link:hover {
    color: #1d4ed8;
  }
</style>