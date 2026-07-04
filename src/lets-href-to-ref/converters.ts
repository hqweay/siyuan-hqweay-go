import { IOperation } from "siyuan";
import { getLogger } from "@/libs/logger";

const log = getLogger("lets-href-to-ref");

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single "work unit": one block to transform, yielding one IOperation.
 * - `operationElement` is the block node whose outerHTML is snapshotted.
 * - `searchRoots` are the contenteditable elements to search for inline spans.
 *
 * Difference between block and page context:
 *   block: operationElement = selected block; searchRoots = editables within it.
 *   page:  operationElement = each NodeParagraph/NodeHeading; searchRoots = [editable inside it].
 */
export interface TransformGroup {
  nodeId: string;
  operationElement: HTMLElement;
  searchRoots: HTMLElement[];
}

// ─── Group builders ───────────────────────────────────────────────────────────

function buildEditableSelector(availableBlocks: string[]): string {
  return availableBlocks
    .map((b) => `[data-type=${b}] [contenteditable="true"]`)
    .join(",");
}

/**
 * For `blockIconEvent`: each selected block becomes one TransformGroup.
 * The operation is keyed by the selected block's nodeId.
 */
export function buildBlockGroups(
  blockElements: HTMLElement[],
  availableBlocks: string[]
): TransformGroup[] {
  const sel = buildEditableSelector(availableBlocks);
  return blockElements.map((item) => ({
    nodeId: item.dataset.nodeId!,
    operationElement: item,
    searchRoots: Array.from(item.querySelectorAll(sel)) as HTMLElement[],
  }));
}

/**
 * For `editortitleiconEvent` / commands: each matching editable is its own
 * TransformGroup. The operation is keyed by the editable's parent block nodeId.
 */
export function buildPageGroups(
  protyle: any,
  availableBlocks: string[]
): TransformGroup[] {
  const sel = buildEditableSelector(availableBlocks);
  return (
    Array.from(
      protyle.wysiwyg.element.querySelectorAll(sel)
    ) as HTMLElement[]
  ).map((editable) => ({
    nodeId: editable.parentElement!.dataset.nodeId!,
    operationElement: editable.parentElement!,
    searchRoots: [editable],
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the nodeId of the currently active document. */
export function getActiveDocId(): string | undefined {
  return (
    document
      .querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      )
      ?.getAttribute("data-node-id") ?? undefined
  );
}

/**
 * After removing a block-ref that leaves an empty parent,
 * collapse and remove the surrounding NodeList to avoid empty list items.
 */
export function cleanupEmptyContainer(
  parentElement: HTMLElement | null
): void {
  if (!parentElement || parentElement.textContent.trim() !== "") return;

  let current = parentElement;
  let depth = 0;
  const maxDepth = 9;

  while (current && current !== document.body && depth < maxDepth) {
    if (current.getAttribute("data-type") === "NodeList") {
      // Move nested NodeLists out before removing
      Array.from(current.children)
        .filter(
          (child) => child.getAttribute("data-type") === "NodeListItem"
        )
        .forEach((nodeListItem) => {
          Array.from(nodeListItem.children)
            .filter(
              (child) => child.getAttribute("data-type") === "NodeList"
            )
            .forEach((nestedList) => {
              current.parentElement?.appendChild(nestedList);
            });
        });
      current.remove();
      break;
    }
    current = current.parentElement!;
    depth++;
  }
}

// ─── Core converters (pure — no settings access, no plugin reference) ─────────

/** 引用 → 块超链接 (block-ref → siyuan:// link) */
export function refToLink(groups: TransformGroup[]): IOperation[] {
  const ops: IOperation[] = [];
  for (const { nodeId, operationElement, searchRoots } of groups) {
    let changed = false;
    for (const root of searchRoots) {
      root.querySelectorAll("[data-type=block-ref]").forEach((ele) => {
        ele.setAttribute("data-type", "a");
        ele.removeAttribute("data-subtype");
        ele.setAttribute(
          "data-href",
          `siyuan://blocks/${ele.getAttribute("data-id")}`
        );
        ele.removeAttribute("data-id");
        changed = true;
      });
    }
    if (changed)
      ops.push({ id: nodeId, data: operationElement.outerHTML, action: "update" });
  }
  return ops;
}

/** 块超链接 → 引用 (siyuan:// link → block-ref) */
export function linkToRef(groups: TransformGroup[]): IOperation[] {
  const ops: IOperation[] = [];
  for (const { nodeId, operationElement, searchRoots } of groups) {
    let changed = false;
    for (const root of searchRoots) {
      root
        .querySelectorAll('[data-type=a][data-href^="siyuan://"]')
        .forEach((ele) => {
          ele.setAttribute("data-type", "block-ref");
          ele.setAttribute("data-subtype", "s");
          ele.setAttribute(
            "data-id",
            ele.getAttribute("data-href")!.replace("siyuan://blocks/", "")
          );
          ele.removeAttribute("data-href");
          changed = true;
        });
    }
    if (changed)
      ops.push({ id: nodeId, data: operationElement.outerHTML, action: "update" });
  }
  return ops;
}

/**
 * 行内元素 → 文本
 *
 * @param selector  CSS attribute selector, e.g. `[data-type~="mark"]`
 * @param styleNesting  When true, strip only the targeted type from multi-type spans.
 */
export function inlineToText(
  groups: TransformGroup[],
  selector: string,
  styleNesting: boolean
): IOperation[] {
  const ops: IOperation[] = [];

  // Pre-extract type name(s) from the selector for styleNesting mode
  const typesToStrip: string[] = [];
  if (styleNesting) {
    const pattern = /\[data-type~="([^"]+)"\]/g;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(selector)) !== null) {
      typesToStrip.push(m[1]);
    }
  }

  for (const { nodeId, operationElement, searchRoots } of groups) {
    let changed = false;
    for (const root of searchRoots) {
      root.querySelectorAll(selector).forEach((ele) => {
        const currentType = (ele.getAttribute("data-type") ?? "").trim();
        const typeList = currentType.split(" ").filter(Boolean);

        if (typeList.length === 1) {
          // Only this type: replace span with plain text node
          ele.parentNode?.replaceChild(
            document.createTextNode(ele.textContent ?? ""),
            ele
          );
          changed = true;
        } else if (styleNesting && typesToStrip.length > 0) {
          // Multiple types: strip only the targeted one
          const updated = typeList
            .filter((t) => t !== typesToStrip[0])
            .join(" ");
          if (!updated) ele.removeAttribute("data-type");
          else ele.setAttribute("data-type", updated);
          changed = true;
        }
        // else: multi-type and styleNesting=false → leave untouched
      });
    }
    if (changed)
      ops.push({ id: nodeId, data: operationElement.outerHTML, action: "update" });
  }
  return ops;
}

/** 清理文档自身引用（删除 data-id === docId 的 block-ref，清理遗留空列表） */
export function cleanSelfRef(
  groups: TransformGroup[],
  docId: string
): IOperation[] {
  const ops: IOperation[] = [];
  for (const { nodeId, operationElement, searchRoots } of groups) {
    let changed = false;
    for (const root of searchRoots) {
      root
        .querySelectorAll('[data-type="block-ref"]')
        .forEach((ele) => {
          if (ele.getAttribute("data-id") === docId) {
            const parent = ele.parentElement;
            ele.remove();
            cleanupEmptyContainer(parent);
            changed = true;
          }
        });
    }
    if (changed)
      ops.push({ id: nodeId, data: operationElement.outerHTML, action: "update" });
  }
  return ops;
}

/** 清理 * 引用（删除 textContent === "*" 的 block-ref） */
export function cleanStarRef(groups: TransformGroup[]): IOperation[] {
  const ops: IOperation[] = [];
  for (const { nodeId, operationElement, searchRoots } of groups) {
    let changed = false;
    for (const root of searchRoots) {
      root
        .querySelectorAll('[data-type="block-ref"]')
        .forEach((ele) => {
          if (ele.textContent === "*") {
            ele.remove();
            changed = true;
          }
        });
    }
    if (changed)
      ops.push({ id: nodeId, data: operationElement.outerHTML, action: "update" });
  }
  return ops;
}
