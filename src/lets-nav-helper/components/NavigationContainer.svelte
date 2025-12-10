<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { isMobile } from "../utils";
  import NavButton from "./NavButton.svelte";
  import Submenu from "./Submenu.svelte";
  import { navigation } from "../navigation";
  import { settings } from "@/settings";
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

  let navigationElement: HTMLElement;
  let submenuVisible = false;
  let submenuType: "navigation" | "customLinks" | null = null;
  let submenuItems: any[] = [];

  // 导航按钮配置
  const buttonConfigs = [
    {
      key: "showBackButton",
      icon: "←",
      label: "返回",
      show: settings.getBySpace(pluginMetadata.name, "showBackButton"),
      action: () => navigation.goBack(),
    },
    {
      key: "showDailyNoteButton",
      icon: "📅",
      label: "今日",
      show: settings.getBySpace(pluginMetadata.name, "showDailyNoteButton"),
      action: () => createDailyNote(),
    },
    {
      key: "showNavigationMenuButton",
      icon: "🧭",
      label: "导航",
      show: settings.getBySpace(
        pluginMetadata.name,
        "showNavigationMenuButton"
      ),
      action: () => showNavigationSubmenu(),
      hasSubmenu: true,
    },
    {
      key: "showForwardButton",
      icon: "→",
      label: "前进",
      show: settings.getBySpace(pluginMetadata.name, "showForwardButton"),
      action: () => navigation.goForward(),
    },
    {
      key: "showDashBoard",
      icon: "🏠",
      label: "首页",
      show: settings.getBySpace(pluginMetadata.name, "showDashBoard"),
      action: () => navigation.goToHome(),
    },
    {
      key: "showCustomLinksButton",
      icon: "🔗",
      label: "链接",
      show: settings.getBySpace(pluginMetadata.name, "showCustomLinksButton"),
      action: () => showCustomLinksSubmenu(),
      hasSubmenu: true,
    },
  ];

  // 获取配置
  function getConfig() {
    return {
      height:
        settings.getBySpace(pluginMetadata.name, "navBarHeight") || "60px",
      backgroundColor:
        settings.getBySpace(pluginMetadata.name, "backgroundColor") ||
        "#ffffff",
      buttonColor:
        settings.getBySpace(pluginMetadata.name, "buttonColor") || "#333333",
      activeButtonColor:
        settings.getBySpace(pluginMetadata.name, "activeButtonColor") ||
        "#007aff",
      notJustInMain: !settings.getBySpace(pluginMetadata.name, "navJustInMain"),
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
        showMessage("今日笔记已创建并打开");
        mobileUtils.vibrate(50);
      } else {
        showMessage("创建今日笔记失败");
        mobileUtils.vibrate([100, 50, 100]);
      }
    } catch (error) {
      console.error("创建今日笔记失败:", error);
      showMessage("创建今日笔记失败");
      mobileUtils.vibrate([100, 50, 100]);
    }
  }

  // 显示导航子菜单
  function showNavigationSubmenu() {
    submenuType = "navigation";
    submenuItems = [
      {
        icon: "⬆️",
        label: "跳转到父文档",
        action: async () => {
          await navigation.goToParent();
          hideSubmenu();
        },
      },
      {
        icon: "⤴️",
        label: "跳转到上一个文档",
        action: async () => {
          await navigation.goToSibling(-1);
          hideSubmenu();
        },
      },
      {
        icon: "🎲",
        label: "随机",
        action: async () => {
          await goToRandomBlock("SELECT * FROM blocks WHERE type = 'd'");
          hideSubmenu();
        },
      },
      {
        icon: "⤵️",
        label: "跳转到下一个文档",
        action: async () => {
          await navigation.goToSibling(1);
          hideSubmenu();
        },
      },
      {
        icon: "⬇️",
        label: "跳转到子文档",
        action: async () => {
          await navigation.goToChild();
          hideSubmenu();
        },
      },
    ];
    submenuVisible = true;
  }

  // 显示自定义链接子菜单
  function showCustomLinksSubmenu() {
    const linksConfig =
      settings.getBySpace(pluginMetadata.name, "customLinks") || "";
    const links = linksConfig.split("\n").filter((line: string) => line.trim());

    if (links.length === 0) {
      showMessage("暂无自定义链接配置");
      return;
    }

    submenuType = "customLinks";
    submenuItems = links
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const [title, url] = line.split("====");
        if (title && url) {
          return {
            icon: "🔗",
            title: title.trim(),
            url: url.trim(),
            action: async () => {
              if (title.startsWith("💾") || title.includes("数据库")) {
                try {
                  const avHelper = await createSiyuanAVHelper(url);
                  await avHelper.addBlocks([getCurrentDocId()]);
                } catch (error) {
                  console.error("初始化或操作失败:", error);
                }
              } else {
                openByUrl(url);
              }
              hideSubmenu();
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
    bind:this={navigationElement}
    class="navigation-container {deviceType}"
    style="
      position: {deviceType === 'mobile' ? 'fixed' : 'fixed'};
      {deviceType === 'mobile'
      ? `
        bottom: 0;
        left: 0;
        right: 0;
        height: ${getConfig().height};
      `
      : `
        bottom: 30px;
        right: calc(50% - 200px);
        width: 280px;
        height: 50px;
      `}
      background-color: {getConfig().backgroundColor};
      z-index: {getConfig().notJustInMain ? 0 : 9999};
      display: flex;
      align-items: center;
      justify-content: space-around;
      {deviceType === 'mobile' ? 'padding: 0 10px;' : 'padding: 4px 3px;'}
      {deviceType === 'mobile'
      ? 'box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);'
      : `
        background: rgba(248, 249, 250, 0.95);
        border-radius: 6px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(233, 236, 239, 0.8);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `}
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
    "
  >
    {#each visibleButtons as button (button.key)}
      <NavButton {button} {deviceType} config={getConfig()} />
    {/each}
  </div>

  {#if submenuVisible}
    <Submenu
      type={submenuType}
      items={submenuItems}
      {deviceType}
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
  }

  .navigation-container.desktop:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  /* 键盘弹出时的样式调整 */
  @media (max-height: 500px) {
    .navigation-container.mobile {
      transform: translateY(100%);
    }
  }
</style>
