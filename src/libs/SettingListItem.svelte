<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { isMobile } from "../utils";

  export let value: any[] = [];
  export let columns: Array<{
    key: string;
    title: string;
    type: "text" | "number" | "select";
    width?: string;
    options?: Record<string, string>;
  }> = [];

  // Ensure value is an array
  if (!Array.isArray(value)) {
    value = [];
  }

  const dispatch = createEventDispatcher();

  function addItem() {
    const newItem: Record<string, any> = {};
    columns.forEach(col => {
      newItem[col.key] = "";
    });
    value = [...value, newItem];
    notifyChange();
  }

  function removeItem(index: number) {
    value.splice(index, 1);
    value = [...value];
    notifyChange();
  }

  function moveUp(index: number) {
    if (index > 0) {
      const temp = value[index];
      value[index] = value[index - 1];
      value[index - 1] = temp;
      value = [...value];
      notifyChange();
    }
  }

  function moveDown(index: number) {
    if (index < value.length - 1) {
      const temp = value[index];
      value[index] = value[index + 1];
      value[index + 1] = temp;
      value = [...value];
      notifyChange();
    }
  }

  function notifyChange() {
    dispatch("value", value);
  }
</script>

<div class="setting-list-container">
  {#each value as item, index}
    <div class="list-row" class:mobile={isMobile}>
      <!-- 动态渲染列 -->
      <div class="list-fields" class:mobile={isMobile}>
        {#each columns as col}
          <div class="field-item" style:flex={col.width && col.width !== '1fr' ? `0 0 ${col.width}` : "1"}>
            {#if isMobile}
              <span class="field-label mobile-only">{col.title}</span>
            {/if}
            
            {#if col.type === "select" && col.options}
              <select class="b3-select fn__flex-center" bind:value={item[col.key]} on:change={notifyChange}>
                {#each Object.entries(col.options) as [optValue, optLabel]}
                  <option value={optValue}>{optLabel}</option>
                {/each}
              </select>
            {:else if col.type === "number"}
              <input type="number" class="b3-text-field fn__block" bind:value={item[col.key]} placeholder={col.title} on:input={notifyChange} />
            {:else}
              <input type="text" class="b3-text-field fn__block" bind:value={item[col.key]} placeholder={col.title} on:input={notifyChange} />
            {/if}
          </div>
        {/each}
      </div>
      
      <!-- 操作区 -->
      <div class="list-actions" class:mobile={isMobile}>
        <button class="b3-button b3-button--text" title="上移" on:click={() => moveUp(index)} disabled={index === 0}>
          <svg><use xlink:href="#iconUp"></use></svg>
        </button>
        <button class="b3-button b3-button--text" title="下移" on:click={() => moveDown(index)} disabled={index === value.length - 1}>
          <svg><use xlink:href="#iconDown"></use></svg>
        </button>
        <button class="b3-button b3-button--text" title="删除" style="color: var(--b3-theme-error);" on:click={() => removeItem(index)}>
          <svg><use xlink:href="#iconTrashcan"></use></svg>
        </button>
      </div>
    </div>
  {/each}
  <div class="list-add-action">
    <button class="b3-button b3-button--outline fn__flex-center" style="width: 100%;" on:click={addItem}>
      <svg><use xlink:href="#iconAdd"></use></svg> 添加项
    </button>
  </div>
</div>

<style>
  .setting-list-container {
    width: 100%;
    margin-top: 8px;
  }

  .list-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .list-row.mobile {
    flex-direction: column;
    background: var(--b3-theme-surface-light);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--b3-border-color);
  }

  .list-fields {
    display: flex;
    flex: 1;
    gap: 8px;
    width: 100%;
  }

  .list-fields.mobile {
    flex-direction: column;
  }

  .field-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0; /* Prevent flex overflow */
  }

  .mobile-only {
    display: block;
    font-size: 12px;
    color: var(--b3-theme-on-surface-light);
    margin-bottom: 4px;
  }

  .list-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-shrink: 0;
  }

  .list-actions.mobile {
    margin-top: 8px;
    width: 100%;
    justify-content: flex-end;
  }

  .list-add-action {
    margin-top: 12px;
  }
</style>
