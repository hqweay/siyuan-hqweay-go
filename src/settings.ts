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
    sendTo: true,
    convert: true,
    typography: true,
    title: true,
    randomNote: true,
    randomHeaderImage: true,
  },
  sendToConfig: {
    inputArea: Object.entries(inpuAreas)
      .map(([key, value]) => `${key}====${value}`)
      .join("\n"),
    isToClipboard: true,
    separator: "",
  },
  randomHeaderImageConfig: {
    folderPaths: "/Users/hqweay/SiYuan/data/assets/images",
  },
  randomNoteConfig: {
    rangeSQL: "SELECT root_id FROM blocks ORDER BY random() LIMIT 1",
  },
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
    // await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    await this.load();
  }

  async resetData() {
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
