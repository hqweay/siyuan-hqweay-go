import {
  appendBlock,
  deleteBlock,
  getBlockAttrs,
  setBlockAttrs,
  sql,
  updateBlock,
} from "@/api";
import type { Annotation, HighlightColor, BookBinding } from "./types";
import { HIGHLIGHT_COLORS } from "./types";

const EPUB_BINDING_ATTR = "custom-bind-epub";

/**
 * Generate a unique ID for annotations
 */
export function generateAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get highlight color by bgColor, or create a custom color if not found in predefined colors
 */
export function getColorByBgColor(bgColor: string): HighlightColor {
  return (
    HIGHLIGHT_COLORS.find((c) => c.bgColor === bgColor) || {
      name: "自定义",
      color: "#000",
      bgColor: bgColor,
    }
  );
}

/**
 * Build the location string for linking back to epub position
 * Format: assets/book.epub#epubcfi(/6/18!/4/82,/1:57,/1:145)#blockId#bgColor
 */
export function buildLocationString(
  epubPath: string,
  cfiRange: string,
  blockId?: string,
  bgColor?: string
): string {
  let locationStr = `${epubPath}#${encodeURIComponent(cfiRange)}`;
  if (blockId) {
    locationStr += `#${blockId}`;
  }
  if (bgColor) {
    locationStr += `#${encodeURIComponent(bgColor)}`;
  }
  return locationStr;
}

/**
 * Parse location string to extract epub path, CFI, blockId and bgColor
 */
export function parseLocationString(
  locationStr: string
): {
  epubPath: string;
  cfiRange: string;
  blockId?: string;
  bgColor?: string;
} | null {
  try {
    const parts = locationStr.split("#");
    if (parts.length < 2) return null;

    const epubPath = parts[0];
    const cfiRange = decodeURIComponent(parts[1]);
    const blockId = parts[2];
    const bgColor = parts[3] ? decodeURIComponent(parts[3]) : undefined;

    return { epubPath, cfiRange, blockId, bgColor };
  } catch (e) {
    console.error("Failed to parse location string:", e);
    return null;
  }
}

/**
 * Format annotation for insertion into Siyuan document
 */
export function formatAnnotationMarkdown(
  annotation: Annotation,
  epubPath: string
): string {
  // Build location string with assets/ prefix so Siyuan recognizes it as an epub file
  const assetsPath = `${epubPath}`;
  const locationStr = buildLocationString(
    assetsPath,
    annotation.cfiRange,
    annotation.id,
    annotation.color.bgColor
  );

  // Format: text [◎](location) - plain text with color info in link
  let markdown = `${escapeMarkdown(annotation.text)} [◎](${locationStr})`;

  if (annotation.note) {
    markdown += `\n  - 📝 ${escapeMarkdown(annotation.note)}`;
  }

  return markdown;
}

/**
 * Escape special markdown characters
 */
function escapeMarkdown(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\n/g, " ");
}

/**
 * Insert annotation into Siyuan document
 */
export async function insertAnnotation(
  annotation: Annotation,
  epubPath: string,
  docId: string
): Promise<string | null> {
  try {
    const markdown = formatAnnotationMarkdown(annotation, epubPath);
    const result = await appendBlock("markdown", markdown, docId);

    if (result && result.length > 0) {
      const blockId = result[0].doOperations?.[0]?.id;
      return blockId || null;
    }
    return null;
  } catch (e) {
    console.error("Failed to insert annotation:", e);
    return null;
  }
}

/**
 * Delete annotation from Siyuan document
 */
export async function removeAnnotation(blockId: string): Promise<boolean> {
  try {
    await deleteBlock(blockId);
    return true;
  } catch (e) {
    console.error("Failed to remove annotation:", e);
    return false;
  }
}

/**
 * Get bound document ID for an epub file
 */
export async function getBoundDocId(epubPath: string): Promise<string | null> {
  try {
    // Query documents with the binding attribute
    const result = await sql(
      `SELECT id FROM blocks WHERE type = 'd' AND ial LIKE '%${EPUB_BINDING_ATTR}="${epubPath}"%'`
    );

    if (result && result.length > 0) {
      return result[0].id;
    }
    return null;
  } catch (e) {
    console.error("Failed to get bound doc:", e);
    return null;
  }
}

/**
 * Bind a document to an epub file
 */
export async function bindDocToEpub(
  docId: string,
  epubPath: string
): Promise<boolean> {
  try {
    await setBlockAttrs(docId, {
      [EPUB_BINDING_ATTR]: epubPath,
    });
    return true;
  } catch (e) {
    console.error("Failed to bind doc to epub:", e);
    return false;
  }
}

/**
 * Get epub binding info from a document
 */
export async function getEpubBinding(docId: string): Promise<string | null> {
  try {
    const attrs = await getBlockAttrs(docId);
    return attrs?.[EPUB_BINDING_ATTR] || null;
  } catch (e) {
    console.error("Failed to get epub binding:", e);
    return null;
  }
}

/**
 * Query all annotations for an epub from bound document
 */
export async function queryAnnotations(
  epubPath: string,
  docId: string
): Promise<Annotation[]> {
  try {
    // Query blocks that contain the epub path in their content
    const result = await sql(
      `SELECT * FROM blocks WHERE root_id = '${docId}' AND content LIKE '%${epubPath}%' AND type = 'i'`
    );

    // Parse annotations from blocks
    const annotations: Annotation[] = [];
    for (const block of result || []) {
      const annotation = parseAnnotationFromBlock(block, epubPath);
      if (annotation) {
        annotations.push(annotation);
      }
    }

    return annotations;
  } catch (e) {
    console.error("Failed to query annotations:", e);
    return [];
  }
}

/**
 * Parse annotation from a Siyuan block
 */
function parseAnnotationFromBlock(
  block: any,
  epubPath: string
): Annotation | null {
  try {
    const content = block.content || "";
    console.log("Parsing annotation content:", content);

    // Extract link from the content
    const linkMatch = content.match(/\[◎\]\(([^)]+)\)/);
    if (!linkMatch) {
      console.warn("No link found in content:", content);
      return null;
    }

    const link = linkMatch[1];
    console.log("Extracted link:", link);

    // Parse location string to get CFI, blockId and bgColor
    const parsedLocation = parseLocationString(link);
    if (!parsedLocation) {
      console.warn("Failed to parse location string:", link);
      return null;
    }

    const { cfiRange, blockId, bgColor } = parsedLocation;
    console.log(
      "Extracted CFI:",
      cfiRange,
      "blockId:",
      blockId,
      "bgColor:",
      bgColor
    );

    // Extract text - everything before the link
    const text = content.split("[◎]")[0].replace(/^-\s*/, "").trim();
    console.log("Extracted text:", text);

    // Get color from bgColor or default
    const color = bgColor ? getColorByBgColor(bgColor) : HIGHLIGHT_COLORS[0];
    console.log("Matched color:", color);

    return {
      id: blockId || block.id,
      type: "highlight",
      text,
      cfiRange,
      epubCfi: cfiRange,
      color,
      blockId: block.id,
      // chapterId will be set later in Reader.svelte where book instance is available
      createdAt: new Date(block.created).getTime(),
      updatedAt: new Date(block.updated).getTime(),
    };
  } catch (e) {
    console.error("Failed to parse annotation from block:", e);
    return null;
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Copy text to clipboard
 */
/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    // Fallback for older browsers
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch (e2) {
      console.error("Failed to copy to clipboard:", e2);
      return false;
    }
  }
}

/**
 * Update annotation color in database
 */
export async function updateAnnotationColor(
  blockId: string,
  newColor: HighlightColor
): Promise<boolean> {
  try {
    // Get current annotation content
    const result = await sql(
      `SELECT markdown FROM blocks WHERE id = '${blockId}'`
    );

    if (result && result.length > 0) {
      let currentMarkdown = result[0].markdown;
      // Handle URL-encoded spaces and other special characters
      currentMarkdown = currentMarkdown.replaceAll("%20", " ");

      // Parse and update color information
      const updatedMarkdown = updateMarkdownColor(currentMarkdown, newColor);

      // Update block content
      await updateBlockContent(blockId, updatedMarkdown);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Failed to update annotation color:", e);
    return false;
  }
}

/**
 * Update markdown color using regex replacement
 */
function updateMarkdownColor(
  markdown: string,
  newColor: HighlightColor
): string {
  console.log("🔄 [颜色更改] 更新 Markdown 颜色:", { markdown, newColor });
  const annotationRegex =
    /\[◎\]\((assets\/.*\.epub)#(epubcfi\(.*\))#(ann-.*)#(.*)\)/;

  const color = encodeURIComponent(newColor.bgColor);

  return markdown.replace(annotationRegex, (match, p1, p2, p3, p4) => {
    // Decode p1 and replace %20 with spaces
    const decodedP1 = decodeURIComponent(p1);
    return `[◎](${decodedP1}#${p2}#${p3}#${color})`;
  });
}

/**
 * Update block content using API
 */
async function updateBlockContent(blockId: string, markdown: string): Promise<void> {
  try {
    // Use API to update block content
    await updateBlock("markdown", markdown, blockId);
  } catch (e) {
    console.error("Failed to update block content:", e);
    throw e;
  }
}
