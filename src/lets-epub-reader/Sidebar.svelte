<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TocItem, Annotation, SidebarTab } from './types';

  export let toc: TocItem[] = [];
  export let annotations: Annotation[] = [];
  export let activeTab: SidebarTab = 'toc';
  export let epubPath = '';
  export let boundDocId = '';
  export let visible = true;

  const dispatch = createEventDispatcher<{
    goToToc: { item: TocItem };
    goToAnnotation: { annotation: Annotation };
    deleteAnnotation: { annotation: Annotation };
    bindDoc: { docId: string };
    search: { query: string; tab: SidebarTab };
  }>();

  let searchQuery = '';
  let docIdInput = '';

  // Filter items based on search
  $: filteredToc = searchQuery
    ? filterToc(toc, searchQuery.toLowerCase())
    : toc;

  $: filteredAnnotations = searchQuery
    ? annotations.filter(a => 
        a.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.note && a.note.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : annotations;

  function filterToc(items: TocItem[], query: string): TocItem[] {
    return items.filter(item => {
      const matches = item.label.toLowerCase().includes(query);
      const hasMatchingChildren = item.subitems && filterToc(item.subitems, query).length > 0;
      return matches || hasMatchingChildren;
    }).map(item => ({
      ...item,
      subitems: item.subitems ? filterToc(item.subitems, query) : undefined
    }));
  }

  function handleTocClick(item: TocItem) {
    dispatch('goToToc', { item });
  }

  function handleAnnotationClick(annotation: Annotation) {
    dispatch('goToAnnotation', { annotation });
  }

  function handleDeleteAnnotation(annotation: Annotation, e: Event) {
    e.stopPropagation();
    if (confirm('确定要删除这条标注吗？')) {
      dispatch('deleteAnnotation', { annotation });
    }
  }

  function handleBindDoc() {
    if (docIdInput.trim()) {
      dispatch('bindDoc', { docId: docIdInput.trim() });
    }
  }

  function handleSearch() {
    dispatch('search', { query: searchQuery, tab: activeTab });
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

{#if visible}
  <div class="sidebar-overlay" on:click={() => dispatch('close')}></div>
  <div class="sidebar">
    <!-- Search bar -->
    <div class="search-bar">
      <input
        type="text"
        placeholder={activeTab === 'toc' ? '搜索目录...' : activeTab === 'annotations' ? '搜索标注...' : ''}
        bind:value={searchQuery}
        on:input={handleSearch}
      />
    </div>

    <!-- Tab buttons -->
    <div class="tabs">
      <button
        class="tab-btn"
        class:active={activeTab === 'toc'}
        on:click={() => activeTab = 'toc'}
      >
        📖 目录
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'annotations'}
        on:click={() => activeTab = 'annotations'}
      >
        🖍️ 标注
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'settings'}
        on:click={() => activeTab = 'settings'}
      >
        ⚙️ 设置
      </button>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      {#if activeTab === 'toc'}
        <div class="toc-list">
          {#if filteredToc.length === 0}
            <div class="empty-state">
              {searchQuery ? '未找到匹配的目录项' : '暂无目录'}
            </div>
          {:else}
            <ul class="toc-items">
              {#each filteredToc as item}
                <li class="toc-item">
                  <button class="toc-link" on:click={() => handleTocClick(item)}>
                    {item.label}
                  </button>
                  {#if item.subitems && item.subitems.length > 0}
                    <ul class="toc-subitems">
                      {#each item.subitems as subitem}
                        <li class="toc-subitem">
                          <button class="toc-link" on:click={() => handleTocClick(subitem)}>
                            {subitem.label}
                          </button>
                        </li>
                      {/each}
                    </ul>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>

      {:else if activeTab === 'annotations'}
        <div class="annotations-list">
          {#if filteredAnnotations.length === 0}
            <div class="empty-state">
              {searchQuery ? '未找到匹配的标注' : '暂无标注'}
            </div>
          {:else}
            {#each filteredAnnotations as annotation}
              <div
                class="annotation-item"
                on:click={() => handleAnnotationClick(annotation)}
              >
                <div class="annotation-header">
                  <span
                    class="annotation-color"
                    style="background-color: {annotation.color.bgColor}"
                  ></span>
                  <span class="annotation-type">
                    {annotation.type === 'note' ? '📝 笔记' : '🖍️ 标注'}
                  </span>
                  <span class="annotation-date">{formatDate(annotation.createdAt)}</span>
                  <button
                    class="delete-btn"
                    title="删除"
                    on:click={(e) => handleDeleteAnnotation(annotation, e)}
                  >
                    🗑️
                  </button>
                </div>
                <div class="annotation-text">{annotation.text}</div>
                {#if annotation.note}
                  <div class="annotation-note">📝 {annotation.note}</div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>

      {:else if activeTab === 'settings'}
        <div class="settings-panel">
          <div class="setting-group">
            <label class="setting-label">绑定文档</label>
            <p class="setting-desc">
              将此书籍与思源笔记文档绑定，标注和笔记将自动插入到绑定的文档中。
            </p>
            
            {#if boundDocId}
              <div class="bound-doc">
                <span class="bound-label">已绑定:</span>
                <code class="doc-id">{boundDocId}</code>
              </div>
            {/if}
            
            <div class="bind-input-group">
              <input
                type="text"
                placeholder="输入文档 ID"
                bind:value={docIdInput}
                class="doc-id-input"
              />
              <button class="bind-btn" on:click={handleBindDoc}>
                {boundDocId ? '更换绑定' : '绑定文档'}
              </button>
            </div>
            
            <p class="setting-hint">
              提示: 在思源笔记中右键点击文档，选择"复制块引用"获取文档 ID
            </p>
          </div>

          <div class="setting-group">
            <label class="setting-label">书籍路径</label>
            <code class="epub-path">{epubPath || '未知'}</code>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sidebar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 99;
  }

  .sidebar {
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--b3-theme-background, #fff);
    border-left: 1px solid var(--b3-border-color, #e1e5e9);
    overflow: hidden;
    z-index: 100;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
  }

  .search-bar {
    padding: 12px;
    border-bottom: 1px solid var(--b3-border-color, #e1e5e9);
  }

  .search-bar input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color, #e1e5e9);
    border-radius: 6px;
    font-size: 13px;
    background: var(--b3-theme-surface, #f8f9fa);
  }

  .search-bar input:focus {
    outline: none;
    border-color: var(--b3-theme-primary, #3b82f6);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--b3-border-color, #e1e5e9);
  }

  .tab-btn {
    flex: 1;
    padding: 10px 8px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    color: var(--b3-theme-on-surface, #666);
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: var(--b3-theme-surface, #f8f9fa);
  }

  .tab-btn.active {
    color: var(--b3-theme-primary, #3b82f6);
    border-bottom: 2px solid var(--b3-theme-primary, #3b82f6);
    margin-bottom: -1px;
  }

  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .empty-state {
    text-align: center;
    color: var(--b3-theme-on-surface-light, #999);
    padding: 24px;
    font-size: 13px;
  }

  /* TOC styles */
  .toc-items {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .toc-item {
    margin-bottom: 4px;
  }

  .toc-link {
    display: block;
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 13px;
    color: var(--b3-theme-on-background, #333);
    border-radius: 4px;
    transition: background 0.2s;
  }

  .toc-link:hover {
    background: var(--b3-theme-surface, #f8f9fa);
  }

  .toc-subitems {
    list-style: none;
    padding-left: 16px;
    margin: 0;
  }

  .toc-subitem .toc-link {
    font-size: 12px;
    color: var(--b3-theme-on-surface, #666);
  }

  /* Annotation styles */
  .annotation-item {
    padding: 12px;
    margin-bottom: 8px;
    background: var(--b3-theme-surface, #f8f9fa);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .annotation-item:hover {
    background: var(--b3-theme-surface-lighter, #f0f0f0);
    transform: translateX(2px);
  }

  .annotation-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .annotation-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .annotation-type {
    font-size: 11px;
    color: var(--b3-theme-on-surface, #666);
  }

  .annotation-date {
    font-size: 10px;
    color: var(--b3-theme-on-surface-light, #999);
    margin-left: auto;
  }

  .delete-btn {
    padding: 2px 6px;
    border: none;
    background: none;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .delete-btn:hover {
    opacity: 1;
  }

  .annotation-text {
    font-size: 13px;
    line-height: 1.5;
    color: var(--b3-theme-on-background, #333);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .annotation-note {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--b3-border-color, #e1e5e9);
    font-size: 12px;
    color: var(--b3-theme-on-surface, #666);
  }

  /* Settings styles */
  .settings-panel {
    padding: 8px 0;
  }

  .setting-group {
    margin-bottom: 20px;
  }

  .setting-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--b3-theme-on-background, #333);
    margin-bottom: 4px;
  }

  .setting-desc {
    font-size: 12px;
    color: var(--b3-theme-on-surface, #666);
    margin: 0 0 12px 0;
  }

  .bound-doc {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px;
    background: var(--b3-theme-success-lighter, #d4edda);
    border-radius: 4px;
  }

  .bound-label {
    font-size: 12px;
    color: var(--b3-theme-success, #28a745);
  }

  .doc-id {
    font-size: 11px;
    background: var(--b3-theme-surface, #f8f9fa);
    padding: 2px 6px;
    border-radius: 3px;
    word-break: break-all;
  }

  .bind-input-group {
    display: flex;
    gap: 8px;
  }

  .doc-id-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--b3-border-color, #e1e5e9);
    border-radius: 4px;
    font-size: 12px;
  }

  .bind-btn {
    padding: 8px 16px;
    background: var(--b3-theme-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }

  .bind-btn:hover {
    background: var(--b3-theme-primary-light, #2563eb);
  }

  .setting-hint {
    font-size: 11px;
    color: var(--b3-theme-on-surface-light, #999);
    margin: 8px 0 0 0;
  }

  .epub-path {
    display: block;
    font-size: 11px;
    background: var(--b3-theme-surface, #f8f9fa);
    padding: 8px;
    border-radius: 4px;
    word-break: break-all;
    margin-top: 4px;
  }
</style>
