<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation } from "../navigation";
  import { mobileUtils, getCurrentDeviceType, DeviceType } from "../utils";
  import { settings } from "@/settings";
  import pluginMetadata from "../plugin";

  export let onClose: () => void;

  let currentDocTitle = "未知文档";
  let historyInfo = { backCount: 0, forwardCount: 0, current: null };
  let isVisible = true;
  let isMinimized = false;

  onMount(() => {
    updateCurrentDoc();
    updateHistoryInfo();

    // 定期更新信息
    const interval = setInterval(() => {
      updateCurrentDoc();
      updateHistoryInfo();
    }, 2000);

    return () => clearInterval(interval);
  });

  function updateCurrentDoc() {
    try {
      const currentDocId = navigation.getCurrentDocId();
      if (currentDocId) {
        currentDocTitle = "当前文档";
      }
    } catch (error) {
      console.error("更新当前文档信息失败:", error);
    }
  }

  function updateHistoryInfo() {
    historyInfo = navigation.getHistoryInfo();
  }

  async function handleGoBack() {
    await navigation.goToBack();
    updateHistoryInfo();
  }

  async function handleGoForward() {
    await navigation.goToForward();
    updateHistoryInfo();
  }

  async function handleGoToParent() {
    await navigation.goToParent();
  }

  async function handleGoToChild() {
    await navigation.goToChild();
  }

  async function handleGoToSibling(delta: -1 | 1) {
    await navigation.goToSibling(delta);
    updateHistoryInfo();
  }

  async function handleGoToRandom() {
    await navigation.goToRandom();
  }

  function handleClearHistory() {
    navigation.clearHistory();
    updateHistoryInfo();
  }

  function handleRefresh() {
    const currentDocId = navigation.getCurrentDocId();
    if (currentDocId) {
      window.open(`siyuan://blocks/${currentDocId}`, "_self");
    }
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
  }

  function handleClose() {
    isVisible = false;
    onClose?.();
  }

  function handleToggleVisibility() {
    isVisible = !isVisible;
  }
</script>

{#if isVisible}
  <div class="desktop-navigation-panel" class:minimized={isMinimized}>
    <!-- 标题栏 -->
    <div class="panel-header">
      <div class="header-left">
        <span class="panel-icon">🧭</span>
        <span class="panel-title">桌面端导航助手</span>
      </div>
      <div class="header-controls">
        <button class="minimize-btn" on:click={toggleMinimize} title={isMinimized ? "展开" : "最小化"}>
          {isMinimized ? "◢" : "◣"}
        </button>
        <button class="close-btn" on:click={handleClose} title="关闭">
          ×
        </button>
      </div>
    </div>

    {#if !isMinimized}
      <!-- 当前文档信息 -->
      <div class="current-doc-info">
        <div class="doc-title">
          <strong>📄 {currentDocTitle}</strong>
        </div>
        <div class="doc-id">
          ID: {navigation.getCurrentDocId() || "未知"}
        </div>
      </div>

      <!-- 导航控制区域 -->
      <div class="navigation-section">
        <h4>🎯 快速导航</h4>
        <div class="nav-grid">
          <button 
            class="nav-btn back-btn" 
            on:click={handleGoBack}
            disabled={historyInfo.backCount === 0}
            title="返回上一页 (Ctrl+←)"
          >
            <span class="icon">←</span>
            <span class="label">返回</span>
            {#if historyInfo.backCount > 0}
              <span class="count">{historyInfo.backCount}</span>
            {/if}
          </button>

          <button 
            class="nav-btn forward-btn" 
            on:click={handleGoForward}
            disabled={historyInfo.forwardCount === 0}
            title="前进下一页 (Ctrl+→)"
          >
            <span class="icon">→</span>
            <span class="label">前进</span>
            {#if historyInfo.forwardCount > 0}
              <span class="count">{historyInfo.forwardCount}</span>
            {/if}
          </button>

          <button class="nav-btn parent-btn" on:click={handleGoToParent} title="跳转到父文档">
            <span class="icon">↑</span>
            <span class="label">父文档</span>
          </button>

          <button class="nav-btn child-btn" on:click={handleGoToChild} title="跳转到子文档">
            <span class="icon">↓</span>
            <span class="label">子文档</span>
          </button>

          <button class="nav-btn prev-btn" on:click={() => handleGoToSibling(-1)} title="上一个兄弟文档">
            <span class="icon">⤴</span>
            <span class="label">上一个</span>
          </button>

          <button class="nav-btn next-btn" on:click={() => handleGoToSibling(1)} title="下一个兄弟文档">
            <span class="icon">⤵</span>
            <span class="label">下一个</span>
          </button>

          <button class="nav-btn random-btn" on:click={handleGoToRandom} title="随机跳转到文档">
            <span class="icon">🎲</span>
            <span class="label">随机</span>
          </button>

          <button class="nav-btn home-btn" on:click={() => navigation.goToHome()} title="回到首页">
            <span class="icon">🏠</span>
            <span class="label">首页</span>
          </button>
        </div>
      </div>

      <!-- 实用工具区域 -->
      <div class="utility-section">
        <h4>🔧 实用工具</h4>
        <div class="utility-grid">
          <button class="util-btn refresh-btn" on:click={handleRefresh} title="刷新当前文档">
            <span class="icon">🔄</span>
            <span class="label">刷新</span>
          </button>

          <button class="util-btn clear-history-btn" on:click={handleClearHistory} title="清空历史记录">
            <span class="icon">🗑️</span>
            <span class="label">清空历史</span>
          </button>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="status-section">
        <div class="history-stats">
          <span class="stat back-stat">
            <strong>↩️ 返回:</strong> {historyInfo.backCount} 项
          </span>
          <span class="stat forward-stat">
            <strong>↪️ 前进:</strong> {historyInfo.forwardCount} 项
          </span>
        </div>
        <div class="device-info">
          <span class="device-stat active">
            💻 桌面端
          </span>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .desktop-navigation-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-height: 70vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 1000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .desktop-navigation-panel.minimized {
    height: 50px;
    width: 250px;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .panel-icon {
    font-size: 18px;
  }

  .panel-title {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .header-controls {
    display: flex;
    gap: 8px;
  }

  .minimize-btn, .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .minimize-btn:hover, .close-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .current-doc-info {
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .doc-title {
    color: white;
    font-size: 14px;
    margin-bottom: 6px;
  }

  .doc-id {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  .navigation-section, .utility-section, .status-section {
    padding: 16px 20px;
  }

  .navigation-section h4, .utility-section h4 {
    color: white;
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .nav-grid, .utility-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .nav-btn, .util-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
    color: white;
    backdrop-filter: blur(10px);
  }

  .nav-btn:hover, .util-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
  }

  .nav-btn:active, .util-btn:active {
    transform: translateY(0);
  }

  .nav-btn:disabled, .util-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .icon {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.9);
  }

  .count {
    background: #ff6b6b;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
    margin-top: 2px;
  }

  /* 不同按钮的悬停效果 */
  .back-btn:hover { background: rgba(116, 185, 255, 0.3); }
  .forward-btn:hover { background: rgba(116, 185, 255, 0.3); }
  .parent-btn:hover { background: rgba(162, 155, 254, 0.3); }
  .child-btn:hover { background: rgba(162, 155, 254, 0.3); }
  .prev-btn:hover { background: rgba(254, 202, 87, 0.3); }
  .next-btn:hover { background: rgba(254, 202, 87, 0.3); }
  .random-btn:hover { background: rgba(255, 159, 243, 0.3); }
  .home-btn:hover { background: rgba(116, 185, 255, 0.3); }
  .refresh-btn:hover { background: rgba(255, 159, 243, 0.3); }
  .clear-history-btn:hover { background: rgba(255, 107, 107, 0.3); }

  .status-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
  }

  .history-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    gap: 8px;
  }

  .stat {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    font-size: 12px;
    color: white;
    flex: 1;
    text-align: center;
  }

  .device-info {
    display: flex;
    justify-content: center;
  }

  .device-stat {
    padding: 4px 12px;
    background: rgba(116, 185, 255, 0.3);
    border-radius: 12px;
    font-size: 11px;
    color: white;
    border: 1px solid rgba(116, 185, 255, 0.5);
  }

  /* 响应式设计 */
  @media (max-width: 1024px) {
    .desktop-navigation-panel {
      width: 320px;
      bottom: 15px;
      right: 15px;
    }
    
    .nav-grid, .utility-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .desktop-navigation-panel {
      width: 280px;
      bottom: 10px;
      right: 10px;
    }
    
    .panel-header {
      padding: 12px 16px;
    }
    
    .navigation-section, .utility-section, .status-section {
      padding: 12px 16px;
    }
  }
</style>