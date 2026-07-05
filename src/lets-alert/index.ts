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
    const compareVersions = (v1: string, v2: string) => {
      const p1 = v1.split('.').map(Number);
      const p2 = v2.split('.').map(Number);
      for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
      }
      return 0;
    };

    const getChangelogSegment = (changelog: string, lastVer: string | null, currentVer: string): string => {
      // 首次安装，只展示最新版本变更
      if (!lastVer) {
        const match = changelog.match(/(##\s+v?\d+\.\d+\.\d+[^]*?)(?=\n##\s+v?\d+\.\d+\.\d+|$)/);
        return match ? match[1].trim() : `## ${currentVer}\n\n- ${this.t("lets-alert.welcome")}`;
      }

      const headerRegex = /^##\s+v?(\d+\.\d+\.\d+)/gm;
      let match;
      let targetIndex = -1;

      // 遍历所有版本号，找到第一个 <= lastVer 的版本
      while ((match = headerRegex.exec(changelog)) !== null) {
        const ver = match[1];
        if (compareVersions(ver, lastVer) <= 0) {
          targetIndex = match.index;
          break;
        }
      }

      const firstHeaderMatch = changelog.match(/##\s+v?\d+\.\d+\.\d+/);
      const firstHeaderIndex = firstHeaderMatch ? (firstHeaderMatch.index || 0) : 0;

      // 如果没找到比 lastVer 小或等的版本，说明落后太多，展示整个 changelog（去除开头的部分）
      if (targetIndex === -1) {
        return changelog.substring(firstHeaderIndex).trim();
      }

      return changelog.substring(firstHeaderIndex, targetIndex).trim();
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
