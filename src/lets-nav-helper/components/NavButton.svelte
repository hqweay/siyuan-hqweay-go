<script lang="ts">
  export let button: {
    key: string;
    icon: string;
    label: string;
    action: (event?: MouseEvent) => void;
    hasSubmenu?: boolean;
  };
  export let deviceType: 'mobile' | 'desktop';
  export let config: any;

  let isPressed = false;

  function handleClick(event: MouseEvent) {
    if (button.hasSubmenu) {
      button.action(event);
    } else {
      button.action();
    }
  }

  function handleTouchStart() {
    isPressed = true;
  }

  function handleTouchEnd() {
    setTimeout(() => {
      isPressed = false;
    }, 150);
  }
</script>

<button
  class="nav-button {deviceType}"
  class:pressed={isPressed}
  style="
    --btn-color: var(--b3-theme-on-surface, inherit);
    --btn-active-color: var(--b3-theme-primary, #007aff);
  "
  on:click={handleClick}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  <span class="icon" class:svg-icon={button.icon && button.icon.startsWith("#icon")}>
    {#if button.icon && button.icon.startsWith("#icon")}
      <svg><use xlink:href={button.icon}></use></svg>
    {:else}
      {button.icon}
    {/if}
  </span>
  <span class="label">{button.label}</span>
</button>

<style>
  .nav-button {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    color: var(--btn-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    font-family: inherit;
    position: relative;
  }

  .nav-button.mobile {
    background: transparent;
    border: none;
    font-size: 18px;
    padding: 6px 12px;
    gap: 2px;
    min-width: 50px;
    min-height: 50px;
    border-radius: 16px;
  }

  .nav-button.desktop {
    background: transparent;
    border: 1px solid var(--b3-border-color, rgba(89, 130, 246, 0.2));
    font-size: 12px;
    padding: 6px 8px;
    gap: 2px;
    min-width: 45px;
    min-height: 38px;
    border-radius: 8px;
  }

  .nav-button:active, .nav-button.pressed {
    transform: scale(0.85);
  }

  .nav-button.mobile:active {
    color: var(--btn-active-color);
    background-color: var(--b3-theme-background-light, rgba(0, 122, 255, 0.1));
  }

  .nav-button.desktop:hover {
    background: var(--b3-theme-background-light, rgba(59, 130, 246, 0.12));
    border-color: var(--btn-active-color);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .icon {
    pointer-events: none;
  }
  
  .nav-button.mobile .icon {
    font-size: 20px;
    margin-bottom: 2px;
  }
  
  .nav-button.desktop .icon {
    font-size: 14px;
    margin-bottom: 0;
  }

  .label {
    pointer-events: none;
    font-size: 10px;
    font-weight: 500;
  }

  .nav-button.desktop .label {
    color: var(--b3-theme-on-surface-light, #6c757d);
  }

  .icon.svg-icon svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
    display: block;
  }
</style>