import { settings } from "./settings";
import { SubPlugin, PluginMetadata } from "./types/plugin";

// Static imports for plugin configurations
import epubReaderConfig from "./epub-reader/plugin.json";
import diaryToolsConfig from "./how-to-write-diary/plugin.json";
import ocrConfig from "./ocr/plugin.json";

// Dynamic imports for plugin classes
import EpubReaderPlugin from "./epub-reader";
import DiaryTools from "./how-to-write-diary";
import OCRPlugin from "./ocr";

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
    // Register plugins with their configurations
    this.registerPluginWithConfig(
      "epub-reader",
      epubReaderConfig as any,
      EpubReaderPlugin
    );
    this.registerPluginWithConfig(
      "how-to-write-diary",
      diaryToolsConfig as any,
      DiaryTools
    );
    this.registerPluginWithConfig("ocr", ocrConfig as any, OCRPlugin);
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
