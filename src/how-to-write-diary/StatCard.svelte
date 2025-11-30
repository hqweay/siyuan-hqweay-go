<script>
  import { createEventDispatcher } from "svelte";

  export let number = 0;
  export let label = "";
  export let className = "";
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
  class={`stat-card ${className}`}
  role={clickable ? "button" : "group"}
  tabindex={clickable ? 0 : undefined}
  aria-label={label}
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  <div class="stat-number">{number}</div>
  <div class="stat-label">{label}</div>
</div>

<style>
  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-5px);
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
</style>
