import { Constants, TProtyleAction } from "siyuan";
import { isStrBlank } from "./string-util";

// 用于生成随机字符串
function randStr(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function NewNodeID(): string {

  const now = new Date();
  const formattedDate = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14); // 格式化为 "YYYYMMDDHHMMSS"
  return `${formattedDate}-${randStr(7)}`;
}

export function getQueryStrByBlock(block: DefBlock | Block) {
  if (!block) {
    return "";
  }
  let markdown = block.markdown;
  if (isStrBlank(markdown)) {
    markdown = block.content;
  }
  return markdown + " " + block.name + " " + block.alias + " " + block.memo + " " + block.tag;

}

export function getOpenTabActionByZoomIn(zoomIn: boolean): TProtyleAction[] {
  let actions: TProtyleAction[] = zoomIn
    ? [
      Constants.CB_GET_HL,
      Constants.CB_GET_FOCUS,
      Constants.CB_GET_ALL,
    ]
    : [
      Constants.CB_GET_HL,
      // Constants.CB_GET_FOCUS,
      Constants.CB_GET_CONTEXT,
      Constants.CB_GET_ROOTSCROLL,
    ];
  return actions;
}
