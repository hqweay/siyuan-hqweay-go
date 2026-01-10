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
        //应对动态生成设置项的情况，比如 代码片段托管v
        SettingItems = initData();
      }
    } else if (detail.group === "代码片段托管") {
      settings.setBySpace("codeSnippets", detail.key, detail.value);

      if (detail.value) {
        (
          PluginRegistry.getInstance().getPlugin(
            "fetch-code-snippets"
          ) as FetchCodeSnippets
        ).insertSingleCSSByID(detail.key);
      } else {
        (
          PluginRegistry.getInstance().getPlugin(
            "fetch-code-snippets"
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
  <ul class="b3-tab-bar b3-list b3-list--background first-menu">
    {#each groups as group}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <li
        data-name="editor"
        class:b3-list-item--focus={group === focusGroup}
        class="b3-list-item"
        on:click={() => {
          focusGroup = group;
          settings.save();
          //console.log("focusGroup", focusGroup);
          //console.log("SettingItems", SettingItems);
        }}
        on:keydown={() => {}}
      >
        <span class="b3-list-item__text_my">{group}</span>
      </li>
    {/each}
  </ul>
  <div class="config__tab-wrap">
    <SettingPanel
      group={focusGroup}
      settingItems={SettingItems[focusGroup]}
      on:changed={onChanged}
      on:click={onClick}
    >
      <div class="fn__flex b3-label">
        <div>💡 部分功能设置后需重启插件生效.</div>
        <div>
          <button
            class="b3-button b3-button--outline fn__flex-center fn__size200 my-reload-button"
            on:click={lreload}>现在重载</button
          >
        </div>
      </div>
    </SettingPanel>
  </div>
</div>

<style lang="scss">
  .config__panel {
    height: 100%;
  }

  /* 移动端：一级菜单和设置面板分排显示 */
  @media (max-width: 768px) {
    /* 一级菜单容器 */
    .config__panel > ul.b3-tab-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .config__panel > ul > li {
      padding-left: 1rem;
      flex-shrink: 0;
    }
    .my-reload-button {
      margin-left: 20%;
    }
    .first-menu {
      margin-top: 10px;
    }
    .my-reload-button {
      margin-left: unset;
    }
    .config__panel {
      flex-direction: column;
    }

    .config__panel > ul.b3-tab-bar {
      flex-direction: row;
      flex-wrap: wrap;
      width: 100%;
    }

    .config__tab-wrap {
      width: 100%;
      margin-top: 12px;
    }
    .b3-list-item {
      background: antiquewhite;
    }
    .b3-list-item--focus {
      background: orange;
    }
  }

  .b3-list-item__text_my {
    flex: 1;
    background-color: rgba(0, 0, 0, 0);
    text-align: left;
    border: 0;
    padding: 0;
    color: var(--b3-theme-on-background);
    word-break: break-all;
    -webkit-line-clamp: 1;
    overflow: hidden !important;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
  }
</style>
