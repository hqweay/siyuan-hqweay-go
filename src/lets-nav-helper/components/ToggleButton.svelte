<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let isCollapsed: boolean = false;
  export let deviceType: 'mobile' | 'desktop';

  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch('toggle');
  }
</script>

<button
  class="toggle-button {deviceType}"
  class:collapsed={isCollapsed}
  on:click={handleClick}
  title={isCollapsed ? '展开导航栏' : '收起导航栏'}
>
  <span class="icon">
    {#if isCollapsed}
      <!-- 展开图标 -->
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9,18 15,12 9,6"></polyline>
      </svg>
    {:else}
      <!-- 收起图标 -->
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15,18 9,12 15,6"></polyline>
      </svg>
    {/if}
  </span>
</button>

<style>
  .toggle-button {
    background: rgba(248, 249, 250, 0.95);
    border: 1px solid rgba(233, 236, 239, 0.8);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .toggle-button.desktop {
    width: 32px;
    height: 32px;
    position: absolute;
    right: -40px;
    top: 50%;
    transform: translateY(-50%);
  }

  .toggle-button:hover {
    background: rgba(233, 236, 239, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%) scale(1.05);
  }

  .toggle-button:active {
    transform: translateY(-50%) scale(0.95);
  }

  .toggle-button.collapsed {
    position: fixed;
    right: 20px;
    bottom: 30px;
    width: 40px;
    height: 40px;
    z-index: 1002;
    animation: pulse 2s infinite;
  }

  .toggle-button.collapsed:hover {
    /* transform: scale(1.05);
    animation: none; */
  }

  .toggle-button.collapsed:active {
    transform: scale(0.95);
  }

  .icon {
    color: #495057;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
</style>