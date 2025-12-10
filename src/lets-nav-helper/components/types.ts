/**
 * Svelte组件相关类型定义
 */

export interface NavigationButton {
  key: string;
  icon: string;
  label: string;
  action: () => void;
  hasSubmenu?: boolean;
  show?: string;
}

export interface SubmenuItem {
  icon: string;
  title?: string;
  label?: string;
  url?: string;
  action: () => void | Promise<void>;
}

export interface ComponentConfig {
  height: string;
  backgroundColor: string;
  buttonColor: string;
  activeButtonColor: string;
  notJustInMain: boolean;
}

export interface NavigationContainerProps {
  deviceType: 'mobile' | 'desktop';
  isVisible: boolean;
}

export interface NavButtonProps {
  button: NavigationButton;
  deviceType: 'mobile' | 'desktop';
  config: {
    buttonColor: string;
    activeButtonColor: string;
  };
}

export interface SubmenuProps {
  type: 'navigation' | 'customLinks' | null;
  items: SubmenuItem[];
  deviceType: 'mobile' | 'desktop';
}