<script>
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-dashboard");
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import EntryItem from "./EntryItem.svelte";
  import StatCard from "./StatCard.svelte";
  import { copyToClipboard } from "@/lets-epub-reader/annotation-service";
  import { showMessage } from "siyuan";
  import { plugin } from "@/utils";

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

  function handleCollapsed(index, currentWrapper) {
    if (
      currentWrapper &&
      currentWrapper.parentElement &&
      currentWrapper.parentElement.nextElementSibling
    ) {
      const nextWrapper =
        currentWrapper.parentElement.nextElementSibling.querySelector(
          ".entry-item-wrapper"
        );
      if (nextWrapper) {
        // 使用 scrollIntoView 让下一个元素滚动到可见位置，从头开始显示
        nextWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  async function loadNext() {
    if (!idSQL || loading || !hasMore) return;

    loading = true;
    const offset = page * pageSize;
    // Wrap idSQL to safely apply LIMIT/OFFSET
    const final = `select * from (${idSQL}) as sub limit ${pageSize} offset ${offset}`;
    try {
      const rows = await sql(final, true);

      if (!rows || rows.length === 0) {
        hasMore = false;
      } else {
        const newIds = rows.map((r) => r.id).filter((id) => !ids.includes(id));
        ids = [...ids, ...newIds]; // 重新赋值触发更新
        page += 1;
        if (rows.length < pageSize) hasMore = false;
      }
    } catch (err) {
      log.error("EntryList load error", err);
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
    <StatCard
      type="text"
      asButton={true}
      label={plugin.i18n["lets-dashboard.collapse"]}
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
      label={plugin.i18n["lets-dashboard.fixedHeight"]}
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
      label={plugin.i18n["lets-dashboard.showTitle"]}
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
        label={plugin.i18n["lets-dashboard.copyFlowLink"]}
        fixedWidth="15%"
        activeBackground="rgba(16, 185, 129, 0.12)"
        clickable={true}
        onClick={() => {
          copyToClipboard(
            `[${title}](siyuan://plugins/siyuan-hqweay-go/flow-entry?title=${encodeURIComponent(title)}&sql=${encodeURIComponent(idSQL)})`
          );
          showMessage(plugin.i18n["lets-dashboard.flowLinkCopied"]);
        }}
      />
    {:else}
      <StatCard
        type="text"
        asButton={true}
        label={plugin.i18n["lets-dashboard.refresh"]}
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
  {#each ids as id, index (id)}
    <div animate:flip={{ duration: 300 }}>
      <EntryItem
        blockId={id}
        {isExpanded}
        {fixedHeight}
        {showTitle}
        {index}
        onCollapsed={handleCollapsed}
      />
    </div>
  {/each}

  <div class="list-loading">
    {#if loading}
      <div class="loading-text">{plugin.i18n["lets-dashboard.loading"]}</div>
    {:else if !hasMore}
      <div class="loading-text">{plugin.i18n["lets-dashboard.noMoreEntries"]}</div>
    {/if}
    <div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
  </div>
</div>

<style>
  /* 文档流不展示底部反链 */
  :global(.entry-list .backlink-panel-document-bottom__area) {
    display: none;
  }

  .entry-header {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;

    background-color: var(--b3-theme-surface);
    border-radius: 10px;
    margin-bottom: 10px;
    /* position: sticky; */
    /* top: 0; */
    /* z-index: 2; */
  }
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
