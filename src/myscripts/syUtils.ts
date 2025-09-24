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
 * 主方法：传入笔记本ID，返回渲染后的日记路径
 */
export async function getRenderedDailyNotePath(
  notebook: string
): Promise<string> {
  try {
    // 1. 获取模板路径
    const template = await getDailyNoteTemplate(notebook);
    if (!template) throw new Error("未配置日记模板路径");

    // 2. 渲染模板
    const renderedPath = await renderSprigTemplate(template);
    if (!renderedPath) throw new Error("模板渲染失败");

    return renderedPath;
  } catch (error) {
    console.error("获取日记路径失败:", error);
    // 降级方案：返回默认渲染路径
    const defaultPath = await renderSprigTemplate(
      '/daily note/{{now | date "2006/01"}}/{{now | date "2006-01-02"}}'
    );
    return (
      defaultPath || `/daily note/${new Date().toISOString().slice(0, 10)}`
    );
  }
}

export async function isdailyNoteExists(dateStr) {
  const data = {
    stmt: `
      select distinct B.* from blocks as B join attributes as A
    on B.id = A.block_id
    where A.name = 'custom-dailynote-${dateStr}'
    limit 1
    `,
  };
  const url = "/api/query/sql";
  return request(url, data).then(function (data) {
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
