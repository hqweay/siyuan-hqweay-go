<script lang="ts" setup>
    import { ItemProperty } from "@/lets-syplugin-backlink-panel/models/setting-model";

    export let itemProperty: ItemProperty;
</script>

<div class="fn__flex b3-label config__item">
    <div class="fn__flex-1 fn__flex-center">
        {itemProperty.name}
        <div class="b3-label__text">
            {@html itemProperty.description}
        </div>
    </div>
    <div class="fn__space"></div>
    <slot />
</div>
