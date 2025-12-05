export interface PluginSettingItem {
  type: 'checkbox' | 'textinput' | 'textarea' | 'select' | 'number' | 'button';
  title: string;
  description?: string;
  key: string;
  value?: any;
  placeholder?: string;
  options?: Record<string, string>;
  hasSetting?: boolean;
}

export interface PluginSettings {
  [groupName: string]: PluginSettingItem[];
}

export interface SubPlugin {
  name: string;
  displayName: string;
  description?: string;
  version?: string;
  settings?: PluginSettings;
  enabled: boolean;

  onload(): void;
  onunload(): void;
  onLayoutReady?(): void;
  onDataChanged?(): void;

  // Event handlers
  editortitleiconEvent?(detail: any): void;
  mobilekeyboardshowEvent?(detail: any): void;
  mobilekeyboardhideEvent?(detail: any): void;
  switchProtyleEvent?(detail: any): void;
  openSiyuanUrlPluginEvent?(detail: any): void;
  blockIconEvent?(detail: any): void;
  imageMenuEvent?(detail: any): void;
  updateProtyleToolbar?(toolbar: any[]): any[];
}

export interface PluginMetadata {
  name: string;
  displayName: string;
  description?: string;
  version?: string;
  author?: string;
  defaultConfig?: Record<string, any>;
  settings?: PluginSettings;
}