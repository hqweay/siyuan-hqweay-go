import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { showMessage, Menu } from "siyuan";
import { plugin } from "@/utils";
import { macOCRByAppleScript } from "./utils";
import { sql } from "@/api";

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
async function ocrAssetsUrl(imgPath: string): Promise<boolean> {
  try {
    const absolutePath = getAbsolutePath(imgPath);
    const storageName = ocrStorageName(imgPath);

    // 从配置中获取 removeLineBreaks 设置
    const removeLineBreaks =
      settings.getBySpace("ocrConfig", "removeLineBreaks") || false;

    // 调用 OCR
    const ocrText = await macOCRByAppleScript(absolutePath, removeLineBreaks);

    if (ocrText && ocrText.trim()) {
      // 保存 OCR 结果
      await plugin.saveData(storageName, {
        words_result: [{ words: ocrText }],
        text: ocrText,
      });

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

      return true;
    } else {
      // OCR 结果为空，保存空结果
      await plugin.saveData(storageName, {});
      return false;
    }
  } catch (error) {
    console.error(`OCR 失败 [${imgPath}]:`, error);
    // 保存失败标记
    const storageName = ocrStorageName(imgPath);
    await plugin.saveData(storageName, { error: true });
    return false;
  }
}

export default class OCRPlugin extends AddIconThenClick {
  id = "hqweay-ocr";
  label = "批量 OCR";
  icon = "®️"; // 用户自己设置
  type = "barMode";

  async exec() {
    // 显示菜单选择 OCR 类型
    const menu = new Menu("hqweay-ocr-menu");
    menu.addItem({
      label: "识别所有无 OCR 数据的图片",
      click: async () => {
        await batchOcr({ type: "all" });
      },
    });
    menu.addItem({
      label: "再次识别所有识别失败的图片",
      click: async () => {
        await batchOcr({ type: "failing" });
      },
    });
    // 获取按钮位置来显示菜单
    const btn = document.getElementById(this.id);
    if (btn) {
      const rect = btn.getBoundingClientRect();
      menu.open({
        x: rect.left,
        y: rect.bottom,
      });
    }
  }

  // 图片右键菜单事件
  imageMenuEvent(event: any) {
    const spanImg = event.detail.element as HTMLElement;
    const img = spanImg.querySelector(`img[data-src]`) as HTMLImageElement;
    if (!img) {
      return;
    }
    const imgSrc = img.dataset.src;
    console.log(imgSrc);
    if (!imgSrc) {
      return;
    }

    (globalThis.window.siyuan.menus.menu as Menu).addItem({
      label: "OCR 识别",
      click: async () => {
        const ok = await ocrAssetsUrl(imgSrc);
        if (ok) {
          showMessage(`OCR 识别成功`);
        } else {
          showMessage(`OCR 识别失败`);
        }
      },
    });
  }
}

/**
 * 批量 OCR 所有图片
 * @param options OCR 选项
 */
export async function batchOcr(options: {
  type: "failing" | "all";
}): Promise<void> {
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
    }> = await sql(`SELECT * FROM assets
WHERE PATH LIKE '%.png'
   OR PATH LIKE '%.jpg'
   OR PATH LIKE '%.jpeg'
   OR PATH LIKE '%.gif'
   OR PATH LIKE '%.bmp'
   OR PATH LIKE '%.webp'
LIMIT 99999`);

    if (assets.length === 0) {
      showMessage("未找到图片资源", 3000);
      return;
    }

    let i = 0;
    let successful: string[] = [];
    let failing: string[] = [];
    let skip: string[] = [];
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 5;

    showMessage(
      `开始批量 OCR，共 ${assets.length} 张图片。可以打开开发者工具查看进度`,
      5000
    );

    for (const img of assets) {
      i += 1;
      let ok = false;
      const imgPath = img.path;
      const storageName = ocrStorageName(imgPath);
      const existingData = await plugin.loadData(storageName);

      // 判断是否需要跳过
      if (options.type === "all" && existingData && existingData.words_result) {
        // 识别所有无 OCR 的图片时，跳过已有 OCR 数据的图片
        skip.push(imgPath);
      } else if (options.type === "failing" && existingData?.words_result) {
        // 再次识别失败图片时，跳过已有识别结果的图片
        skip.push(imgPath);
      } else {
        try {
          ok = await ocrAssetsUrl(imgPath);
        } catch (error) {
          ok = false;
          console.error(`OCR 处理失败 [${imgPath}]:`, error);
        }

        if (ok) {
          successful.push(imgPath);
          consecutiveFailures = 0; // 重置失败计数器
        } else {
          failing.push(imgPath);
          consecutiveFailures++; // 增加失败计数器
          console.log("失败", imgPath);

          // 检查是否达到连续失败阈值
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            const errorMsg = `OCR 接口连续失败 ${MAX_CONSECUTIVE_FAILURES} 次，已停止批量 OCR 处理。\n建议检查网络连接或 OCR 服务状态后重试。`;
            console.error(errorMsg);
            showMessage(errorMsg, 10000, "error");
            return;
          }
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
  } catch (error) {
    console.error("批量 OCR 失败:", error);
    showMessage(`批量 OCR 失败: ${error.message}`, 5000, "error");
  }
}
