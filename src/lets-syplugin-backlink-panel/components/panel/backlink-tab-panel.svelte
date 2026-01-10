<script lang="ts">
  import { getBlockAttrs, setBlockAttrs } from "@/api";
  import { SettingService } from "@/lets-syplugin-backlink-panel/service/setting/SettingService";
  import { onMount } from "svelte";
  import BacklinkFilterPanelPage from "./backlink-filter-panel-page.svelte";
  import CustomSqlPanel from "./custom-sql-panel.svelte";

  export let rootId: string;
  export let focusBlockId: string;
  export let currentTab: any;

  // Tab状态管理
  let activeTab: "backlink" | "sql" = "backlink";

  // 保存的SQL列表
  let savedSqlList: Array<{ name: string; sql: string }> = [];
  let isLoadingSql = false;

  // Tab配置
  let defaultTabs = [
    {
      id: "backlink" as const,
      name: "反链",
      icon: "#iconLink",
      component: BacklinkFilterPanelPage,
    },
    ...SettingService.ins.SettingConfig["sqlQuery"]
      ?.split("/n")
      .map((sql, index) => {
        if (sql.trim() !== "") {
          const [name, sqlTemp] = sql.split(":");
          return {
            id: `sql-default-${name}` as const,
            name: `${name}`,
            icon: "#iconSQL",
            component: CustomSqlPanel,
            presetSql: sqlTemp,
          };
        }
        return null; // 或者用 undefined
      }),
  ];
  $: tabs = [...defaultTabs];

  // 从文档属性中获取保存的SQL
  async function loadSavedSqlList(event?: any) {
    try {
      isLoadingSql = true;
      // 说明是修改反显过来的
      if (event && event.detail) {
        savedSqlList = event.detail.savedSqlList;
        // 说明是新增SQL后切换过来的
      } else {
        const result = await getBlockAttrs(rootId);

        if (result && result["custom-tab-panel-sqls"]) {
          const sqlAttr = result["custom-tab-panel-sqls"];
          if (sqlAttr) {
            try {
              savedSqlList = JSON.parse(sqlAttr);
            } catch (e) {
              console.error("解析保存的SQL数据失败:", e);
              savedSqlList = [];
            }
          }
        }
      }
      updateSqlTabs();

      if (event && event.detail && event.detail.name) {
        if (event.detail.name === "backlink") {
          switchTab(`backlink`);
        } else if (activeTab !== `sql-${event.detail.name}`) {
          switchTab(`sql-${event.detail.name}`);
        }
      }
    } catch (error) {
      console.error("获取保存的SQL列表失败:", error);
      savedSqlList = [];
    } finally {
      isLoadingSql = false;
    }
  }

  // 更新SQL相关的Tab
  function updateSqlTabs() {
    // 移除现有的SQL相关tabs
    tabs = [...defaultTabs];

    // 添加保存的SQL作为单独的tab，每个Tab使用CustomSqlPanel
    savedSqlList.forEach((sqlItem, index) => {
      tabs.push({
        id: `sql-${sqlItem.name}` as const,
        name: sqlItem.name,
        icon: "#iconSQL",
        component: CustomSqlPanel,
        presetSql: sqlItem.sql, // 传递SQL内容给CustomSqlPanel
      });
    });

    // 添加"新增SQL"tab，使用SqlManagementPanel
    tabs.push({
      id: "sql" as const,
      name: "➕新增SQL",
      icon: "#iconAdd",
      component: CustomSqlPanel,
    });

    // tabs = tabs.map((tab) => ({ ...tab })); // 创建新对象数组以触发Svelte的响应式更新
  }

  async function switchTab(tabId: string) {
    activeTab = tabId as any;

    await setBlockAttrs(rootId, {
      "custom-tab-panel-active-tab": tabId,
    });

    // 如果切换到SQL tab，重新加载数据
    if (tabId === "sql") {
      loadSavedSqlList();
    }
  }

  onMount(async () => {
    // 初始化时加载SQL数据
    loadSavedSqlList();
    const activeTabResult = await getBlockAttrs(rootId);
    if (activeTabResult && activeTabResult["custom-tab-panel-active-tab"]) {
      activeTab = activeTabResult["custom-tab-panel-active-tab"] as any;
    }
  });
</script>

<div class="tab-panel-container">
  <!-- Tab头部 -->
  <div class="tab-header">
    <div class="tab-nav">
      {#each tabs as tab (tab.id)}
        <button
          class="tab-button"
          class:active={activeTab === tab.id}
          on:click={() => switchTab(tab.id)}
          title={tab.name}
        >
          <!-- <svg class="tab-icon"><use xlink:href={tab.icon}></use></svg> -->
          <span class="tab-name">{tab.name}</span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Tab内容区域 -->
  <div class="tab-content">
    <!-- {#if activeTab === "backlink"} -->
    <div class:is-hidden={activeTab !== "backlink"}>
      <BacklinkFilterPanelPage {rootId} {focusBlockId} {currentTab} />
    </div>
    <!-- {:else} -->
    <!-- 查找当前激活的Tab配置 -->
    {#each tabs as tab (tab.id)}
      <!-- {#if tab.id === activeTab} -->
      <div class:is-hidden={tab.id !== activeTab} class="custom-sql-panel-tab">
        {#if tab.component === CustomSqlPanel}
          <CustomSqlPanel
            presetSql={tab.presetSql}
            saveSqlName={tab.name}
            id={tab.id}
            {rootId}
            on:sqlUpdated={loadSavedSqlList}
          />
        {/if}
      </div>
      <!-- {/if} -->
    {/each}
    <!-- {/if} -->
  </div>
</div>

<style>
  .is-hidden {
    display: none;
  }
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
    flex-wrap: wrap;
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
      /* display: none; */
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
