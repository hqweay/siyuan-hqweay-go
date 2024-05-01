import { fetchSyncPost } from "siyuan";
import { plugin } from "./utils";

//配置文件名称
export const CONFIG = "hqweay-go-config";

const inpuAreas = {
  "Gemini 总结": "shortcuts://run-shortcut?name=Gemini 总结剪贴板",
  "ChatGPT 总结剪贴板": "shortcuts://run-shortcut?name=ChatGPT 总结剪贴板",
  提醒事项: "shortcuts://run-shortcut?name=从剪贴板添加提醒事项",
  "Google 搜索": "https://www.google.com/search?q=${content}",
};
//配置文件内容
const DEFAULT_CONFIG = {
  pluginFlag: {
    sendTo: false,
    convert: false,
    typography: false,
    title: false,
    randomNote: false,
    randomHeaderImage: false,
    memo: false,
    dockLeft: false,
    read: false,
    bookmark: false,
    dockShowAndHide: false,
  },
  sendToConfig: {
    inputArea: Object.entries(inpuAreas)
      .map(([key, value]) => `${key}====${value}`)
      .join("\n"),
    isToClipboard: true,
    separator: "",
  },
  randomHeaderImageConfig: {
    folderPaths: `/Users/hqweay/SiYuan/data/assets/images
https://img.xjh.me/random_img.php
https://shibe.online/api/shibes?count=1`,
    isCached: true,
  },
  randomNoteConfig: {
    rangeSQL: "SELECT root_id FROM blocks ORDER BY random() LIMIT 1",
  },
  convertConfig: {
    styleNesting: true,
  },
  memoConfig: {
    id: "20240406015842-137jie3",
  },
  dockLeftConfig: {
    ids: `🥹====20240330144736-irg5pfz
😉====20240416195915-sod1ftd
🌁====siyuan://plugins/sy-docs-flow/open-rule?ruleType=SQL&ruleInput=select+B.*+from+blocks+as+B+join+attributes+as+A%0Aon+B.id+%3D+A.block_id%0Awhere+A.name+like+%27custom-dailynote%25%27%0Aorder+by+A.value+desc%3B&ruleTitle=%F0%9F%98%80%F0%9F%98%80+Daily+Notes&ruleConfig=%7B%22scroll%22%3Afalse%2C%22breadcrumb%22%3Afalse%2C%22protyleTitle%22%3Atrue%2C%22readonly%22%3Afalse%2C%22dynamicLoading%22%3A%7B%22enabled%22%3Atrue%2C%22capacity%22%3A15%2C%22shift%22%3A10%7D%7D`,
  },
  readConfig: {
    extractPath: "",
    noteBookID: "",
    keepContext: true,
    addRef: false,
  },
  bookmarkConfig: {
    items: "读到这里啦",
  },
  typographyConfig: {
    autoSpace: false,
    closeTip: true,
  },
  dockShowAndHideConfig: {
    items: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
    leftWidth: `200px`,
    rightWidth: `200px`,
    hideDock: true,
    returnIfSplit: true
  },
  mergedFlag: true,
};

/**
 * 配置类
 */
class Settings {
  //初始化配置文件
  async initData() {
    //载入配置
    await this.load();

    //配置不存在则按照默认值建立配置文件
    if (
      plugin.data[CONFIG] === "" ||
      plugin.data[CONFIG] === undefined ||
      plugin.data[CONFIG] === null
    ) {
      await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }

    if (!plugin.data[CONFIG]["mergedFlag"]) {
      // console.log("mergeData", plugin.data[CONFIG]);
      await this.mergeData();
    } else {
      // console.log("loadData", plugin.data[CONFIG]);
      await this.load();
    }
  }

  async resetData() {
    await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    await this.load();
  }

  deepMerge(target, source) {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) {
            target[key] = {};
          }
          this.deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }
  async mergeData() {
    // console.log("mergeData", plugin.data[CONFIG]);
    // console.log("mergeData", DEFAULT_CONFIG);
    this.deepMerge(DEFAULT_CONFIG, plugin.data[CONFIG]);
    // console.log("mergeData", DEFAULT_CONFIG);
    await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    await this.load();
  }

  setFlag(key: any, value: any, config = CONFIG) {
    plugin.data[config]["pluginFlag"][key] = value;
  }
  getFlag(key: any, config = CONFIG) {
    return plugin.data[config] && plugin.data[config]["pluginFlag"]?.[key];
  }

  setBySpace(space: any, key: any, value: any, config = CONFIG) {
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
    // console.log("save", plugin.data[config]);
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
