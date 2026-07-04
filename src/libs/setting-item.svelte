<script lang="ts">
  import { createEventDispatcher } from "svelte";
  export let type: string; // Setting Type
  export let title: string; // Displayint Setting Title
  export let description: string; // Displaying Setting Text
  export let settingKey: string;
  export let settingValue: any;
  export let height: string;

  //Optional
  export let placeholder: string = ""; // Use it if type is input
  export let options: { [key: string | number]: string } = {}; // Use it if type is select
  export let slider: {
    min: number;
    max: number;
    step: number;
  } = { min: 0, max: 100, step: 1 }; // Use it if type is slider

  const dispatch = createEventDispatcher();

  function clicked() {
    dispatch("click", { key: settingKey, value: settingValue });
  }

  function changed() {
    dispatch("changed", { key: settingKey, value: settingValue });
  }
</script>

{#if type === "textarea"}
  <label class="fn__flex-column b3-label" style="min-height: unset;">
    <div>
      {title}
      <div class="b3-label__text">
        {@html description}
      </div>
    </div>
    <textarea
      style="height: {height ? height : '300px'};"
      class="b3-text-field"
      id={settingKey}
      {placeholder}
      bind:value={settingValue}
      on:change={changed}
    />
  </label>
{/if}
{#if type !== "textarea"}
  <label class="fn__flex b3-label">
    <div class="fn__flex-1">
      {@html title}
      <div class="b3-label__text">
        {@html description}
      </div>
    </div>
    <span class="fn__space" />
    <!-- <slot /> -->
    {#if type === "checkbox"}
      <!-- Checkbox -->
      <input
        class="b3-switch fn__flex-center"
        id={settingKey}
        type="checkbox"
        bind:checked={settingValue}
        on:change={changed}
      />
    {:else if type === "textinput"}
      <!-- Text Input -->
      <input
        class="b3-text-field fn__flex-center fn__size200"
        id={settingKey}
        {placeholder}
        bind:value={settingValue}
        on:change={changed}
      />
    {:else if type === "number"}
      <input
        class="b3-text-field fn__flex-center fn__size200"
        id={settingKey}
        type="number"
        bind:value={settingValue}
        on:change={changed}
      />
    {:else if type === "button"}
      <!-- Button Input -->
      <button
        class="b3-button b3-button--outline fn__flex-center fn__size200"
        id={settingKey}
        on:click={clicked}
      >
        {settingValue}
      </button>
    {:else if type === "select"}
      <!-- Dropdown select -->
      <select
        class="b3-select fn__flex-center fn__size200"
        id="iconPosition"
        bind:value={settingValue}
        on:change={changed}
      >
        {#each Object.entries(options) as [value, text]}
          <option {value}>{text}</option>
        {/each}
      </select>
    {:else if type == "slider"}
      <!-- Slider -->
      <div class="slider-container">
        <input
          class="b3-slider fn__size200"
          id="fontSize"
          min={slider.min}
          max={slider.max}
          step={slider.step}
          type="range"
          bind:value={settingValue}
          on:change={changed}
        />
        <span class="slider-value">{settingValue}</span>
      </div>
    {/if}
  </label>
{/if}

<style lang="scss">
  .b3-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    margin: 0;
    border-bottom: 1px solid var(--b3-theme-outline-variant);
    min-height: 58px;
    box-sizing: border-box;
    background-color: transparent;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      background-color: var(--b3-theme-background-hover);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  /* Textarea Specific Layout */
  .fn__flex-column.b3-label {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding-bottom: 18px;
    
    &:hover {
      background-color: transparent; /* Textarea area is large; hover bg-color might look weird */
    }
    
    textarea {
      width: 100%;
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 13px;
      line-height: 1.5;
      resize: vertical;
      background-color: var(--b3-theme-surface-variant, inherit);
      border: 1px solid var(--b3-theme-outline-variant);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;

      &:focus {
        border-color: var(--b3-theme-primary);
        box-shadow: 0 0 0 2px var(--b3-theme-primary-opacity, rgba(59, 130, 246, 0.15));
      }
    }
  }

  /* Slider Layout */
  .slider-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .slider-value {
    min-width: 38px;
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    font-weight: 600;
    color: var(--b3-theme-primary);
    text-align: right;
  }

  /* Modern input control transitions */
  .b3-switch, .b3-select, .b3-text-field, .b3-slider {
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
  }

  .b3-text-field, .b3-select {
    border-radius: 6px;
    height: 30px;
    box-sizing: border-box;
  }

  .b3-button--outline {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 6px;
    font-weight: 500;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      border-color: var(--b3-theme-primary);
    }

    &:active {
      transform: scale(0.96);
    }
  }

  .b3-switch:active {
    transform: scale(0.96);
  }
</style>
