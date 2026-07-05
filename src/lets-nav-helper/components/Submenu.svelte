<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from "svelte";

  export let type: "navigation" | "customLinks" | null = null;
  export let items: any[] = [];
  export let deviceType: "mobile" | "desktop";
  export let triggerButton: HTMLElement | null = null;

  const dispatch = createEventDispatcher();

  let submenuElement: HTMLElement;

  function handleOutsideClick(event: Event) {
    if (submenuElement && !submenuElement.contains(event.target as Node)) {
      dispatch("close");
    }
  }

  function handleItemClick(item: any) {
    if (item.action) {
      item.action();
    }
  }

  onMount(() => {
    // 延迟添加点击监听器以避免立即触发
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleOutsideClick);
  });

  $: position = getPosition();

  function getPosition() {
    // 动态获取子菜单预估宽度
    const submenuWidth = deviceType === 'mobile' ? 200 : 180;

    if (triggerButton) {
      const buttonRect = triggerButton.getBoundingClientRect();
      
      // 基础位置：尝试与触发按钮居中对齐
      let left = buttonRect.left + (buttonRect.width - submenuWidth) / 2;
      
      // 屏幕边界约束 (防止在边缘被截断)
      const padding = 10;
      if (left < padding) {
        left = padding; // 左边缘
      } else if (left + submenuWidth > window.innerWidth - padding) {
        left = window.innerWidth - submenuWidth - padding; // 右边缘
      }

      return {
        position: "fixed",
        bottom: `${window.innerHeight - buttonRect.top + 10}px`,
        left: `${left}px`,
        transform: "translateX(0)",
      };
    } else {
      // 回退到固定居中位置
      return {
        position: "fixed",
        bottom: deviceType === 'mobile' ? "70px" : "80px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
  }
</script>

<div
  bind:this={submenuElement}
  class="submenu {deviceType}"
  style="
    opacity: 0;
    {Object.entries(position)
    .map(([key, value]) => `${key}: ${value};`)
    .join('')}
    background: var(--b3-theme-surface, white);
    border-radius: 12px;
    box-shadow: var(--b3-dialog-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
    z-index: 1001;
    min-width: {deviceType === 'mobile' ? '200px' : '180px'};
    max-width: {deviceType === 'mobile' ? '250px' : '200px'};
    border: 1px solid var(--b3-border-color, rgba(233, 236, 239, 0.2));
  "
  on:introstart={() => {
    // 强制重绘，确保定位准确
    if (submenuElement) {
      submenuElement.style.opacity = "1";
    }
  }}
>
  <div class="submenu-content" style="padding: 10px;">
    {#each items as item, index (index)}
      <button
        class="submenu-item"
        style="
          padding: 12px 15px;
          border-bottom: {index === items.length - 1
          ? 'none'
          : '1px solid var(--b3-border-color, #f0f0f0)'};
          border: none;
          background: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.2s;
          width: 100%;
          text-align: left;
        "
        on:click={() => handleItemClick(item)}
        on:mouseenter={(e) => (e.target.style.backgroundColor = "var(--b3-theme-background-light, #f8f9fa)")}
        on:mouseleave={(e) => (e.target.style.backgroundColor = "transparent")}
        role="menuitem"
      >
        <span style="margin-right: 10px; font-size: 14px; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center;">
          {#if item.icon && item.icon.startsWith("#icon")}
            <svg style="width: 14px; height: 14px; fill: currentColor;"><use xlink:href={item.icon}></use></svg>
          {:else}
            {item.icon ? item.icon : ""}
          {/if}
        </span>
        <span style="flex: 1; color: var(--b3-theme-on-surface, #333); font-size: 13px;">
          {item.title || item.label}
        </span>
        {#if type === "customLinks"}
          <span style="font-size: 12px; color: var(--b3-theme-on-surface-light, #666);">→</span>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .submenu {
    animation: slideDown 0.2s ease-out;
  }

  .submenu-item {
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    outline: none;
  }

  .submenu-item:active {
    transform: scale(0.98);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .submenu:not(.no-animation) {
    animation: slideDown 0.2s ease-out forwards;
  }
</style>
