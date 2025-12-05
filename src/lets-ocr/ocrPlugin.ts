import { request, sql } from "@/api";
import {
  cleanSpacesBetweenChineseCharacters,
  executeTransaction,
} from "@/myscripts/utils";
import { settings } from "@/settings";
import { formatUtil } from "@/siyuan-typography-go/utils";
import { html2ele } from "@frostime/siyuan-plugin-kits";
import { fetchSyncPost, IOperation, Menu, showMessage } from "siyuan";
import { SubPlugin } from "@/types/plugin";
import { umiOCR } from "./umi-ocr";
import { macOCRByAppleScript, tesseractOCR } from "./utils";
const path = require("path");

/**
 * 获取 OCR 存储名称
 * @param imgSrc 图片路径
 * @returns 存储名称
 */
function ocrStorageName(imgSrc: string): string {
  const path = imgSrc.replace(/[:\/?#\*|<>"%]+/g, "_");
  return `ocr_${path}.json`;
}

/**
 * 将相对路径转换为绝对路径
 * @param imgPath 图片相对路径（如 /assets/xxx.png）
 * @returns 绝对路径
 */
function getAbsolutePath(imgPath: string): string {
  const workspaceDir = `${window.siyuan.config.system.workspaceDir}/data`;
  // 移除开头的斜杠，然后拼接
  const relativePath = imgPath.startsWith("/") ? imgPath.slice(1) : imgPath;
  return path.join(workspaceDir, relativePath);
}

/**
 * 对单个图片进行 OCR
 * @param imgPath 图片路径（相对路径，如 /assets/xxx.png）
 * @returns 是否成功
 */
export async function ocrAssetsUrl(
  imgPath: string,
  autoRemoveLineBreaks: boolean
): Promise<string> {
  try {
    const absolutePath = getAbsolutePath(imgPath);

    // 从配置中获取 removeLineBreaks 设置
    const ocrMethod =
      settings.getBySpace("ocr", "ocrMethod") || "macOSVision";

    if (autoRemoveLineBreaks === undefined) {
      autoRemoveLineBreaks =
        settings.getBySpace("ocr", "autoRemoveLineBreaks") || false;
    }

    const removeLineBreaks =
      settings.getBySpace("ocr", "removeLineBreaks") || false;
    const removeBlankInChinese =
      settings.getBySpace("ocr", "removeBlankInChinese") || false;
    const formatWithPangu =
      settings.getBySpace("ocr", "formatWithPangu") || false;

    let ocrText = "";
    // 调用 OCR
    if (ocrMethod === "macOSVision") {
      ocrText = await macOCRByAppleScript(absolutePath);
    } else if (ocrMethod === "umi") {
      const umiOCRServer = settings.getBySpace("ocr", "umiOCRServer");
      if (!umiOCRServer || umiOCRServer.trim() === "") {
        return;
      }
      ocrText = await umiOCR(absolutePath, umiOCRServer.trim());
    } else if (ocrMethod === "tesseract") {
      ocrText = await tesseractOCR(absolutePath);
    } else {
      return;
    }

    if (autoRemoveLineBreaks) {
      ocrText = processOCRText(ocrText, {
        autoRemoveLineBreaks: true,
        removeBlankInChinese,
        lineEndSymbols: [
          // 英文标点
          ".",
          "!",
          "?",
          ",",
          ";",
          ":",
          "...",
          "—",
          "-",
          "(",
          ")",
          '"',
          "'",

          // 中文标点
          "。",
          "，",
          "；",
          "：",
          "！",
          "？",
          "（",
          "）",
          "“",
          "”",
          "‘",
          "’",
          "…",
          "—",

          // 可能还需要的中文标点
          "、",
          "《",
          "》",
          "【",
          "】",
          "『",
          "』",
          "「",
          "」",
        ],
      });
    } else if (removeLineBreaks) {
      ocrText = ocrText.replace(/\r?\n/g, "");
    }

    // 移除中文字符间的空格
    if (removeBlankInChinese) {
      ocrText = cleanSpacesBetweenChineseCharacters(ocrText);
    }

    // 调用 pangu 格式化
    if (formatWithPangu) {
      ocrText = formatUtil.formatContent(ocrText).trim();
    }

    if (ocrText) {
      // 调用思源 API 设置图片 OCR 文本
      try {
        await fetch("/api/asset/setImageOCRText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: imgPath,
            text: ocrText,
          }),
        });
      } catch (error) {
        console.error("设置图片 OCR 文本失败:", error);
      }

      return ocrText;
    } else {
      // OCR 结果为空
      return "";
    }
  } catch (error) {
    console.error(`OCR 失败 [${imgPath}]:`, error);
    return "";
  }
}

interface OCRConfig {
  autoRemoveLineBreaks?: boolean;
  removeBlankInChinese?: boolean;
  lineEndSymbols?: string[];
}
/**
 * 根据配置处理 OCR 文本
 * @param text OCR 原始文本
 * @param config 配置
 * @returns 处理后的文本
 */
export function processOCRText(text: string, config: OCRConfig = {}): string {
  const {
    autoRemoveLineBreaks = false,
    lineEndSymbols = [".", "!", "?", ",", "，", "。"],
  } = config;

  if (!autoRemoveLineBreaks) {
    return text;
  }

  // 拆分成行
  const lines = text.split(/\r?\n/);
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line === "") continue;

    if (processedLines.length === 0) {
      processedLines.push(line);
      continue;
    }

    // 上一行最后一个字符是否为指定符号
    const prevLine = processedLines[processedLines.length - 1];
    const lastChar = prevLine.slice(-1);
    if (lineEndSymbols.includes(lastChar)) {
      processedLines.push(line);
    } else {
      // 合并当前行到上一行
      processedLines[processedLines.length - 1] = prevLine + " " + line;
    }
  }
  console.log("Processed OCR lines:", processedLines);
  return processedLines.join("\n");
  // return JSON.stringify(processedLines.join("\\n"));
}

export default class OCRPlugin implements SubPlugin {
  private _isEnabled = false;

  private id = "hqweay-ocr";
  private label = "批量 OCR";
  private icon = "®️";
  private thisElement: HTMLElement | null = null;

  // OCR 运行状态控制
  private isOcrRunning = false;
  private shouldStopOcr = false;

  async onload() {
    // Add icon to toolbar
    this.addIconToToolbar();
  }

  onunload() {
    // Clean up
    if (this.thisElement) {
      this.thisElement.remove();
      this.thisElement = null;
    }
  }

  private addIconToToolbar() {
    if (document.getElementById(this.id) || this.thisElement) {
      return;
    }

    const barMode = document.getElementById("barMode");
    if (!barMode) {
      return;
    }

    barMode.insertAdjacentHTML(
      "beforebegin",
      `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="${this.label}" ></div>`
    );

    const btn = document.getElementById(this.id);
    if (btn) {
      this.thisElement = btn as HTMLElement;
      btn.style.width = "auto";
      btn.innerHTML = this.icon;
      btn.addEventListener(
        "click",
        (e) => {
          this.exec();
          e.stopPropagation();
          e.preventDefault();
        },
        true
      );
    }
  }

  async exec() {
    // 如果 OCR 正在运行，显示停止选项
    if (this.isOcrRunning) {
      this.stopOcr();
      return;
    }

    // 显示菜单选择 OCR 类型
    const menu = new Menu("hqweay-ocr-menu");

    menu.addItem({
      label: "OCR 当前文档 的图片（强制 OCR 所有） + 自动换行",
      click: async () => {
        const currentDocId = document
          .querySelector(
            ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
          )
          ?.getAttribute("data-node-id");

        await batchOcr(
          `SELECT * FROM assets where root_id = '${currentDocId}' and (PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp')`,
          { type: "force", autoRemoveLineBreaks: true },
          this
        );
      },
    });

    menu.addItem({
      label: "OCR 当前文档 的图片（强制 OCR 所有） + 不配置自动换行",
      click: async () => {
        const currentDocId = document
          .querySelector(
            ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
          )
          ?.getAttribute("data-node-id");

        await batchOcr(
          `SELECT * FROM assets where root_id = '${currentDocId}' and (PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp')`,
          { type: "force", autoRemoveLineBreaks: false },
          this
        );
      },
    });

    menu.addItem({
      label: "OCR 当前文档 的图片（跳过 已 OCR） + 配置自动换行",
      click: async () => {
        const currentDocId = document
          .querySelector(
            ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
          )
          ?.getAttribute("data-node-id");

        await batchOcr(
          `SELECT * FROM assets where root_id = '${currentDocId}' and (PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp')`,
          { type: "all", autoRemoveLineBreaks: true },
          this
        );
      },
    });

    menu.addItem({
      label: "OCR 当前文档 的图片（跳过 已 OCR） + 不配置自动换行",
      click: async () => {
        const currentDocId = document
          .querySelector(
            ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
          )
          ?.getAttribute("data-node-id");

        await batchOcr(
          `SELECT * FROM assets where root_id = '${currentDocId}' and (PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp')`,
          { type: "all", autoRemoveLineBreaks: false },
          this
        );
      },
    });

    menu.addItem({
      label: "OCR 所有 图片（跳过 已 OCR）",
      click: async () => {
        await batchOcr(
          `SELECT * FROM assets
WHERE PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp'
LIMIT 99999`,
          { type: "all" },
          this
        );
      },
    });

    menu.addItem({
      label: "将当前文档的所有图片替换为 OCR 识别内容（若存在）",
      click: async () => {
        await this.replaceAllImagesWithOcrText(false);
      },
    });

    menu.addItem({
      label: "将当前文档的所有图片替换为 OCR 识别内容（无 OCR 则识别）",
      click: async () => {
        await this.replaceAllImagesWithOcrText(true);
      },
    });

    const btn = document.getElementById(this.id);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menu.open({
        x: rect.left,
        y: rect.bottom,
      });
    }
  }

  async replaceAllImagesWithOcrText(noOcrToGet: boolean) {
    const doOperations: IOperation[] = [];
    const currentDocId = document
      .querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      )
      ?.getAttribute("data-node-id");

    let childrenResult = await fetchSyncPost("/api/block/getChildBlocks", {
      id: currentDocId,
    });
    let childrenBlocks = childrenResult.data;

    for (let i = 0; i < childrenBlocks.length; i++) {
      const block = childrenBlocks[i];

      let response = await fetchSyncPost("/api/block/getBlockDOM", {
        id: block.id,
      });
      let result = response.data.dom;
      const id = response.data.id;
      let ele = html2ele(result);
      const elements = ele.querySelectorAll('[data-type="img"]');

      let updateFlag = false;
      for (const element of elements) {
        try {
          // 获取图片元素
          const img = element.querySelector("img");
          if (!img || !img.getAttribute("data-src")) continue;

          const existingOCR = await request("/api/asset/getImageOCRText", {
            path: img.getAttribute("data-src"),
          });

          let ocrText = existingOCR?.text?.trim();
          if (!ocrText) {
            if (noOcrToGet) {
              ocrText = await ocrAssetsUrl(
                img.getAttribute("data-src"),
                undefined
              );
            }
          }
          if (ocrText) {
            // 创建文本节点直接替换元素;
            const textNode = document.createTextNode(ocrText);
            element.parentNode.replaceChild(textNode, element);
            updateFlag = true;
          }
        } catch (error) {
          console.error("OCR 识别失败:", error);
        }
      }

      if (updateFlag) {
        doOperations.push({
          id: id,
          data: ele.outerHTML,
          action: "update",
        });
      }
    }
    await executeTransaction(doOperations);
  }

  // 停止 OCR
  stopOcr() {
    this.shouldStopOcr = true;
    showMessage("正在停止 OCR...", 2000);
  }

  // 检查是否应该停止
  shouldStop(): boolean {
    return this.shouldStopOcr;
  }

  // 开始 OCR
  startOcr() {
    this.isOcrRunning = true;
    this.shouldStopOcr = false;
    // 更新按钮标签提示可以停止
    const btn = document.getElementById(this.id);
    if (btn) {
      btn.setAttribute("aria-label", "点击停止 OCR");
    }
  }

  // 结束 OCR
  endOcr() {
    this.isOcrRunning = false;
    this.shouldStopOcr = false;
    // 恢复按钮标签
    const btn = document.getElementById(this.id);
    if (btn) {
      btn.setAttribute("aria-label", this.label);
    }
  }

  // 图片右键菜单事件
  imageMenuEvent(event: any) {
    console.log(event.detail.element);
    const spanImg = event.detail.element as HTMLElement;
    const img = spanImg.querySelector(`img[data-src]`) as HTMLImageElement;
    if (!img) {
      return;
    }
    const imgSrc = img.dataset.src;

    if (!imgSrc) {
      return;
    }

    (globalThis.window.siyuan.menus.menu as Menu).addItem({
      label: "OCR 识别",
      click: async () => {
        const ocrText = await ocrAssetsUrl(imgSrc, undefined);
        if (ocrText) {
          showMessage(`OCR 识别成功`);
          navigator.clipboard.writeText(ocrText);
          showMessage("OCR 内容已复制到剪贴板", 2000);
        } else {
          showMessage(`OCR 识别失败`);
        }
      },
    });
    (globalThis.window.siyuan.menus.menu as Menu).addItem({
      label: "复制 OCR 内容",
      click: async () => {
        const existingOCR = await request("/api/asset/getImageOCRText", {
          path: imgSrc,
        });
        if (existingOCR?.text?.trim()) {
          navigator.clipboard.writeText(existingOCR.text);
          showMessage("OCR 内容已复制到剪贴板", 2000);
        } else {
          showMessage("该图片暂无 OCR 内容", 2000);
        }
      },
    });

    (globalThis.window.siyuan.menus.menu as Menu).addItem({
      label: "用 OCR 内容替换图片",
      click: async (element, event) => {
        const doOperations: IOperation[] = [];
        try {
          const existingOCR = await request("/api/asset/getImageOCRText", {
            path: imgSrc,
          });

          let ocrText = existingOCR?.text?.trim();
          if (!ocrText) {
            ocrText = await ocrAssetsUrl(imgSrc, undefined);
          }

          if (ocrText) {
            const targetElement = spanImg.closest("[data-node-id]");

            // 创建文本节点直接替换元素;
            const textNode = document.createTextNode(ocrText);
            spanImg.parentNode.replaceChild(textNode, spanImg);

            console.log(targetElement);
            if (targetElement) {
              doOperations.push({
                id: targetElement.getAttribute("data-node-id"),
                data: targetElement.outerHTML,
                action: "update",
              });

              // 点击按钮后思源会触发一次保存操作，这里延时一秒执行事务，避免冲突
              setTimeout(async () => {
                await executeTransaction(doOperations);
                showMessage("图片已被 OCR 内容替换", 2000);
              }, 1000);
            }
          }
        } catch (error) {
          console.error("OCR 识别失败:", error);
        }
      },
    });
  }
}

/**
 * 批量 OCR 所有图片
 * @param options OCR 选项
 * @param ocrPlugin OCR 插件实例，用于控制停止
 */
export async function batchOcr(
  sqlStr,
  options: {
    type: "failing" | "all" | "force";
    autoRemoveLineBreaks?: boolean;
  },
  ocrPlugin?: OCRPlugin
): Promise<void> {
  try {
    // 查询所有图片资源
    const assets: Array<{
      block_id: string;
      box: string;
      docpath: string;
      hash: string;
      id: string;
      name: string;
      path: string;
      root_id: string;
      title: string;
    }> = await sql(sqlStr);

    if (assets.length === 0) {
      showMessage("未找到图片资源", 3000);
      return;
    }

    let i = 0;
    let successful: string[] = [];
    let failing: string[] = [];
    let skip: string[] = [];
    // let consecutiveFailures = 0;
    // const MAX_CONSECUTIVE_FAILURES = 5;

    // 开始 OCR
    if (ocrPlugin) {
      ocrPlugin.startOcr();
    }

    showMessage(
      `开始批量 OCR，共 ${assets.length} 张图片。可以打开开发者工具查看进度，点击工具栏 OCR 按钮可停止`,
      5000
    );

    for (const img of assets) {
      // 检查是否应该停止
      if (ocrPlugin && ocrPlugin.shouldStop()) {
        const stopMsg = `OCR 已停止！\n总计: ${assets.length}\n已处理: ${i}\n成功: ${successful.length}\n失败: ${failing.length}\n跳过: ${skip.length}`;
        console.log(stopMsg);
        showMessage(stopMsg, 10000, "info");
        if (ocrPlugin) {
          ocrPlugin.endOcr();
        }
        return;
      }

      i += 1;
      let ocrText = "";
      const imgPath = img.path;

      const existingOCR = await request("/api/asset/getImageOCRText", {
        path: imgPath,
      });

      if (options.type === "all" && existingOCR?.text?.trim() !== "") {
        // 识别所有无 OCR 的图片时，跳过已有 OCR 数据的图片
        skip.push(imgPath);
      } else {
        //if force      // 强制识别所有图片
        try {
          ocrText = await ocrAssetsUrl(imgPath, options.autoRemoveLineBreaks);
        } catch (error) {
          ocrText = "";
          console.error(`OCR 处理失败 [${imgPath}]:`, error);
        }

        if (ocrText) {
          successful.push(imgPath);
        } else {
          // 失败一般是丢失的资源
          failing.push(imgPath);
          console.log("失败", imgPath);
        }
      }

      const msg = `总计:${assets.length} 进度 ${(
        (i / assets.length) *
        100
      ).toFixed(2)}% 成功识别:${successful.length} 失败:${
        failing.length
      } 跳过:${skip.length}`;
      console.log(msg);
    }

    // 显示最终结果
    const finalMsg = `批量 OCR 完成！\n总计: ${assets.length}\n成功: ${successful.length}\n失败: ${failing.length}\n跳过: ${skip.length}`;
    console.log(finalMsg);
    if (failing.length > 0) {
      console.log(`以下图片识别失败:`, failing);
    }
    showMessage(finalMsg, 10000, "info");

    // 结束 OCR
    if (ocrPlugin) {
      ocrPlugin.endOcr();
    }
  } catch (error) {
    console.error("批量 OCR 失败:", error);
    showMessage(`批量 OCR 失败: ${error.message}`, 5000, "error");

    // 结束 OCR
    if (ocrPlugin) {
      ocrPlugin.endOcr();
    }
  }
}