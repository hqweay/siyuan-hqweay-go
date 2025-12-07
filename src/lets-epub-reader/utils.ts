import type { SelectionRect } from './types';

/**
 * Get the bounding rectangle of a selection relative to a container
 */
export function getSelectionRect(selection: Selection, container?: HTMLElement): SelectionRect {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // If container is provided, calculate relative position
  if (container) {
    const containerRect = container.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  }
  
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

/**
 * Check if a selection has valid text content
 */
export function hasValidSelection(selection: Selection | null): boolean {
  if (!selection) return false;
  return selection.rangeCount > 0 && selection.toString().trim().length > 0;
}

/**
 * Apply highlight style to a range by wrapping it in a span
 */
export function applyHighlightStyle(range: Range, style: string): void {
  const highlightEl = document.createElement('span');
  highlightEl.style.cssText = style;
  highlightEl.className = 'epub-highlight';
  try {
    range.surroundContents(highlightEl);
  } catch (e) {
    // If surroundContents fails (e.g., selection spans multiple elements),
    // use a different approach
    console.warn('Failed to apply highlight with surroundContents, using alternative method');
    const fragment = range.extractContents();
    highlightEl.appendChild(fragment);
    range.insertNode(highlightEl);
  }
}

/**
 * Get CFI (Canonical Fragment Identifier) from a selection in epub.js
 */
export function getCfiFromSelection(book: any, content: any, selection: Selection): string {
  if (!book || !content || !selection || selection.rangeCount === 0) {
    return '';
  }
  
  try {
    const range = selection.getRangeAt(0);
    
    // Method 1: Use content's cfiFromRange method
    if (content.cfiFromRange && typeof content.cfiFromRange === 'function') {
      const cfi = content.cfiFromRange(range);
      if (cfi) {
        return cfi;
      }
    }
    
    // Method 2: Try using content's epubcfi method
    if (content.epubcfi && typeof content.epubcfi === 'function') {
      const cfi = content.epubcfi(range);
      if (cfi) {
        return cfi;
      }
    }
    
    // Method 3: Try generating CFI from the range directly
    if (book.locations && book.locations.cfiFromRange) {
      const cfi = book.locations.cfiFromRange(range);
      if (cfi) {
        return cfi;
      }
    }
    
    // Method 4: Use the book's CFI generator
    if (book.cfiFromRange) {
      const cfi = book.cfiFromRange(range);
      if (cfi) {
        return cfi;
      }
    }
    
    console.warn('All CFI generation methods failed');
    return '';
  } catch (e) {
    console.warn('Failed to get CFI from selection:', e);
    return '';
  }
}

/**
 * Parse location information from a URL
 * Format: assets/book.epub#cfi#blockId#bgColor
 */
export function parseLocationFromUrl(url: string): { epubPath: string; cfiRange?: string; blockId?: string; bgColor?: string } | null {
  if (!url) return null;

  try {
    const parts = url.split('#');
    const epubPath = parts[0];

    // Check if it ends with .epub or contains assets/ path
    if (!epubPath.endsWith('.epub') && !epubPath.includes('assets/')) {
      return null;
    }

    let cfiRange: string | undefined;
    let blockId: string | undefined;
    let bgColor: string | undefined;

    if (parts.length > 1) {
      // Decode and check if it's a CFI
      const cfiPart = decodeURIComponent(parts[1]);
      // CFI typically starts with '/' or contains epubcfi
      if (cfiPart.startsWith('/') || cfiPart.includes('!') || cfiPart.startsWith('epubcfi(')) {
        cfiRange = cfiPart;
        console.log('Parsed CFI from URL:', cfiRange);
      }
    }

    if (parts.length > 2) {
      blockId = parts[2];
      console.log('Parsed block ID from URL:', blockId);
    }

    if (parts.length > 3) {
      bgColor = decodeURIComponent(parts[3]);
      console.log('Parsed bgColor from URL:', bgColor);
    }

    console.log('Parsed location:', { epubPath, cfiRange, blockId, bgColor });
    return { epubPath, cfiRange, blockId, bgColor };
  } catch (e) {
    console.warn('Failed to parse location from URL:', e);
    return null;
  }
}

/**
 * Build a URL with location information
 */
export function buildLocationUrl(epubPath: string, cfiRange?: string, blockId?: string, bgColor?: string): string {
  let url = epubPath;

  if (cfiRange) {
    url += '#' + encodeURIComponent(cfiRange);
  }

  if (blockId) {
    url += '#' + blockId;
  }

  if (bgColor) {
    url += '#' + encodeURIComponent(bgColor);
  }

  return url;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
