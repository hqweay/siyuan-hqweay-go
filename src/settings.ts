import { fetchSyncPost } from "siyuan";
import { deepMerge, plugin } from "./utils";
import { scale } from "svelte/transition";
import { PluginRegistry } from "./plugin-registry";
// import { template } from "@siyuan-community/siyuan-sdk/dist/types/kernel/api";

//配置文件名称
export const CONFIG = "hqweay-go-config";

const inpuAreas = {
  "Gemini 总结": "shortcuts://run-shortcut?name=Gemini 总结剪贴板",
  "ChatGPT 总结": "https://chat.openai.com/chat?q=请帮我总结：${content}",
  提醒事项: "shortcuts://run-shortcut?name=从剪贴板添加提醒事项",
  添加块链接到提醒事项: "shortcuts://run-shortcut?name=从剪贴板添加提醒事项",
  "Google 搜索": "https://www.google.com/search?q=${content}",
};
// 动态生成默认配置
function generateDefaultConfig(pluginRegistry: PluginRegistry) {
  const config: any = {};

  // 从插件注册表获取所有插件配置
  const pluginConfigs = pluginRegistry.getPluginConfigs();

  console.log("pluginConfigs", pluginConfigs);

  // 为每个插件添加默认配置
  for (const pluginMeta of pluginConfigs) {
    // 添加插件默认配置
    if (pluginMeta.defaultConfig) {
      const configKey = pluginMeta.name;
      config[configKey] = { ...pluginMeta.defaultConfig };
    }
  }

  // 添加一些全局配置（这些是还没有迁移到子插件的功能）
  config.codeSnippets = {};
  config.doOnPaste = {
    title: true,
    recAnno: false,
    resizeAndCenterImg: false,
  };
  config.sendTo = {
    inputArea: Object.entries(inpuAreas)
      .map(([key, value]) => `${key}====${value}`)
      .join("\n"),
    isToClipboard: true,
    separator: "",
  };
  config.convert = {
    styleNesting: true,
  };
  config.memo = {
    id: "20240406015842-137jie3",
    activeDoc: false,
  };
  config.dockLeft = {
    ids: `🥹====20240330144736-irg5pfz
😉====20240416195915-sod1ftd
🌁====siyuan://plugins/sy-docs-flow/open-rule?ruleType=SQL&ruleInput=select+B.*+from+blocks+as+B+join+attributes+as+A%0Aon+B.id+%3D+A.block_id%0Awhere+A.name+like+%27custom-dailynote%25%27%0Aorder+by+A.value+desc%3B&ruleTitle=%F0%9F%98%80%F0%9F%98%80+Daily+Notes&ruleConfig=%7B%22scroll%22%3Afalse%2C%22breadcrumb%22%3Afalse%2C%22protyleTitle%22%3Atrue%2C%22readonly%22%3Afalse%2C%22dynamicLoading%22%3A%7B%22enabled%22%3Atrue%2C%22capacity%22%3A15%2C%22shift%22%3A10%7D%7D`,
  };
  config.read = {
    extractPath: "",
    noteBookID: "",
    keepContext: true,
    addRef: false,
    addOutline: false,
  };
  config.readHelper = {
    markAndCopyRef: false,
    markAndCopyTextRef: false,
    markAndCopyTextRefNoHighlight: false,
  };
  config.bookmark = {
    items: "读到这里啦",
  };
  config.typography = {
    autoSpace: false,
    netImg2LocalAssets: false,
    closeTip: true,
    imageCenter: 0,
  };
  config.dockShowAndHide = {
    items: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    leftWidth: `200px`,
    rightWidth: `200px`,
    hideDock: false,
    returnIfSplit: true,
    otherDocs: "恢复上次使用配置",
  };
  config.card = {
    author: "养恐龙",
    addTime: "byCreated",
    hideLi: true,
    pLineHeight: 0,
    addDOCTitle: "center",
    cardBackgroundColor: "beige",
    innerBackgroundColor: "beige",
    fontColor: "black",
    hfColor: "brown",
    template: "",
    templates: {
      "卡片、内容都绿色；字体红色；": {
        hideLi: false,
        author: "养恐龙",
        addTime: "byCreated",
        cardBackgroundColor: "#72c396",
        innerBackgroundColor: "#72c396",
        fontColor: "red",
        hfColor: "brown",
        pLineHeight: 0,
        addDOCTitle: "none",
      },
      "卡片、内容都绿色；字体黑色；": {
        hideLi: false,
        author: "养恐龙",
        addTime: "byCreated",
        cardBackgroundColor: "#72c396",
        innerBackgroundColor: "#72c396",
        fontColor: "black",
        hfColor: "brown",
        pLineHeight: 0,
        addDOCTitle: "none",
      },
      诗歌: {
        hideLi: false,
        author: "养恐龙",
        addTime: "byCreated",
        cardBackgroundColor: "#72c396",
        innerBackgroundColor: "#72c396",
        fontColor: "black",
        hfColor: "brown",
        pLineHeight: 0,
        addDOCTitle: "center",
      },
      "卡片绿色；内容块：beige；字体黑色；": {
        hideLi: false,
        author: "养恐龙",
        addTime: "byCreated",
        cardBackgroundColor: "#72c396",
        innerBackgroundColor: "beige",
        fontColor: "black",
        hfColor: "brown",
        pLineHeight: 0,
        addDOCTitle: "none",
      },
    },
  };
  config.voiceNotes = {
    token: "",
    formatContent: false,
    syncedRecordingIds: "",
    syncDirectory: "voicenotes",
    dateFormat: "YYYY-MM-DD HH:mm:ss",
    latestDataCountOfPage: "-1",
    manualSyncPageCount: "2",
    excludeTags: "siyuan",
    notebook: "",
    newLineNewBlock: true,
    noteTemplate: `{% if summary %}
## Summary

{{ summary }}
{% endif %}

{% if points %}
## Main points

{{ points }}
{% endif %}

{% if attachments %}
## Attachments

{{ attachments }}
{% endif %}

{% if tidy %}
## Tidy Transcript

{{ tidy }}

{% else %}
## Transcript

{{ transcript }}
{% endif %}

{% if todo %}
## Todos

{{ todo }}
{% endif %}

{% if email %}
## Email

{{ email }}
{% endif %}

{% if blog %}
## Blog

{{ blog }}
{% endif %}

{% if tweet %}
## Tweet

{{ tweet }}
{% endif %}

{% if custom %}
## Others

{{ custom }}
{% endif %}

{% if teamSummary %}
## Team Summary

{{ teamSummary }}
{% endif %}

{% if related_notes %}
## Related Notes

{{ related_notes }}
{% endif %}
`,
  };
  config.showCustomPropertiesUnderTitle = {
    customProperties: "custom-createdAt|创建时间",
  };
  config.mobileHelper = {
    enableBottomNav: true,
    showBackButton: true,
    navJustInMain: true,
    noteBookID: "",
    showForwardButton: false,
    showDashBoard: true,
    showRandomButton: true,
    showCustomLinksButton: true,
    showContextButton: true,
    navBarHeight: "60px",
    backgroundColor: "#ffffff",
    buttonColor: "#333333",
    activeButtonColor: "#007aff",
    randomSql:
      "SELECT id FROM blocks WHERE type = 'd' ORDER BY RANDOM() LIMIT 1",
    customLinks:
      "Daily Notes====siyuan://plugins/sy-docs-flow/open-rule?ruleType=DailyNote&ruleInput=20240330144726-gs2xey6&ruleTitle=%E6%81%90%E9%BE%99%E4%BC%9A%E9%A3%9E%F0%9F%A6%95&ruleConfig=%7B%22scroll%22%3Afalse%2C%22breadcrumb%22%3Afalse%2C%22protyleTitle%22%3Atrue%2C%22readonly%22%3Afalse%2C%22dynamicLoading%22%3A%7B%22enabled%22%3Atrue%2C%22capacity%22%3A20%2C%22shift%22%3A10%7D%7D\n养恐龙====https://leay.net/\n日记随机====select * from blocks where path like '%/20250126213235-a3tnoqb/%' and type='d'\n草稿随机====select * from blocks where path like '%/20240406015842-137jie3/%' and type='d'\n添加到写作数据库====20250914152149-1emaqok",
  };
  config.createDailyNote = {
    noteBookID: "20240330144726-gs2xey6",
    slashDiaryNote: true,
    quickInput: true,
    topBar: false,
    getWeatherSetAttrs: "101270101",
  };
  config.quickAttr = {
    attrs: `[
    {
  name: "@测试配置多个属性-@开头会注册进slash",
    keyvalues : {
      "key1": "value1",
      "key2": "value2",
      "key3": "value3"
    },
    enabled: true,
  },
  {
    name: "恢复转换效果",
    key: "f",
    value: "",
    enabled: true,
  },
  {
    name: "转换为表格",
    key: "f",
    value: "bg",
    enabled: true,
  },
  {
    name: "转换为导图",
    key: "f",
    value: "dt",
    enabled: true,
  },
  {
    name: "转换为时间线",
    key: "f",
    value: "timeline",
    enabled: true,
  },
  {
    name: "转换为看板",
    key: "f",
    value: "kb",
    enabled: true,
  },
  {
    name: "转换为Tab",
    key: "f",
    value: "list2tab",
    enabled: true,
  },
]`,
  };
  config.docky = {
    zoomScale: 100,
    rules: `id:20251126002344-r4jzwns,name:haha,position: RightTop`,
  };

  console.log("config", config);

  return config;
}

let mergedFlag = true;
/**
 * 配置类
 */
class Settings {
  private pluginRegistry = PluginRegistry.getInstance();

  // 获取动态生成的默认配置
  private getDefaultConfig() {
    return generateDefaultConfig(this.pluginRegistry);
  }

  //初始化配置文件
  async initData() {
    //载入配置
    await this.load();

    console.log("initData", plugin.data[CONFIG]);

    //配置不存在则按照默认值建立配置文件
    if (
      plugin.data[CONFIG] === "" ||
      plugin.data[CONFIG] === undefined ||
      plugin.data[CONFIG] === null
    ) {
      await plugin.saveData(CONFIG, JSON.stringify(this.getDefaultConfig()));
    }

    //插件加载时 merge
    if (!mergedFlag) {
      console.log("mergeData", plugin.data[CONFIG]);
      await this.mergeData();
      mergedFlag = true;
    } else {
      // console.log("loadData", plugin.data[CONFIG]);
      await this.load();
    }
  }

  async resetData() {
    await plugin.saveData(CONFIG, JSON.stringify(this.getDefaultConfig()));
    await this.load();
  }

  async mergeData() {
    const DEFAULT_CONFIG = this.getDefaultConfig();

    // console.log("mergeData", plugin.data[CONFIG]);
    // console.log("mergeData", DEFAULT_CONFIG);
    deepMerge(DEFAULT_CONFIG, plugin.data[CONFIG]);
    // console.log("mergeData", DEFAULT_CONFIG);
    await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    await this.load();
  }

  // Legacy method for backward compatibility
  setFlag(key: any, value: any, config = CONFIG) {
    // Redirect to plugin's enabled config
    this.setBySpace(key, "enabled", value, config);
  }

  getFlag(key: any, config = CONFIG) {
    // Redirect to plugin's enabled config
    return this.getBySpace(key, "enabled", config);
  }

  setBySpace(space: any, key: any, value: any, config = CONFIG) {
    console.log("setBySpace", space, key, value, config);
    console.log("plugin.data[config]", plugin.data[config]);
    plugin.data[config][space][key] = value;
  }
  getBySpace(space: any, key: any, config = CONFIG) {
    return plugin.data[config] && plugin.data[config][space]?.[key];
  }

  set(key: any, value: any, config = CONFIG) {
    plugin.data[config][key] = value;
  }

  get(key: any, config = CONFIG) {
    return plugin.data[config]?.[key];
  }

  async load(config = CONFIG) {
    await plugin.loadData(config);
  }

  async save(config = CONFIG) {
    console.log("save", plugin.data[config]);
    await plugin.saveData(config, plugin.data[config]);
    await this.load();
  }

  async saveCopy(config = CONFIG) {
    await plugin.saveData(config, plugin.data[CONFIG]);
  }

  async saveTo(config: string) {
    plugin.data[config]["docBuilder"] = plugin.data[CONFIG]["docBuilder"];
    await plugin.saveData(CONFIG, plugin.data[config]);
  }

  async remove(config = CONFIG) {
    await plugin.removeData(config);
  }

  async rename(config: string, newname: string) {
    await fetchSyncPost("/api/file/renameFile", {
      path: `/data/storage/petal/siyuan-plugins-index/${config}`,
      newPath: `/data/storage/petal/siyuan-plugins-index/${newname}`,
    });
  }

  loadSettings(data: any) {
    this.set("icon", data.icon);
    this.set("depth", data.depth);
    this.set("listType", data.listType);
    this.set("linkType", data.linkType);
    this.set("fold", data.fold);
    this.set("col", data.col);
    this.set("autoUpdate", data.autoUpdate);
  }

  loadSettingsforOutline(data: any) {
    this.set("at", data.at);
    this.set("outlineType", data.outlineType);
    this.set("outlineAutoUpdate", data.outlineAutoUpdate);
    this.set("listTypeOutline", data.listTypeOutline);
  }
}

export const settings: Settings = new Settings();
