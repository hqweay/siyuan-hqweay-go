<script lang="ts">
  import { onMount } from "svelte";
  import BacklinkFilterPanelPage from "./backlink-filter-panel-page.svelte";
  import CustomSqlPanel from "./custom-sql-panel.svelte";
  import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";

  export let rootId: string;
  export let focusBlockId: string;
  export let currentTab: any;

  // Tab状态管理
  let activeTab: "backlink" | "sql" = "backlink";

  // Tab配置
  const tabs = [
    {
      id: "backlink" as const,
      name: "反链",
      icon: "#iconLink",
      component: BacklinkFilterPanelPage,
    },
    {
      id: "sql" as const,
      name: "SQL",
      icon: "#iconSQL",
      component: CustomSqlPanel,
    },
  ];

  function switchTab(tabId: "backlink" | "sql") {
    activeTab = tabId;
  }

  // 获取当前激活的Tab配置
  $: currentTabConfig = tabs.find((tab) => tab.id === activeTab);
</script>

<div class="tab-panel-container">
  <!-- Tab头部 -->
  <div class="tab-header">
    <div class="tab-nav">
      {#each tabs as tab}
        <button
          class="tab-button"
          class:active={activeTab === tab.id}
          on:click={() => switchTab(tab.id)}
          title={tab.name}
        >
          <svg class="tab-icon"><use xlink:href={tab.icon}></use></svg>
          <span class="tab-name">{tab.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Tab内容区域 -->
  <div class="tab-content">
    {#if activeTab === "backlink"}
      <BacklinkFilterPanelPage {rootId} {focusBlockId} {currentTab} />
    {:else if activeTab === "sql"}
      <CustomSqlPanel />
    {/if}
  </div>
</div>

<style>
  .tab-panel-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--b3-theme-background);
  }

  .tab-header {
    /* border-bottom: 1px solid var(--b3-theme-outline-variant);
        background: var(--b3-theme-surface);
        position: sticky;
        top: 0;
        z-index: 10; */
    position: sticky;
    /* top: 0; */
    text-align: center;
    padding: 0px 0px;
    z-index: 2;
    background-color: var(--b3-theme-surface);
    margin-bottom: 10px;
    border-radius: 10px;
  }

  .tab-nav {
    display: flex;
    padding: 0 12px;
    gap: 4px;
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--b3-theme-on-surface);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 14px;
    white-space: nowrap;
    position: relative;
  }

  .tab-button:hover {
    background: var(--b3-theme-surface-variant);
    color: var(--b3-theme-on-surface);
  }

  .tab-button.active {
    color: var(--b3-theme-primary);
    border-bottom-color: var(--b3-theme-primary);
    background: var(--b3-theme-background);
  }

  .tab-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tab-name {
    font-weight: 500;
  }

  /* 在移动设备上隐藏文字，只显示图标 */
  @media (max-width: 768px) {
    .tab-name {
      display: none;
    }

    .tab-button {
      padding: 8px;
      min-width: 36px;
      justify-content: center;
    }
  }

  .tab-content {
    flex: 1;
    /* overflow: auto; */
    overflow: visible;
    display: flex;
    flex-direction: column;
  }
</style>
