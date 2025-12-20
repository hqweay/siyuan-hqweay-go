<script lang="ts">
    import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
    import { onDestroy, onMount } from "svelte";
    import BacklinkFilterPanelPageSvelte from "@/lets-syplugin-backlink-panel/components/panel/backlink-filter-panel-page.svelte";
    import { isStrNotBlank } from "@/lets-syplugin-backlink-panel/utils/string-util";

    let isMobile = false;
    let dockActive: boolean;
    let lastRootId: string;

    let rootId: string;
    let focusBlockId: string;
    let panelBacklinkViewExpand: boolean = true;
    let currentTab = null;

    let mobileSidebarObserver: MutationObserver;

    // let rootElement: HTMLElement;

    onMount(async () => {
        init();
        initObserver();
    });
    onDestroy(() => {
        destroyObserver();
    });

    export function resize(clientWidth?: number) {
        if (clientWidth && clientWidth > 0) {
            dockActive = true;
            rootId = lastRootId;
        } else {
            dockActive = false;
        }
    }

    async function init() {
        isMobile = EnvConfig.ins.isMobile;
        lastRootId = EnvConfig.ins.lastViewedDocId;
        EnvConfig.ins.plugin.eventBus.on("switch-protyle", (e: any) => {
            switchProtyleCallback(e);
        });
    }

    async function switchProtyleCallback(e) {
        if (e && e.detail && e.detail.protyle && e.detail.protyle.block) {
            lastRootId = e.detail.protyle.block.rootID;
            if (dockActive) {
                rootId = lastRootId;
            }
        }
    }

    function initObserver() {
        if (!isMobile) {
            return;
        }
        const sidebarElement = document.getElementById("sidebar");

        if (!sidebarElement) {
            return;
        }
        mobileSidebarObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === "style") {
                    const newTransform = (mutation.target as HTMLElement).style
                        .transform;
                    if (isStrNotBlank(newTransform)) {
                        dockActive = true;
                        rootId = lastRootId;
                    } else {
                        dockActive = false;
                    }
                }
            });
        });

        mobileSidebarObserver.observe(sidebarElement, { attributes: true });
    }

    function destroyObserver() {
        if (mobileSidebarObserver) {
            mobileSidebarObserver.disconnect();
        }
    }
</script>

{#if isMobile}
    <!-- <div class="toolbar toolbar--border toolbar--dark">
        <svg class="toolbar__icon"
            ><use xlink:href="#BacklinkPanelFilter"></use></svg
        >
        <div class="toolbar__text">{EnvConfig.ins.i18n.flatDocumentTree}</div>
    </div> -->
    <div class="">
        <BacklinkFilterPanelPageSvelte
            {rootId}
            {focusBlockId}
            {panelBacklinkViewExpand}
            {currentTab}
        />
    </div>
{:else}
    <div class="fn__flex-column">
        <BacklinkFilterPanelPageSvelte
            {rootId}
            {focusBlockId}
            {panelBacklinkViewExpand}
            {currentTab}
        />
    </div>
{/if}
