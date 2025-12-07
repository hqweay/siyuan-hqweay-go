import { request } from "@/api";
import { isMobile, plugin } from "@/utils";
import {
  getActiveEditor,
  getFrontend,
  openMobileFileById,
  openTab,
  showMessage,
} from "siyuan";
import { goToRandomBlock } from "./randomDocCache";
import { openByMobile } from "./utils";
/**
 * 获取笔记本的日记模板路径
 */
async function getDailyNoteTemplate(notebook: string): Promise<string> {
  const data = await request("/api/notebook/getNotebookConf", { notebook });
  return data?.conf?.dailyNoteSavePath || "";
}

/**
 * 渲染模板路径
 */
async function renderSprigTemplate(template: string): Promise<string> {
  const result = await request("/api/template/renderSprig", { template });
  return result || "";
}

/**
 * 主方法：传入笔记本ID和日期字符串，返回渲染后的日记路径
 * @param notebook 笔记本ID
 * @param dateString 日期字符串（格式：YYYY-MM-DD）
 */
export async function getRenderedDailyNotePath(
  notebook: string,
  dateString: string = new Date().toISOString().slice(0, 10) // 默认使用当天
): Promise<string> {
  try {
    // 1. 获取日记存放模板路径
    const template = await getDailyNoteTemplate(notebook);
    if (!template) throw new Error("未配置日记存放模板路径");

    // 2. 将模板中的 now 替换为指定日期
    const dateAwareTemplate = template.replace(
      /now/g,
      `"${dateString}" | toDate "2006-01-02"`
    );

    // 3. 渲染日记存放模板
    const renderedPath = await renderSprigTemplate(dateAwareTemplate);
    if (!renderedPath) throw new Error("日记存放模板渲染失败");

    return renderedPath;
  } catch (error) {
    console.error("获取日记路径失败:", error);
    // 降级方案：返回默认渲染路径（使用指定日期）
    const defaultTemplate = `/daily note/{{ "${dateString}" | toDate "2006-01-02" | date "2006/01"}}/{{ "${dateString}" | toDate "2006-01-02" | date "2006-01-02"}}`;
    const defaultPath = await renderSprigTemplate(defaultTemplate);
    return defaultPath || `/daily note/${dateString}`;
  }
}

export async function isdailyNoteExists(dateStr, booknoteID) {
  // 存在多个日记的情况下取一条
  const data = {
    stmt: `
      select distinct B.* from blocks as B join attributes as A
    on B.id = A.block_id
    where A.name = 'custom-dailynote-${dateStr}' and A.box = '${booknoteID}'
    limit 1
    `,
  };
  return request("/api/query/sql", data).then(function (data) {
    return data && data.length >= 1 ? data[0].id : "";
  });
}

export async function addProtyleSlash(slash: any) {
  for (let i = 0; i < plugin.protyleSlash.length; i++) {
    if (plugin.protyleSlash[i].id === slash.id) {
      return;
    }
  }
  plugin.protyleSlash.push(slash);
}

const BlockIDPattern = /^\d{14,}-\w{7}$/;
export function isBlockID(id: string): boolean {
  return BlockIDPattern.test(id);
}

export function isNotebookID(id: string): boolean {
  return id.startsWith("20") && id.length === 14;
}

export function isAssetID(id: string): boolean {
  return id.startsWith("assets/");
}

export function isFileAnnotationID(id: string): boolean {
  return id.startsWith("fileannotation-");
}

export function isFileAnnotationBlockID(id: string): boolean {
  return id.startsWith("fileannotation-block_");
}

export function getCurrentDocId(): string {
  return isMobile
    ? window.siyuan.mobile.editor.protyle.block.id
    : document
        .querySelector(
          ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
        )
        ?.getAttribute("data-node-id");
}

export const getCurrentDoc = (): {} | null => {
  // 原生函数获取当前文档 protyle https://github.com/siyuan-note/siyuan/issues/15415
  const editor = getActiveEditor(false);
  const protyle = editor?.protyle;
  if (
    !protyle ||
    !protyle.block?.rootID ||
    !protyle.path ||
    !protyle.notebookId
  )
    return null;
  return {
    id: protyle.block.rootID,
    path: protyle.path,
    notebookId: protyle.notebookId,
  };
};
export function openBlockByID(id: string) {
  if (!isBlockID(id)) {
    return;
  }
  if (isMobile) {
    openMobileFileById(plugin.app, id);
  } else {
    openTab({
      app: plugin.app, //plugin 是你插件的 this 对象
      doc: {
        id: id,
      },
    });
  }
}

export function openByUrl(url) {
  url = url.trim();
  if (!url) {
    showMessage("url为空");
    return;
  } else if (url.toLowerCase().startsWith("select ")) {
    goToRandomBlock(url);
  } else if (isBlockID(url)) {
    isMobile
      ? openMobileFileById(plugin.app, url)
      : window.open(`siyuan://blocks/${url}`, "_blank");
  } else if (url.toLowerCase().startsWith("siyuan://")) {
    plugin.eventBus.emit("open-siyuan-url-plugin", { url });
  } else {
    isMobile ? openByMobile(url) : window.open(url, "_blank");
  }
}
