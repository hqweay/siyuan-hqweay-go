import { lsNotebooks } from "@/api";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-how-to-write-diary");

const LOCAL_DAILYNOTE_ID = "local-dailynoteid";

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

export async function getDiaryNoteBookId(): Promise<string> {
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
