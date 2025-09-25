import AutoLinkTitleUtil from "./util";
import { CheckIf } from "./checkif";
import { plugin } from "@/utils";
import { settings } from "@/settings";
import { showMessage } from "siyuan";
export default class doOnPaste {
  onunload() {
    plugin.eventBus.off("paste", () => {});
  }

  public async onload() {
    if (!settings.getBySpace("pluginFlag", "doOnPaste")) {
      return;
    }

    plugin.eventBus.on("paste", async (event: any) => {
      event.preventDefault();

      if (
        settings.getBySpace("doOnPasteConfig", "title") &&
        (await this.getTitle(event))
      ) {
        return;
      }

      settings.getBySpace("doOnPasteConfig", "recAnno") &&
        this.execRecAnno(event);

      event.detail.resolve({
        textPlain: event.detail.textPlain,
        textHTML: event.detail.textHTML,
        siyuanHTML: event.detail.siyuanHTML,
      });
    });
  }

  private async emptyLine(event) {
    var pattern = /\n\s*\n/g; // 匹配连续的空行
    var replacement = "\n\n"; // 替换为空行之间的单个换行符
    let clipboardText = event.detail.textPlain.trim();
    if (clipboardText.match(pattern)) {
      //阻止冒泡
      event.stopPropagation();
      clipboardText = clipboardText.replace(pattern, replacement);
      // document.execCommand("insertText", false, clipboardText);
      showMessage("粘贴时清理空行");
      return true;
    }
    return false;
  }
  private async execRecAnno(event) {
    const regex = /<<([^>]+)\s+"([^"]+)">>\n!\[\]\(([^)]+)\)/g;
    const replaced = event.detail.textPlain
      .trim()
      .replace(regex, '![]($3)<<$1 "📌">>');
    event.detail.textPlain = replaced;
    return true;
  }
  private async getTitle(event) {
    if (!navigator.onLine) {
      return false;
    }
    let clipboardText = event.detail.textPlain.trim();
    if (!CheckIf.isUrl(clipboardText) || CheckIf.isImage(clipboardText)) {
      return false;
    }
    document.execCommand("insertText", false, `[fetching...]`);

    // event.detail.resolve();
    let title = await new AutoLinkTitleUtil().convertUrlToTitledLink(
      clipboardText
    );
    //撤销占位符
    event.detail.protyle.undo.undo(event.detail.protyle);
    title = title ? title : clipboardText;
    document.execCommand("insertText", false, `[${title}](${clipboardText})`);

    return true;
  }
}
