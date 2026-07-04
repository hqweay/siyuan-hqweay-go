import { plugin } from "@/utils";
import { sql, updateBlock } from "@/api";
import { fetchSyncPost } from "siyuan";
import { refToLink, linkToRef, TransformGroup, getActiveDocId } from "./converters";
import { IOperation } from "siyuan";
import { getLogger } from "@/libs/logger";

const log = getLogger("lets-href-to-ref");

// ─── API helpers ──────────────────────────────────────────────────────────────

/**
 * Query all paragraph / heading block IDs in the given document via SQL.
 * SQL covers ALL nesting levels (lists, blockquotes, superblocks, etc.),
 * unlike `getChildBlocks` which only returns immediate children.
 */
async function getDocBlockIds(
  docId: string,
  availableBlocks: string[]
): Promise<string[]> {
  const apiTypeMap: Record<string, string> = {
    NodeParagraph: "p",
    NodeHeading: "h",
  };
  const inClause = availableBlocks
    .map((b) => apiTypeMap[b])
    .filter(Boolean)
    .map((t) => `'${t}'`)
    .join(",");

  if (!inClause) return [];

  const rows: Array<{ id: string }> = await sql(
    `SELECT id FROM blocks WHERE root_id = '${docId}' AND type IN (${inClause})`
  );
  return (rows ?? []).map((r) => r.id);
}

/**
 * Fetch a block's real DOM from the kernel, parse it, apply the transform,
 * and persist the result via `updateBlock` if anything changed.
 *
 * Kernel DOM is always the ground truth — no lazy-load gaps.
 */
async function processBlock(
  blockId: string,
  transform: (groups: TransformGroup[]) => IOperation[]
): Promise<void> {
  const result = await fetchSyncPost("/api/block/getBlockDOM", { id: blockId });
  if (!result?.data?.dom) return;

  const { id, dom } = result.data as { id: string; dom: string };

  // Parse into a real DOM tree so our pure converter functions can work on it
  const wrapper = document.createElement("div");
  wrapper.innerHTML = dom;
  const blockEl = wrapper.firstElementChild as HTMLElement | null;
  if (!blockEl) return;

  const editable = blockEl.querySelector('[contenteditable="true"]') as HTMLElement | null;
  if (!editable) return;

  const groups: TransformGroup[] = [
    {
      nodeId: id,
      operationElement: blockEl,
      searchRoots: [editable],
    },
  ];

  const ops = transform(groups);
  if (ops.length > 0) {
    // ops[0].data is blockEl.outerHTML after in-place DOM mutation
    await updateBlock("dom", ops[0].data as string, id);
  }
}

/**
 * Apply a transform to every paragraph / heading block in the current document.
 *
 * Flow:
 *   1. Resolve active doc ID from the focused protyle title bar.
 *   2. SQL → all paragraph / heading block IDs (full depth, no lazy-load gaps).
 *   3. For each block: getBlockDOM → parse → transform → updateBlock.
 */
async function applyToFullDoc(
  availableBlocks: string[],
  transform: (groups: TransformGroup[]) => IOperation[]
): Promise<void> {
  const docId = getActiveDocId();
  if (!docId) {
    log.warn("applyToFullDoc: no active document found");
    return;
  }

  const blockIds = await getDocBlockIds(docId, availableBlocks);
  log.info(`applyToFullDoc: ${blockIds.length} blocks to process in doc ${docId}`);

  // Sequential to avoid hammering the kernel with concurrent writes
  for (const id of blockIds) {
    await processBlock(id, transform);
  }
}

// ─── Command registration ─────────────────────────────────────────────────────

/**
 * Register command-palette entries + hotkey slots.
 *
 * Uses `callback` (not `editorCallback`) so commands:
 *   - Appear and execute from the command palette (⌘/)
 *   - Also respond to user-bound hotkeys (Settings → Keymap)
 *
 * Operates on the kernel's true block content (via getBlockDOM + SQL),
 * so it works regardless of what the frontend has lazily rendered.
 */
export function registerCommands(availableBlocks: string[]): void {
  plugin.addCommand({
    langKey: "lets-href-to-ref.cmdRefToLink",
    hotkey: "",
    callback: async () => {
      await applyToFullDoc(availableBlocks, refToLink);
    },
  });

  plugin.addCommand({
    langKey: "lets-href-to-ref.cmdLinkToRef",
    hotkey: "",
    callback: async () => {
      await applyToFullDoc(availableBlocks, linkToRef);
    },
  });
}
