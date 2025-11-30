<script>
  import { plugin } from "@/utils";
  import { Protyle } from "siyuan";
  import { onMount } from "svelte";
  export let blockId;
  export let isExpanded = false;
  let container;

  onMount(() => {
    try {
      if (Protyle && container) {
        const protyle = new Protyle(plugin.app, container, {
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
        console.log("ss");
        console.log(protyle);
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

<div>
  <div class="entry-header">
    <button
      class="toggle-btn"
      on:click={() => {
        isExpanded = !isExpanded;
      }}
      title={isExpanded ? "折叠" : "展开"}
    >
      <span class="arrow">{isExpanded ? "➡️" : "⬇️"}</span>
    </button>
    <span class="entry-id">{blockId}</span>
  </div>
  <div class="entry-item" bind:this={container} class:expanded={isExpanded} />
</div>

<style>
  .entry-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    user-select: none;
    transition: background 0.2s;
    margin-bottom: 10px;
  }

  .entry-header:hover {
    background: rgba(255, 255, 255, 0.1);
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
    color: rgba(255, 255, 255, 0.7);
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
  }
  .expanded {
    display: none;
  }
  :global(.entry-item .protyle-breadcrumb) {
    background-color: unset;
  }
</style>
