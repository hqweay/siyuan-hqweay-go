<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Protyle, showMessage } from "siyuan";
  import { plugin } from "@/utils";
  import { openBlock } from "@frostime/siyuan-plugin-kits";
  import { openBlockByID } from "@/myscripts/syUtils";

  import { createEventDispatcher } from "svelte";
  
  export let inlineElements: any[] = [];
  export let currentDocId: string = "";
  export let isLoading: boolean = false;
  export let pageSize: number = 20;
  export let isRefreshing: boolean = false;
  
  const dispatch = createEventDispatcher();

  // 内部状态管理
  let useProtyle = false;
  let searchText = "";
  let manualSearchText = ""; // Protyle 模式下的手动搜索
  let currentPage = 0;
  let protyleInstances: { [key: string]: any } = {};
  let protyleContainers: { [key: string]: HTMLElement } = {};

  // 过滤显示的元素（根据模式选择搜索方式）
  $: currentSearchText = useProtyle ? manualSearchText : searchText;
  $: filteredElements = inlineElements.filter(
    (element) =>
      !currentSearchText ||
      element.markdown
        .toLowerCase()
        .includes(currentSearchText.toLowerCase()) ||
      element.content.toLowerCase().includes(currentSearchText.toLowerCase())
  );

  // Protyle 模式下按 block id 去重
  $: uniqueElementsById = useProtyle
    ? Object.values(
        filteredElements.reduce((acc, element) => {
          // 保留每个 id 第一次出现的元素
          if (!acc[element.id]) {
            acc[element.id] = element;
          }
          return acc;
        }, {})
      )
    : filteredElements;

  // 分页处理
  $: paginatedElements = useProtyle
    ? uniqueElementsById.slice(0, (currentPage + 1) * pageSize)
    : filteredElements;

  // 是否还有更多内容可以加载
  $: hasMore = useProtyle && paginatedElements.length < filteredElements.length;

  onMount(() => {
    if (useProtyle && paginatedElements.length > 0) {
      initProtyleInstances();
    }
  });

  onDestroy(() => {
    // 清理 Protyle 实例
    Object.values(protyleInstances).forEach((instance) => {
      if (instance && instance.destroy) {
        instance.destroy();
      }
    });
  });

  // 监听数据变化，自动初始化/清理 Protyle 实例
  $: if (useProtyle && paginatedElements.length > 0) {
    setTimeout(() => {
      initProtyleInstances();
    }, 50);
  }

  // 监听模式切换
  $: if (useProtyle) {
    setTimeout(() => {
      if (paginatedElements.length > 0) {
        initProtyleInstances();
      }
    }, 100);
  } else {
    // 切换到简单模式时清理 Protyle 实例
    Object.values(protyleInstances).forEach((instance) => {
      if (instance && instance.destroy) {
        instance.destroy();
      }
    });
    protyleInstances = {};
  }

  function initProtyleInstances() {
    console.log("初始化 Protyle 实例", {
      paginatedElementsCount: paginatedElements.length,
      protyleContainersKeys: Object.keys(protyleContainers),
      existingInstances: Object.keys(protyleInstances),
    });

    // 清理已存在的实例
    const currentElementIds = new Set(paginatedElements.map((e) => e.id));
    Object.keys(protyleInstances).forEach((id) => {
      if (!currentElementIds.has(id)) {
        if (protyleInstances[id] && protyleInstances[id].destroy) {
          protyleInstances[id].destroy();
        }
        delete protyleInstances[id];
      }
    });

    // 为新的元素创建 Protyle 实例
    paginatedElements.forEach((element) => {
      const container = protyleContainers[element.id];
      console.log(`检查元素 ${element.id}:`, {
        hasContainer: !!container,
        containerTagName: container?.tagName,
        hasExistingInstance: !!protyleInstances[element.id],
      });

      if (container && !protyleInstances[element.id]) {
        createProtyleInstance(element, container);
      }
    });
  }

  function createProtyleInstance(element: any, container: HTMLElement) {
    try {
      console.log("尝试创建 Protyle 实例", {
        elementId: element.id,
        hasProtyle: !!Protyle,
        hasContainer: !!container,
        hasPlugin: !!plugin,
      });

      if (Protyle && container) {
        const protyle = new Protyle(plugin.app, container, {
          blockId: element.id,
          action: ["cb-get-focus"],
          render: {
            title: false,
            titleShowTop: false,
            hideTitleOnZoom: false,
            gutter: false,
            scroll: false,
            breadcrumb: false,
            breadcrumbDocName: false,
          },
        });
        protyleInstances[element.id] = protyle;
        console.log("Protyle 实例创建成功", element.id);
      } else {
        console.warn("无法创建 Protyle 实例", {
          Protyle: !!Protyle,
          container: !!container,
          plugin: !!plugin,
        });
        // Fallback: 显示简单链接
        if (container) {
          container.innerHTML = `<a href="siyuan://blocks/${element.id}">打开块 ${element.id}</a>`;
        }
      }
    } catch (err) {
      console.error("创建 Protyle 实例失败", err);
      // Fallback: 显示简单链接
      container.innerHTML = `<a href=\"siyuan://blocks/${element.id}\">打开块 ${element.id}</a>`;
    }
  }

  function loadMore() {
    if (hasMore) {
      currentPage++;
      // loadMore 后会自动触发 $: 监听器，无需手动调用
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      showMessage("已复制到剪贴板", 2000);
    });
  }

  function jumpToElement(elementId: string) {
    // 跳转到指定的块
    openBlockByID(elementId);
  }

  function handleScroll(event: Event) {
    if (!useProtyle) return;

    const target = event.target as HTMLElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      loadMore();
    }
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && useProtyle) {
      manualSearchText = searchText;
      event.preventDefault();
    }
  }

  function clearSearch() {
    searchText = "";
    manualSearchText = "";
  }

  function handleRefresh() {
    dispatch("refresh");
  }
</script>

<div class="inline-elements-panel" on:scroll={handleScroll}>
  <!-- 标题栏 -->
  <div class="panel-header">
    <div class="panel-title">
      <svg class="panel-icon" width="16" height="16" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12L17.63 5.84z"
        />
      </svg>
      <span>文档标注</span>
      {#if useProtyle}
        <span class="mode-badge simple">Protyle</span>
      {:else}
        <span class="mode-badge simple">简单</span>
      {/if}
    </div>
    <div class="header-actions">
      <!-- 刷新按钮 -->
      <button
        class="refresh-btn"
        title="刷新标注列表"
        on:click={handleRefresh}
        disabled={isRefreshing}
      >
        {isRefreshing ? "⟳" : "🔄"}
      </button>
      <!-- 模式切换按钮 -->
      <button
        class="mode-toggle-btn"
        title={useProtyle ? "切换到简单模式" : "切换到 Protyle 模式"}
        on:click={() => (useProtyle = !useProtyle)}
      >
        {useProtyle ? "🔧" : "📝"}
      </button>
      <div class="element-count">
        {paginatedElements.length}{useProtyle
          ? `/ ${uniqueElementsById.length}`
          : ""}
      </div>
    </div>
  </div>

  <!-- 搜索框 -->
  <!--@todo Protyle 搜索有bug，先不支持搜索 -->

  {#if !useProtyle}
    <div class="search-container">
      <input
        type="text"
        placeholder={useProtyle
          ? "输入搜索关键词，按 Enter 键搜索"
          : "搜索标注内容..."}
        bind:value={searchText}
        on:keydown={handleSearchKeydown}
        class="search-input"
      />

      {#if searchText}
        <button on:click={clearSearch} class="clear-btn" title="清空">
          ×
        </button>
      {/if}
    </div>
  {/if}
  <!-- 内容区域 -->
  <div class="content-container" class:protyle-mode={useProtyle}>
    {#if isLoading}
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>
    {:else if filteredElements.length === 0}
      <div class="empty-state">
        {#if inlineElements.length === 0}
          <div class="empty-icon">📝</div>
          <div class="empty-text">当前文档暂无标注</div>
          <div class="empty-hint">使用 ==文本== 格式添加标注</div>
        {:else}
          <div class="empty-text">未找到匹配的标注</div>
        {/if}
      </div>
    {:else if useProtyle}
      <!-- Protyle 模式 -->
      <div class="protyle-elements-list">
        {#each paginatedElements as element, index}
          <div class="protyle-element-item" data-element-id={element.id}>
            <div class="element-header">
              <div class="element-index">{index + 1}</div>
              <div class="element-info">
                <div
                  class="element-id"
                  on:click={() => copyToClipboard(element.id)}
                >
                  {element.id}
                </div>
                <div class="element-actions">
                  <button
                    class="action-btn"
                    title="复制 ID"
                    on:click={() => copyToClipboard(element.id)}
                  >
                    📋
                  </button>
                  <button
                    class="action-btn"
                    title="跳转到位置"
                    on:click={() => jumpToElement(element.id)}
                  >
                    🔗
                  </button>
                </div>
              </div>
            </div>
            <div
              class="protyle-container"
              bind:this={protyleContainers[element.id]}
            ></div>
          </div>
        {/each}

        {#if hasMore}
          <div class="load-more-container">
            <button class="load-more-btn" on:click={loadMore}>
              加载更多 ({uniqueElementsById.length - paginatedElements.length} 剩余)
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <!-- 简单模式 -->
      <div class="elements-list">
        {#each filteredElements as element, index}
          <div class="element-item" data-element-id={element.id}>
            <!-- <div class="element-header">
                                <div class="element-index">{index + 1}</div>
                                <div class="element-actions">
                                    <button 
                                        class="action-btn" 
                                        title="复制内容"
                                        on:click={() => copyToClipboard(element.content)}
                                    >
                                        📋
                                    </button>
                                    <button 
                                        class="action-btn" 
                                        title="跳转到位置"
                                        on:click={() => jumpToElement(element.id)}
                                    >
                                        🔗
                                    </button>
                                </div>
                            </div> -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="element-content"
              on:click={() => jumpToElement(element.id)}
              on:contextmenu={() => copyToClipboard(element.content)}
            >
              {element.content}
            </div>
            <!-- 不展示上下文，没必要了吧…… -->
            <!-- {#if element.context}
                                <div class="element-context">
                                    <div class="context-label">上下文:</div>
                                    <div class="context-text">{element.context}</div>
                                </div>
                            {/if} -->
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .inline-elements-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--toolbar-bg-color, #f7f7f7);
    border-left: 1px solid var(--border-color, #e5e5e5);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e5e5e5);
    background: var(--panel-header-bg-color, #fafafa);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .mode-toggle-btn {
    background: none;
    border: 1px solid var(--border-color, #d9d9d9);
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mode-toggle-btn:hover {
    background-color: var(--hover-bg-color, #f0f0f0);
    border-color: var(--primary-color, #1890ff);
  }

  .refresh-btn {
    background: none;
    border: 1px solid var(--border-color, #d9d9d9);
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
  }

  .refresh-btn:hover {
    background-color: var(--hover-bg-color, #f0f0f0);
    border-color: var(--primary-color, #1890ff);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-btn:disabled:hover {
    background-color: transparent;
    border-color: var(--border-color, #d9d9d9);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-color, #333);
  }

  .panel-icon {
    color: var(--primary-color, #1890ff);
  }

  .mode-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 500;
  }

  .mode-badge.simple {
    background: var(--success-color, #52c41a);
    color: white;
  }

  .element-count {
    background: var(--primary-color, #1890ff);
    color: white;
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 12px;
    min-width: 20px;
    text-align: center;
  }

  .search-container {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #e5e5e5);
  }

  .search-input {
    width: 90%;
    padding: 8px 12px;
    border: 1px solid var(--border-color, #d9d9d9);
    border-radius: 4px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: var(--primary-color, #1890ff);
  }

  .clear-btn {
    background: none;
    border: none;
    color: var(--text-secondary-color, #666);
    cursor: pointer;
    padding: 4px;
    border-radius: 2px;
    font-size: 16px;
    line-height: 1;
    position: absolute;
    right: 24px;
    top: 50%;
    transform: translateY(-50%);
  }

  .clear-btn:hover {
    color: var(--text-color, #333);
    background-color: var(--hover-bg-color, #f0f0f0);
  }

  .search-container {
    position: relative;
  }

  .content-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .content-container.protyle-mode {
    overflow-y: auto;
    height: calc(100% - 80px);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    text-align: center;
    color: var(--text-secondary-color, #666);
  }

  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border-color, #e5e5e5);
    border-top: 2px solid var(--primary-color, #1890ff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .empty-icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .empty-hint {
    font-size: 12px;
    opacity: 0.7;
  }

  /* 简单模式样式 */
  .elements-list {
    padding: 0 8px;
  }

  .element-item {
    background: white;
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 6px;
    margin-bottom: 8px;
    padding: 12px;
    transition: box-shadow 0.2s;
  }

  .element-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* Protyle 模式样式 */
  .protyle-elements-list {
    padding: 0 8px;
  }

  .protyle-element-item {
    background: white;
    border: 1px solid var(--border-color, #e5e5e5);
    border-radius: 6px;
    margin-bottom: 12px;
    padding: 12px;
    transition: box-shadow 0.2s;
  }

  .protyle-element-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .element-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .element-index {
    background: var(--primary-color, #1890ff);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  .element-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex: 1;
    margin-left: 8px;
  }

  .element-id {
    font-family: monospace;
    font-size: 12px;
    color: var(--text-secondary-color, #666);
    cursor: pointer;
    user-select: all;
  }

  .element-actions {
    display: flex;
    gap: 4px;
  }

  .action-btn {
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    opacity: 0.6;
    transition:
      opacity 0.2s,
      background-color 0.2s;
  }

  .action-btn:hover {
    opacity: 1;
    background-color: var(--hover-bg-color, #f0f0f0);
  }

  .protyle-container {
    min-height: 100px;
    background: var(--protyle-bg, #fafafa);
    border-radius: 4px;
    overflow: hidden;
  }

  .load-more-container {
    text-align: center;
    padding: 16px;
  }

  .load-more-btn {
    background: var(--primary-color, #1890ff);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .load-more-btn:hover {
    background: var(--primary-hover-color, #40a9ff);
  }

  /* 简单模式的元素内容样式 */
  .element-content {
    font-size: 14px;
    line-height: 1.5;
    color: var(--text-color, #333);
    word-break: break-word;
    margin-bottom: 8px;
    padding: 8px;
    background: var(--highlight-bg-color, #fffbe6);
    border-left: 3px solid var(--primary-color, #1890ff);
    border-radius: 0 4px 4px 0;
  }
  .element-content:hover {
    cursor: pointer;
  }

  .element-context {
    font-size: 12px;
    color: var(--text-secondary-color, #666);
    border-top: 1px solid var(--border-color, #f0f0f0);
    padding-top: 8px;
  }

  .context-label {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .context-text {
    line-height: 1.4;
    font-style: italic;
    opacity: 0.8;
  }
</style>
