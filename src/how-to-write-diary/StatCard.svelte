<script>
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  export let type = "";
  export let header = "";
  export let footer = "";
  export let hover = "";
  export let number = 0;
  export let label = "";
  export let className = "";
  export let icon = "";
  export let percentage = 0;
  export let trend = "stable"; // up, down, stable
  export let status = "normal"; // normal, success, warning, error
  export let time = "";
  export let subNumbers = {}; // 用于多数字对比，如 {left: 10, right: 20}
  // 如果父组件希望响应点击，将这个属性设为 true
  export let clickable = false;

  const dispatch = createEventDispatcher();

  function handleClick(event) {
    if (!clickable) return;
    dispatch("click", { number, label, originalEvent: event });
  }

  function handleKeydown(event) {
    if (!clickable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick(event);
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  transition:fade={{ duration: 300 }}
  class={`stat-card custom-tooltip ${className}`}
  role={clickable ? "button" : "group"}
  tabindex={clickable ? 0 : undefined}
  aria-label={label ? label : ""}
  on:click={handleClick}
  on:keydown={handleKeydown}
  title={hover}
>
  {#if header}
    <div style="">{@html header ? header : ""}</div>
  {/if}
  {#if type === "text"}
    <div class="stat-label">{@html label ? label : ""}</div>
  {:else if type === "number"}
    <div class="stat-number">{number != undefined ? number : ""}</div>
  {:else if type === "progress"}
    <div class="stat-label">{@html label ? label : ""}</div>
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: {percentage}%"></div>
      </div>
      <span class="progress-text">{percentage}%</span>
    </div>
  {:else if type === "percentage"}
    <div class="percentage-container">
      <svg class="percentage-circle" viewBox="0 0 100 100">
        <circle class="percentage-bg" cx="50" cy="50" r="45"></circle>
        <circle
          class="percentage-fill"
          cx="50"
          cy="50"
          r="45"
          style="stroke-dasharray: {2 * Math.PI * 45}; stroke-dashoffset: {2 *
            Math.PI *
            45 *
            (1 - percentage / 100)}"
        ></circle>
      </svg>
      <div class="percentage-content">
        <div class="percentage-number">{percentage}%</div>
        <div class="stat-label">{@html label ? label : ""}</div>
      </div>
    </div>
  {:else if type === "trend"}
    <div class="stat-label">{@html label ? label : ""}</div>
    <div class="trend-container">
      <div class="stat-number">{number != undefined ? number : ""}</div>
      <div class="trend-indicator {trend}">
        {#if trend === "up"}
          <span class="trend-arrow">↗</span>
        {:else if trend === "down"}
          <span class="trend-arrow">↘</span>
        {:else}
          <span class="trend-arrow">→</span>
        {/if}
      </div>
    </div>
  {:else if type === "icon"}
    <div class="icon-container">
      {#if icon}
        <div class="icon">{icon}</div>
      {/if}
      <div class="stat-number">{number != undefined ? number : ""}</div>
      <div class="stat-label">{@html label ? label : ""}</div>
    </div>
  {:else if type === "status"}
    <div class="status-container">
      <div class="status-indicator {status}"></div>
      <div class="status-content">
        <div class="stat-number">{number != undefined ? number : ""}</div>
        <div class="stat-label">{@html label ? label : ""}</div>
      </div>
    </div>
  {:else if type === "time"}
    <div class="stat-label">{@html label ? label : ""}</div>
    <div class="time-container">
      <div class="time-value">{time || number}</div>
    </div>
  {:else if type === "badge"}
    <div class="badge-container">
      <div class="badge-content">
        <div class="stat-number">{number != undefined ? number : ""}</div>
        <div class="stat-label">{@html label ? label : ""}</div>
      </div>
      <div class="badge-dot {status}"></div>
    </div>
  {:else if type === "multi-number"}
    <div class="stat-label">{@html label ? label : ""}</div>
    <div class="multi-number-container">
      {#if subNumbers.left !== undefined}
        <div class="multi-number-item">
          <span class="multi-number-value">{subNumbers.left}</span>
          <span class="multi-number-label">左</span>
        </div>
      {/if}
      {#if subNumbers.right !== undefined}
        <div class="multi-number-separator">:</div>
        <div class="multi-number-item">
          <span class="multi-number-value">{subNumbers.right}</span>
          <span class="multi-number-label">右</span>
        </div>
      {/if}
    </div>
  {:else if type === "number-text"}
    <div class="stat-number">{number != undefined ? number : ""}</div>
    <div class="stat-label">{@html label ? label : ""}</div>
  {:else}
    <div class="stat-label">{@html label ? label : ""}</div>
    <div class="stat-number">{number != undefined ? number : ""}</div>
  {/if}
  {#if footer}
    <div style="">{@html footer ? footer : ""}</div>
  {/if}
</div>

<style>
  .stat-card {
    background: rgb(60 178 59 / 10%);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease;
    /* 统一样式尺寸 */
    min-width: 180px;
    min-height: 120px;
    max-width: 300px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #ffd700;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 5px;
  }

  .stat-card[role="button"] {
    cursor: pointer;
  }

  .active {
    background: #659049;
    color: #333;
  }
  .total {
    background: #4badb2;
    color: #333;
  }

  /* Progress type styles */
  .progress-container {
    margin-top: 10px;
  }
  .progress-bar {
    width: 100%;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #ffd700, #ffed4e);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  .progress-text {
    font-size: 0.8rem;
    color: #ffd700;
    margin-top: 5px;
    display: block;
  }

  /* Percentage type styles */
  .percentage-container {
    position: relative;
    width: 80px;
    height: 80px;
    margin: 10px auto;
  }
  .percentage-circle {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .percentage-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 8;
  }
  .percentage-fill {
    fill: none;
    stroke: #ffd700;
    stroke-width: 8;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.3s ease;
  }
  .percentage-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }
  .percentage-number {
    font-size: 1.2rem;
    font-weight: bold;
    color: #ffd700;
  }

  /* Trend type styles */
  .trend-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }
  .trend-indicator {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }
  .trend-indicator.up {
    background: rgba(76, 175, 80, 0.3);
    color: #4caf50;
  }
  .trend-indicator.down {
    background: rgba(244, 67, 54, 0.3);
    color: #f44336;
  }
  .trend-indicator.stable {
    background: rgba(158, 158, 158, 0.3);
    color: #9e9e9e;
  }
  .trend-arrow {
    font-size: 1rem;
  }

  /* Icon type styles */
  .icon-container {
    text-align: center;
  }
  .icon {
    font-size: 2rem;
    margin-bottom: 10px;
  }

  /* Status type styles */
  .status-container {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    justify-content: center;
  }
  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-indicator.success {
    background: #4caf50;
    box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  }
  .status-indicator.warning {
    background: #ff9800;
    box-shadow: 0 0 10px rgba(255, 152, 0, 0.5);
  }
  .status-indicator.error {
    background: #f44336;
    box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
  }
  .status-indicator.normal {
    background: #2196f3;
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
  }
  .status-content {
    flex: 1;
  }

  /* Time type styles */
  .time-container {
    margin-top: 10px;
  }
  .time-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
    font-family: "Courier New", monospace;
  }

  /* Badge type styles */
  .badge-container {
    position: relative;
    text-align: center;
  }
  .badge-dot {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .badge-dot.success {
    background: #4caf50;
  }
  .badge-dot.warning {
    background: #ff9800;
  }
  .badge-dot.error {
    background: #f44336;
  }
  .badge-dot.normal {
    background: #2196f3;
  }

  /* Multi-number type styles */
  .multi-number-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-top: 10px;
  }
  .multi-number-item {
    text-align: center;
  }
  .multi-number-value {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: #ffd700;
  }
  .multi-number-label {
    font-size: 0.7rem;
    opacity: 0.7;
    margin-top: 2px;
  }
  .multi-number-separator {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
