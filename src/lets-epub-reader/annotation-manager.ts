import type { Annotation, AnnotationType } from './types';

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

    try {
      // 如果标注已存在，先移除再重新应用
      if (this.appliedAnnotations.has(annotation.id)) {
        console.log('🔄 [标注管理器] 标注已存在，重新应用:', annotation.id);
        this.removeHighlight(annotation);
      }

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

      const className = `epub-anno-${annotation.id}`;
      const annotationType = annotation.type === 'note' ? 'highlight' : annotation.type;

      // 使用 epub.js 通用标注 API
      this.rendition.annotations.add(
        annotationType,
        annotation.cfiRange,
        {
          id: annotation.id,
          color: annotation.color.bgColor,
          type: annotationType
        },
        onClick || ((e: any) => {}),
        className,
        {
          fill: annotation.color.bgColor,
          'fill-opacity': annotationType === 'mark' ? '0.6' : '0.4',
          'cursor': 'pointer',
          ...(annotationType === 'underline' ? {
            'border-bottom': `2px solid ${annotation.color.bgColor}`,
            'padding-bottom': '1px'
          } : {}),
          ...(annotationType === 'mark' ? {
            'background-color': annotation.color.bgColor,
            'color': '#000'
          } : {})
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
  removeHighlight(annotation: Annotation): boolean {
    try {
      console.log('🗑️ [标注管理器] 尝试删除标注:', annotation.id);
      
      // 使用 epub.js API 移除标注
      const annotationType = annotation.type === 'note' ? 'highlight' : annotation.type;
      this.rendition.annotations.remove(annotation.cfiRange, annotationType);
      
      // 从跟踪中移除
      this.appliedAnnotations.delete(annotation.id);

      console.log('✅ [标注管理器] 标注已删除:', annotation.id);
      return true;
    } catch (e) {
      console.error('❌ [标注管理器] 删除标注失败:', annotation.id, e);
      return false;
    }
  }

  /**
   * 使用 CFI 范围移除标注
   */
  removeHighlightByCfi(cfiRange: string): boolean {
    const types: AnnotationType[] = ['highlight', 'underline', 'mark'];
    let success = false;
    
    for (const type of types) {
      try {
        this.rendition.annotations.remove(cfiRange, type);
        console.log(`✅ [标注管理器] 通过 CFI 移除标注 (${type}):`, cfiRange);
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
