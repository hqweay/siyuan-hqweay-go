import type { SelectionRect } from './types';

export function getSelectionRect(selection: Selection): SelectionRect {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

export function hasValidSelection(selection: Selection): boolean {
  return selection.rangeCount > 0 && selection.toString().trim().length > 0;
}

export function applyHighlightStyle(range: Range, style: string): void {
  const highlightEl = document.createElement('span');
  highlightEl.style.cssText = style;
  range.surroundContents(highlightEl);
}