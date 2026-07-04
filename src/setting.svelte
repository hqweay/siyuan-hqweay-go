<script lang="ts">
  import { settings } from "@/settings";
  import { showMessage } from "siyuan";
  import { onDestroy } from "svelte";
  import SettingPanel from "./libs/setting-panel.svelte";
  // let groups: string[] = ["Default", "自动获取链接标题"];
  import FetchCodeSnippets from "./lets-fetch-code-snippets";
  import VoiceNotesPlugin from "./lets-voicenotes-sync";
  import { selectIconDialog } from "./myscripts/utils";
  import { PluginRegistry } from "./plugin-registry";
  import { plugin } from "./utils";

  const initData = () => {
    const pluginRegistry = PluginRegistry.getInstance();
    const pluginConfigs = pluginRegistry.getPluginConfigs();

    // Generate dynamic settings from plugins
    const dynamicSettings: any = {
      开关: [],
      设置: [
        {
          type: "button",
          title: "合并数据",
          description: "若某些功能无法正常使用，尝试使用此选项。",
          key: "mergeData",
          value: "确认",
        },
        {
          type: "button",
          title: "恢复/清理数据",
          description: "若合并数据后仍有问题，尝试使用此选项。",
          key: "resetData",
          value: "确认",
        },
      ],
    };

    //console.log("pluginConfigs");
    //console.log(pluginConfigs);

    // Add plugin flags
    for (const pluginMeta of pluginConfigs) {
      dynamicSettings.开关.push({
        type: "checkbox",
        title: pluginMeta.displayName || pluginMeta.name,
        description: pluginMeta.description || "",
        key: pluginMeta.name,
        value:
          settings.getBySpace(pluginMeta.name, "enabled") ||
          pluginMeta.enabled ||
          false,
        hasSetting: pluginMeta.settings ? true : false,
      });

      //console.log(pluginMeta.name);
      //console.log("pluginMeta.settings");
      //console.log(pluginMeta.settings);
      // 创建新的设置数组，但不修改原对象
      const newSettings = pluginMeta.settings?.map((item) => ({
        ...item,
        value: settings.getBySpace(pluginMeta.name, item.key) || item.value,
      }));

      // 添加到 dynamicSettings
      if (newSettings?.length) {
        dynamicSettings[pluginMeta.displayName] = newSettings;
      }
    }

    //console.log("dynamicSettings");
    //console.log(dynamicSettings);
    return dynamicSettings;
  };

  let SettingItems = initData();

  $: groups = [
    "开关",
    "设置",
    // "移动端助手",
    ...SettingItems["开关"]
      .filter((item) => item.value === true && item.hasSetting)
      .map((item) => item.title),
  ];

  let focusGroup = "开关";
  let showBottomSheet = false;

  $: {
    if (groups && !groups.includes(focusGroup)) {
      focusGroup = "开关";
    }
  }

  /********** Events **********/
  interface ChangeEvent {
    group: string;
    key: string;
    value: any;
  }

  const onClick = async ({ detail }: CustomEvent<ChangeEvent>) => {
    if ("设置" === detail.group) {
      if ("resetData" === detail.key) {
        await settings.resetData();
        SettingItems = initData();
        showMessage("配置恢复为默认值");
      } else if ("mergeData" === detail.key) {
        await settings.mergeData();
        SettingItems = initData();
        showMessage("合并配置为最新配置");
      }
    } else if ("VoiceNotes 同步" === detail.group) {
      if ("fullSyncVoiceNotes" === detail.key) {
        await new VoiceNotesPlugin().exec(true);
      }
    } else if ("侧边栏展示文档或块" === detail.group) {
      if ("selectIcon" === detail.key) {
        selectIconDialog();
      }
    }
  };

  const onChanged = async ({ detail }: CustomEvent<ChangeEvent>) => {
    if (detail.group === "开关") {
      settings.setBySpace(detail.key, "enabled", detail.value);

      if (!detail.value) {
        //卸载自己就行了
        PluginRegistry.getInstance().unloadPlugin(detail.key);
      } else {
        //动态加载; addDock 有点问题，目前不能实时切换
        await PluginRegistry.getInstance().beginPlugin(detail.key);
      }
      // 无论启用还是禁用，均重新载入设置数据
      SettingItems = initData();
    } else if (detail.group === "代码片段托管") {
      settings.setBySpace("codeSnippets", detail.key, detail.value);

      if (detail.value) {
        (
          PluginRegistry.getInstance().getPlugin(
            "fetch-code-snippets",
          ) as FetchCodeSnippets
        ).insertSingleCSSByID(detail.key);
      } else {
        (
          PluginRegistry.getInstance().getPlugin(
            "fetch-code-snippets",
          ) as FetchCodeSnippets
        ).onunloadCSSByID(detail.key);
      }
    } else {
      const opItem = SettingItems["开关"].filter((ele) => {
        return ele.title === detail.group;
      });
      console.log("opItem", opItem);
      console.log("detail", detail);

      settings.setBySpace(opItem[0].key, detail.key, detail.value);

      console.log(settings.getBySpace(opItem[0].key, detail.key));
      // 子组件的配置修改了，立马刷新
      await PluginRegistry.getInstance().beginPlugin(opItem[0].key);
    }

    for (let index = 0; index < SettingItems[focusGroup].length; index++) {
      if (SettingItems[focusGroup][index].key === detail.key) {
        SettingItems[focusGroup][index].value = detail.value;
        break;
      }
    }
    settings.save();
  };

  onDestroy(async () => {
    await settings.save();
    //console.log("onDestroy");
  });

  const lreload = () => {
    location.reload();
  };
</script>

<div class="fn__flex-1 fn__flex config__panel">
  <!-- Desktop Sidebar -->
  <ul class="sidebar-menu">
    {#each groups as group}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <li
        class="sidebar-item"
        class:active={group === focusGroup}
        on:click={() => {
          focusGroup = group;
          settings.save();
        }}
        on:keydown={() => {}}
      >
        <span class="b3-list-item__text_my">{group}</span>
      </li>
    {/each}
  </ul>

  <!-- Mobile Selector Bar -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="mobile-selector-bar" on:click={() => (showBottomSheet = true)}>
    <span class="current-category">{focusGroup}</span>
    <span class="arrow-icon">▼</span>
  </div>

  <!-- Main Content Wrap -->
  <div class="config__tab-wrap">
    <!-- Global Persistent Warning Banner -->
    <div class="global-banner">
      <div class="banner-left">
        <span>💡</span>
        <span>部分功能设置后需重启插件生效.</span>
      </div>
      <button
        class="b3-button b3-button--outline my-reload-button"
        on:click={lreload}
      >
        现在重载
      </button>
    </div>

    <!-- Active Setting Panel -->
    <div class="panel-content">
      <SettingPanel
        group={focusGroup}
        settingItems={SettingItems[focusGroup]}
        on:changed={onChanged}
        on:click={onClick}
      />
    </div>
  </div>
</div>

<!-- Mobile Bottom Sheet Drawer -->
{#if showBottomSheet}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div class="bottom-sheet-backdrop" on:click={() => (showBottomSheet = false)}>
    <div class="bottom-sheet-container" on:click|stopPropagation>
      <div class="bottom-sheet-header">
        <h3>选择设置分类</h3>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <button class="close-btn" on:click={() => (showBottomSheet = false)}
          >&times;</button
        >
      </div>
      <ul class="bottom-sheet-list">
        {#each groups as group}
          <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
          <li
            class:active={group === focusGroup}
            on:click={() => {
              focusGroup = group;
              settings.save();
              showBottomSheet = false;
            }}
          >
            {group}
          </li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style lang="scss">
  .config__panel {
    display: flex;
    height: 100%;
    overflow: hidden;
    background-color: var(--b3-theme-background);
  }

  /* Desktop Sidebar styling */
  .sidebar-menu {
    width: 200px;
    flex-shrink: 0;
    border-right: 1px solid var(--b3-theme-outline-variant);
    padding: 16px 12px;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    background-color: var(--b3-theme-surface-variant, inherit);
  }

  .sidebar-item {
    list-style: none;
    padding: 10px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--b3-theme-on-surface);
    display: flex;
    align-items: center;

    &:hover {
      background-color: var(--b3-theme-background-hover);
    }

    &.active {
      background-color: var(--b3-theme-primary-light, rgba(59, 130, 246, 0.08));
      color: var(--b3-theme-primary);
      font-weight: 600;
    }
  }

  .b3-list-item__text_my {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Content Wrapper styling */
  .config__tab-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 24px;
    box-sizing: border-box;
  }

  .panel-content {
    flex: 1;
  }

  /* Global Banner styling */
  .global-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px;
    background-color: var(--b3-theme-warning-light, rgba(245, 158, 11, 0.06));
    border: 1px solid var(--b3-theme-warning, #eab308);
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 13px;
    color: var(--b3-theme-warning-on, #854d0e);

    .banner-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .my-reload-button {
      flex-shrink: 0;
      border: 1px solid var(--b3-theme-warning, #eab308) !important;
      color: var(--b3-theme-warning-on, #854d0e) !important;
      background: transparent;
      padding: 4px 12px;
      font-size: 12px;
      height: 28px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: var(--b3-theme-warning, #eab308) !important;
        color: var(--b3-theme-on-warning, #ffffff) !important;
      }
    }
  }

  /* Hide mobile selector on desktop */
  .mobile-selector-bar {
    display: none;
  }

  /* Mobile Responsive styling */
  @media (max-width: 768px) {
    .config__panel {
      flex-direction: column;
    }

    .sidebar-menu {
      display: none;
    }

    .mobile-selector-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      margin: 16px 16px 8px 16px;
      background-color: var(--b3-theme-surface);
      border: 1px solid var(--b3-theme-outline-variant);
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .arrow-icon {
        font-size: 10px;
        color: var(--b3-theme-on-surface-light, #9ca3af);
      }
    }

    .config__tab-wrap {
      padding: 8px 16px 16px 16px;
    }

    .global-banner {
      margin-bottom: 16px;
      padding: 10px 14px;
      flex-direction: row;
      align-items: center;

      .my-reload-button {
        padding: 2px 10px;
        height: 26px;
      }
    }

    /* Bottom Sheet Layout */
    .bottom-sheet-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: flex;
      align-items: flex-end;
    }

    .bottom-sheet-container {
      width: 100%;
      background-color: var(--b3-theme-surface);
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
      max-height: 60%;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
      animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bottom-sheet-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--b3-theme-outline-variant);
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: var(--b3-theme-on-surface);
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        color: var(--b3-theme-on-surface-light, #9ca3af);
        line-height: 1;
      }
    }

    .bottom-sheet-list {
      margin: 0;
      padding: 8px 0 24px 0;
      overflow-y: auto;
      list-style: none;

      li {
        padding: 14px 24px;
        font-size: 14px;
        color: var(--b3-theme-on-surface);
        border-bottom: 1px solid var(--b3-theme-background);
        cursor: pointer;
        transition: background-color 0.2s;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background-color: var(--b3-theme-background-hover);
        }

        &.active {
          color: var(--b3-theme-primary);
          font-weight: 600;
          background-color: var(
            --b3-theme-primary-light,
            rgba(59, 130, 246, 0.08)
          );
        }
      }
    }
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
</style>
