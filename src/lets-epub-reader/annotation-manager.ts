import type { Annotation } from './types';

/**
 * 标注管理器类
 * 统一管理 EPUB 标注的创建、清理和状态跟踪
 */
export class AnnotationManager {
  private appliedAnnotations = new Set<string>();
  private rendition: any;

  constructor(rendition: any) {
    this.rendition = rendition;
  }

  /**
   * 清除所有现有的标注高亮
   */
  clearAllHighlights(): void {
    console.log('🧹 [标注管理器] 开始清理所有标注');
    
    try {
      // 清除 epub.js 标注存储
      this.rendition.annotations.removeAll('highlight');
      console.log('✅ [标注管理器] epub.js 标注存储已清理');
    } catch (e) {
      console.warn('⚠️ [标注管理器] 清理 epub.js 标注存储失败:', e);
    }

    // 清除基于 DOM 的高亮
    const contents = this.rendition.getContents();
    for (const content of contents) {
      const doc = content.document;
      
      // 移除 SVG rect 高亮
      const rects = doc.querySelectorAll('svg .epubjs-hl, .epubjs-hl');
      rects.forEach((rect) => rect.remove());

      // 移除 span 高亮并恢复文本内容
      const spans = doc.querySelectorAll('span.epubjs-hl, span[class*="epub-hl-"]');
      spans.forEach((span) => {
        const text = doc.createTextNode(span.textContent || '');
        span.parentNode?.replaceChild(text, span);
      });

      // 移除自定义高亮样式
      const customHighlights = doc.querySelectorAll('[class*="epub-hl-"]');
      customHighlights.forEach((el) => {
        const text = doc.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(text, el);
      });
    }

    // 重置跟踪状态
    this.appliedAnnotations.clear();
    console.log('✅ [标注管理器] 所有标注已清理完成');
  }

  /**
   * 应用单个标注高亮
   */
  applyHighlight(annotation: Annotation, onClick?: (e: any) => void): boolean {
    if (!this.rendition || !annotation.cfiRange) {
      console.warn('⚠️ [标注管理器] 无法应用标注：缺少必要参数', { 
        hasRendition: !!this.rendition, 
        hasCfi: !!annotation.cfiRange 
      });
      return false;
    }

    // 检查是否已经应用过
    if (this.appliedAnnotations.has(annotation.id)) {
      console.log('⏭️ [标注管理器] 标注已存在，跳过:', annotation.id);
      return true;
    }

    try {
      console.log('🎨 [标注管理器] 应用标注:', annotation.id, 'CFI:', annotation.cfiRange);
      
      // 映射颜色到 CSS 类
      const getColorClass = (bgColor: string): string => {
        const colorMap: { [key: string]: string } = {
          '#ffeb3b': 'epub-hl-yellow',
          '#a5d6a7': 'epub-hl-green', 
          '#90caf9': 'epub-hl-blue',
          '#f48fb1': 'epub-hl-pink',
          '#ffcc80': 'epub-hl-orange',
        };
        return colorMap[bgColor] || 'epub-hl-yellow';
      };

      const className = `epub-hl-${annotation.id}`;

      // 使用 epub.js 标注 API 应用
      this.rendition.annotations.highlight(
        annotation.cfiRange,
        { id: annotation.id },
        onClick || ((e: any) => {}),
        className,
        {
          fill: annotation.color.bgColor,
          'fill-opacity': '0.4',
          'cursor': 'pointer'
        }
      );

      // 跟踪已应用的标注
      this.appliedAnnotations.add(annotation.id);
      console.log('✅ [标注管理器] 标注应用成功:', annotation.id);
      return true;

    } catch (e) {
      console.error('❌ [标注管理器] 应用标注失败:', annotation.id, e);
      return false;
    }
  }

  /**
   * 应用所有标注
   */
  applyAllHighlights(
    annotations: Annotation[], 
    onClick?: (annotation: Annotation) => (e: any) => void
  ): { success: number; failed: number } {
    console.log('📋 [标注管理器] 开始应用所有标注，数量:', annotations.length);
    
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

    console.log('📊 [标注管理器] 应用结果 - 成功:', success, '失败:', failed);
    return { success, failed };
  }

  /**
   * 移除特定的高亮标注
   */
  removeHighlight(annotationId: string): boolean {
    try {
      // 从标注数组中找到对应的标注信息
      // 这里假设外部会维护标注数组，或者通过其他方式获取
      console.log('🗑️ [标注管理器] 尝试删除标注:', annotationId);
      
      // 尝试从 epub.js 标注中移除
      // 注意：这里需要 CFI 范围，但我们在当前上下文中可能没有
      // 实际使用时可能需要外部传入 CFI 信息
      
      // 从跟踪中移除
      this.appliedAnnotations.delete(annotationId);
      
      // 从 DOM 中移除（如果存在）
      const contents = this.rendition.getContents();
      for (const content of contents) {
        const doc = content.document;
        const highlightEl = doc.querySelector(`.epub-hl-${annotationId}`);
        if (highlightEl) {
          const text = doc.createTextNode(highlightEl.textContent || '');
          highlightEl.parentNode?.replaceChild(text, highlightEl);
        }
      }

      console.log('✅ [标注管理器] 标注已删除:', annotationId);
      return true;
    } catch (e) {
      console.error('❌ [标注管理器] 删除标注失败:', annotationId, e);
      return false;
    }
  }

  /**
   * 使用 CFI 范围移除标注
   */
  removeHighlightByCfi(cfiRange: string): boolean {
    try {
      this.rendition.annotations.remove(cfiRange, 'highlight');
      console.log('✅ [标注管理器] 通过 CFI 移除标注:', cfiRange);
      return true;
    } catch (e) {
      console.error('❌ [标注管理器] 通过 CFI 移除标注失败:', cfiRange, e);
      return false;
    }
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
    console.log('🔄 [标注管理器] 重新应用所有标注');
    
    // 先清理所有
    this.clearAllHighlights();
    
    // 然后重新应用
    return this.applyAllHighlights(annotations, onClick);
  }

  /**
   * 销毁管理器并清理资源
   */
  destroy(): void {
    console.log('🗑️ [标注管理器] 销毁管理器');
    this.clearAllHighlights();
    this.appliedAnnotations.clear();
  }
}