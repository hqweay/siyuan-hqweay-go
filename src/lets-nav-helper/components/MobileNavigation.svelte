<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { navigation } from "../navigation";
  import { mobileUtils, isMobile } from "../utils";

  export let onClose: () => void;

  let currentDocTitle = "未知文档";
  let historyInfo = { backCount: 0, forwardCount: 0, current: null };
  let deviceInfo = { isMobile: false, isTablet: false, isDesktop: false };

  onMount(() => {
    updateCurrentDoc();
    updateHistoryInfo();
    updateDeviceInfo();

    // 定期更新信息
    const interval = setInterval(() => {
      updateCurrentDoc();
      updateHistoryInfo();
      updateDeviceInfo();
    }, 1000);

    return () => clearInterval(interval);
  });

  function updateCurrentDoc() {
    try {
      const currentDocId = navigation.getCurrentDocId();
      if (currentDocId) {
        // 这里可以添加获取文档标题的逻辑
        // 暂时使用默认标题
        currentDocTitle = "当前文档";
      }
    } catch (error) {
      console.error("更新当前文档信息失败:", error);
    }
  }

  function updateHistoryInfo() {
    historyInfo = navigation.getHistoryInfo();
  }

  function updateDeviceInfo() {
    deviceInfo = mobileUtils.getDeviceInfo();
  }

  async function handleGoBack() {
    await navigation.goToBack();
    updateHistoryInfo();
    onClose?.();
  }

  async function handleGoForward() {
    await navigation.goToForward();
    updateHistoryInfo();
    onClose?.();
  }

  async function handleGoToParent() {
    await navigation.goToParent();
    onClose?.();
  }

  async function handleGoToChild() {
    await navigation.goToChild();
    onClose?.();
  }

  async function handleGoToSibling(delta: -1 | 1) {
    await navigation.goToSibling(delta);
    updateHistoryInfo();
    onClose?.();
  }

  async function handleGoToRandom() {
    await navigation.goToRandom();
    onClose?.();
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
    onClose?.();
  }

  function handleOpenSettings() {
    if ((window as any).mobileHelper?.plugin?.openGlobalSetting) {
      (window as any).mobileHelper.plugin.openGlobalSetting();
    }
    onClose?.();
  }
</script>

<div class="mobile-navigation-panel">
  <div class="panel-header">
    <h3>移动端导航助手</h3>
    <button class="close-btn" on:click={onClose}>×</button>
  </div>

  <div class="current-doc-info">
    <div class="doc-title">
      <strong>当前文档:</strong> {currentDocTitle}
    </div>
    <div class="doc-id">
      ID: {navigation.getCurrentDocId() || "未知"}
    </div>
  </div>

  <div class="navigation-controls">
    <h4>导航控制</h4>
    <div class="control-grid">
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

      <button class="nav-btn home-btn" on:click={() => { navigation.goToHome(); onClose?.(); }} title="回到首页">
        <span class="icon">🏠</span>
        <span class="label">首页</span>
      </button>
    </div>
  </div>

  <div class="history-info">
    <h4>历史记录</h4>
    <div class="history-stats">
      <span class="stat">
        <strong>返回:</strong> {historyInfo.backCount} 项
      </span>
      <span class="stat">
        <strong>前进:</strong> {historyInfo.forwardCount} 项
      </span>
    </div>
    <button class="clear-history-btn" on:click={handleClearHistory}>
      清空历史记录
    </button>
  </div>

  <div class="utility-controls">
    <h4>实用工具</h4>
    <div class="utility-grid">
      <button class="util-btn refresh-btn" on:click={handleRefresh} title="刷新当前文档">
        <span class="icon">🔄</span>
        <span class="label">刷新</span>
      </button>

      <button class="util-btn settings-btn" on:click={handleOpenSettings} title="打开设置">
        <span class="icon">⚙️</span>
        <span class="label">设置</span>
      </button>
    </div>
  </div>

  <div class="device-info">
    <h4>设备信息</h4>
    <div class="device-stats">
      <span class="device-stat" class:active={deviceInfo.isMobile}>
        📱 移动端
      </span>
      <span class="device-stat" class:active={deviceInfo.isTablet}>
        📟 平板
      </span>
      <span class="device-stat" class:active={deviceInfo.isDesktop}>
        💻 桌面端
      </span>
    </div>
  </div>
</div>

<style>
  .mobile-navigation-panel {
    background: white;
    border-radius: 12px;
    padding: 20px;
    max-width: 400px;
    margin: 0 auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
  }

  .panel-header h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #f0f0f0;
    color: #666;
  }

  .current-doc-info {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .doc-title {
    font-size: 14px;
    color: #333;
    margin-bottom: 5px;
  }

  .doc-id {
    font-size: 12px;
    color: #666;
    font-family: monospace;
  }

  .navigation-controls, .history-info, .utility-controls, .device-info {
    margin-bottom: 20px;
  }

  .navigation-controls h4, .history-info h4, .utility-controls h4, .device-info h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #333;
    font-weight: 600;
  }

  .control-grid, .utility-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .nav-btn, .util-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
  }

  .nav-btn:hover, .util-btn:hover {
    background: #f0f8ff;
    border-color: #007aff;
    transform: translateY(-1px);
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
    color: #333;
  }

  .count {
    background: #007aff;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-top: 2px;
  }

  .back-btn:hover { background: #e8f4fd; }
  .forward-btn:hover { background: #e8f4fd; }
  .parent-btn:hover { background: #e8f5e8; }
  .child-btn:hover { background: #e8f5e8; }
  .prev-btn:hover { background: #fff2e8; }
  .next-btn:hover { background: #fff2e8; }
  .random-btn:hover { background: #f3e8ff; }
  .home-btn:hover { background: #e8f4fd; }
  .refresh-btn:hover { background: #f0f8ff; }
  .settings-btn:hover { background: #f0f0f0; }

  .history-stats {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 12px;
    color: #666;
  }

  .stat {
    padding: 4px 8px;
    background: #f0f0f0;
    border-radius: 4px;
  }

  .clear-history-btn {
    width: 100%;
    padding: 8px;
    background: #ff6b6b;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .clear-history-btn:hover {
    background: #ff5252;
  }

  .device-stats {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .device-stat {
    padding: 4px 8px;
    background: #f0f0f0;
    border-radius: 4px;
    font-size: 11px;
    color: #666;
  }

  .device-stat.active {
    background: #007aff;
    color: white;
  }

  @media (max-width: 480px) {
    .mobile-navigation-panel {
      margin: 10px;
      padding: 15px;
    }
    
    .control-grid, .utility-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    
    .nav-btn, .util-btn {
      padding: 10px 6px;
    }
  }
</style>