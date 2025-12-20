import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
import BacklinkFilterPanelPageSvelte from "@/lets-syplugin-backlink-panel/components/panel/backlink-filter-panel-page.svelte";
import BacklinkTabPanel from "@/lets-syplugin-backlink-panel/components/panel/backlink-tab-panel.svelte";
import { SettingService } from "@/lets-syplugin-backlink-panel/service/setting/SettingService";
import Instance from "@/lets-syplugin-backlink-panel/utils/Instance";
import { Menu } from "siyuan";
import { BacklinkFilterPanelAttributeService, DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY } from "@/lets-syplugin-backlink-panel/service/setting/BacklinkPanelFilterCriteriaService";
import { clearProtyleGutters, hasClosestByClassName, hasClosestById } from "@/lets-syplugin-backlink-panel/utils/html-util";
import { generateGetDefBlockArraySql } from "../backlink/backlink-sql";
import { sql } from "@/lets-syplugin-backlink-panel/utils/api";
import { isArrayEmpty } from "@/lets-syplugin-backlink-panel/utils/array-util";
import { NewNodeID } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";


let backlinkPanelPageSvelteMap: Map<string, any> = new Map();
let documentProtyleElementMap: Map<string, HTMLElement> = new Map();


export class DocumentService {

    public static get ins(): DocumentService {
        return Instance.get(DocumentService);
    }

    public init() {
        EnvConfig.ins.plugin.eventBus.on("loaded-protyle-static", (e: any) => {
            // console.log("loaded-protyle-static e : ", e)
            handleSwitchProtyleOrLoadedProtyleStatic(e);
        });

        EnvConfig.ins.plugin.eventBus.on("switch-protyle", (e: any) => {
            // console.log("switch-protyle e : ", e)
            handleSwitchProtyleOrLoadedProtyleStatic(e);
        });

        EnvConfig.ins.plugin.eventBus.on("destroy-protyle", (e: any) => {
            handleDestroyProtyle(e);
        });

        EnvConfig.ins.plugin.eventBus.on("click-editortitleicon", (e: any) => {
            hadnleClickEditorTitleIcon(e);
        });
        // EnvConfig.ins.plugin.addCommand({
        //     langKey: "showDocumentBottomBacklinkPanel",
        //     langText: "始终显示底部反链面板",
        //     hotkey: "⌥⇧⌘A",
        //     editorCallback: (protyle: any) => {
        //         console.log(protyle, "editorCallback");
        //     },
        // });

        intervalSetNodePaddingBottom();
    }

    public destory() {
        destroyAllPanel();
        destoryIntervalSetNodePaddingBottom();
    }
}

async function handleSwitchProtyleOrLoadedProtyleStatic(e) {
    if (!e || !e.detail || !e.detail.protyle) {
        return;
    }

    let docuemntContentElement = e.detail.protyle.contentElement as HTMLElement;
    let rootId = e.detail.protyle.block.rootID;
    // let focusBlockId = e.detail.protyle.block.id;
    if (!rootId) {
        return;
    }
    await refreshBacklinkPanelToBottom(docuemntContentElement, rootId, null);

}

function handleDestroyProtyle(e) {
    // let rootId = e.detail.protyle.block.rootID;
    // documentProtyleElementMap.delete(rootId);

    let docuemntContentElement = e.detail.protyle.contentElement as HTMLElement;
    if (!docuemntContentElement) {
        return;

    }
    destroyPanel(docuemntContentElement);
}

async function getDocumentBottomBacklinkPanelDisplay(docuemntContentElement: HTMLElement, rootId: string) {
    // 如果是闪卡界面，不显示底部反链面板
    let isCardBlock = hasClosestByClassName(docuemntContentElement, "card__block")
    if (isCardBlock) {
        let flashCardBottomDisplay = SettingService.ins.SettingConfig.flashCardBottomDisplay;
        if (!flashCardBottomDisplay) {
            return false;
        }
    }
    // 必须是页签文档或悬浮窗才可以通过。防止 Dock 栏的插件渲染 protyle 加载反链。
    let isLayoutCenter = hasClosestByClassName(docuemntContentElement, "layout__center");
    let isPopoverBlock = hasClosestByClassName(docuemntContentElement, "block__popover");
    // 搜索弹窗的预览也显示底部反链面板，fn__flex-1 search__preview protyle
    let isSearchDialog = hasClosestById(docuemntContentElement, "searchPreview");
    if (!isLayoutCenter && !isPopoverBlock && !isSearchDialog) {
        return false;
    }

    let documentBottomDisplay = SettingService.ins.SettingConfig.documentBottomDisplay;

    // 默认展示，以展示 SQL 查询
    // if (documentBottomDisplay) {
    //     let getDefBlockArraySql = generateGetDefBlockArraySql({ rootId: rootId });
    //     let curDocDefBlockArray: DefBlock[] = await sql(getDefBlockArraySql);
    //     if (isArrayEmpty(curDocDefBlockArray)) {
    //         documentBottomDisplay = false;;
    //     }
    // }
    let docProtyleElement = null;
    if (docuemntContentElement.matches(".protyle-wysiwyg--attr")) {
        docProtyleElement = docuemntContentElement;
    } else {
        docProtyleElement = docuemntContentElement.querySelector(`div.protyle-wysiwyg--attr[${DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY}]`);
    }

    if (docProtyleElement) {
        let attributeValue = docProtyleElement.getAttribute(DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY);
        if (attributeValue == "1") {
            documentBottomDisplay = true;
        } else if (attributeValue == "-1") {
            documentBottomDisplay = false;
        }
    }

    return documentBottomDisplay;
}


async function refreshBacklinkPanelToBottom(docuemntContentElement: HTMLElement, rootId: string, focusBlockId: string) {
    if (!docuemntContentElement || !rootId) {
        return;
    }
    let bottomDisplay = await getDocumentBottomBacklinkPanelDisplay(docuemntContentElement, rootId);
    // 如果该文档不需要显示，则尝试删除该元素内部可能存在的底部反链。
    if (!bottomDisplay) {
        destroyPanel(docuemntContentElement);
        return;
    } else {
        addBacklinkPanelToBottom(docuemntContentElement, rootId, focusBlockId);
    }
}

async function addBacklinkPanelToBottom(docuemntContentElement: HTMLElement, rootId: string, focusBlockId: string) {
    if (!docuemntContentElement || !rootId) {
        return;
    }
    // let bottomDisplay = await getDocumentBottomBacklinkPanelDisplay(docuemntContentElement, rootId);
    // // 如果该文档不需要显示，则尝试删除该元素内部可能存在的底部反链。
    // if (!bottomDisplay) {
    //     destroyPanel(docuemntContentElement);
    //     return;
    // }

    let protyleWysiwygElement = docuemntContentElement.querySelector(".protyle-wysiwyg.protyle-wysiwyg--attr");
    let backlinkPanelBottomElement = docuemntContentElement.querySelector(".backlink-panel-document-bottom__area");
    if (backlinkPanelBottomElement) {
        let panelRootId = backlinkPanelBottomElement.getAttribute("data-root-id");
        if (panelRootId == rootId) {
            return;
        } else {
            destroyPanel(docuemntContentElement);
        }
    }

    backlinkPanelBottomElement = document.createElement("div");
    backlinkPanelBottomElement.classList.add(
        "backlink-panel-document-bottom__area"
    );

    let isMobile = EnvConfig.ins.isMobile;
    if (isMobile) {
        backlinkPanelBottomElement.classList.add("document-panel-plugin-mobile");
    }

    // console.log("handleDestroyProtyle setAttribute rootId ", rootId)
    docuemntContentElement.appendChild(backlinkPanelBottomElement);
    let panelId = NewNodeID();
    backlinkPanelBottomElement.setAttribute("data-root-id", rootId);
    backlinkPanelBottomElement.setAttribute("misuzu-backlink-panel-id", panelId)

    // let hrElement = document.createElement("hr");
    // backlinkPanelBottomElement.appendChild(hrElement);

    let docBottomBacklinkPanelViewExpand = SettingService.ins.SettingConfig.docBottomBacklinkPanelViewExpand

    let pageSvelte = new BacklinkTabPanel({
        target: backlinkPanelBottomElement,
        props: {
            rootId: rootId,
            focusBlockId: focusBlockId,
            currentTab: null,
        }
    });
    backlinkPanelBottomElement.parentElement.addEventListener(
        "scroll",
        () => {
            clearProtyleGutters(backlinkPanelBottomElement as HTMLElement);
        },
    );
    backlinkPanelBottomElement.addEventListener("mouseover", (event: MouseEvent) => {
        // const target = event.target as HTMLElement;
        //
        // // 如果元素包含 aria-label 样式，则不阻止事件传播
        // if (target.classList.contains('ariaLabel')) {
        //     return; // 不做任何操作，继续传播
        // } else {
        //     document.getElementById("tooltip").classList.add("fn__none");
        // }
        //
        // // 考虑创建一个隐藏的 blockref 来显示悬浮窗，子文档列表挂件中好像有相似代码。
        // if (target.getAttribute('data-type') === 'block-ref') {
        //     event.stopPropagation();
        //
        // }

        event.stopPropagation();
    })


    backlinkPanelPageSvelteMap.set(panelId, pageSvelte);
    documentProtyleElementMap.set(panelId, protyleWysiwygElement as HTMLElement);
    // handleProtyleHeightChange(protyleElement)
}


function destroyPanel(docuemntContentElement: HTMLElement) {
    if (!docuemntContentElement) {
        return;
    }
    let backlinkPanelBottomElement = docuemntContentElement.querySelector(".backlink-panel-document-bottom__area");
    if (!backlinkPanelBottomElement) {
        return;
    }
    let panelId = backlinkPanelBottomElement.getAttribute("misuzu-backlink-panel-id");
    if (!panelId) {
        return;
    }
    documentProtyleElementMap.delete(panelId);
    let pageSvelte = backlinkPanelPageSvelteMap.get(panelId);
    if (!pageSvelte) {
        return;
    }
    backlinkPanelPageSvelteMap.delete(panelId);
    pageSvelte.$destroy();
    backlinkPanelBottomElement.remove();

}

function destroyAllPanel() {

    let allDocumentContentElementArray = document.querySelectorAll("div.layout__center div.layout-tab-container div.protyle-content.protyle-content--transition");

    if (!allDocumentContentElementArray) {
        return;
    }
    for (const docuemntContentElement of allDocumentContentElementArray) {
        destroyPanel(docuemntContentElement as HTMLElement);

    }

}

function hadnleClickEditorTitleIcon(e) {


    (e.detail.menu as Menu).addItem({
        icon: "BacklinkPanelFilter",
        type: "submenu",
        label: "反链过滤面板",
        submenu: getDocumentBlockIconMenus(e)
    });
}

function getDocumentBlockIconMenus(e) {
    let rootId = e.detail.data.rootID;
    if (!rootId) {
        return;
    }
    let submenus = [];
    submenus.push({
        label: "恢复默认",
        click: async () => {
            await BacklinkFilterPanelAttributeService.ins.updateDocumentBottomShowPanel(rootId, null);
            let documentBottomDisplay = SettingService.ins.SettingConfig.documentBottomDisplay;
            if (documentBottomDisplay) {
                let docuemntContentElement = e.detail.protyle.contentElement as HTMLElement;
                await refreshBacklinkPanelToBottom(docuemntContentElement, rootId, null);
            } else {
                handleDestroyProtyle(e);
            }
        }
    });
    submenus.push({
        label: "始终显示该文档底部反链",
        click: async () => {
            await BacklinkFilterPanelAttributeService.ins.updateDocumentBottomShowPanel(rootId, 1);

            let docuemntContentElement = e.detail.protyle.contentElement as HTMLElement;
            await refreshBacklinkPanelToBottom(docuemntContentElement, rootId, null);
        }
    });
    submenus.push({
        label: "始终隐藏该文档底部反链",
        click: async () => {
            BacklinkFilterPanelAttributeService.ins.updateDocumentBottomShowPanel(rootId, -1);
            let docuemntContentElement = e.detail.protyle.contentElement as HTMLElement;
            destroyPanel(docuemntContentElement);
        }
    });

    return submenus;
}


let intervalId;
function intervalSetNodePaddingBottom() {
    // 后续看能不能优化成响应式的。。
    intervalId = setInterval(() => {
        if (documentProtyleElementMap.size <= 0) {
            return;
        }
        let paddingWidthSize = SettingService.ins.SettingConfig.documentBottomBacklinkPaddingWidth;

        let paddingBottomSize = "48px";
        for (const key of documentProtyleElementMap.keys()) {
            let protyleElement = documentProtyleElementMap.get(key);

            if (parseFloat(protyleElement.style.paddingBottom) > 88) {
                protyleElement.style.paddingBottom = paddingBottomSize;
            }
            let panelElement = protyleElement.parentElement.querySelector(".backlink-panel-document-bottom__area") as HTMLElement;
            if (panelElement && protyleElement.style.paddingLeft != panelElement.style.paddingLeft) {
                let paddingWidthPx = paddingWidthSize + "px";
                if (paddingWidthSize == undefined || paddingWidthSize == null) {
                    // console.log("intervalSetNodePaddingBottom")
                    paddingWidthPx = protyleElement.style.paddingLeft;
                }
                panelElement.style.paddingLeft = paddingWidthPx;
                panelElement.style.paddingRight = paddingWidthPx;
            }
        }
    }, 50);
}


function destoryIntervalSetNodePaddingBottom() {
    if (intervalId) {
        clearInterval(intervalId);
    }
}