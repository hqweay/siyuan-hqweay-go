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
    if (
      !settings.getBySpace("doOnPasteConfig", "title")
      // && !settings.getBySpace("doOnPasteConfig", "emptyLine")
    ) {
      return;
    }
    plugin.eventBus.on("paste", async (event: any) => {
      if (
        settings.getBySpace("doOnPasteConfig", "title") &&
        (await this.getTitle(event)) === true
      ) {
        // } else if (
        //   settings.getBySpace("doOnPasteConfig", "emptyLine") &&
        //   (await this.emptyLine(event)) === true
        // ) {
      }
    });
  }

  private async emptyLine(event) {
    var pattern = /\n\s*\n/g; // 匹配连续的空行
    var replacement = "\n\n"; // 替换为空行之间的单个换行符
    let clipboardText = event.detail.textPlain.trim();
    if (clipboardText.match(pattern)) {
      //阻止冒泡
      event.stopPropagation();
      console.log(clipboardText);
      clipboardText = clipboardText.replace(pattern, replacement);
      console.log(clipboardText);
      // document.execCommand("insertText", false, clipboardText);
      showMessage("粘贴时清理空行");
      return true;
    }
    return false;
  }
  private async getTitle(event) {
    if (!navigator.onLine) {
      return false;
    }
    let clipboardText = event.detail.textPlain.trim();
    if (!CheckIf.isUrl(clipboardText) || CheckIf.isImage(clipboardText)) {
      return false;
    }
    //阻止默认行为：如果是 URL 则不直接粘贴，而是尝试获取标题
    event.preventDefault();

    // 插入一个占位符
    document.execCommand("insertText", false, `[fetching...]`);
    //阻止冒泡
    //   event.stopPropagation();
    let title = await new AutoLinkTitleUtil().convertUrlToTitledLink(
      clipboardText
    );
    //撤销占位符
    event.detail.protyle.undo.undo(event.detail.protyle);

    title = title ? title : clipboardText;
    // event.detail.textPlain = `[${title}](${clipboardText})`;
    document.execCommand("insertText", false, `[${title}](${clipboardText})`);
    return true;
    // return `[${title}](${clipboardText})`;
  }
}
