import type { Annotation, HighlightColor } from '../types';

/**
 * 标注处理器集合
 * 处理标注相关的各种操作
 */

/**
 * 创建标注点击处理器
 */
export function createAnnotationClickHandler(
  annotation: Annotation,
  setColorPicker: (annotation: Annotation, rect: any) => void,
  setShowColorPicker: (show: boolean) => void,
  setSelectionToolbarVisible: (show: boolean) => void,
  setShowRemoveButton: (show: boolean) => void,
  setSelectedAnnotation: (annotation: Annotation | null) => void
) {
  return (e: MouseEvent) => {
    console.log("📍 [点击标注] 处理点击事件", {
      annotationId: annotation.id,
      annotationText: annotation.text,
      annotationColor: annotation.color,
      hasBlockId: !!annotation.blockId,
    });

    setColorPicker(annotation, (e.target as HTMLElement).getBoundingClientRect());
    setShowColorPicker(true);
    setSelectionToolbarVisible(false);
    setShowRemoveButton(false);
    setSelectedAnnotation(null);
  };
}

/**
 * 创建标注颜色更改处理器
 */
export function createColorChangeHandler(
  updateAnnotation: (annotation: Annotation, color: HighlightColor) => Promise<void>,
  reapplyHighlights: () => void
) {
  return async (event: CustomEvent<{ color: HighlightColor }>) => {
    const { color } = event.detail;
    console.log("🎨 [颜色更改] 开始处理颜色更改", color);
    
    // 更新标注颜色
    await updateAnnotation(undefined as any, color);
    
    // 重新应用高亮
    setTimeout(reapplyHighlights, 100);
  };
}

/**
 * 创建删除标注处理器
 */
export function createRemoveHandler(
  removeAnnotation: (blockId: string) => Promise<boolean>,
  annotationManager: any,
  setSelectionToolbarVisible: (show: boolean) => void,
  setSelectedAnnotation: (annotation: Annotation | null) => void,
  setShowRemoveButton: (show: boolean) => void
) {
  return async (selectedAnnotation: Annotation) => {
    if (!selectedAnnotation.blockId) {
      console.warn("❌ [删除标注] 缺少 blockId");
      return;
    }

    const success = await removeAnnotation(selectedAnnotation.blockId);
    if (success) {
      // 移除高亮
      if (annotationManager) {
        annotationManager.removeHighlightByCfi(selectedAnnotation.cfiRange);
      }
    }

    setSelectionToolbarVisible(false);
    setSelectedAnnotation(null);
    setShowRemoveButton(false);
  };
}

/**
 * 创建标注创建处理器
 */
export function createAnnotationCreator(
  type: 'highlight' | 'note',
  generateId: () => string,
  getCurrentSelection: () => { text: string; cfiRange: string; range: Range | null } | null,
  getBoundDocId: () => string,
  getEpubPath: () => string,
  applyHighlight: (annotation: Annotation) => boolean,
  insertAnnotation: (annotation: Annotation, epubPath: string, docId: string) => Promise<string | null>,
  reapplyHighlights: () => void,
  openFloatLayer?: (blockId: string) => void,
  clearSelection?: () => void
) {
  return async (event: CustomEvent<{ color: HighlightColor }>) => {
    const selection = getCurrentSelection();
    const boundDocId = getBoundDocId();
    
    if (!selection || !boundDocId) {
      console.warn("⚠️ [创建标注] 缺少选择内容或未绑定文档");
      return;
    }

    const { color } = event.detail;
    const annotation: Annotation = {
      id: generateId(),
      type,
      text: selection.text,
      cfiRange: selection.cfiRange,
      epubCfi: selection.cfiRange,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 应用高亮
    const success = applyHighlight(annotation);
    if (!success) {
      console.warn("⚠️ [创建标注] 应用高亮失败:", annotation.id);
    }

    // 插入到文档
    const epubPath = getEpubPath();
    const blockId = await insertAnnotation(annotation, epubPath, boundDocId);
    
    if (blockId) {
      annotation.blockId = blockId;
      console.log(`✅ [创建标注] ${type === 'highlight' ? '标注' : '笔记'}已保存:`, annotation.id);

      // 重新应用所有高亮以确保一致性
      setTimeout(reapplyHighlights, 100);

      // 如果是笔记，打开浮动层
      if (type === 'note' && openFloatLayer) {
        setTimeout(() => openFloatLayer(blockId), 300);
      }
    }

    if (clearSelection) {
      clearSelection();
    }
  };
}