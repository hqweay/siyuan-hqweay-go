<script lang="ts">
  import { openBlockByID, openByUrl } from "@/myscripts/syUtils";
  import { onMount, onDestroy } from "svelte";

  export let inlineElements: any[] = [];
  export let currentDocId: string = "";
  export let isLoading: boolean = false;

  let searchText = "";

  // 过滤显示的元素
  $: filteredElements = inlineElements.filter(
    (element) =>
      !searchText ||
      element.markdown.toLowerCase().includes(searchText.toLowerCase()) ||
      element.content.toLowerCase().includes(searchText.toLowerCase())
  );

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加一个提示消息
      console.log("已复制到剪贴板");
    });
  }

  function jumpToElement(elementId: string) {
    openBlockByID(elementId);
  }
</script>

<div class="inline-elements-panel">
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
    </div>
    <div class="element-count">{filteredElements.length}</div>
  </div>

  <!-- 搜索框 -->
  <div class="search-container">
    <input
      type="text"
      placeholder="搜索标注内容..."
      bind:value={searchText}
      class="search-input"
    />
  </div>

  <!-- 内容区域 -->
  <div class="content-container">
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
    {:else}
      <div class="elements-list">
        {#each filteredElements as element, index}
          <div class="element-item" data-element-id={element.id}>
            <div class="element-header">
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
            </div>
            <div class="element-content">
              {element.content}
            </div>
            {#if element.context}
              <div class="element-context">
                <div class="context-label">上下文:</div>
                <div class="context-text">{element.context}</div>
              </div>
            {/if}
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
    width: 100%;
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

  .content-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
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
