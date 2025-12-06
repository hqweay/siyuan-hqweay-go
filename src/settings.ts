import { fetchSyncPost } from "siyuan";
import { deepMerge, plugin } from "./utils";
import { scale } from "svelte/transition";
import { PluginRegistry } from "./plugin-registry";
// import { template } from "@siyuan-community/siyuan-sdk/dist/types/kernel/api";

//配置文件名称
export const CONFIG = "hqweay-go-config";

// 动态生成默认配置
function generateDefaultConfig(pluginRegistry: PluginRegistry) {
  const config: any = {};

  // 从插件注册表获取所有插件配置
  const pluginConfigs = pluginRegistry.getPluginConfigs();

  console.log("pluginConfigs", pluginConfigs);

  // 为每个插件添加默认配置
  for (const pluginMeta of pluginConfigs) {
    // 添加插件默认配置
    if (pluginMeta.settings) {
      const configKey = pluginMeta.name;

      config[configKey] = {};
      // 默认值通过settings来实现
      pluginMeta.settings.forEach((setting) => {
        config[configKey][setting.key] = setting.value;
      });
      // config[configKey]["enabled"] = false;
      // config[configKey] = { ...pluginMeta.defaultConfig };
    }
  }
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
  async initData(config = CONFIG) {
    //配置不存在则按照默认值建立配置文件
    if (
      plugin.data[config] === "" ||
      plugin.data[config] === undefined ||
      plugin.data[config] === null
    ) {
      await plugin.saveData(config, JSON.stringify(this.getDefaultConfig()));
    }

    //插件加载时 merge
    if (!mergedFlag) {
      //console.log("mergeData", plugin.data[CONFIG]);
      await this.mergeData();
      mergedFlag = true;
    } else {
      // //console.log("loadData", plugin.data[CONFIG]);
      await this.load();
    }
  }

  async resetData() {
    // await plugin.removeData(CONFIG);
    // await PluginRegistry.getInstance().reScanPlugins();
    await plugin.saveData(CONFIG, JSON.stringify(this.getDefaultConfig()));
    await this.load();
  }

  async mergeData() {
    const DEFAULT_CONFIG = this.getDefaultConfig();
    deepMerge(DEFAULT_CONFIG, plugin.data[CONFIG]);
    await plugin.saveData(CONFIG, JSON.stringify(DEFAULT_CONFIG));
    await this.load();
  }

  // setFlag(key: any, value: any, config = CONFIG) {
  //   this.setBySpace(key, "enabled", value, config);
  // }

  // getFlag(key: any, config = CONFIG) {
  //   return this.getBySpace(key, "enabled", config);
  // }

  setBySpace(space: any, key: any, value: any, config = CONFIG) {
    if (!plugin.data[config][space]) {
      plugin.data[config][space] = {};
    }
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
    await plugin.saveData(config, plugin.data[config]);
    await this.load();
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
