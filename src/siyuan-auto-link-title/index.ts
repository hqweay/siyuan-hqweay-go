import AutoLinkTitleUtil from "./util";
import { CheckIf } from "./checkif";
import { plugin } from "@/utils";
import { settings } from "@/settings";
import { showMessage } from "siyuan";
import { ocrAssetsUrl } from "@/ocr/ocrPlugin";
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

      const recAnnoType = settings.getBySpace("doOnPasteConfig", "recAnno");
      if (recAnnoType) {
        await this.execRecAnno(event, recAnnoType);
      }

      settings.getBySpace("doOnPasteConfig", "resizeAndCenterImg") &&
        this.resizeAndCenterImg(event);

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

  private async resizeAndCenterImg(event) {
    const regex = /!\[\]\(([^)]+)\)/g;
    const replaced = event.detail.textPlain
      .trim()
      .replace(regex, `![]($1){: style="width: calc(50% - 8px);"}`);
    event.detail.textPlain = replaced;
    return true;
  }

  private async execRecAnno(event, recAnnoType) {
    const clipboardText = event.detail.textPlain.trim();
    const regex = /<<([^>]+)\s+"([^"]+)">>\n!\[\]\(([^)]+)\)/g;
    if (!clipboardText.match(regex)) {
      return false;
    }
    let replaced = ``;
    if (recAnnoType === "imgPin") {
      replaced = clipboardText.replace(regex, `![]($3)<<$1 "📌">>`);
    } else if (recAnnoType === "pinImg") {
      replaced = clipboardText.replace(regex, `<<$1 "📌">>![]($3)`);
    } else if (recAnnoType === "ocrTextPin") {
      showMessage("正在识别OCR，请稍候...", 2000);
      const ocrText = await ocrAssetsUrl(
        Array.from(clipboardText.matchAll(regex), (match) => match[3])[0],
        undefined
      );
      replaced = clipboardText.replace(regex, `<<$1 "📌">>\n${ocrText}`);
    } else if (recAnnoType === "pinOcrText") {
      showMessage("正在识别OCR，请稍候...", 2000);
      const ocrText = await ocrAssetsUrl(
        Array.from(clipboardText.matchAll(regex), (match) => match[3])[0],
        undefined
      );
      replaced = clipboardText.replace(regex, `${ocrText}<<$1 "📌">>`);
    } else if (recAnnoType === "ocrText") {
      showMessage("正在识别OCR，请稍候...", 2000);
      const ocrText = await ocrAssetsUrl(
        Array.from(clipboardText.matchAll(regex), (match) => match[3])[0],
        undefined
      );
      replaced = clipboardText.replace(regex, `<<$1 "${ocrText}">>`);
    }

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
