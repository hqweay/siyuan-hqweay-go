<script lang="ts">
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-nav-helper");
  import { onMount, onDestroy } from "svelte";
  import { isMobile } from "../utils";
  import NavButton from "./NavButton.svelte";
  import Submenu from "./Submenu.svelte";
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



  // 滚动隐藏逻辑
  let isScrollingDown = false;
  let lastScrollTop = 0;

  function handleScroll(event: Event) {
    if (deviceType !== "mobile") return;
    
    const target = event.target as HTMLElement;
    // 仅响应编辑器主滚动容器，过滤掉侧边栏、弹出面板等其他元素的滚动
    if (!target || typeof target.className !== "string" || !target.classList.contains("protyle-scroll")) return;
    if (target.scrollTop === undefined) return;
    
    const currentScrollTop = target.scrollTop;
    // 设置一个防抖阈值，避免太敏感
    if (Math.abs(currentScrollTop - lastScrollTop) < 10) return;

    if (currentScrollTop > lastScrollTop) {
      isScrollingDown = true;
    } else {
      isScrollingDown = false;
    }
    
    lastScrollTop = currentScrollTop;
  }

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
    const links = settings.getBySpace(pluginMetadata.name, "customLinks") || [];

    if (!Array.isArray(links) || links.length === 0) {
      showMessage(plugin.i18n["lets-nav-helper.noCustomLinks"]);
      return;
    }

    submenuType = "customLinks";
    submenuItems = links
      .map((item: any) => {
        const { title, url, icon } = item;
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

  // 显示 PC 专属悬浮球菜单
  function showDesktopMenu(event: MouseEvent) {
    submenuType = "navigation"; // 复用基本样式
    submenuTriggerButton = event.currentTarget as HTMLElement;
    submenuItems = [];

    // 随机漫游
    if (settings.getBySpace(pluginMetadata.name, "showRandomButton")) {
      submenuItems.push({
        icon: "🎲",
        label: plugin.i18n["lets-nav-helper.random"],
        action: async () => {
          let sql = settings.getBySpace(pluginMetadata.name, "randomSql") || "SELECT id FROM blocks WHERE type = 'd'";
          await goToRandomBlock(sql);
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) hideSubmenu();
        }
      });
    }

    // 今日笔记
    if (settings.getBySpace(pluginMetadata.name, "showDailyNoteButton")) {
      submenuItems.push({
        icon: "📅",
        label: plugin.i18n["lets-nav-helper.dailyNote"],
        action: async () => {
          await createDailyNote();
          if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) hideSubmenu();
        }
      });
    }

    // 上下级导航
    if (settings.getBySpace(pluginMetadata.name, "showContextButton")) {
      submenuItems.push(
        {
          icon: "⬆️",
          label: plugin.i18n["lets-nav-helper.jumpToParent"],
          action: async () => {
            await navigation.goToParent();
            if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) hideSubmenu();
          }
        },
        {
          icon: "⬇️",
          label: plugin.i18n["lets-nav-helper.jumpToChild"],
          action: async () => {
            await navigation.goToChild();
            if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) hideSubmenu();
          }
        }
      );
    }

    // 自定义链接
    if (settings.getBySpace(pluginMetadata.name, "showCustomLinksButton")) {
      const links = settings.getBySpace(pluginMetadata.name, "customLinks") || [];
      if (Array.isArray(links)) {
        links.forEach((item: any) => {
          const { title, url, icon } = item;
          if (title && url) {
          submenuItems.push({
            icon: icon ? icon : "🔗",
            label: title.trim(),
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
              if (settings.getBySpace(pluginMetadata.name, "hideSubmenu")) hideSubmenu();
            }
          });
        }
      });
      }
    }

    submenuVisible = true;
  }

  // 隐藏子菜单
  function hideSubmenu() {
    submenuVisible = false;
    submenuType = null;
    submenuItems = [];
    submenuTriggerButton = null;
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
    window.addEventListener("scroll", handleScroll, true); // 使用 capture 捕获内部滚动
    handleResize();
  });

  onDestroy(() => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll, true);
  });
</script>

{#if isVisible}
  <div
    class="navigation-container {deviceType}"
    class:scrolling-down={isScrollingDown}
    style="
      --nav-height: {getConfig().height};
      --nav-bg: {getConfig().backgroundColor || 'var(--b3-theme-surface, rgba(248, 249, 250, 0.95))'};
      --nav-zindex: {getConfig().navJustInMain ? 0 : 9999};
    "
  >
    {#if deviceType === "desktop"}
      <button class="fab-button" on:click={showDesktopMenu}>
        🧭
      </button>
    {/if}

    {#if deviceType === "mobile"}
      {#each visibleButtons as button (button.key)}
        <NavButton {button} {deviceType} config={getConfig()} />
      {/each}
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
    bottom: env(safe-area-inset-bottom, 16px);
    left: 16px;
    right: 16px;
    height: var(--nav-height);
    width: auto;
    justify-content: space-around;
    border-radius: 999px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
  }

  .navigation-container.mobile.scrolling-down {
    transform: translateY(150%);
    opacity: 0.5;
    pointer-events: none;
  }

  .navigation-container.desktop {
    bottom: 30px;
    right: 30px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(20px);
    border: 1px solid var(--b3-border-color, rgba(233, 236, 239, 0.2));
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }

  .navigation-container.desktop:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
  
  .navigation-container.desktop:active {
    transform: translateY(0) scale(0.95);
  }

  .fab-button {
    background: transparent;
    border: none;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    outline: none;
    cursor: pointer;
  }

  /* 键盘弹出时的样式调整 */
  @media (max-height: 500px) {
    .navigation-container.mobile {
      transform: translateY(100%);
    }
  }
</style>
