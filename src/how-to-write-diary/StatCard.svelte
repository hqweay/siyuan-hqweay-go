<script>
  // @ts-nocheck

  import { onMount } from "svelte";

  // 基础属性
  export let type = "number"; // 'number', 'text', 'progress', 'trend', 'gauge', 'comparison', 'list', 'icon-stat'
  export let label = "";
  export let number = undefined;
  export let text = "";
  export let unit = "";
  export let icon = ""; // 图标类名或 emoji

  // 按钮模式属性
  export let asButton = false;
  export let active = false;
  export let activeColor = "#3b82f6";
  export let inactiveColor = "#94a3b8";
  export let activeBackground = "rgba(59, 130, 246, 0.12)";
  export let inactiveBackground = "transparent";

  // 固定尺寸属性 ⭐ 新增
  export let fixedWidth = ""; // 例如: "120px", "10rem", "auto"
  export let fixedHeight = ""; // 例如: "80px", "6rem", "auto"
  export let minWidth = ""; // 最小宽度
  export let maxWidth = ""; // 最大宽度

  // 进度条类型
  export let percentage = 0;
  export let showPercentage = true;
  export let progressColor = "var(--b3-theme-primary)";

  // 趋势类型
  export let trend = "up"; // 'up', 'down', 'neutral'
  export let trendValue = "";
  export let previousValue = undefined;

  // 仪表盘类型
  export let gaugeValue = 0;
  export let gaugeMax = 100;
  export let gaugeMin = 0;
  export let gaugeThresholds = []; // [{value: 50, color: 'yellow'}, {value: 80, color: 'red'}]

  // 对比类型
  export let currentValue = 0;
  export let comparisonValue = 0;
  export let comparisonLabel = "vs 上期";

  // 列表类型
  export let items = []; // [{label: '', value: ''}]
  export let maxItems = 5;

  // 样式
  export let footer = "";
  export let hover = "";
  export let clickable = false;
  export let color = "";
  export let backgroundColor = "";
  export let size = "medium"; // 'small', 'medium', 'large'
  export let fullWidth = false; // 是否占据整行展示

  export let animate = true;

  // 事件
  export let onClick = null;

  let mounted = false;
  let displayNumber = 0;
  let displayPercentage = 0;

  // 按钮模式下的计算属性 ⭐
  $: isButtonMode = asButton || clickable;
  $: computedColor = asButton
    ? active
      ? activeColor
      : inactiveColor
    : color || "var(--b3-theme-on-surface)";
  $: computedBackground = asButton
    ? active
      ? activeBackground
      : inactiveBackground
    : backgroundColor || "var(--b3-theme-surface)";

  onMount(() => {
    mounted = true;
    if (animate && type === "number" && number != undefined) {
      animateNumber(number);
    }
    if (animate && type === "progress") {
      animateProgress(percentage);
    }
  });

  function animateNumber(target) {
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        displayNumber = target;
        clearInterval(interval);
      } else {
        displayNumber = Math.round(current);
      }
    }, duration / steps);
  }

  function animateProgress(target) {
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        displayPercentage = target;
        clearInterval(interval);
      } else {
        displayPercentage = Math.round(current);
      }
    }, duration / steps);
  }

  function handleClick(event) {
    if (isButtonMode || onClick) {
      if (typeof onClick === "function") {
        onClick(event);
      }
    }
  }

  function getTrendIcon() {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  }

  function getTrendColor() {
    if (trend === "up") return "#4caf50";
    if (trend === "down") return "#f44336";
    return "#9e9e9e";
  }

  function getChangePercentage() {
    if (previousValue === undefined || previousValue === 0) return 0;
    return (((number - previousValue) / previousValue) * 100).toFixed(1);
  }

  function getGaugeColor() {
    if (!gaugeThresholds.length) return "var(--b3-theme-primary)";
    const normalizedValue =
      ((gaugeValue - gaugeMin) / (gaugeMax - gaugeMin)) * 100;
    for (let i = gaugeThresholds.length - 1; i >= 0; i--) {
      if (normalizedValue >= gaugeThresholds[i].value) {
        return gaugeThresholds[i].color;
      }
    }
    return "var(--b3-theme-primary)";
  }

  function getComparisonChange() {
    if (comparisonValue === 0) return 0;
    return (((currentValue - comparisonValue) / comparisonValue) * 100).toFixed(
      1
    );
  }

  $: displayedNumber = animate && mounted ? displayNumber : number;
  $: displayedPercentage = animate && mounted ? displayPercentage : percentage;
  $: gaugeRotation =
    ((gaugeValue - gaugeMin) / (gaugeMax - gaugeMin)) * 180 - 90;
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="stat-card {type} {size}"
  class:clickable={isButtonMode}
  class:active={asButton && active}
  class:button-mode={asButton}
  class:fixed-size={asButton && (fixedWidth || fixedHeight)}
  class:has-icon={icon}
  class:full-width={fullWidth}
  style:--card-color={computedColor}
  style:--card-bg={computedBackground}
  style:--progress-color={progressColor}
  style:--active-color={activeColor}
  style:--inactive-color={inactiveColor}
  style:--fixed-width={fixedWidth}
  style:--fixed-height={fixedHeight}
  style:--min-width={minWidth}
  style:--max-width={maxWidth}
  on:click={handleClick}
  on:keydown={(e) => e.key === "Enter" && handleClick(e)}
  role={isButtonMode ? "button" : undefined}
  tabindex={isButtonMode ? 0 : undefined}
  aria-pressed={asButton ? active : undefined}
  title={hover}
>
  {#if icon}
    <div class="stat-icon" class:active={asButton && active}>{icon}</div>
  {/if}

  <div class="stat-content">
    {#if label}
      <div class="stat-label" class:active={asButton && active}>
        {@html label}
      </div>
    {/if}

    {#if type === "number"}
      <div class="stat-number">
        {displayedNumber != undefined ? displayedNumber : ""}
        {#if unit}
          <span class="stat-unit">{@html unit}</span>
        {/if}
      </div>
      {#if previousValue !== undefined}
        <div class="stat-change" style:color={getTrendColor()}>
          {getTrendIcon()}
          {getChangePercentage()}%
        </div>
      {/if}
    {:else if type === "text"}
      <div class="stat-text">{@html text ? text : ""}</div>
    {:else if type === "progress"}
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" style:width="{displayedPercentage}%"></div>
        </div>
        {#if showPercentage}
          <div class="progress-text">{displayedPercentage}%</div>
        {/if}
      </div>
    {:else if type === "trend"}
      <div class="trend-container">
        <div class="trend-value">
          {number}
          {#if unit}<span class="stat-unit">{unit}</span>{/if}
        </div>
        <div class="trend-indicator" style:color={getTrendColor()}>
          <span class="trend-icon">{getTrendIcon()}</span>
          {#if trendValue}
            <span class="trend-text">{trendValue}</span>
          {/if}
        </div>
      </div>
    {:else if type === "gauge"}
      <div class="gauge-container">
        <svg class="gauge-svg" viewBox="0 0 100 60">
          <path
            class="gauge-background"
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--b3-theme-surface-lighter)"
            stroke-width="8"
          />
          <path
            class="gauge-fill"
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={getGaugeColor()}
            stroke-width="8"
            stroke-dasharray="125.6"
            stroke-dashoffset={125.6 -
              (125.6 * (gaugeValue - gaugeMin)) / (gaugeMax - gaugeMin)}
          />
          <circle cx="50" cy="50" r="3" fill={getGaugeColor()} />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke={getGaugeColor()}
            stroke-width="2"
            transform="rotate({gaugeRotation} 50 50)"
          />
        </svg>
        <div class="gauge-value">
          {gaugeValue}
          {#if unit}<span class="stat-unit">{@html unit}</span>{/if}
        </div>
      </div>
    {:else if type === "comparison"}
      <div class="comparison-container">
        <div class="comparison-current">
          <div class="comparison-value">{currentValue}</div>
          <div class="comparison-label">当前</div>
        </div>
        <div class="comparison-divider">
          <div
            class="comparison-change"
            style:color={getComparisonChange() >= 0 ? "#4caf50" : "#f44336"}
          >
            {getComparisonChange() >= 0 ? "↑" : "↓"}
            {Math.abs(getComparisonChange())}%
          </div>
        </div>
        <div class="comparison-previous">
          <div class="comparison-value">{@html comparisonValue}</div>
          <div class="comparison-label">{@html comparisonLabel}</div>
        </div>
      </div>
    {:else if type === "list"}
      <div class="list-container">
        {#each items.slice(0, maxItems) as item, i}
          <div class="list-item">
            <span class="list-label">{@html item.label}</span>
            <span class="list-value">{@html item.value}</span>
          </div>
        {/each}
      </div>
    {:else if type === "icon-stat"}
      <div class="icon-stat-container">
        <div class="icon-stat-number">
          {number}
          {#if unit}<span class="stat-unit">{@html unit}</span>{/if}
        </div>
        {#if text}
          <div class="icon-stat-text">{@html text}</div>
        {/if}
      </div>
    {/if}

    {#if footer}
      <div class="stat-footer">{@html footer}</div>
    {/if}
  </div>
</div>

<style lang="scss">
  .stat-card {
    background: var(--card-bg, var(--b3-theme-surface));
    border: 1px solid var(--b3-theme-surface-lighter);
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    gap: 12px;
  }

  .stat-card.full-width {
    // 调整占宽一点
    grid-column: 1 / 3;
    max-width: none; /* 移除最大宽度限制 */

    padding: 24px;

    .stat-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      text-align: center;
    }

    .stat-number {
      font-size: 3em;
    }

    .stat-text {
      font-size: 1.5em;
    }

    .progress-container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }

    .gauge-container {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    .comparison-container {
      width: 100%;
      display: flex;
      justify-content: center;
      gap: 32px;
    }

    .list-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
    }

    .icon-stat-container {
      width: 100%;
    }
  }

  /* 固定尺寸样式 ⭐ */
  .stat-card.fixed-size {
    width: var(--fixed-width, auto);
    height: var(--fixed-height, auto);
    min-width: var(--min-width, auto);
    max-width: var(--max-width, auto);
    flex-shrink: 0; /* 防止被压缩 */
  }

  /* 按钮模式下的默认固定尺寸 */
  .stat-card.button-mode {
    cursor: pointer;
    user-select: none;
    min-width: 100px; /* 默认最小宽度 */
    .stat-content {
      display: unset;
    }
  }

  /* 按钮模式下的紧凑布局 */
  .stat-card.button-mode .stat-content {
    justify-content: center;
    text-align: center;
  }

  .stat-card.button-mode .stat-number,
  .stat-card.button-mode .icon-stat-number {
    font-size: 1.8em; /* 按钮模式下稍小一点 */
  }

  .stat-card.button-mode.small {
    padding: 8px 12px;
    min-width: 80px;
  }

  .stat-card.button-mode.small .stat-number,
  .stat-card.button-mode.small .icon-stat-number {
    font-size: 1.4em;
  }

  .stat-card.button-mode.large {
    padding: 20px;
    min-width: 140px;
  }

  .stat-card.small {
    padding: 12px;
    font-size: 0.9em;
  }

  .stat-card.large {
    padding: 24px;
    font-size: 1.1em;
  }

  /* 按钮模式样式 ⭐ */
  .stat-card.button-mode {
    cursor: pointer;
    user-select: none;
    .stat-label {
      color: unset;
    }
  }

  .stat-card.button-mode.active {
    border-color: var(--active-color);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  }

  .stat-card.button-mode:not(.active) {
    opacity: 0.7;
  }

  .stat-card.button-mode:not(.active):hover {
    opacity: 0.85;
    background: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
  }

  .stat-card.button-mode.active:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  .stat-card.button-mode:active {
    transform: translateY(0);
  }

  /* 传统可点击样式 */
  .stat-card.clickable:not(.button-mode) {
    cursor: pointer;
  }

  .stat-card.clickable:not(.button-mode):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: var(--b3-theme-primary);
  }

  .stat-card.has-icon {
    padding-left: 12px;
  }

  .stat-icon {
    font-size: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }

  .stat-icon.active {
    opacity: 1;
  }

  .stat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .stat-label {
    font-size: 0.85em;
    color: var(--b3-theme-on-surface-light);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: color 0.3s ease;
  }

  .stat-label.active {
    color: var(--card-color);
    font-weight: 600;
  }

  .stat-number {
    font-size: 2em;
    font-weight: 700;
    color: var(--card-color, var(--b3-theme-on-surface));
    line-height: 1.2;
  }

  .stat-unit {
    font-size: 0.5em;
    font-weight: 400;
    color: var(--b3-theme-on-surface-light);
    margin-left: 4px;
  }

  .stat-text {
    font-size: 1.2em;
    color: var(--card-color, var(--b3-theme-on-surface));
    line-height: 1.4;
  }

  .stat-change {
    font-size: 0.9em;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stat-footer {
    font-size: 0.8em;
    color: var(--b3-theme-on-surface-light);
    padding-top: 8px;
    border-top: 1px solid var(--b3-theme-surface-lighter);
  }

  /* ... 其他样式保持不变 ... */

  /* Progress Type */
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: var(--b3-theme-surface-lighter);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--progress-color);
    border-radius: 4px;
    transition: width 1s ease-out;
  }

  .progress-text {
    font-weight: 600;
    color: var(--b3-theme-on-surface);
    min-width: 45px;
    text-align: right;
  }

  /* Icon Stat Type */
  .icon-stat-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .icon-stat-number {
    font-size: 2.5em;
    font-weight: 700;
    color: var(--card-color, var(--b3-theme-on-surface));
  }

  .icon-stat-text {
    font-size: 0.9em;
    color: var(--b3-theme-on-surface-light);
    text-align: center;
  }
</style>
