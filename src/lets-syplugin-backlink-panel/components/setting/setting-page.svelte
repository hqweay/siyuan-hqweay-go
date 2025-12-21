<script lang="ts">
    import { getSettingTabArray } from "@/lets-syplugin-backlink-panel/models/setting-constant";
    import SettingItem from "./setting-item.svelte";
    import { TabProperty } from "@/lets-syplugin-backlink-panel/models/setting-model";
    import SettingSwitch from "./inputs/setting-switch.svelte";
    import SettingSelect from "./inputs/setting-select.svelte";
    import SettingInput from "./inputs/setting-input.svelte";
    import { SettingService } from "@/lets-syplugin-backlink-panel/service/setting/SettingService";

    let tabArray: TabProperty[] = getSettingTabArray();
    let activeTab = tabArray[0].key;
    SettingService.ins.init();

    function handleKeyDownDefault(event) {
        console.log(event.key);
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
    class="fn__flex-1 fn__flex config__panel"
    style="width: auto; height: 100%; max-width: 1280px;"
>
    <ul class="b3-tab-bar b3-list b3-list--background">
        {#each tabArray as tab}
            <li
                class="b3-list-item {activeTab === tab.key
                    ? 'b3-list-item--focus'
                    : true}"
                on:click={() => {
                    activeTab = tab.key;
                }}
                on:keydown={handleKeyDownDefault}
            >
                <svg class="b3-list-item__graphic">
                    <use xlink:href={"#" + tab.iconKey}></use>
                </svg>
                <span class="b3-list-item__text">{tab.name}</span>
            </li>
        {/each}
    </ul>
    <div class="config__tab-wrap">
        {#each tabArray as tab}
            {#if activeTab === tab.key}
                <div class="config__tab-container">
                    {#each tab.props as itemProperty}
                        <SettingItem {itemProperty}>
                            {#if itemProperty.type == "switch"}
                                <SettingSwitch {itemProperty}></SettingSwitch>
                            {:else if itemProperty.type == "select"}
                                <SettingSelect {itemProperty}></SettingSelect>
                            {:else if itemProperty.type == "number" || itemProperty.type == "text" || itemProperty.type == "textarea"}
                                <SettingInput {itemProperty} />
                            {:else}
                                不能载入设置项，请检查设置代码实现。 Key: {itemProperty.key}
                                <br />
                                can't load settings, check code please. Key:
                                {itemProperty.key}
                            {/if}
                        </SettingItem>
                    {/each}
                </div>
            {/if}
        {/each}
    </div>
</div>
