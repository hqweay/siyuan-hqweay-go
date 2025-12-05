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