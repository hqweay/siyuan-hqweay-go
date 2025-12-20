<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '@/settings';

  // Props
  export let docId: string;
  export let plugin: any;

  // Component state
  let isVisible = true;
  let isExpanded = false;
  let activeTab = 'backlinks'; // 'backlinks' | 'custom-sql'
  let backlinks: any[] = [];
  let customSqlResults: any[] = [];
  let customSqlQuery = '';
  let isLoading = false;
  let hasMoreBacklinks = true;
  let hasMoreCustomSql = true;
  let backlinksOffset = 0;
  let customSqlOffset = 0;

  // Settings
  let showDocTitle = true;
  let showContext = true;
  let contextLength = 100;
  let initialLoadCount = 20;
  let scrollLoadCount = 10;
  let enableCustomSql = true;
  let autoExpand = false;

  onMount(() => {
    loadSettings();
    setupScrollListener();
    
    if (autoExpand) {
      isExpanded = true;
    }
    
    // 初始加载反链数据
    loadBacklinks();
    
    // 加载默认自定义SQL
    const defaultSql = settings.getBySpace('backlink-panel', 'defaultSql');
    if (defaultSql && enableCustomSql) {
      customSqlQuery = defaultSql;
      loadCustomSqlResults();
    }
  });

  onDestroy(() => {
    removeScrollListener();
  });

  function loadSettings() {
    showDocTitle = settings.getBySpace('backlink-panel', 'showDocTitle') ?? true;
    showContext = settings.getBySpace('backlink-panel', 'showContext') ?? true;
    contextLength = settings.getBySpace('backlink-panel', 'contextLength') ?? 100;
    initialLoadCount = settings.getBySpace('backlink-panel', 'initialLoadCount') ?? 20;
    scrollLoadCount = settings.getBySpace('backlink-panel', 'scrollLoadCount') ?? 10;
    enableCustomSql = settings.getBySpace('backlink-panel', 'enableCustomSql') ?? true;
    autoExpand = settings.getBySpace('backlink-panel', 'autoExpand') ?? false;
  }

  function setupScrollListener() {
    window.addEventListener('scroll', handleScroll);
  }

  function removeScrollListener() {
    window.removeEventListener('scroll', handleScroll);
  }

  function handleScroll() {
    if (!isVisible || !isExpanded) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 当滚动到页面底部附近时加载更多数据
    if (scrollTop + windowHeight >= documentHeight - 200) {
      loadMoreData();
    }
  }

  async function loadBacklinks() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      const newBacklinks = await plugin.getBacklinks(docId, backlinksOffset, initialLoadCount);
      
      if (newBacklinks.length < initialLoadCount) {
        hasMoreBacklinks = false;
      }
      
      backlinks = [...backlinks, ...newBacklinks];
      backlinksOffset += newBacklinks.length;
    } catch (error) {
      console.error('加载反链失败:', error);
    } finally {
      isLoading = false;
    }
  }

  async function loadCustomSqlResults() {
    if (isLoading || !customSqlQuery.trim()) return;
    
    isLoading = true;
    try {
      const newResults = await plugin.executeCustomSql(customSqlQuery, customSqlOffset, initialLoadCount);
      
      if (newResults.length < initialLoadCount) {
        hasMoreCustomSql = false;
      }
      
      customSqlResults = [...customSqlResults, ...newResults];
      customSqlOffset += newResults.length;
    } catch (error) {
      console.error('执行自定义SQL失败:', error);
    } finally {
      isLoading = false;
    }
  }

  async function loadMoreData() {
    if (activeTab === 'backlinks') {
      if (hasMoreBacklinks) {
        await loadBacklinks();
      }
    } else if (activeTab === 'custom-sql') {
      if (hasMoreCustomSql) {
        await loadCustomSqlResults();
      }
    }
  }

  function switchTab(tab: string) {
    if (tab === activeTab) return;
    
    activeTab = tab;
    
    // 如果切换到自定义SQL标签页且还没有结果，尝试加载
    if (tab === 'custom-sql' && customSqlResults.length === 0 && customSqlQuery.trim()) {
      loadCustomSqlResults();
    }
  }

  function toggleExpanded() {
    isExpanded = !isExpanded;
  }

  function setVisible(visible: boolean) {
    isVisible = visible;
  }

  function refresh() {
    // 重置状态
    backlinks = [];
    customSqlResults = [];
    backlinksOffset = 0;
    customSqlOffset = 0;
    hasMoreBacklinks = true;
    hasMoreCustomSql = true;
    
    // 重新加载当前标签页的数据
    if (activeTab === 'backlinks') {
      loadBacklinks();
    } else if (activeTab === 'custom-sql') {
      loadCustomSqlResults();
    }
  }

  function updateDocId(newDocId: string) {
    docId = newDocId;
    refresh();
  }

  async function openBlock(blockId: string) {
    await plugin.openBlock(blockId);
  }

  function formatContent(content: string): string {
    if (!content) return '';
    
    // 移除HTML标签，保留纯文本
    const textContent = content.replace(/<[^>]*>/g, '');
    
    // 截断到指定长度
    if (textContent.length > contextLength) {
      return textContent.substring(0, contextLength) + '...';
    }
    
    return textContent;
  }

  function formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  function truncateText(text: string, maxLength: number = 50): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
</script>

<div class="backlink-panel" class:expanded={isExpanded}>
  <!-- 面板头部 -->
  <div class="panel-header" role="button" tabindex="0" on:click={toggleExpanded} on:keydown={(e) => e.key === 'Enter' && toggleExpanded()}>
    <div class="header-left">
      <svg class="panel-icon" class:expanded={isExpanded} viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
      <span class="panel-title">反链面板</span>
      <span class="backlink-count" class:hidden={backlinks.length === 0}>
        {backlinks.length}
      </span>
    </div>
    <div class="header-actions">
      <button class="refresh-btn" on:click|stopPropagation={refresh} title="刷新">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- 面板内容 -->
  {#if isExpanded}
    <div class="panel-content">
      <!-- 标签页导航 -->
      <div class="tab-nav">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'backlinks'}
          on:click={() => switchTab('backlinks')}
        >
          反链
        </button>
        {#if enableCustomSql}
          <button 
            class="tab-btn" 
            class:active={activeTab === 'custom-sql'}
            on:click={() => switchTab('custom-sql')}
          >
            自定义SQL
          </button>
        {/if}
      </div>

      <!-- 反链标签页内容 -->
      {#if activeTab === 'backlinks'}
        <div class="tab-content">
          {#if backlinks.length === 0 && !isLoading}
            <div class="empty-state">
              <p>暂无反链数据</p>
            </div>
          {:else}
            <div class="backlink-list">
              {#each backlinks as backlink}
                <div class="backlink-item" on:click={() => openBlock(backlink.id)}>
                  <div class="backlink-content">
                    <div class="content-text">
                      {formatContent(backlink.content)}
                    </div>
                    {#if showContext && backlink.content}
                      <div class="context-preview">
                        引用自: {truncateText(backlink.content, 100)}
                      </div>
                    {/if}
                  </div>
                  <div class="backlink-meta">
                    <span class="block-type">{backlink.type}</span>
                    <span class="block-date">{formatDate(backlink.updated)}</span>
                  </div>
                </div>
              {/each}
              
              {#if isLoading}
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>加载中...</span>
                </div>
              {/if}
              
              {#if !hasMoreBacklinks && backlinks.length > 0}
                <div class="end-message">
                  <p>已显示所有反链</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

      <!-- 自定义SQL标签页内容 -->
      {#if activeTab === 'custom-sql' && enableCustomSql}
        <div class="tab-content">
          <div class="sql-input-section">
            <textarea 
              bind:value={customSqlQuery}
              placeholder="输入自定义SQL查询语句..."
              class="sql-input"
              rows="3"
            ></textarea>
            <button 
              class="execute-sql-btn" 
              on:click={loadCustomSqlResults}
              disabled={!customSqlQuery.trim() || isLoading}
            >
              执行查询
            </button>
          </div>

          {#if customSqlResults.length === 0 && !isLoading}
            <div class="empty-state">
              <p>输入SQL查询并点击执行查看结果</p>
            </div>
          {:else}
            <div class="sql-results">
              {#each customSqlResults as result}
                <div class="result-item">
                  <div class="result-content">
                    {JSON.stringify(result, null, 2)}
                  </div>
                </div>
              {/each}
              
              {#if isLoading}
                <div class="loading-state">
                  <div class="loading-spinner"></div>
                  <span>执行中...</span>
                </div>
              {/if}
              
              {#if !hasMoreCustomSql && customSqlResults.length > 0}
                <div class="end-message">
                  <p>已显示所有结果</p>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .backlink-panel {
    background: var(--b3-theme-surface1, #f6f6f6);
    border: 1px solid var(--b3-theme-border, #e0e0e0);
    border-radius: 8px;
    margin: 8px 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    cursor: pointer;
    background: var(--b3-theme-background, #fff);
    border-bottom: 1px solid var(--b3-theme-border, #e0e0e0);
    transition: background-color 0.2s ease;
  }

  .panel-header:hover {
    background: var(--b3-theme-surface2, #f0f0f0);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.3s ease;
  }

  .panel-icon.expanded {
    transform: rotate(180deg);
  }

  .panel-title {
    font-weight: 600;
    color: var(--b3-theme-text, #333);
  }

  .backlink-count {
    background: var(--b3-theme-primary, #007acc);
    color: white;
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
  }

  .backlink-count.hidden {
    display: none;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .refresh-btn {
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    border-radius: 4px;
    color: var(--b3-theme-text, #666);
    transition: all 0.2s ease;
  }

  .refresh-btn:hover {
    background: var(--b3-theme-surface2, #e0e0e0);
    color: var(--b3-theme-primary, #007acc);
  }

  .refresh-btn svg {
    width: 16px;
    height: 16px;
  }

  .panel-content {
    background: var(--b3-theme-surface1, #f6f6f6);
  }

  .tab-nav {
    display: flex;
    background: var(--b3-theme-background, #fff);
    border-bottom: 1px solid var(--b3-theme-border, #e0e0e0);
  }

  .tab-btn {
    flex: 1;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--b3-theme-text, #666);
    transition: all 0.2s ease;
    position: relative;
  }

  .tab-btn:hover {
    background: var(--b3-theme-surface2, #f0f0f0);
  }

  .tab-btn.active {
    color: var(--b3-theme-primary, #007acc);
    font-weight: 500;
  }

  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--b3-theme-primary, #007acc);
  }

  .tab-content {
    padding: 16px;
    max-height: 400px;
    overflow-y: auto;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--b3-theme-text, #999);
  }

  .backlink-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .backlink-item {
    background: var(--b3-theme-background, #fff);
    border: 1px solid var(--b3-theme-border, #e0e0e0);
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .backlink-item:hover {
    border-color: var(--b3-theme-primary, #007acc);
    box-shadow: 0 2px 8px rgba(0, 122, 204, 0.1);
  }

  .backlink-content {
    margin-bottom: 8px;
  }

  .content-text {
    font-size: 14px;
    line-height: 1.4;
    color: var(--b3-theme-text, #333);
    margin-bottom: 4px;
  }

  .context-preview {
    font-size: 12px;
    color: var(--b3-theme-text, #666);
    font-style: italic;
  }

  .backlink-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--b3-theme-text, #999);
  }

  .block-type {
    background: var(--b3-theme-surface2, #e0e0e0);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
  }

  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 20px;
    color: var(--b3-theme-text, #666);
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--b3-theme-border, #e0e0e0);
    border-top: 2px solid var(--b3-theme-primary, #007acc);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .end-message {
    text-align: center;
    padding: 20px;
    color: var(--b3-theme-text, #999);
    font-size: 12px;
  }

  .sql-input-section {
    margin-bottom: 16px;
  }

  .sql-input {
    width: 100%;
    padding: 8px;
    border: 1px solid var(--b3-theme-border, #e0e0e0);
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    resize: vertical;
    background: var(--b3-theme-background, #fff);
    color: var(--b3-theme-text, #333);
  }

  .execute-sql-btn {
    margin-top: 8px;
    padding: 8px 16px;
    background: var(--b3-theme-primary, #007acc);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s ease;
  }

  .execute-sql-btn:hover:not(:disabled) {
    background: var(--b3-theme-primary-light, #339dd4);
  }

  .execute-sql-btn:disabled {
    background: var(--b3-theme-border, #e0e0e0);
    cursor: not-allowed;
  }

  .sql-results {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .result-item {
    background: var(--b3-theme-background, #fff);
    border: 1px solid var(--b3-theme-border, #e0e0e0);
    border-radius: 6px;
    padding: 12px;
  }

  .result-content {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: var(--b3-theme-text, #333);
    white-space: pre-wrap;
    overflow-x: auto;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .panel-header {
      padding: 10px 12px;
    }
    
    .tab-content {
      padding: 12px;
    }
    
    .backlink-item {
      padding: 10px;
    }
  }
</style>