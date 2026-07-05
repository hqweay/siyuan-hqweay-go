import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { isMobile } from "@/utils";
import { Dialog } from "siyuan";
import changelogText from "../../CHANGELOG.md?raw";

export default class LetsAlert implements SubPlugin {
  onload(): void {}
  onLayoutReady(): void {
    // 1. 从 CHANGELOG.md 提取首个最新版本号作为 currentVersion
    const versionMatch = changelogText.match(/##\s*v?(\d+\.\d+\.\d+)/);
    const currentVersion = versionMatch ? versionMatch[1] : "0.0.0";

    const lastVersion = settings.get("lastVersion");

    // 如果已阅读版本已经是最新版本，则跳过弹窗
    if (lastVersion && lastVersion === currentVersion) {
      return;
    }

    // 2. 根据用户上次已阅版本，动态切片截取错过的所有版本日志
    const getChangelogSegment = (changelog: string, lastVer: string | null, currentVer: string): string => {
      // 首次安装，只展示最新版本变更
      if (!lastVer) {
        const match = changelog.match(/(##\s+\d+\.\d+\.\d+[^]*?)(?=\n##\s+\d+\.\d+\.\d+|$)/);
        return match ? match[1].trim() : `## ${currentVer}\n\n- ${this.t("lets-alert.welcome")}`;
      }

      const lastVerHeader = `## ${lastVer}`;
      const lastVerIndex = changelog.indexOf(lastVerHeader);
      
      // 如果没有找到上次已阅的版本标题，说明落后太多或者本地配置有误，降级为只展示最新一版
      if (lastVerIndex === -1) {
        const match = changelog.match(/(##\s+\d+\.\d+\.\d+[^]*?)(?=\n##\s+\d+\.\d+\.\d+|$)/);
        return match ? match[1].trim() : `## ${currentVer}`;
      }

      // 提取从第一个 "## " 标题到 "## [lastVersion]" 之间的所有内容
      const firstHeaderMatch = changelog.match(/##\s+\d+\.\d+\.\d+/);
      if (!firstHeaderMatch) {
        return `## ${currentVer}`;
      }

      const firstHeaderIndex = firstHeaderMatch.index || 0;
      return changelog.substring(firstHeaderIndex, lastVerIndex).trim();
    };

    const changelogSegment = getChangelogSegment(changelogText, lastVersion, currentVersion);

    // 3. 简易的 Markdown 转 HTML 渲染器
    const renderMarkdown = (md: string) => {
      return md
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          if (trimmed.startsWith("###")) {
            return `<h4 style="margin: 12px 0 6px 0; color: var(--b3-theme-primary); font-size: 14px;">${trimmed.replace(/^###\s*/, "")}</h4>`;
          }
          if (trimmed.startsWith("##")) {
            return `<h3 style="margin: 16px 0 8px 0; font-size: 16px; border-bottom: 1px solid var(--b3-theme-surface-lighter); padding-bottom: 4px;">${trimmed.replace(/^##\s*/, "")}</h3>`;
          }
          if (trimmed.startsWith("-")) {
            return `<li style="margin-left: 16px; margin-bottom: 4px; line-height: 1.4; list-style-type: disc;">${trimmed.replace(/^- \s*/, "")}</li>`;
          }
          if (trimmed.length === 0) {
            return "<div style='height: 8px;'></div>";
          }
          return `<p style="margin: 4px 0; line-height: 1.4;">${trimmed}</p>`;
        })
        .join("");
    };

    // 4. 构建弹窗内容
    const dialogContent = `<div class="b3-dialog__content" style="padding: 20px; box-sizing: border-box; font-size: 14px;">
      <h2 style="margin-top: 0; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; font-size: 18px;">
        ${this.t("lets-alert.title")}
      </h2>
      <div style="font-size: 12px; color: var(--b3-theme-on-surface-light); margin-bottom: 16px;">
        ${this.t("lets-alert.currentVersion")}: v${currentVersion}
      </div>
      <div class="fn__hr" style="margin-bottom: 16px;"></div>
      <div style="max-height: 380px; overflow-y: auto; padding-right: 8px;">
        ${renderMarkdown(changelogSegment)}
      </div>
      <div class="fn__hr" style="margin-top: 20px; margin-bottom: 16px;"></div>
      <div style="display: flex; justify-content: flex-end;">
        <button class="b3-button fn__size200" id="closeChangelogBtn">${this.t("lets-alert.ok")}</button>
      </div>
    </div>`;

    const dialog = new Dialog({
      title: `${this.t("lets-alert.dialogTitle")} (v${currentVersion})`,
      content: dialogContent,
      width: isMobile ? "92vw" : "500px",
      height: "460px",
      destroyCallback: () => {
        settings.set("lastVersion", currentVersion);
        settings.save();
      },
    });

    const closeBtn = dialog.element.querySelector("#closeChangelogBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        dialog.destroy();
      });
    }
  }
  onunload(): void {}
}
