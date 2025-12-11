<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import EntryItem from "./EntryItem.svelte";
  import StatCard from "./StatCard.svelte";
  import { copyToClipboard } from "@/lets-epub-reader/annotation-service";
  import { showMessage } from "siyuan";

  export let idSQL = null; // a query that returns rows with `id` and optionally `created`
  export let pageSize = 12;
  export let fromFlow = false;
  export let title = "😝";
  // export let title = "仪表盘";

  $: ids = [];

  let page = 0;
  let loading = false;
  let hasMore = true;
  let sentinel;
  let fixedHeight = false;
  let isExpanded = false;
  let showTitle = true;

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
  <div
    class="entry-header"
    style="display: flex; gap: 12px; margin-bottom: 30px;flex-wrap: wrap;"
  >
    <StatCard
      type="text"
      asButton={true}
      label="折叠"
      active={isExpanded}
      activeBackground="rgba(16, 185, 129, 0.12)"
      fixedWidth="15%"
      clickable={true}
      onClick={() => {
        isExpanded = !isExpanded;
      }}
    />
    <StatCard
      type="text"
      asButton={true}
      label="固定高度"
      fixedWidth="15%"
      active={fixedHeight}
      activeBackground="rgba(16, 185, 129, 0.12)"
      clickable={true}
      onClick={() => {
        fixedHeight = !fixedHeight;
      }}
    />
    <StatCard
      type="text"
      asButton={true}
      label="展示标题"
      fixedWidth="15%"
      active={showTitle}
      activeBackground="rgba(16, 185, 129, 0.12)"
      clickable={true}
      onClick={() => {
        showTitle = !showTitle;
      }}
    />
    {#if !fromFlow}
      <StatCard
        type="text"
        asButton={true}
        label="复制文档流链接"
        fixedWidth="15%"
        activeBackground="rgba(16, 185, 129, 0.12)"
        clickable={true}
        onClick={() => {
          copyToClipboard(
            `siyuan://plugins/siyuan-hqweay-go/flow-entry?title=${encodeURIComponent(title)}&sql=${encodeURIComponent(idSQL)}`
          );
          showMessage(`文档流访问链接已复制到剪贴板～`);
        }}
      />
    {:else}
      <StatCard
        type="text"
        asButton={true}
        label="刷新"
        fixedWidth="15%"
        activeBackground="rgba(16, 185, 129, 0.12)"
        clickable={true}
        onClick={() => {
          ids = [];
          page = 0;
          hasMore = true;
          loadNext();
        }}
      />
    {/if}
  </div>
  {#each ids as id}
    <EntryItem blockId={id} {isExpanded} {fixedHeight} {showTitle} />
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
    color: rgba(0, 0, 0, 0.9);
  }
  .sentinel {
    height: 12px;
  }
</style>
