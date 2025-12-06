/**
 * 移动端助手相关类型定义
 */

export interface MobileConfig {
  enabled: boolean;
  enableBottomNav: string;
  showBackButton: boolean;
  navJustInMain: boolean;
  noteBookID: string;
  showForwardButton: boolean;
  showDashBoard: boolean;
  showRandomButton: boolean;
  showCustomLinksButton: boolean;
  showDailyNoteButton: boolean;
  showNavigationMenuButton: boolean;
  showContextButton: boolean;
  navBarHeight: string;
  backgroundColor: string;
  buttonColor: string;
  activeButtonColor: string;
  randomSql: string;
  customLinks: string;
}

export interface NavigationButtonConfig {
  key: string;
  icon: string;
  label: string;
  action: () => void;
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface NavigationHistory {
  backStack: string[];
  forwardStack: string[];
  current: string | null;
}

export interface CustomLink {
  title: string;
  url: string;
  type: "siyuan" | "external";
}

export interface MobileHelperAPI {
  navigation: {
    getCurrentDocId(): string | null;
    goToParent(): Promise<void>;
    goToChild(): Promise<void>;
    goToSibling(delta: -1 | 1): Promise<void>;
    goBack(): void;
    goForward(): void;
    goToHome(): void;
    getHistoryInfo(): {
      backCount: number;
      forwardCount: number;
      current: string | null;
    };
  };
  utils: {
    getCurrentDocId(): string | null;
    isMobile: boolean;
    getDeviceInfo(): DeviceInfo;
    vibrate(pattern: number | number[]): void;
    showMobileMessage(
      message: string,
      type?: "info" | "success" | "error"
    ): void;
  };
}

/**
 * 移动端事件类型
 */
export type MobileEventType =
  | "mobile-keyboard-show"
  | "mobile-keyboard-hide"
  | "orientation-change"
  | "visibility-change";

/**
 * 移动端事件数据
 */
export interface MobileEventData {
  type: MobileEventType;
  data?: any;
}

/**
 * 设置项类型
 */
export interface SettingItem {
  type: "checkbox" | "textinput" | "textarea" | "select" | "button" | "number";
  title: string;
  description: string;
  key: string;
  value: any;
  placeholder?: string;
  options?: string[];
}

/**
 * 导航栏主题配置
 */
export interface NavTheme {
  height: string;
  backgroundColor: string;
  buttonColor: string;
  activeButtonColor: string;
  borderColor?: string;
  shadowColor?: string;
}

/**
 * 快速操作类型
 */
export type QuickAction =
  | "back"
  | "forward"
  | "parent"
  | "child"
  | "sibling-prev"
  | "sibling-next"
  | "random"
  | "home"
  | "refresh"
  | "settings";

/**
 * 快速操作配置
 */
export interface QuickActionConfig {
  action: QuickAction;
  enabled: boolean;
  icon: string;
  label: string;
  shortcut?: string;
}
