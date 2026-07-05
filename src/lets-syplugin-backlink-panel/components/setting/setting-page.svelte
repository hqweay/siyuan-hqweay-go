<script lang="ts">
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-syplugin-backlink-panel");
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
        log.info(event.key);
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="modern-settings-container">
    <div class="modern-sidebar">
        {#each tabArray as tab}
            <div
                class="modern-tab-item {activeTab === tab.key ? 'active' : ''}"
                on:click={() => {
                    activeTab = tab.key;
                }}
                on:keydown={handleKeyDownDefault}
                tabindex="0"
                role="button"
            >
                <svg class="modern-tab-icon">
                    <use xlink:href={"#" + tab.iconKey}></use>
                </svg>
                <span class="modern-tab-text">{tab.name}</span>
            </div>
        {/each}
    </div>
    
    <div class="modern-content-wrap">
        {#each tabArray as tab}
            {#if activeTab === tab.key}
                <div class="modern-tab-container">
                    <h2 class="modern-tab-title">{tab.name}</h2>
                    <div class="modern-tab-content">
                        {#each tab.props as itemProperty}
                            <SettingItem {itemProperty}>
                                {#if itemProperty.type == "switch"}
                                    <SettingSwitch {itemProperty}></SettingSwitch>
                                {:else if itemProperty.type == "select"}
                                    <SettingSelect {itemProperty}></SettingSelect>
                                {:else if itemProperty.type == "number" || itemProperty.type == "text" || itemProperty.type == "textarea"}
                                    <SettingInput {itemProperty} />
                                {:else}
                                    <div style="color: var(--b3-theme-error);">
                                        不能载入设置项，请检查设置代码实现。 Key: {itemProperty.key}
                                        <br />
                                        can't load settings, check code please. Key: {itemProperty.key}
                                    </div>
                                {/if}
                            </SettingItem>
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}
    </div>
</div>

<style>
    .modern-settings-container {
        display: flex;
        flex: 1;
        width: 100%;
        height: 100%;
        max-width: 1280px;
        margin: 0 auto;
        background: var(--b3-theme-background);
        border-radius: 8px;
        overflow: hidden;
    }
    
    .modern-sidebar {
        width: 220px;
        background: var(--b3-theme-surface);
        border-right: 1px solid var(--b3-theme-surface-lighter, rgba(128,128,128,0.1));
        padding: 24px 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1;
    }

    .modern-tab-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--b3-theme-on-surface);
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        user-select: none;
        opacity: 0.8;
    }

    .modern-tab-item:hover {
        background: var(--b3-theme-background-light);
        opacity: 1;
        transform: translateX(4px);
    }

    .modern-tab-item.active {
        background: var(--b3-theme-primary);
        color: var(--b3-theme-on-primary);
        opacity: 1;
        box-shadow: 0 4px 12px rgba(var(--b3-theme-primary-rgb, 0,0,0), 0.2);
        font-weight: 500;
        transform: translateX(4px);
    }

    .modern-tab-icon {
        width: 18px;
        height: 18px;
        margin-right: 12px;
        fill: currentColor;
    }
    
    .modern-tab-text {
        font-size: 14px;
        letter-spacing: 0.5px;
    }

    .modern-content-wrap {
        flex: 1;
        padding: 32px 48px;
        overflow-y: auto;
        scroll-behavior: smooth;
        background: var(--b3-theme-background);
    }

    .modern-tab-container {
        animation: fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .modern-tab-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--b3-theme-on-background);
        margin-bottom: 32px;
        padding-bottom: 12px;
        border-bottom: 2px solid var(--b3-theme-surface-lighter, rgba(128,128,128,0.1));
    }
    
    .modern-tab-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    @keyframes fadeSlideUp {
        from {
            opacity: 0;
            transform: translateY(15px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
