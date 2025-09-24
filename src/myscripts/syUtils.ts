import { request } from "@/api";
import { plugin } from "@/utils";
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
