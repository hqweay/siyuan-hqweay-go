type TSettingItemType =
  | "checkbox"
  | "select"
  | "textinput"
  | "textarea"
  | "number"
  | "slider"
  | "button"
  | "hint"
  | "list";
interface ISettingItem {
  key: string;
  value: any;
  type: TSettingItemType;
  title: string;
  description?: string;
  placeholder?: string;
  height?: string;
  slider?: {
    min: number;
    max: number;
    step: number;
  };
  options?: { [key: string | number]: string };
  columns?: Array<{
    key: string;
    title: string;
    type: "text" | "number" | "select";
    width?: string;
    options?: Record<string, string>;
  }>;
  button?: {
    label: string;
    callback: () => void;
  };
}
