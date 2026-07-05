<script lang="ts" setup>
    import { ItemProperty } from "@/lets-syplugin-backlink-panel/models/setting-model";

    export let itemProperty: ItemProperty;
</script>

<div class="fn__flex modern-setting-item">
    <div class="fn__flex-1 fn__flex-column" style="justify-content: center; padding-right: 16px;">
        <div class="item-title">{itemProperty.name}</div>
        <div class="item-desc">
            {@html itemProperty.description}
        </div>
    </div>
    <div class="fn__flex-center">
        <slot />
    </div>
</div>

<style>
    .modern-setting-item {
        padding: 20px 24px;
        margin-bottom: 12px;
        border-radius: 12px;
        background-color: var(--b3-theme-surface);
        border: 1px solid var(--b3-theme-surface-lighter, rgba(128,128,128,0.1));
        transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    .modern-setting-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
        border-color: var(--b3-theme-primary-light, var(--b3-theme-primary));
    }
    .item-title {
        font-weight: 600;
        font-size: 1.05rem;
        margin-bottom: 6px;
        color: var(--b3-theme-on-background);
        letter-spacing: 0.3px;
    }
    .item-desc {
        color: var(--b3-theme-on-surface);
        font-size: 0.9rem;
        line-height: 1.5;
        opacity: 0.85;
    }
</style>
