import { settings } from "@/settings";

import MobileNavBar from "./MobileNavBar.svelte"; // Import the Svelte component
import { isMobile } from "@/utils";

export default class MobileHelper {
  constructor() {
    this.navComponent = null;
    this.forwardStack = [];
    this.isNavigating = false;
  }

  onload() {
    if (isMobile && settings.getFlag("mobileHelper") && !this.navComponent) {
      this.createBottomNavigation();
    }
  }

  onunload() {
    if (this.navComponent) {
      this.navComponent.$destroy();
      this.navComponent = null;
    }
  }

  // @ts-ignore
  mobilekeyboardshowEvent({ detail }) {
    if (this.navComponent) {
      this.navComponent.$set({ visible: false });
    }
  }
  // @ts-ignore
  mobilekeyboardhideEvent({ detail }) {
    if (this.navComponent) {
      this.navComponent.$set({ visible: true });
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
    const target = document.createElement("div");
    target.id = "siyuan-mobile-nav-container";
    document.body.appendChild(target);

    // Initialize the Svelte component
    this.navComponent = new MobileNavBar({
      target,
      props: {
        visible: true,
        config: {
          ...config,
          // Add any additional props if needed
        },
      },
    });

    this.adjustBodyPadding();
  }

  adjustBodyPadding() {
    const config = settings.get("mobileHelperConfig");
    const navHeight = parseInt(config.navBarHeight);
    document.body.style.paddingBottom = `${navHeight + 10}px`;
  }
}
