import { SubPlugin } from "../types/plugin";

/**
 * 子插件基类
 * 
 * @description
 * 必须且只能通过 PluginRegistry 进行扫描与实例化，注入的属性和方法才会在运行时生效。
 * 继承此类可以避免编写空 onload() / onunload() 的样板代码，并可直接调用配置读写与多语言接口。
 */
export class SubPluginBase implements SubPlugin {
  name!: string;
  displayName!: string;
  description!: string;
  version!: string;
  enabled!: boolean;

  t!: (key: string) => string;
  getSetting!: (key: string) => any;
  setSetting!: (key: string, value: any) => void;

  onload(): void {}
  onunload(): void {}
}
