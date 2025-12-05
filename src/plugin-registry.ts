import { settings } from "./settings";
import { SubPlugin, PluginMetadata } from "./types/plugin";

// Static imports for plugin configurations
import epubReaderConfig from "./lets-epub-reader/plugin";
import diaryToolsConfig from "./lets-how-to-write-diary/plugin";
import ocrConfig from "./ocr/plugin";

// Dynamic imports for plugin classes
import EpubReaderPlugin from "./lets-epub-reader";
import DiaryTools from "./lets-how-to-write-diary";
import OCRPlugin from "./ocr";
import randomHeaderImage from "./random-header-image";

// 自动导出所有子插件
// const modules = import.meta.glob("./lets*/index.ts", { eager: true }) as Record<
//   string,
//   { default: SubPlugin }
// >;

// export const subPlugins = Object.entries(modules).reduce(
//   (acc, [path, module]) => {
//     const pluginName = path.split("/")[1]; // 获取文件夹名
//     acc[pluginName] = module.default;
//     return acc;
//   },
//   {} as Record<string, SubPlugin>
// );

// const configs = [
//   "random-header-image",
//   "epub-reader",
//   "how-to-write-diary",
//   "ocr",
// ];

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, SubPlugin> = new Map();
  private pluginConfigs: Map<string, PluginMetadata> = new Map();

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  async scanPlugins() {
    // 读取所有符合模式的文件
    const pluginFiles = import.meta.glob(
      ["./lets-*/index.ts", "./lets-*/plugin.ts"],
      {
        eager: true,
        import: "default",
      }
    );

    // 使用 Map 按插件名分组
    const pluginMap = new Map<string, { config?: any; plugin?: any }>();

    Object.entries(pluginFiles).forEach(([path, module]) => {
      // 注意这里的正则：lets- 后面是插件名
      const match = path.match(/\.\/lets-([^\/]+)\/(index|plugin)\.ts$/);
      if (match) {
        const [, pluginName, fileType] = match;

        if (!pluginMap.has(pluginName)) {
          pluginMap.set(pluginName, {});
        }

        const pluginData = pluginMap.get(pluginName)!;
        if (fileType === "index") {
          pluginData.config = module;
        } else {
          pluginData.plugin = module;
        }
      }
    });

    // 注册所有插件
    for (const [pluginName, { config, plugin }] of pluginMap) {
      if (config && plugin) {
        this.registerPluginWithConfig(pluginName, plugin, config);
      } else {
        console.warn(`插件 ${pluginName} 缺少配置文件`, {
          hasConfig: !!config,
          hasPlugin: !!plugin,
        });
      }
    }
  }

  private registerPluginWithConfig(
    name: string,
    config: PluginMetadata,
    PluginClass: any
  ) {
    try {
      // Register configuration
      this.registerPluginConfig(name, config);

      // Instantiate and register plugin
      const pluginInstance = new PluginClass();
      this.registerPlugin(pluginInstance);

      console.log(`Loaded plugin: ${name}`);
    } catch (error) {
      console.warn(`Failed to load plugin ${name}:`, error);
    }
  }

  // Initialize enabled plugins
  async initializeEnabledPlugins() {
    const plugins = this.getAllPlugins();
    for (const plugin of plugins) {
      console.log(plugin);
      console.log(settings.getFlag(plugin.name));
      if (settings.getFlag(plugin.name)) {
        plugin.enabled = true;
        try {
          await plugin.onload();
        } catch (error) {
          console.error(`Error in onload for plugin ${plugin.name}:`, error);
        }
      }
    }
  }

  // Unload disabled plugins
  async unloadDisabledPlugins() {
    const plugins = this.getAllPlugins();
    for (const plugin of plugins) {
      if (!settings.getFlag(plugin.name) && plugin.enabled) {
        plugin.enabled = false;
        try {
          await plugin.onunload();
        } catch (error) {
          console.error(`Error in onunload for plugin ${plugin.name}:`, error);
        }
      }
    }
  }
  registerPlugin(plugin: SubPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  registerPluginConfig(name: string, config: PluginMetadata): void {
    this.pluginConfigs.set(name, config);
  }

  getPlugin(name: string): SubPlugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): SubPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginConfigs(): PluginMetadata[] {
    return Array.from(this.pluginConfigs.values());
  }

  isPluginEnabled(name: string): boolean {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.enabled : false;
  }

  enablePlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = true;
    }
  }

  disablePlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.enabled = false;
    }
  }
}
