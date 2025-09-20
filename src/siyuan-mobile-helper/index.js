import { settings } from "@/settings";
import { openMobileFileById, showMessage } from "siyuan";
import { plugin } from "@/utils";
import MobileNavBar from "./MobileNavBar.svelte"; // Import the Svelte component

export default class MobileHelper {
  constructor() {
    this.navComponent = null;
    this.isMobile = false;
    this.forwardStack = [];
    this.isNavigating = false;
  }

  onload() {
    this.isMobile = this.detectMobile();
    if (this.isMobile && settings.getFlag("mobileHelper")) {
      this.createBottomNavigation();
    }

    this.configChangeHandler = () => {
      this.recreate();
    };

    this.resizeHandler = () => {
      const wasMobile = this.isMobile;
      this.isMobile = this.detectMobile();

      if (wasMobile !== this.isMobile) {
        this.recreate();
      }
    };

    window.addEventListener("resize", this.resizeHandler);
  }

  onunload() {
    if (this.navComponent) {
      this.navComponent.$destroy();
      this.navComponent = null;
    }

    if (this.resizeHandler) {
      window.removeEventListener("resize", this.resizeHandler);
    }
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      document.documentElement.clientWidth <= 768
    );
  }

  createBottomNavigation() {
    if (this.navComponent) {
      this.navComponent.$destroy();
    }

    const config = settings.get("mobileHelperConfig");
    if (!config.enableBottomNav) return;

    // Create a target element for the Svelte component
    const target = document.createElement('div');
    target.id = 'siyuan-mobile-nav-container';
    document.body.appendChild(target);

    // Initialize the Svelte component
    this.navComponent = new MobileNavBar({
      target,
      props: {
        config: {
          ...config,
          // Add any additional props if needed
        }
      }
    });

    this.adjustBodyPadding();
  }

  adjustBodyPadding() {
    const config = settings.get("mobileHelperConfig");
    const navHeight = parseInt(config.navBarHeight);
    document.body.style.paddingBottom = `${navHeight + 10}px`;
  }

  recreate() {
    this.onunload();
    if (this.isMobile && settings.getFlag("mobileHelper")) {
      this.createBottomNavigation();
    }
  }
}