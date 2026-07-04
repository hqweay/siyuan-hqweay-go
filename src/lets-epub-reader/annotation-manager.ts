import type { Annotation, AnnotationType } from "./types";
import { extractChapterIdFromCfi } from "./epub-utils";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-epub-reader");

/**
 * 标注管理器类
 * 统一管理 EPUB 标注的创建、清理和状态跟踪
 */
export class AnnotationManager {
  private appliedAnnotations = new Set<string>();
  private rendition: any;
  private chapterAnnotations = new Map<string, Set<string>>(); // chapterId -> annotationIds

  constructor(rendition: any) {
    this.rendition = rendition;
  }

  /**
   * 清除所有现有的标注高亮
   */
  clearAllHighlights(): void {
    log.info("🧹 [标注管理器] 开始清理所有标注");

    try {
      // 清除 epub.js 标注存储
      this.rendition.annotations.removeAll("highlight");
      log.info("✅ [标注管理器] epub.js 标注存储已清理");
    } catch (e) {
      log.warn("⚠️ [标注管理器] 清理 epub.js 标注存储失败:", e);
    }

    // 清除基于 DOM 的高亮
    const contents = this.rendition.getContents();
    for (const content of contents) {
      const doc = content.document;

      // 移除 SVG rect 高亮
      const rects = doc.querySelectorAll("svg .epubjs-hl, .epubjs-hl");
      rects.forEach((rect) => rect.remove());

      // 移除 span 高亮并恢复文本内容
      const spans = doc.querySelectorAll(
        'span.epubjs-hl, span[class*="epub-hl-"]'
      );
      spans.forEach((span) => {
        const text = doc.createTextNode(span.textContent || "");
        span.parentNode?.replaceChild(text, span);
      });

      // 移除自定义高亮样式
      const customHighlights = doc.querySelectorAll('[class*="epub-hl-"]');
      customHighlights.forEach((el) => {
        const text = doc.createTextNode(el.textContent || "");
        el.parentNode?.replaceChild(text, el);
      });
    }

    // 重置跟踪状态
    this.appliedAnnotations.clear();
    this.chapterAnnotations.clear();
    log.info("✅ [标注管理器] 所有标注已清理完成");
  }

  /**
   * 应用单个标注高亮
   */
  applyHighlight(annotation: Annotation, onClick?: (e: any) => void): boolean {
    if (!this.rendition || !annotation.cfiRange) {
      log.warn("⚠️ [标注管理器] 无法应用标注：缺少必要参数", {
        hasRendition: !!this.rendition,
        hasCfi: !!annotation.cfiRange,
      });
      return false;
    }

    try {
      // 如果标注已存在，先移除再重新应用
      if (this.appliedAnnotations.has(annotation.id)) {
        log.info("🔄 [标注管理器] 标注已存在，重新应用:", annotation.id);
        this.removeHighlight(annotation);
      }

      log.info(
        "🎨 [标注管理器] 应用标注:",
        annotation.id,
        "CFI:",
        annotation.cfiRange
      );

      // 映射颜色到 CSS 类
      const getColorClass = (bgColor: string): string => {
        const colorMap: { [key: string]: string } = {
          "#ffeb3b": "epub-hl-yellow",
          "#a5d6a7": "epub-hl-green",
          "#90caf9": "epub-hl-blue",
          "#f48fb1": "epub-hl-pink",
          "#ffcc80": "epub-hl-orange",
        };
        return colorMap[bgColor] || "epub-hl-yellow";
      };

      const className = `epub-anno-${annotation.id}`;
      const annotationType =
        annotation.type === "note" ? "highlight" : annotation.type;

      // 使用 epub.js 通用标注 API
      this.rendition.annotations.add(
        annotationType,
        annotation.cfiRange,
        {
          id: annotation.id,
          color: annotation.color.bgColor,
          type: annotationType,
        },
        onClick || ((e: any) => {}),
        className,
        {
          fill: annotation.color.bgColor,
          "fill-opacity": annotationType === "mark" ? "0.6" : "0.4",
          cursor: "pointer",
          ...(annotationType === "underline"
            ? {
                "border-bottom": `2px solid ${annotation.color.bgColor}`,
                "padding-bottom": "1px",
              }
            : {}),
          ...(annotationType === "mark"
            ? {
                "background-color": annotation.color.bgColor,
                color: "#000",
              }
            : {}),
        }
      );

      // 跟踪已应用的标注
      this.appliedAnnotations.add(annotation.id);

      // 记录标注所属的章节
      if (annotation.chapterId) {
        if (!this.chapterAnnotations.has(annotation.chapterId)) {
          this.chapterAnnotations.set(annotation.chapterId, new Set());
        }
        this.chapterAnnotations.get(annotation.chapterId)?.add(annotation.id);
      }

      log.info("✅ [标注管理器] 标注应用成功:", annotation.id);
      return true;
    } catch (e) {
      log.error("❌ [标注管理器] 应用标注失败:", annotation.id, e);
      return false;
    }
  }

  /**
   * 过滤出属于特定章节的标注
   */
  filterAnnotationsByChapter(
    annotations: Annotation[],
    chapterId: string
  ): Annotation[] {
    return annotations.filter((annotation) => {
      log.info("🔍 [标注管理器] 检查标注:", annotation.id, annotation.chapterId);
      // 如果标注有章节ID，直接比较
      if (annotation.chapterId) {
        return annotation.chapterId === chapterId;
      }

      // 如果没有章节ID，尝试从CFI中提取
      // Note: 需要 book 实例来提取章节ID，这里暂时跳过
      return false;
    });
  }

  /**
   * 获取当前章节的ID
   *
   * 行为：
   * 1. 从 rendition.currentLocation 获取当前起始 CFI（location.start.cfi）。
   * 2. 如果 rendition.book 可用，使用 book.spine.get(cfi) 获取对应的 section。
   * 3. 返回优先使用 section.href（唯一且稳定），若不可用则返回 section.index 的字符串形式。
   * 4. 若无法获取 book 或 section，则尝试使用 extractChapterIdFromCfi 作为回退（返回基路径），但首选 spine.get。
   */
  /**
   * 获取当前章节的 ID（推荐返回 section.index，稳定且唯一）
   */
  getCurrentChapterId(): string | null {
    if (!this.rendition) return null;

    try {
      const location = this.rendition.currentLocation();
      log.info("📌 [标注管理器] 当前位置:", location);
      if (!location || !location.start || !location.start.cfi) {
        return null;
      }

      const cfi: string = location.start.cfi;

      log.info("📌 [标注管理器] 当前 CFI:", location.start);

      // 获取 epub.js 的 book 实例
      const book =
        (this.rendition as any).book || (this.rendition as any).manager?.book;

      if (book && book.spine && typeof book.spine.get === "function") {
        try {
          const section = book.spine.get(cfi);
          if (!section) return null;

          // 最稳定的章节 ID → 使用 spine index
          if (typeof section.index !== "undefined") {
            return String(section.index);
          }

          // 次级选项：href
          if (section.href) {
            return String(section.href);
          }

          return null;
        } catch (e) {
          log.warn("使用 book.spine.get 解析章节失败:", e);
        }
      }

      // 最后的回退：返回 CFI 的基路径（仅用于兜底，不保证唯一性）
      const basePath = extractChapterIdFromCfi(cfi);
      return basePath || null;
    } catch (e) {
      log.warn("获取当前章节 ID 失败:", e);
      return null;
    }
  }
  /**
   * 清除当前章节的标注
   */
  clearCurrentChapterHighlights(): void {
    const currentChapterId = this.getCurrentChapterId();
    if (!currentChapterId) return;

    log.info(`🧹 [标注管理器] 清除当前章节标注: ${currentChapterId}`);

    const annotationIds = this.chapterAnnotations.get(currentChapterId);
    if (!annotationIds) return;

    // 遍历当前章节的所有标注并移除
    for (const annotationId of annotationIds) {
      try {
        this.rendition.annotations.removeAll(); // 清除所有标注
        this.appliedAnnotations.delete(annotationId);
      } catch (e) {
        log.warn(`移除标注失败: ${annotationId}`, e);
      }
    }

    // 从章节映射中清除
    this.chapterAnnotations.delete(currentChapterId);
  }

  /**
   * 应用当前章节的标注
   */
  applyCurrentChapterHighlights(
    annotations: Annotation[],
    onClick?: (annotation: Annotation) => (e: any) => void
  ): { success: number; failed: number } {
    const currentChapterId = this.getCurrentChapterId();
    if (!currentChapterId) {
      log.info("⚠️ [标注管理器] 无法确定当前章节，跳过标注应用");
      return { success: 0, failed: 0 };
    }

    log.info(`🎯 [标注管理器] 应用当前章节标注: ${currentChapterId}`);

    // 先清除当前章节的标注
    this.clearCurrentChapterHighlights();

    // 过滤出当前章节的标注
    const chapterAnnotations = this.filterAnnotationsByChapter(
      annotations,
      currentChapterId
    );

    log.info(
      `📋 [标注管理器] 找到 ${chapterAnnotations.length} 个当前章节的标注`
    );

    // 应用过滤后的标注
    let success = 0;
    let failed = 0;

    for (const annotation of chapterAnnotations) {
      const clickHandler = onClick ? onClick(annotation) : undefined;
      if (this.applyHighlight(annotation, clickHandler)) {
        success++;
      } else {
        failed++;
      }
    }

    log.info(
      `✅ [标注管理器] 当前章节标注应用完成 - 成功: ${success}, 失败: ${failed}`
    );
    return { success, failed };
  }

  /**
   * 应用所有标注
   */
  applyAllHighlights(
    annotations: Annotation[],
    onClick?: (annotation: Annotation) => (e: any) => void
  ): { success: number; failed: number } {
    log.info("📋 [标注管理器] 开始应用所有标注，数量:", annotations.length);

    let success = 0;
    let failed = 0;

    for (const annotation of annotations) {
      const clickHandler = onClick ? onClick(annotation) : undefined;
      if (this.applyHighlight(annotation, clickHandler)) {
        success++;
      } else {
        failed++;
      }
    }

    log.info("📊 [标注管理器] 应用结果 - 成功:", success, "失败:", failed);
    return { success, failed };
  }

  /**
   * 移除特定的高亮标注
   */
  removeHighlight(annotation: Annotation): boolean {
    try {
      log.info("🗑️ [标注管理器] 尝试删除标注:", annotation.id);

      // 使用 epub.js API 移除标注
      const annotationType =
        annotation.type === "note" ? "highlight" : annotation.type;
      this.rendition.annotations.remove(annotation.cfiRange, annotationType);

      // 从跟踪中移除
      this.appliedAnnotations.delete(annotation.id);

      // 从章节映射中移除
      if (annotation.chapterId) {
        this.chapterAnnotations
          .get(annotation.chapterId)
          ?.delete(annotation.id);
      }

      log.info("✅ [标注管理器] 标注已删除:", annotation.id);
      return true;
    } catch (e) {
      log.error("❌ [标注管理器] 删除标注失败:", annotation.id, e);
      return false;
    }
  }

  /**
   * 使用 CFI 范围移除标注
   */
  removeHighlightByCfi(cfiRange: string): boolean {
    const types: AnnotationType[] = ["highlight", "underline", "mark"];
    let success = false;

    for (const type of types) {
      try {
        this.rendition.annotations.remove(cfiRange, type);
        log.info(`✅ [标注管理器] 通过 CFI 移除标注 (${type}):`, cfiRange);
        success = true;
      } catch (e) {
        // Ignore errors for types that don't exist at this CFI
      }
    }

    return success;
  }

  /**
   * 检查标注是否已应用
   */
  isApplied(annotationId: string): boolean {
    return this.appliedAnnotations.has(annotationId);
  }

  /**
   * 获取已应用标注的数量
   */
  getAppliedCount(): number {
    return this.appliedAnnotations.size;
  }

  /**
   * 获取所有已应用标注的 ID
   */
  getAppliedAnnotationIds(): string[] {
    return Array.from(this.appliedAnnotations);
  }

  /**
   * 重新应用所有标注（用于页面刷新或重新加载后）
   */
  reapplyAllHighlights(
    annotations: Annotation[],
    onClick?: (annotation: Annotation) => (e: any) => void
  ): { success: number; failed: number } {
    log.info("🔄 [标注管理器] 重新应用所有标注");

    // 先清理所有
    this.clearAllHighlights();

    // 然后重新应用
    return this.applyAllHighlights(annotations, onClick);
  }

  /**
   * 销毁管理器并清理资源
   */
  destroy(): void {
    log.info("🗑️ [标注管理器] 销毁管理器");
    this.clearAllHighlights();
    this.appliedAnnotations.clear();
  }
}
