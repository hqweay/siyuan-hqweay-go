<script lang="ts">
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-nav-helper");
  import { onMount, onDestroy } from "svelte";
  import { isMobile } from "../utils";
  import NavButton from "./NavButton.svelte";
  import Submenu from "./Submenu.svelte";
  import ToggleButton from "./ToggleButton.svelte";
  import { navigation } from "../navigation";
  import { settings } from "@/settings";
  import { plugin } from "@/utils";
  import pluginMetadata from "../plugin";
  import { mobileUtils } from "../utils";
  import { createDailynote } from "@frostime/siyuan-plugin-kits";
  import { showMessage } from "siyuan";
  import { createSiyuanAVHelper } from "@/myscripts/dbUtil";
  import { goToRandomBlock } from "@/myscripts/randomDocCache";
  import {
    getCurrentDocId,
    openBlockByID,
    openByUrl,
  } from "@/myscripts/syUtils";

  export let deviceType: "mobile" | "desktop" = "mobile";
  export let isVisible: boolean = true;

  let submenuVisible = false;
  let submenuType: "navigation" | "customLinks" | null = null;
  let submenuItems: any[] = [];
  let submenuTriggerButton: HTMLElement | null = null;

  // Collapse/expand state management - only enable on desktop
  let isCollapsed = deviceType === "mobile" ? false : false;

  // 导航按钮配置
  const buttonConfigs = [
    {
      key: "showBackButton",
      icon: "←",
      label: plugin.i18n["lets-nav-helper.back"],
      show: settings.getBySpace(pluginMetadata.name, "showBackButton"),
      action: () => navigation.goBack(),
    },
    {
      key: "showDailyNoteButton",
      icon: "📅",
      label: plugin.i18n["lets-nav-helper.dailyNote"],
      show: settings.getBySpace(pluginMetadata.name, "showDailyNoteButton"),
      action: () => createDailyNote(),
    },
    {
      key: "showNavigationMenuButton",
      icon: "🧭",
      label: plugin.i18n["lets-nav-helper.navigation"],
      show: settings.getBySpace(
        pluginMetadata.name,
        "showNavigationMenuButton"
      ),
      action: (event) => showNavigationSubmenu(event),
      hasSubmenu: true,
    },
    {
      key: "showForwardButton",
      icon: "→",
      label: plugin.i18n["lets-nav-helper.forward"],
      show: settings.getBySpace(pluginMetadata.name, "showForwardButton"),
      action: () => navigation.goForward(),
    },
    {
      key: "showDashBoard",
      icon: "🏠",
      label: plugin.i18n["lets-nav-helper.home"],
      show: settings.getBySpace(pluginMetadata.name, "showDashBoard"),
      action: () => navigation.goToHome(),
    },
    {
      key: "showCustomLinksButton",
      icon: "🔗",
      label: plugin.i18n["lets-nav-helper.links"],
      show: settings.getBySpace(pluginMetadata.name, "showCustomLinksButton"),
      action: (event) => showCustomLinksSubmenu(event),
      hasSubmenu: true,
    },
  ];

  // 获取配置
  function getConfig() {
    return {
      height:
        settings.getBySpace(pluginMetadata.name, "navBarHeight") || "60px",
      backgroundColor:
        settings.getBySpace(pluginMetadata.name, "backgroundColor") || "",
      buttonColor:
        settings.getBySpace(pluginMetadata.name, "buttonColor") || "",
      activeButtonColor:
        settings.getBySpace(pluginMetadata.name, "activeButtonColor") || "",
      navJustInMain: settings.getBySpace(pluginMetadata.name, "navJustInMain"),
    };
  }

  // 创建今日笔记
  async function createDailyNote() {
    try {
      const noteBookID = settings.getBySpace(pluginMetadata.name, "noteBookID");
      const today = new Date();
      const dailyNoteId = await createDailynote(
        noteBookID || "20210926105749-l6jquz7",
        today
      );

      if (dailyNoteId) {
        openBlockByID(dailyNoteId);
        showMessage(plugin.i18n["lets-nav-helper.dailyNoteCreated"]);
        mobileUtils.vibrate(50);
      } else {
        showMessage(plugin.i18n["lets-nav-helper.dailyNoteFailed"]);
        mobileUtils.vibrate([100, 50, 100]);
      }
    } catch (error) {
      log.error("创建今日笔记失败:", error);
      showMessage(plugin.i18n["lets-nav-helper.dailyNoteFailed"]);
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  // 显示导航子菜单
  function showNavigationSubmenu(event: MouseEvent) {
    submenuType = "navigation";
    submenuTriggerButton = event.currentTarget as HTMLElement;
    submenuItems = [
      {
        icon: "⬆️",
        label: plugin.i18n["lets-nav-helper.jumpToParent"],
        action: async () => {
          await navigation.goToParent();
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
            hideSubmenu();
          }
        },
      },
      {
        icon: "⤴️",
        label: plugin.i18n["lets-nav-helper.jumpToPrevSibling"],
        action: async () => {
          await navigation.goToSibling(-1);
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
            hideSubmenu();
          }
        },
      },
      {
        icon: "🎲",
        label: plugin.i18n["lets-nav-helper.random"],
        action: async () => {
          await goToRandomBlock("SELECT id FROM blocks WHERE type = 'd'");
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
            hideSubmenu();
          }
        },
      },
      {
        icon: "⤵️",
        label: plugin.i18n["lets-nav-helper.jumpToNextSibling"],
        action: async () => {
          await navigation.goToSibling(1);
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
            hideSubmenu();
          }
        },
      },
      {
        icon: "⬇️",
        label: plugin.i18n["lets-nav-helper.jumpToChild"],
        action: async () => {
          await navigation.goToChild();
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
            hideSubmenu();
          }
        },
      },
    ];
    submenuVisible = true;
  }

  // 显示自定义链接子菜单
  function showCustomLinksSubmenu(event: MouseEvent) {
    submenuTriggerButton = event.currentTarget as HTMLElement;
    const linksConfig =
      settings.getBySpace(pluginMetadata.name, "customLinks") || "";
    const links = linksConfig.split("\n").filter((line: string) => line.trim());

    if (links.length === 0) {
      showMessage(plugin.i18n["lets-nav-helper.noCustomLinks"]);
      return;
    }

    submenuType = "customLinks";
    submenuItems = links
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const [title, url, icon] = line.split("====");
        if (title && url) {
          return {
            icon: icon ? icon : "🔗",
            title: title.trim(),
            url: url.trim(),
            action: async () => {
              if (icon == "💾" || title.includes("添加到")) {
                try {
                  const avHelper = await createSiyuanAVHelper(url);
                  await avHelper.addBlocks([getCurrentDocId()]);
                } catch (error) {
                  log.error("初始化或操作失败:", error);
                }
              } else {
                openByUrl(url);
              }
              if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) {
                hideSubmenu();
              }
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    submenuVisible = true;
  }

  // 隐藏子菜单
  function hideSubmenu() {
    submenuVisible = false;
    submenuType = null;
    submenuItems = [];
    submenuTriggerButton = null;
  }

  // Toggle collapse/expand state
  function toggleCollapse() {
    if (deviceType === "desktop") {
      isCollapsed = !isCollapsed;
    }
  }

  // 过滤显示的按钮
  $: visibleButtons = buttonConfigs.filter((btn) => {
    if (isMobile && btn.show === "mobile") return true;
    if (!isMobile && btn.show === "pc") return true;
    if (btn.show === "both") return true;
    return false;
  });

  // 响应式调整
  function handleResize() {
    if (deviceType === "desktop") {
      const screenWidth = window.innerWidth;
      if (screenWidth < 768) {
        isVisible = false;
      } else {
        isVisible = true;
      }
    }
  }

  onMount(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
  });

  onDestroy(() => {
    window.removeEventListener("resize", handleResize);
  });
</script>

{#if isVisible}
  <div
    class="navigation-container {deviceType}"
    class:collapsed={isCollapsed}
    style="
      --nav-height: {getConfig().height};
      --nav-bg: {getConfig().backgroundColor || 'var(--b3-theme-surface, rgba(248, 249, 250, 0.95))'};
      --nav-zindex: {getConfig().navJustInMain ? 0 : 9999};
    "
  >
    {#if deviceType === "desktop" && !isCollapsed}
      {#each visibleButtons as button (button.key)}
        <NavButton {button} {deviceType} config={getConfig()} />
      {/each}
    {/if}

    {#if deviceType === "mobile"}
      {#each visibleButtons as button (button.key)}
        <NavButton {button} {deviceType} config={getConfig()} />
      {/each}
    {/if}

    <!-- Toggle button for desktop -->
    {#if deviceType === "desktop"}
      <ToggleButton {isCollapsed} {deviceType} on:toggle={toggleCollapse} />
    {/if}
  </div>

  {#if submenuVisible}
    <Submenu
      type={submenuType}
      items={submenuItems}
      {deviceType}
      triggerButton={submenuTriggerButton}
      on:close={hideSubmenu}
    />
  {/if}
{/if}

<style>
  .navigation-container.mobile {
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .navigation-container.mobile button {
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  .navigation-container.mobile button:active {
    transform: scale(0.95);
  }

  .navigation-container {
    touch-action: manipulation;
    position: fixed;
    z-index: var(--nav-zindex);
    display: flex;
    align-items: center;
    background-color: var(--nav-bg);
    font-family: var(--b3-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif);
  }

  .navigation-container.mobile {
    bottom: 0;
    left: 0;
    right: 0;
    height: var(--nav-height);
    width: 100%;
    justify-content: space-around;
  }

  .navigation-container.desktop {
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    height: 50px;
    justify-content: space-around;
    border-radius: 6px;
    box-shadow: var(--b3-dialog-shadow, 0 4px 16px rgba(0, 0, 0, 0.1));
    backdrop-filter: blur(10px);
    border: 1px solid var(--b3-border-color, rgba(233, 236, 239, 0.2));
  }

  .navigation-container.desktop.collapsed {
    left: auto;
    right: 20px;
    transform: none;
    width: 50px;
    justify-content: center;
  }

  .navigation-container.desktop:hover:not(.collapsed) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .navigation-container.desktop.collapsed:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  /* 键盘弹出时的样式调整 */
  @media (max-height: 500px) {
    .navigation-container.mobile {
      transform: translateY(100%);
    }
  }

  /* Smooth transition for collapse/expand */
  .navigation-container.desktop {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, width, left, right, box-shadow;
  }

  .navigation-container.desktop.collapsed {
    will-change: transform, width, left, right, box-shadow;
  }
</style>
