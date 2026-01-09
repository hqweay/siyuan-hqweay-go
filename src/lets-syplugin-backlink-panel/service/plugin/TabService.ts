import BacklinkTabPanel from "@/lets-syplugin-backlink-panel/components/panel/backlink-tab-panel.svelte";
import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
import { CUSTOM_ICON_MAP } from "@/lets-syplugin-backlink-panel/models/icon-constant";
import { clearProtyleGutters, getActiveTab } from "@/lets-syplugin-backlink-panel/utils/html-util";
import Instance from "@/lets-syplugin-backlink-panel/utils/Instance";
import { isStrBlank } from "@/lets-syplugin-backlink-panel/utils/string-util";
import { openTab } from "siyuan";


const BACKLINK_TAB_PREFIX = "backlink_tab_"

export class TabService {


    public static get ins(): TabService {
        return Instance.get(TabService);
    }

    public init() {
        EnvConfig.ins.plugin.addCommand({
            langKey: "showDocumentBacklinkPanelTab",
            langText: "显示当前文反链过滤面板页签",
            hotkey: "⌥⇧T",
            editorCallback: (protyle: any) => {
                // console.log(protyle, "editorCallback");
                // let rootId = protyle.block.rootID;
                let currentDocument: HTMLDivElement = getActiveTab();
                if (!currentDocument) {
                    return;
                }
                // console.log("显示当前文档反链面板页签")

                const docTitleElement = currentDocument.querySelector(".protyle-title");
                let docTitle = currentDocument.querySelector("div.protyle-title__input").textContent;
                let docId = docTitleElement.getAttribute("data-node-id");
                TabService.ins.openBacklinkTab(docTitle, docId, null);
            },
        });



        // 用来修复反链面板页签新窗口打开时，没有初始化该页签ID，导致显示空白的问题 https://github.com/Misuzu2027/syplugin-backlink-panel/issues/23
        // 初始化时查看有没有销毁的ID，有的话初始化tab。
        // let destoryDocIdArray = CacheManager.ins.getAndRemoveBacklinkDestoryTabDocIdArray();
        // console.log("destoryDocIdArray ", destoryDocIdArray)
        // for (const docId of destoryDocIdArray) {
        //     this.pluginAddTab(docId, null);
        // }

    }

    public pluginAddTab(docId: string, focusBlockId: string) {
        let tabId = BACKLINK_TAB_PREFIX + docId;
        let backlinkFilterPanelPageSvelte: any;

        EnvConfig.ins.plugin.addTab({
            type: tabId,
            init() {
                backlinkFilterPanelPageSvelte = new BacklinkTabPanel({
                    target: this.element,
                    props: {
                        rootId: docId,
                        focusBlockId: focusBlockId,
                        currentTab: this,
                    }
                });

                this.element.addEventListener(
                    "scroll",
                    () => {
                        clearProtyleGutters(this.element as HTMLElement);
                    },
                );
            },
            beforeDestroy() {
                backlinkFilterPanelPageSvelte?.$destroy();
            },
            destroy() {
            },
            resize() {

            },
            update() {
            }
        });

    }


    public openBacklinkTab(docTitle: string, docId: string, focusBlockId: string) {
        if (isStrBlank(docTitle) || isStrBlank(docId)) {
            console.log("反链过滤面板插件 打开反链页签错误，参数缺失")
            return;
        }

        let tabId = BACKLINK_TAB_PREFIX + docId;

        this.pluginAddTab(docId, focusBlockId);

        CacheManager.ins.addBacklinkDestoryTabDocId(docId);

        openTab({
            app: EnvConfig.ins.app,
            custom: {
                id: EnvConfig.ins.plugin.name + tabId,
                icon: CUSTOM_ICON_MAP.BacklinkPanelFilter.id,
                title: docTitle,
                // data: { rootId: docId, focusBlockId: focusBlockId }
            },
            position: "right",
            afterOpen() {
            }
        });
    }

}
