import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
import { Dialog } from "siyuan";
import SettingPageSvelte from "@/lets-syplugin-backlink-panel/components/setting/setting-page.svelte";

export function openSettingsDialog() {
  let isMobile = EnvConfig.ins.isMobile;
  // 生成Dialog内容
  const dialogId = "backlink-panel-setting-" + Date.now();
  // 创建dialog
  const settingDialog = new Dialog({
    title: "反链面板插件设置",
    content: `
          <div  id="${dialogId}" style="overflow: hidden; position: relative;height: 100%;"></div>
          `,
    width: isMobile ? "92vw" : "1040px",
    height: isMobile ? "50vw" : "80vh",
  });

  new SettingPageSvelte({
    target: settingDialog.element.querySelector(`#${dialogId}`),
  });
}
