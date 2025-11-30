<script>
  import { plugin } from "@/utils";
  import { Protyle } from "siyuan";
  import { onMount } from "svelte";
  export let blockId;
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

<div class="entry-item" bind:this={container} />

<style>
  .entry-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 12px;
    min-height: 60px;
    overflow: hidden;
  }
  :global(.entry-item .protyle-breadcrumb) {
    background-color: unset;
  }
</style>
