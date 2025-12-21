<script lang="ts" setup>
  import { ItemProperty } from "@/lets-syplugin-backlink-panel/models/setting-model";
  import { SettingService } from "@/lets-syplugin-backlink-panel/service/setting/SettingService";

  export let itemProperty: ItemProperty;
  let inputValue = SettingService.ins.SettingConfig[itemProperty.key];

  let changeTimeoutId: NodeJS.Timeout;

  function inputChange() {
    // 清除之前的定时器
    if (changeTimeoutId) {
      clearTimeout(changeTimeoutId);
    }
    changeTimeoutId = setTimeout(() => {
      changeTimeoutId = null;
      SettingService.ins.updateSettingCofnigValue(itemProperty.key, inputValue);
    }, 450);
  }
</script>

{#if itemProperty.type === "text"}
  <input
    class="b3-text-field fn__flex-center fn__size200"
    type="text"
    bind:value={inputValue}
    on:change={inputChange}
  />
{:else if itemProperty.type === "number"}
  <input
    class="b3-text-field fn__flex-center fn__size200"
    min={itemProperty.min}
    max={itemProperty.max}
    type="number"
    bind:value={inputValue}
    on:change={inputChange}
  />
{:else if itemProperty.type === "textarea"}
  <textarea
    class="b3-text-field fn__flex-center fn__size200"
    style="width: 70%;"
    bind:value={inputValue}
    on:change={inputChange}
  />
{/if}
