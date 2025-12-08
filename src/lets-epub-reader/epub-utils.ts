import type { Annotation } from './types';

/**
 * EPUB 工具函数集合
 * 包含标注处理、CFI 操作等通用功能
 */

/**
 * 根据背景颜色获取对应的 CSS 类名
 */
export function getColorClassByBgColor(bgColor: string): string {
  const colorMap: { [key: string]: string } = {
    '#ffeb3b': 'epub-hl-yellow',
    '#a5d6a7': 'epub-hl-green', 
    '#90caf9': 'epub-hl-blue',
    '#f48fb1': 'epub-hl-pink',
    '#ffcc80': 'epub-hl-orange',
  };
  return colorMap[bgColor] || 'epub-hl-yellow';
}

/**
 * 生成标注的 CSS 类名
 */
export function generateAnnotationClassName(annotationId: string, bgColor: string): string {
  const colorClass = getColorClassByBgColor(bgColor);
  return `epub-hl epub-hl-${annotationId} ${colorClass}`;
}

/**
 * 验证 CFI 格式是否有效
 */
export function isValidCfi(cfi: string): boolean {
  if (!cfi || typeof cfi !== 'string') {
    return false;
  }
  
  // 基本格式检查：应该包含 epubcfi() 
  return cfi.includes('epubcfi(') && cfi.includes(')');
}

/**
 * 解析 CFI 字符串，提取基本部分
 */
export function parseCfiString(cfi: string): {
  base: string;
  range: string;
} | null {
  if (!isValidCfi(cfi)) {
    return null;
  }
  
  try {
    // 提取 epubcfi() 内的内容
    const match = cfi.match(/epubcfi\((.*)\)/);
    if (!match || !match[1]) {
      return null;
    }
    
    const content = match[1];
    
    // 分离基址和范围（如果有）
    const parts = content.split(',');
    const base = parts[0];
    const range = parts.length > 1 ? parts.slice(1).join(',') : '';
    
    return { base, range };
  } catch (e) {
    console.warn('解析 CFI 失败:', cfi, e);
    return null;
  }
}

/**
 * 从 CFI 中提取章节 ID
 * 使用 epub.js 官方的 spine item 方式：章节本质上是 spine item（XHTML 文件）
 * @param book - EPUB book 实例
 * @param cfi - CFI 字符串
 * @returns 章节索引或 href，失败返回 null
 */
export function extractChapterIdFromCfi(book: any, cfi: string): string | null {
  if (!cfi || !book) return null;
  
  try {
    // 首先确保 CFI 格式正确
    if (!isValidCfi(cfi)) {
      return null;
    }
    
    // 使用 epub.js 官方的章节定位方式
    // 通过 book.spine.get() 获取对应的 spine item
    const section = book.spine.get(cfi);
    
    if (!section) {
      console.warn('无法从 CFI 获取章节:', cfi);
      return null;
    }
    
    // 返回章节的 index（这是最准确的章节标识符）
    // 如果 index 不可用，回退到 href
    if (typeof section.index === 'number') {
      console.log(`✅ 章节识别成功: CFI=${cfi} -> 章节索引=${section.index}`);
      return `${section.index}`;
    }
    
    // 回退方案：使用 href
    if (section.href) {
      console.log(`✅ 章节识别成功: CFI=${cfi} -> href=${section.href}`);
      return section.href;
    }
    
    console.warn('章节信息不完整:', section);
    return null;
    
  } catch (e) {
    console.warn('从 CFI 提取章节 ID 失败:', cfi, e);
    return null;
  }
}

/**
 * 获取当前章节信息
 * @param book - EPUB book 实例
 * @param cfi - CFI 字符串
 * @returns 章节信息对象，包含 index、href 等信息
 */
export function getCurrentChapterInfo(book: any, cfi: string): { index: number; href: string; section: any } | null {
  if (!cfi || !book) return null;
  
  try {
    // 使用 epub.js 官方的章节定位方式
    const section = book.spine.get(cfi);
    
    if (!section) {
      console.warn('无法从 CFI 获取章节:', cfi);
      return null;
    }
    
    return {
      index: section.index,
      href: section.href,
      section: section
    };
    
  } catch (e) {
    console.warn('获取当前章节信息失败:', cfi, e);
    return null;
  }
}

/**
 * 解析当前章节的 CFI
 * 接收完整的 CFI 并返回当前章节的基础 CFI（不包含范围部分）
 * @param book - EPUB book 实例
 * @param cfi - 完整 CFI 字符串
 * @returns 章节基础 CFI
 */
export function getCurrentChapterCfi(book: any, cfi: string): string | null {
  if (!cfi || !book) return null;
  
  try {
    // 首先确保 CFI 格式正确
    if (!isValidCfi(cfi)) {
      return null;
    }
    
    // 使用 epub.js 官方方式获取章节信息
    const chapterInfo = getCurrentChapterInfo(book, cfi);
    
    if (!chapterInfo) {
      return null;
    }
    
    // 构建章节基础 CFI（只包含到章节的部分，不包含具体位置）
    // 这里我们使用章节的 spine 位置作为基础 CFI
    const baseCfi = `epubcfi(/spine/${chapterInfo.index}!)`;
    
    console.log(`✅ 章节基础 CFI: ${cfi} -> ${baseCfi}`);
    return baseCfi;
    
  } catch (e) {
    console.warn('获取当前章节 CFI 失败:', cfi, e);
    return null;
  }
}

/**
 * 从文本创建选择范围
 */
export function createSelectionRange(
  startElement: Element, 
  startOffset: number, 
  endElement: Element, 
  endOffset: number
): Range {
  const range = document.createRange();
  range.setStart(startElement, startOffset);
  range.setEnd(endElement, endOffset);
  return range;
}

/**
 * 检测元素是否包含文本内容
 */
export function hasTextContent(element: Element): boolean {
  return element.textContent && element.textContent.trim().length > 0;
}

/**
 * 获取元素在文档中的位置信息
 */
export function getElementPosition(element: Element): {
  top: number;
  left: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 防抖函数 - 用于处理频繁触发的事件
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数 - 用于限制函数执行频率
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 深拷贝对象（用于避免引用问题）
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as { [key: string]: any };
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned as T;
  }
  
  return obj;
}

/**
 * 格式化时间戳为可读字符串
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * 生成唯一标识符
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${randomPart}`;
}

/**
 * 检查是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * 获取设备屏幕尺寸
 */
export function getScreenSize(): {
  width: number;
  height: number;
  isMobile: boolean;
} {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: isMobileDevice(),
  };
}