<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import EntryItem from "./EntryItem.svelte";

  export let idSQL = null; // a query that returns rows with `id` and optionally `created`
  export let pageSize = 12;

  $: ids = [];

  let page = 0;
  let loading = false;
  let hasMore = true;
  let sentinel;
  let fixedHeight;
  let isExpanded;

  async function loadNext() {
    if (!idSQL || loading || !hasMore) return;

    loading = true;
    const offset = page * pageSize;
    // Wrap idSQL to safely apply LIMIT/OFFSET
    const final = `select * from (${idSQL}) as sub limit ${pageSize} offset ${offset}`;
    try {
      const rows = await sql(final);

      if (!rows || rows.length === 0) {
        hasMore = false;
      } else {
        const newIds = rows.map((r) => r.id).filter((id) => !ids.includes(id));
        ids = [...ids, ...newIds]; // 重新赋值触发更新
        page += 1;
        if (rows.length < pageSize) hasMore = false;
      }
    } catch (err) {
      console.error("EntryList load error", err);
    } finally {
      loading = false;
    }
  }

  $: if (idSQL) {
    // reset when query changes
    ids = [];
    page = 0;
    hasMore = true;
    loadNext();
  }

  onMount(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore) {
            loadNext();
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  });
</script>

<div class="entry-list">
  <div class="entry-header">
    <button
      class="tab-btn"
      class:active={isExpanded === true}
      on:click={() => (isExpanded = !isExpanded)}>折叠</button
    >
    <button
      class="tab-btn"
      class:active={fixedHeight === true}
      on:click={() => (fixedHeight = !fixedHeight)}>固定高度</button
    >
  </div>
  {#each ids as id}
    <EntryItem blockId={id} {isExpanded} {fixedHeight} />
  {/each}

  <div class="list-loading">
    {#if loading}
      <div class="loading-text">加载中…</div>
    {:else if !hasMore}
      <div class="loading-text">没有更多条目</div>
    {/if}
    <div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
  </div>
</div>

<style>
  .entry-list {
    display: block;
  }
  .list-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 0;
  }
  .loading-text {
    color: rgba(255, 255, 255, 0.85);
  }
  .sentinel {
    height: 12px;
  }
</style>
