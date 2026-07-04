export type TocPosition = 'left' | 'right' | 'hidden';

export interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export interface SelectionRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ReaderProps {
  src?: string | File | ArrayBuffer;
  initialCfi?: string;
  storedKey?: string;
  width?: string;
  height?: string;
  tocPosition?: TocPosition;
  highlightStyle?: string;
  docId?: string;
}

// Highlight color presets
export interface HighlightColor {
  name: string;
  color: string;
  bgColor: string;
}

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'lets-epub-reader.colorYellow', color: '#000', bgColor: '#ffeb3b' },
  { name: 'lets-epub-reader.colorGreen', color: '#000', bgColor: '#a5d6a7' },
  { name: 'lets-epub-reader.colorBlue', color: '#000', bgColor: '#90caf9' },
  { name: 'lets-epub-reader.colorPink', color: '#000', bgColor: '#f48fb1' },
  { name: 'lets-epub-reader.colorOrange', color: '#000', bgColor: '#ffcc80' },
];

// Annotation types
export type AnnotationType = 'highlight' | 'note' | 'underline' | 'mark';

export interface Annotation {
  id: string;
  type: AnnotationType;
  text: string;
  cfiRange: string;
  epubCfi: string;
  color: HighlightColor;
  note?: string;
  blockId?: string; // Siyuan block ID after insertion
  createdAt: number;
  updatedAt: number;
  chapterId?: string; // Chapter identifier for efficient rendering
}

// Sidebar tab types
export type SidebarTab = 'toc' | 'annotations' | 'settings';

// Book binding configuration
export interface BookBinding {
  epubPath: string;
  docId: string;
  title?: string;
}

// Selection info for toolbar
export interface SelectionInfo {
  text: string;
  cfiRange: string;
  range: Range | null;
}

// Toolbar action types
export type ToolbarAction = 'highlight' | 'note' | 'copy' | 'remove';
