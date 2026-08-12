import { lsNotebooks } from "@/api";
import { getLogger } from "@/libs/logger";
import { settings } from "@/settings";
import { plugin } from "@/utils";
import { Dialog } from "siyuan";
const log = getLogger("lets-how-to-write-diary");

const LOCAL_DAILYNOTE_ID = "local-dailynoteid";
const DIARY_NOTEBOOK_KEY = "diaryNoteBookId";

function getOpenNotebooks(): any[] {
  try {
    return (window.siyuan?.notebooks ?? []).filter((n) => !n.closed);
  } catch {
    return [];
  }
}

function getStoredDailyNoteId(): string {
  try {
    return window.siyuan?.storage?.[LOCAL_DAILYNOTE_ID] ?? "";
  } catch {
    return "";
  }
}

function pickNotebookId(storedId: string, openNotebooks: any[]): string {
  if (storedId && openNotebooks.some((n) => n.id === storedId)) {
    return storedId;
  }
  if (openNotebooks.length === 1) {
    return openNotebooks[0].id;
  }
  return "";
}

async function getConfiguredDiaryNoteBookId(): Promise<string> {
  const configured = settings.getBySpace("diaryTools", DIARY_NOTEBOOK_KEY);
  if (!configured) {
    return "";
  }
  if (getOpenNotebooks().some((n) => n.id === configured)) {
    return configured;
  }
  try {
    const { notebooks } = await lsNotebooks();
    if ((notebooks ?? []).some((n) => !n.closed && n.id === configured)) {
      return configured;
    }
  } catch (error) {
    log.error("查询笔记本失败:", error);
  }
  return "";
}

export async function getDiaryNoteBookId(): Promise<string> {
  // 优先使用配置中指定的笔记本
  const configuredId = await getConfiguredDiaryNoteBookId();
  if (configuredId) {
    return configuredId;
  }

  // 回退到思源笔记自带的日记本
  const storedId = getStoredDailyNoteId();
  const id = pickNotebookId(storedId, getOpenNotebooks());
  if (id) {
    return id;
  }

  try {
    const { notebooks } = await lsNotebooks();
    return pickNotebookId(storedId, (notebooks ?? []).filter((n) => !n.closed));
  } catch (error) {
    log.error("查询笔记本失败:", error);
  }
  return "";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function chooseDiaryNoteBookDialog(): Promise<
  { id: string; name: string } | null
> {
  return new Promise(async (resolve) => {
    let notebooks: any[] = [];
    try {
      const { notebooks: all } = await lsNotebooks();
      notebooks = all.filter((n) => !n.closed);
    } catch (error) {
      log.error("查询笔记本失败:", error);
      resolve(null);
      return;
    }

    const currentId = settings.getBySpace("diaryTools", DIARY_NOTEBOOK_KEY);
    const t = (key: string) => plugin.i18n[key] || key;

    const optionRows = notebooks
      .map((n) => {
        const isCurrent = n.id === currentId ? " b3-list-item--focus" : "";
        return `<div class="b3-list-item b3-list-item--r b3-tooltips b3-tooltips__n${isCurrent}" data-notebook-id="${n.id}" aria-label="${escapeHtml(
          n.name
        )}">
          <svg><use xlink:href="#iconFiles"></use></svg>
          <span class="b3-list-item__text">${escapeHtml(n.name)}</span>
        </div>`;
      })
      .join("");

    const dialog = new Dialog({
      title: t("lets-how-to-write-diary.diaryNoteBookPickerTitle"),
      content: `<div class="b3-list" style="max-height: 400px; overflow-y: auto;">
        <div class="b3-list-item b3-list-item--r${
          !currentId ? " b3-list-item--focus" : ""
        }" data-notebook-id="">
          <svg><use xlink:href="#iconUndo"></use></svg>
          <span class="b3-list-item__text">${t(
            "lets-how-to-write-diary.diaryNoteBookUseBuiltIn"
          )}</span>
        </div>
        ${
          notebooks.length
            ? optionRows
            : `<div class="b3-list-item b3-list-item--r"><span class="b3-list-item__text">${t(
                "lets-how-to-write-diary.diaryNoteBookNone"
              )}</span></div>`
        }
      </div>`,
      width: "420px",
      height: "auto",
    });

    const items = dialog.element.querySelectorAll(
      ".b3-list-item[data-notebook-id]"
    );
    items.forEach((el) => {
      el.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = el as HTMLElement;
        const id = target.getAttribute("data-notebook-id") || "";
        const name =
          id === ""
            ? ""
            : (target.querySelector(".b3-list-item__text")?.textContent ?? "");
        resolve({ id, name });
        dialog.destroy();
      });
    });
  });
}