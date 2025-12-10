<script lang="ts">
  export let button: {
    key: string;
    icon: string;
    label: string;
    action: (event?: MouseEvent) => void;
    hasSubmenu?: boolean;
  };
  export let deviceType: 'mobile' | 'desktop';
  export let config: {
    buttonColor: string;
    activeButtonColor: string;
  };

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
    background: {deviceType === 'desktop' ? 'transparent' : 'none'};
    border: {deviceType === 'desktop' ? '1px solid rgba(89, 130, 246, 0.2)' : 'none'};
    color: {config.buttonColor};
    font-size: {deviceType === 'mobile' ? '18px' : '12px'};
    padding: {deviceType === 'mobile' ? '8px' : '6px 8px'};
    border-radius: {deviceType === 'mobile' ? '8px' : '8px'};
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: {deviceType === 'mobile' ? '0' : '2px'};
    transition: all 0.3s ease;
    font-family: inherit;
    min-width: {deviceType === 'mobile' ? '50px' : '45px'};
    min-height: {deviceType === 'mobile' ? '50px' : '38px'};
    position: relative;
    {deviceType === 'mobile' ? 'background: none;' : ''}
  "
  on:click={handleClick}
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
>
  <span 
    class="icon"
    style="
      font-size: {deviceType === 'mobile' ? '20px' : '14px'};
      margin-bottom: {deviceType === 'mobile' ? '2px' : '0'};
    "
  >
    {button.icon}
  </span>
  <span 
    class="label"
    style="
      font-size: {deviceType === 'mobile' ? '10px' : '10px'};
      font-weight: 500;
      color: {deviceType === 'desktop' ? '#6c757d' : 'inherit'};
    "
  >
    {button.label}
  </span>
</button>

<style>
  .nav-button {
    -webkit-tap-highlight-color: transparent;
    outline: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .nav-button:active {
    transform: scale(0.95);
  }

  .nav-button.mobile {
    background: none;
  }

  .nav-button.mobile:active {
    color: var(--active-button-color, #007aff);
    background-color: rgba(0, 122, 255, 0.1);
  }

  .nav-button.desktop:hover {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }

  .nav-button.pressed {
    transform: scale(0.95);
  }

  .icon, .label {
    pointer-events: none;
  }
</style>