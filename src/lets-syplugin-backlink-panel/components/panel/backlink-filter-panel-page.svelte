<script lang="ts">
    import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
    import {
        BACKLINK_BLOCK_SORT_METHOD_ELEMENT,
        CUR_DOC_DEF_BLOCK_SORT_METHOD_ELEMENT,
        CUR_DOC_DEF_BLOCK_TYPE_ELEMENT,
        RELATED_DEF_BLOCK_SORT_METHOD_ELEMENT,
        RELATED_DEF_BLOCK_TYPE_ELEMENT,
        RELATED_DOCMUMENT_SORT_METHOD_ELEMENT,
    } from "@/lets-syplugin-backlink-panel/models/backlink-constant";
    import {
        IBacklinkFilterPanelData,
        IBacklinkFilterPanelDataQueryParams,
        IBacklinkPanelRenderData,
        IPanelRednerFilterQueryParams,
        BacklinkPanelFilterCriteria,
    } from "@/lets-syplugin-backlink-panel/models/backlink-model";
    import {
        defBlockArrayTypeAndKeywordFilter,
        defBlockArraySort,
        getBacklinkPanelData,
        getBacklinkPanelRenderData,

    } from "@/lets-syplugin-backlink-panel/service/backlink/backlink-data";
    import {
        isArrayEmpty,
        isArrayNotEmpty,
        isSetEmpty,
        isSetNotEmpty,
    } from "@/lets-syplugin-backlink-panel/utils/array-util";
    import {
        clearProtyleGutters,
        getElementsBeforeDepth,
        highlightElementTextByCss,
        getElementsAtDepth,
        syHasChildListNode,
    } from "@/lets-syplugin-backlink-panel/utils/html-util";
    import {
        isStrBlank,
        removePrefixAndSuffix,
        splitKeywordStringToArray,
    } from "@/lets-syplugin-backlink-panel/utils/string-util";
    import {
        Constants,
        openMobileFileById,
        Protyle,
        TProtyleAction,
        Custom,
        openTab,
    } from "siyuan";
    import { onDestroy, onMount } from "svelte";
    import { getBlockTypeIconHref } from "@/lets-syplugin-backlink-panel/utils/icon-util";
    import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
    import { BacklinkFilterPanelAttributeService } from "@/lets-syplugin-backlink-panel/service/setting/BacklinkPanelFilterCriteriaService";
    import { SettingService } from "@/lets-syplugin-backlink-panel/service/setting/SettingService";
    import { delayedTwiceRefresh } from "@/lets-syplugin-backlink-panel/utils/timing-util";
    import { getBlockIsFolded } from "@/lets-syplugin-backlink-panel/utils/api";
    import { getOpenTabActionByZoomIn } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";

    export let rootId: string;
    export let focusBlockId: string;
    export let currentTab: Custom;
    // 用来监听变化
    let previousRootId: string;
    let previousFocusBlockId: string;
    // 监听 rootId 变化
    $: if (rootId !== previousRootId || focusBlockId !== previousFocusBlockId) {
        initBaseData();
    }

    /* 绑定 HTML 元素 */
    // let curRootElement: HTMLElement;
    let backlinkULElement: HTMLElement;

    /* 数据 */
    let backlinkFilterPanelBaseData: IBacklinkFilterPanelData;
    let backlinkFilterPanelRenderData: IBacklinkPanelRenderData;
    // 用于排序、关键字查找筛选条件，此时不会改动反链信息，所以在页面中处理。
    let queryParams: IPanelRednerFilterQueryParams;
    let savedQueryParamMap: Map<string, IPanelRednerFilterQueryParams>;

    /* 全局使用 */
    let defalutEditors: Protyle[] = [];
    let doubleClickTimeout: number = 0;
    let clickCount: number = 0;
    let clickTimeoutId: NodeJS.Timeout;
    let inputChangeTimeoutId: NodeJS.Timeout;
    let queryCurDocDefBlockRange: string;
    // 用来保存当前页面反链渲染区的展开折叠状态
    let backlinkDocumentFoldMap: Map<string, boolean> = new Map();
    let backlinkProtyleItemFoldMap: Map<string, Set<string>> = new Map();
    let backlinkProtyleHeadingExpandMap: Map<string, boolean> = new Map();

    /* 控制页面元素的 */
    let panelFilterViewExpand: boolean = false;
    export let panelBacklinkViewExpand: boolean = true;
    let displayHintPanelBaseDataCacheUsage: boolean = false;
    let displayHintBacklinkBlockCacheUsage: boolean = false;
    let hideBacklinkProtyleBreadcrumb: boolean = false;
    let showSaveCriteriaInputBox: boolean = false;
    let saveCriteriaInputText: string = "";
    
    /* 滚动加载相关变量 */
    let isLoadingMore: boolean = false;
    let hasMoreData: boolean = true;
    let currentPage: number = 1;
    let totalItems: number = 0;
    const pageSize: number = SettingService.ins.SettingConfig.pageSize;

    $: updateLastCriteria(
        queryParams,
        panelFilterViewExpand,
        // panelBacklinkViewExpand,
    );

    onMount(async () => {
        doubleClickTimeout =
            SettingService.ins.SettingConfig.doubleClickTimeout;
        if (!doubleClickTimeout) {
            doubleClickTimeout = 0;
        }
        if (
            rootId !== previousRootId ||
            focusBlockId !== previousFocusBlockId
        ) {
            initBaseData();
        }

        initEvent();
        
        // 根据配置决定是否启用滚动加载
        if (SettingService.ins.SettingConfig.scrollLoading) {
            initScrollListener();
        }
    });

    onDestroy(async () => {
        clearBacklinkProtyleList();
        
        // 根据配置决定是否清理滚动监听器
        if (SettingService.ins.SettingConfig.scrollLoading) {
            const scrollContainer = findScrollableContainer();
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            } else {
                window.removeEventListener('scroll', handleScroll);
            }
        }
    });

    function updateLastCriteria(
        queryParams: IPanelRednerFilterQueryParams,
        backlinkPanelFilterViewExpand: boolean,
        // backlinkPanelBacklinkViewExpand: boolean,
    ) {
        if (!rootId || !queryParams) {
            return;
        }
        let criteria: BacklinkPanelFilterCriteria = {
            queryParams,
            backlinkPanelFilterViewExpand,
            // backlinkPanelBacklinkViewExpand,
        };
        BacklinkFilterPanelAttributeService.ins.updatePanelCriteria(
            rootId,
            criteria,
        );
    }

    function initEvent() {
        backlinkULElement.addEventListener("mouseleave", () => {
            clearProtyleGutters(backlinkULElement);
        });
        backlinkULElement.addEventListener("mousemove", (event: MouseEvent) => {
            const target = event.target as HTMLElement;

            // 检查是否是移动到文档名称元素上
            if (
                (target && target.classList.contains("b3-list-item__text")) ||
                target.classList.contains("list-item__document-name")
            ) {
                clearProtyleGutters(backlinkULElement);
            }
        });
    }

    function clickBacklinkDocumentLiElement(event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        if (event.ctrlKey) {
            let rootId = target.getAttribute("data-node-id");
            let blockId = target.getAttribute("data-backlink-block-id");
            openBlockTab(rootId, blockId);
            return;
        }
        toggleBacklinkDocument(target);
    }

    function contextmenuBacklinkDocumentLiElement(event: MouseEvent) {
        const target = event.currentTarget as HTMLElement;
        let rootId = target.getAttribute("data-node-id");
        let blockId = target.getAttribute("data-backlink-block-id");
        openBlockTab(rootId, blockId);
        return;
    }

    function toggleBacklinkDocument(documentLiElement: HTMLElement) {
        let closeStatus = documentLiElement.classList.contains("backlink-hide");
        if (closeStatus) {
            expandBacklinkDocument(documentLiElement);
        } else {
            collapseBacklinkDocument(documentLiElement);
        }
    }

    function expandBacklinkDocument(documentLiElement: HTMLElement) {
        documentLiElement.nextElementSibling.classList.remove("fn__none");
        documentLiElement.classList.remove("backlink-hide");
        documentLiElement
            .querySelector(".b3-list-item__arrow")
            .classList.add("b3-list-item__arrow--open");
    }

    function collapseBacklinkDocument(documentLiElement: HTMLElement) {
        documentLiElement.nextElementSibling.classList.add("fn__none");
        documentLiElement.classList.add("backlink-hide");
        documentLiElement
            .querySelector(".b3-list-item__arrow")
            .classList.remove("b3-list-item__arrow--open");
    }

    function expandAllBacklinkDocument(event: MouseEvent) {
        if (event) {
        }
        // 左键点击展开所有文档
        // if (event.button === 0) {
        let documentLiElementArray = backlinkULElement.querySelectorAll(
            "li.list-item__document-name",
        );
        for (const documentLiElement of documentLiElementArray) {
            expandBacklinkDocument(documentLiElement as HTMLElement);
        }
        return;
        // }
    }

    function expandAllBacklinkListItemNode(event: MouseEvent) {
        if (event) {
        }
        // 右键点击展开所有反链中的列表块
        // if (event.button === 2) {
        let backlinkProtyleElementArray =
            backlinkULElement.querySelectorAll("div.protyle");

        for (const backlinkProtyle of backlinkProtyleElementArray) {
            expandAllListItemNode(backlinkProtyle as HTMLElement);
        }
        return;
        // }
    }

    function collapseAllBacklinkDocument(event: MouseEvent) {
        if (event) {
        }
        // 左键点击折叠所有文档
        // if (event.button === 0) {
        let documentLiElementArray = backlinkULElement.querySelectorAll(
            "li.list-item__document-name",
        );
        for (const documentLiElement of documentLiElementArray) {
            collapseBacklinkDocument(documentLiElement as HTMLElement);
        }
        // }
    }

    function collapseAllBacklinkListItemNode(event: MouseEvent) {
        if (event) {
        }
        // 右键点击折叠所有反链中的列表块
        // if (event.button === 2) {
        let backlinkProtyleElementArray =
            backlinkULElement.querySelectorAll("div.protyle");

        for (const backlinkProtyle of backlinkProtyleElementArray) {
            collapseAllListItemNode(backlinkProtyle as HTMLElement);
        }
        return;
        // }
    }

    function clickExpandAllListItemNode(event: MouseEvent) {
        const target = event.target as HTMLElement;

        const parentLiElement = target.closest(".list-item__document-name");
        if (!parentLiElement) {
            return;
        }
        expandAllListItemNode(
            parentLiElement.nextElementSibling as HTMLElement,
        );
    }

    function expandAllListItemNode(element: HTMLElement) {
        if (!element) {
            return;
        }
        let protyleWysiwygElement = element.querySelector(
            "div.protyle-wysiwyg.protyle-wysiwyg--attr",
        );
        if (!protyleWysiwygElement) {
            return;
        }
        const liNodes = protyleWysiwygElement.querySelectorAll<HTMLElement>(
            'div[data-type="NodeListItem"].li[fold="1"]',
        );

        liNodes.forEach((node) => {
            node.removeAttribute("fold");
        });
    }

    function foldListItemNodeByIdSet(element: Element, idSet: Set<string>) {
        if (!element || !idSet) {
            return;
        }
        let protyleWysiwygElement = element.querySelector(
            "div.protyle-wysiwyg.protyle-wysiwyg--attr",
        );
        if (!protyleWysiwygElement) {
            return;
        }
        // 先展开所有，然后再折叠对应的
        expandAllListItemNode(element as HTMLElement);
        for (const nodeId of idSet) {
            let foldItemElement = protyleWysiwygElement.querySelector(
                `div[data-type="NodeListItem"].li[data-node-id="${nodeId}"]`,
            );
            if (!foldItemElement) {
                continue;
            }
            foldItemElement.setAttribute("fold", "1");
        }
    }

    function expandListItemNodeByDepth(element: Element, depth: number) {
        if (!element || depth < 1) {
            return;
        }
        let protyleWysiwygElement = element.querySelector(
            "div.protyle-wysiwyg.protyle-wysiwyg--attr",
        );
        if (!protyleWysiwygElement) {
            return;
        }

        // 先递归展开到指定深度
        depth = depth - 1;
        const liNodes = getElementsBeforeDepth(
            protyleWysiwygElement as HTMLElement,
            'div[data-type="NodeListItem"].li',
            depth,
        );

        liNodes.forEach((node) => {
            node.removeAttribute("fold");
        });

        // 然后获取指定深度的列表节点，如果存在子节点加上折叠。
        const collapseLiNodes = getElementsAtDepth(
            protyleWysiwygElement as HTMLElement,
            'div[data-type="NodeListItem"].li',
            depth,
        );

        collapseLiNodes.forEach((node) => {
            if (syHasChildListNode(node)) {
                node.setAttribute("fold", "1");
            }
        });
    }

    function clickCollapseAllListItemNode(event: MouseEvent) {
        const target = event.target as HTMLElement;

        const parentLiElement = target.closest(".list-item__document-name");
        if (!parentLiElement) {
            return;
        }
        collapseAllListItemNode(parentLiElement.nextElementSibling);
    }

    function collapseAllListItemNode(element: Element) {
        if (!element) {
            return;
        }
        let protyleWysiwygElement = element.querySelector(
            "div.protyle-wysiwyg.protyle-wysiwyg--attr",
        );
        if (!protyleWysiwygElement) {
            return;
        }
        const liNodes = protyleWysiwygElement.querySelectorAll<HTMLElement>(
            'div[data-type="NodeListItem"].li:not([fold])',
        );
        liNodes.forEach((node) => {
            if (syHasChildListNode(node)) {
                node.setAttribute("fold", "1");
            }
        });
    }

    function expandBacklinkHeadingMore(element: Element) {
        if (!element) {
            return;
        }

        let protyleWysiwygElement = element.querySelector(
            "div.protyle-wysiwyg.protyle-wysiwyg--attr",
        );

        if (!protyleWysiwygElement) {
            return;
        }
        let moreElement = protyleWysiwygElement.querySelector(
            `div.protyle-breadcrumb__item`,
        );
        if (moreElement) {
            let nextElement = moreElement.nextElementSibling;
            while (
                nextElement &&
                !nextElement.classList.contains("protyle-breadcrumb__bar")
            ) {
                nextElement.classList.remove("fn__none");
                nextElement = nextElement.nextElementSibling;
            }
            moreElement.remove();
        }
    }

    // function openDocumentTab(rootId: string) {
    //     let actions: TProtyleAction[] = [Constants.CB_GET_CONTEXT];

    //     if (EnvConfig.ins.isMobile) {
    //         openMobileFileById(EnvConfig.ins.app, rootId, actions);
    //     } else {
    //         openTab({
    //             app: EnvConfig.ins.app,
    //             doc: {
    //                 id: rootId,
    //                 action: actions,
    //             },
    //         });
    //     }
    // }

    async function openBlockTab(rootId: string, blockId: string) {
        let zoomIn = await getBlockIsFolded(blockId);
        let actions: TProtyleAction[] = getOpenTabActionByZoomIn(zoomIn);

        if (EnvConfig.ins.isMobile) {
            openMobileFileById(EnvConfig.ins.app, blockId, actions);
        } else {
            openDestopBlockTab({ zoomIn, actions, rootId, blockId });
        }
    }

    async function openDestopBlockTab(params: {
        zoomIn: boolean;
        actions: TProtyleAction[];
        rootId: string;

        blockId: string;
    }) {
        if (params.rootId == params.blockId) {
            // actions = actions.filter((item) => item !== Constants.CB_GET_HL);
            params.actions = [Constants.CB_GET_FOCUS, Constants.CB_GET_SCROLL];
        }

        openTab({
            app: EnvConfig.ins.app,
            doc: {
                id: params.blockId,
                action: params.actions,
            },
        });
    }

    async function initBaseData() {
        if (!rootId) {
            return;
        }
        clearBacklinkProtyleList();

        previousRootId = rootId;
        previousFocusBlockId = focusBlockId;
        let settingConfig = SettingService.ins.SettingConfig;
        let backlinkPanelDataQueryParams: IBacklinkFilterPanelDataQueryParams =
            {
                rootId,
                focusBlockId,
                queryParentDefBlock: settingConfig.queryParentDefBlock,
                querrChildDefBlockForListItem:
                    settingConfig.querrChildDefBlockForListItem,
                queryChildDefBlockForHeadline:
                    settingConfig.queryChildDefBlockForHeadline,
                queryCurDocDefBlockRange,
            };
        hideBacklinkProtyleBreadcrumb =
            settingConfig.hideBacklinkProtyleBreadcrumb;

        let backlinkPanelBaseDataTemp = await getBacklinkPanelData(
            backlinkPanelDataQueryParams,
        );
        // if (rootId != backlinkPanelBaseDataTemp.rootId) {
        // return;
        // }
        backlinkFilterPanelBaseData = backlinkPanelBaseDataTemp;

        if (
            backlinkFilterPanelBaseData &&
            backlinkFilterPanelBaseData.userCache
        ) {
            displayHintPanelBaseDataCacheUsage = true;
        } else {
            displayHintPanelBaseDataCacheUsage = false;
        }

        let defaultPanelCriteria =
            await BacklinkFilterPanelAttributeService.ins.getPanelCriteria(
                rootId,
            );

        queryParams = defaultPanelCriteria.queryParams;
        panelFilterViewExpand =
            defaultPanelCriteria.backlinkPanelFilterViewExpand;
        // panelBacklinkViewExpand =
        //     defaultPanelCriteria.backlinkPanelBacklinkViewExpand;
        
        // 根据配置重置状态
        if (SettingService.ins.SettingConfig.scrollLoading) {
            resetScrollLoadingState();
        } else {
            // 翻页模式下重置分页状态
            queryParams.pageNum = 1;
        }

        savedQueryParamMap =
            await BacklinkFilterPanelAttributeService.ins.getPanelSavedCriteriaMap(
                rootId,
            );

        if (settingConfig.defaultSelectedViewBlock) {
            let selectBlockId = previousRootId;
            // if (previousFocusBlockId) {
            //     selectBlockId = previousFocusBlockId;
            // }
            let viewBlockExistBacklink = false;
            backlinkFilterPanelBaseData.curDocDefBlockArray.forEach((item) => {
                if (item.id == selectBlockId) {
                    viewBlockExistBacklink = true;
                    return;
                }
            });

            if (viewBlockExistBacklink) {
                // 如果使用这个功能，必须先清空缓存。
                queryParams.includeRelatedDefBlockIds = new Set<string>();
                queryParams.excludeRelatedDefBlockIds = new Set<string>();
                queryParams.includeDocumentIds = new Set<string>();
                queryParams.excludeDocumentIds = new Set<string>();

                queryParams.includeRelatedDefBlockIds.add(selectBlockId);
            }
        }

        updateRenderData();
    }

    async function updateRenderData() {
        let backlinkPanelRenderDataTemp = await getBacklinkPanelRenderData(
            backlinkFilterPanelBaseData,
            queryParams,
        );
        if (backlinkPanelRenderDataTemp.rootId != rootId) {
            return;
        }
        backlinkFilterPanelRenderData = backlinkPanelRenderDataTemp;

        queryParams = queryParams;

        refreshFilterDisplayData();

        refreshBacklinkPreview(true);
    }
    
    // 翻页函数（当禁用滚动加载时使用）
    async function pageTurning(pageNumParam: number) {
        if (
            pageNumParam < 1 ||
            pageNumParam > backlinkFilterPanelRenderData.totalPage
        ) {
            return;
        }
        queryParams.pageNum = pageNumParam;
        let pageBacklinkPanelRenderData =
            await getBacklinkPanelRenderData(
                backlinkFilterPanelBaseData,
                queryParams,
            );

        backlinkFilterPanelRenderData.backlinkDataArray =
            pageBacklinkPanelRenderData.backlinkDataArray;
        backlinkFilterPanelRenderData.pageNum =
            pageBacklinkPanelRenderData.pageNum;
        backlinkFilterPanelRenderData.usedCache =
            pageBacklinkPanelRenderData.usedCache;
        queryParams = queryParams;

        refreshBacklinkPreview(true);
    }


    async function refreshFilterDisplayData() {
        let curDocDefBlockArray =
            backlinkFilterPanelRenderData.curDocDefBlockArray;
        let relatedDefBlockArray =
            backlinkFilterPanelRenderData.relatedDefBlockArray;
        let backlinkDocumentArray =
            backlinkFilterPanelRenderData.backlinkDocumentArray;
        let realatedDefBLockType = queryParams.filterPanelRelatedDefBlockType;

        // 先匹配关键字
        defBlockArrayTypeAndKeywordFilter(
            curDocDefBlockArray,
            null,
            queryParams.filterPanelCurDocDefBlockKeywords,
        );
        defBlockArrayTypeAndKeywordFilter(
            relatedDefBlockArray,
            realatedDefBLockType,
            queryParams.filterPanelRelatedDefBlockKeywords,
        );
        defBlockArrayTypeAndKeywordFilter(
            backlinkDocumentArray,
            null,
            queryParams.filterPanelBacklinkDocumentKeywords,
        );
        // 排序
        await defBlockArraySort(
            curDocDefBlockArray,
            queryParams.filterPanelCurDocDefBlockSortMethod,
        );
        await defBlockArraySort(
            relatedDefBlockArray,
            queryParams.filterPanelRelatedDefBlockSortMethod,
        );
        await defBlockArraySort(
            backlinkDocumentArray,
            queryParams.filterPanelBacklinkDocumentSortMethod,
        );

        backlinkFilterPanelRenderData = backlinkFilterPanelRenderData;
        // console.log("refreshFilterDisplayData ", backlinkPanelRenderData);
    }

    function refreshBacklinkPreview(isNewSearch: boolean = true) {
        if (isNewSearch) {
            // 新的搜索或筛选条件改变时，清空现有内容
            clearBacklinkProtyleList();
            totalItems = 0;
            
            // 根据配置重置状态
            if (SettingService.ins.SettingConfig.scrollLoading) {
                resetScrollLoadingState();
            } else {
                // 翻页模式下重置分页状态
                queryParams.pageNum = 1;
            }
        }

        if (isNewSearch || currentPage === 1) {
            // 首次加载或新搜索时，显示所有数据
            batchCreateOfficialBacklinkProtyle(
                backlinkFilterPanelRenderData.backlinkDocumentArray,
                backlinkFilterPanelRenderData.backlinkDataArray,
            );
            totalItems = backlinkFilterPanelRenderData.backlinkDataArray.length;
        }

        if (backlinkFilterPanelRenderData.usedCache) {
            displayHintBacklinkBlockCacheUsage = true;
        } else {
            displayHintBacklinkBlockCacheUsage = false;
        }
    }

    function clearBacklinkProtyleList() {
        let editorsTemp = getEditors();
        if (isArrayNotEmpty(editorsTemp)) {
            editorsTemp.forEach((editor) => {
                // 清理前先保存列表项折叠状态。
                updateBacklinkDocumentAndProtyleItemAndHeadlineFoldMap(editor);
                editor.destroy();
            });
        }
        clearEditors();
        if (backlinkULElement) {
            backlinkULElement.innerHTML = "";
        }
    }

    function updateBacklinkDocumentAndProtyleItemAndHeadlineFoldMap(
        editor: Protyle,
    ) {
        if (!editor || !editor.protyle || !editor.protyle.contentElement) {
            return;
        }
        let documentLiElement =
            editor.protyle.contentElement.parentElement.previousElementSibling;

        if (!documentLiElement) {
            return;
        }

        let backlinkBlockId = documentLiElement.getAttribute(
            "data-backlink-block-id",
        );
        let closeStatus = documentLiElement.classList.contains("backlink-hide");
        if (closeStatus) {
            backlinkDocumentFoldMap.set(backlinkBlockId, true);
        }

        let protyleWysiwygElement = editor.protyle.contentElement.querySelector(
            "div.protyle-wysiwyg",
        );
        let foldItemElementArray = [];
        let expandHeadingMore: boolean = false;
        if (protyleWysiwygElement) {
            foldItemElementArray = protyleWysiwygElement.querySelectorAll(
                `div[data-type="NodeListItem"].li[fold="1"]`,
            );
            expandHeadingMore = !Boolean(
                protyleWysiwygElement.querySelector(
                    `div.protyle-breadcrumb__item use`,
                ),
            );
        }
        let foldSet = backlinkProtyleItemFoldMap.get(backlinkBlockId);
        if (!foldSet) {
            foldSet = new Set<string>();
        }
        foldSet.clear();
        for (const itemElement of foldItemElementArray) {
            let nodeId = itemElement.getAttribute("data-node-id");
            foldSet.add(nodeId);
        }
        backlinkProtyleItemFoldMap.set(backlinkBlockId, foldSet);

        backlinkProtyleHeadingExpandMap.set(backlinkBlockId, expandHeadingMore);
    }

    function batchCreateOfficialBacklinkProtyle(
        backlinkDocumentArray: DefBlock[],
        backlinkDataArray: IBacklinkData[],
    ) {
        if (isArrayEmpty(backlinkDataArray)) {
            let pElement = document.createElement("p");
            pElement.style.padding = "5px 15px";
            pElement.innerText = window.siyuan.languages.emptyContent;
            backlinkULElement.append(pElement);
        }

        for (const backlinkDoc of backlinkDataArray) {
            let backlinkNode = backlinkDoc.backlinkBlock;
            let backlinkBlockId = backlinkNode.id;
            let notebookId = backlinkNode.box;

            let documentName: string = "";
            for (const document of backlinkDocumentArray) {
                if (document.id == backlinkNode.root_id) {
                    documentName = document.content;
                    break;
                }
            }
            let backlinkRootId = backlinkNode.root_id;
            // let backlinkRootId = backlinkDoc.blockPaths[0].id;

            let documentLiElement = createdDocumentLiElement(
                documentName,
                backlinkBlockId,
                backlinkRootId,
                backlinkNode.content,
            );

            let backlinks: IBacklinkData[] = [backlinkDoc];
            const editorElement = document.createElement("div");
            editorElement.style.minHeight = "auto";

            backlinkULElement.append(editorElement);
            const editor = new Protyle(EnvConfig.ins.app, editorElement, {
                blockId: backlinkRootId,
                backlinkData: backlinks,
                render: {
                    background: false,
                    title: false,
                    gutter: true,
                    scroll: false,
                    breadcrumb: false,
                },
            });
            afterCreateBacklinkProtyle(backlinkDoc, documentLiElement, editor);

            editor.protyle.notebookId = notebookId;

            let editorsTemp = getEditors();
            editorsTemp.push(editor);
        }
    }
    
    function appendBacklinkProtyle(
        backlinkDocumentArray: DefBlock[],
        backlinkDataArray: IBacklinkData[],
    ) {
        if (isArrayEmpty(backlinkDataArray)) {
            return;
        }

        for (const backlinkDoc of backlinkDataArray) {
            let backlinkNode = backlinkDoc.backlinkBlock;
            let backlinkBlockId = backlinkNode.id;
            let notebookId = backlinkNode.box;

            let documentName: string = "";
            for (const document of backlinkDocumentArray) {
                if (document.id == backlinkNode.root_id) {
                    documentName = document.content;
                    break;
                }
            }
            let backlinkRootId = backlinkNode.root_id;

            let documentLiElement = createdDocumentLiElement(
                documentName,
                backlinkBlockId,
                backlinkRootId,
                backlinkNode.content,
            );

            let backlinks: IBacklinkData[] = [backlinkDoc];
            const editorElement = document.createElement("div");
            editorElement.style.minHeight = "auto";

            backlinkULElement.append(editorElement);
            const editor = new Protyle(EnvConfig.ins.app, editorElement, {
                blockId: backlinkRootId,
                backlinkData: backlinks,
                render: {
                    background: false,
                    title: false,
                    gutter: true,
                    scroll: false,
                    breadcrumb: false,
                },
            });
            afterCreateBacklinkProtyle(backlinkDoc, documentLiElement, editor);

            editor.protyle.notebookId = notebookId;

            let editorsTemp = getEditors();
            editorsTemp.push(editor);
        }
    }

    function afterCreateBacklinkProtyle(
        backlinkData: IBacklinkData,
        documentLiElement: HTMLElement,
        protyle: Protyle,
    ) {
        // 手动发送一下加载 Protyle 事件，实验方法，仅对自己的插件起效
        EnvConfig.ins.plugin.app.plugins.forEach((item) => {
            if (item.name != "syplugin-image-pin-preview") {
                return;
            }
            item.eventBus.emit("loaded-protyle-static", {
                protyle: protyle.protyle,
            });
        });
        let protyleContentElement = protyle.protyle.contentElement;

        let backlinkBlockId = backlinkData.backlinkBlock.id;

        // 是否折叠反链文档
        if (backlinkDocumentFoldMap.get(backlinkBlockId) === true) {
            collapseBacklinkDocument(documentLiElement);
        }

        // 展开列表项，首先判断有没有历史记录，存在历史记录则用记录
        let foldIdSet = backlinkProtyleItemFoldMap.get(backlinkBlockId);
        if (foldIdSet) {
            foldListItemNodeByIdSet(protyleContentElement, foldIdSet);
        } else {
            let defaultExpandedListItemLevel =
                SettingService.ins.SettingConfig.defaultExpandedListItemLevel;
            if (defaultExpandedListItemLevel > 0) {
                expandListItemNodeByDepth(
                    protyleContentElement,
                    defaultExpandedListItemLevel,
                );
            }
        }

        // 展开大纲下的子内容
        let expandHeadingMore =
            backlinkProtyleHeadingExpandMap.get(backlinkBlockId);

        if (expandHeadingMore) {
            expandBacklinkHeadingMore(protyleContentElement);
        }

        // 隐藏筛选条件中不相干的列表项，
        hideOtherListItemElement(backlinkData, protyle);

        // 高亮搜索内容
        let keywordArray = splitKeywordStringToArray(
            queryParams.backlinkKeywordStr,
        );
        // 去掉关键词前面存在的匹配符
        for (let i = 0; i < keywordArray.length; i++) {
            let keyword = keywordArray[i];
            if (keyword.startsWith("-%") || keyword.startsWith("%-")) {
                keywordArray[i] = keyword.slice(2);
            } else if (keyword.startsWith("%") || keyword.startsWith("-")) {
                keywordArray[i] = keyword.slice(1);
            }
        }
        highlightElementTextByCss(documentLiElement, keywordArray);
        delayedTwiceRefresh(() => {
            highlightElementTextByCss(protyleContentElement, keywordArray);
        }, 100);

        // 主要防止手机端侧边栏上下滑动导致退回
        protyleContentElement.addEventListener("touchend", (event) => {
            event.stopPropagation();
        });
    }

    function hideOtherListItemElement(
        backlinkData: IBacklinkData,
        protyle: Protyle,
    ) {
        // 因为之前筛选面板的设计没有考虑到选择一个关联定义块后，隐藏其他没有这个定义块的列表这个功能，所以这里隐藏了，筛选面板不会隐藏，暂时不处理
        // return;
        let protyleContentElement = protyle.protyle.contentElement;

        let inclucdeRelatedDefBlockIds = queryParams.includeRelatedDefBlockIds;
        let excludeRelatedDefBlockIds = queryParams.excludeRelatedDefBlockIds;
        if (
            isSetEmpty(inclucdeRelatedDefBlockIds) &&
            isSetEmpty(excludeRelatedDefBlockIds)
        ) {
            return;
        }

        // 首先判断反链块是否是列表项
        let targetBlockParentElement = protyleContentElement.querySelector(
            `div[data-node-id='${backlinkData.backlinkBlock.id}']`,
        ).parentElement;
        if (
            !targetBlockParentElement.matches(`div[data-type="NodeListItem"]`)
        ) {
            return;
        }
        let includeChildListItemIdArray =
            backlinkData.includeChildListItemIdArray;
        let excludeChildLisetItemIdArray =
            backlinkData.excludeChildLisetItemIdArray;

        if (
            isSetNotEmpty(inclucdeRelatedDefBlockIds) &&
            isArrayNotEmpty(includeChildListItemIdArray)
        ) {
            // 获取所有子列表项块
            let allListItemElement = targetBlockParentElement.querySelectorAll(
                `div[data-type="NodeListItem"]`,
            );
            // 先把所有列表项块隐藏
            for (const itemElement of allListItemElement) {
                itemElement.classList.add("fn__none");
            }
            for (const itemId of includeChildListItemIdArray) {
                let targetElement = targetBlockParentElement.querySelector(
                    `div[data-type="NodeListItem"][data-node-id="${itemId}"]`,
                );
                if (targetElement) {
                    targetElement.classList.remove("fn__none");
                }
            }
        }
        if (
            isSetNotEmpty(excludeRelatedDefBlockIds) &&
            isArrayNotEmpty(excludeChildLisetItemIdArray)
        ) {
            for (const itemId of excludeChildLisetItemIdArray) {
                let targetElement = targetBlockParentElement.querySelector(
                    `div[data-type="NodeListItem"][data-node-id="${itemId}"]`,
                );
                if (targetElement) {
                    targetElement.classList.add("fn__none");
                }
            }
        }

        // 遍历列表项节点，把符合条件的列表项节点显示出来：包含定义块的列表项块；定义块下的列表项块。
        // for (const itemElement of allListItemElement) {
        // if (!itemElement.classList.contains("fn__none")) {
        // continue;
        // }
        // for (const blockId of inclucdeRelatedDefBlockIds) {
        // let refBlockElement = itemElement.querySelector(
        // `span[data-type="block-ref"][data-id="${blockId}"]`,
        // );
        // if (!refBlockElement) {
        // continue;
        // }
        // itemElement.classList.remove("fn__none");
        // let refBlockParentItemElement =
        // getParentListItemElement(refBlockElement);
        // if (refBlockParentItemElement) {
        // let refBlockChildListItemElement =
        // refBlockParentItemElement.querySelectorAll(
        // `div[data-type="NodeListItem"]`,
        // );
        // for (const itemElement of refBlockChildListItemElement) {
        // itemElement.classList.remove("fn__none");
        // }
        // }
        // }
        // }
    }

    //    function getParentListItemElement(element: Element): Element {
    //        let itemElement = element;
    //        while (
    //            itemElement &&
    //            !itemElement.matches(`div[data-type="NodeListItem"]`)
    //        ) {
    //            itemElement = itemElement.parentElement;
    //        }
    //        return itemElement;
    //    }

    function createdDocumentLiElement(
        documentName: string,
        backlinkBlockId: string,
        backlinkRootId: string,
        docAriaText: string,
    ): HTMLElement {
        let documentLiElement = document.createElement("li");

        documentLiElement.classList.add(
            "b3-list-item",
            "b3-list-item--hide-action",
            "list-item__document-name",
        );
        documentLiElement.setAttribute("data-node-id", backlinkRootId);
        documentLiElement.setAttribute(
            "data-backlink-block-id",
            backlinkBlockId,
        );
        if (docAriaText) {
            docAriaText = docAriaText.substring(0, 100);
        }

        documentLiElement.innerHTML = `
<span style="padding-left: 4px;margin-right: 2px" class="b3-list-item__toggle b3-list-item__toggle--hl">
<svg class="b3-list-item__arrow b3-list-item__arrow--open"><use xlink:href="#iconRight"></use></svg>
</span>
<svg class="b3-list-item__graphic popover__block"><use xlink:href="#iconFile"></use></svg>
<span class="b3-list-item__text ariaLabel"  aria-label="${docAriaText}"  >
${documentName}
</span>
<svg class="b3-list-item__graphic counter ariaLabel expand-listitem-icon" aria-label="展开所有列表项"><use xlink:href="#iconLiElementExpand"></use></svg>
<svg class="b3-list-item__graphic counter ariaLabel collapse-listitem-icon" aria-label="折叠所有列表项"><use xlink:href="#iconLiElementCollapse"></use></svg>
`;
        documentLiElement.addEventListener("click", (event: MouseEvent) => {
            clickBacklinkDocumentLiElement(event);
        });

        documentLiElement.addEventListener(
            "contextmenu",
            (event: MouseEvent) => {
                contextmenuBacklinkDocumentLiElement(event);
            },
        );

        documentLiElement.addEventListener("mousedown", (event: MouseEvent) => {
            if (event.button !== 1) {
                return;
            }
            event.stopPropagation();
            event.preventDefault();
            const target = event.currentTarget as HTMLElement;
            toggleBacklinkDocument(target);
        });

        documentLiElement
            .querySelector(
                "li > svg.b3-list-item__graphic.counter.ariaLabel.expand-listitem-icon",
            )
            .addEventListener("click", (event: MouseEvent) => {
                clickExpandAllListItemNode(event);
                event.stopPropagation();
            });

        documentLiElement
            .querySelector(
                "li > svg.b3-list-item__graphic.counter.ariaLabel.collapse-listitem-icon",
            )
            .addEventListener("click", (event: MouseEvent) => {
                clickCollapseAllListItemNode(event);
                event.stopPropagation();
            });

        backlinkULElement.append(documentLiElement);
        return documentLiElement;
    }

    function getDefBlockAriaLabel(
        defBlock: DefBlock,
        showContent: boolean = false,
    ): string {
        let ariaLabel = "";
        if (!defBlock) {
            return ariaLabel;
        }
        let ariaLabelRow = [];
        if (defBlock.name) {
            ariaLabelRow.push(
                `<br>${window.siyuan.languages.name}: ${defBlock.name}`,
            );
        }
        if (defBlock.alias) {
            ariaLabelRow.push(
                `<br>${window.siyuan.languages.alias}: ${defBlock.alias}`,
            );
        }
        if (defBlock.staticAnchor) {
            ariaLabelRow.push(
                `<br>${window.siyuan.languages.anchor}: ${defBlock.staticAnchor}`,
            );
        }
        if (showContent) {
            ariaLabelRow.push(`<br> ${defBlock.content.substring(0, 100)}`);
        }
        // if (defBlock.memo) {
        //     ariaLabelRow.push(
        //         `<br>${window.siyuan.languages.memo} ${defBlock.memo}`,
        //     );
        // }
        ariaLabel = ariaLabelRow.join("");
        ariaLabel = removePrefixAndSuffix(ariaLabel, "<br>", "<br>");
        return ariaLabel;
    }

    function clearCacheAndRefresh() {
        CacheManager.ins.deleteBacklinkPanelAllCache(rootId);
        initBaseData();
    }

    function resetFilterQueryParametersToDefault() {
        let defaultQueryParams =
            BacklinkFilterPanelAttributeService.ins.getDefaultQueryParams();

        queryParams.filterPanelCurDocDefBlockSortMethod =
            defaultQueryParams.filterPanelCurDocDefBlockSortMethod;
        queryParams.filterPanelCurDocDefBlockKeywords = "";

        queryParams.includeRelatedDefBlockIds.clear();
        queryParams.excludeRelatedDefBlockIds.clear();
        queryParams.filterPanelRelatedDefBlockType =
            defaultQueryParams.filterPanelRelatedDefBlockType;
        queryParams.filterPanelRelatedDefBlockSortMethod =
            defaultQueryParams.filterPanelRelatedDefBlockSortMethod;
        queryParams.filterPanelRelatedDefBlockKeywords = "";

        queryParams.includeDocumentIds.clear();
        queryParams.excludeDocumentIds.clear();
        queryParams.filterPanelBacklinkDocumentSortMethod =
            defaultQueryParams.filterPanelBacklinkDocumentSortMethod;
        queryParams.filterPanelBacklinkDocumentKeywords = "";
        queryParams = queryParams;
        updateRenderData();
    }

    function resetBacklinkQueryParametersToDefault() {
        let defaultQueryParams =
            BacklinkFilterPanelAttributeService.ins.getDefaultQueryParams();
        queryParams.backlinkCurDocDefBlockType =
            defaultQueryParams.backlinkCurDocDefBlockType;
        queryParams.backlinkBlockSortMethod =
            defaultQueryParams.backlinkBlockSortMethod;
        queryParams.backlinkKeywordStr = "";

        updateRenderData();
    }

    // 处理定义块点击事件
    function handleRelatedDefBlockClick(event, defBlock: DefBlock) {
        if (event) {
        }
        if (event.shiftKey) {
            addExcludeRelatedDefBlockCondition(defBlock);
            return;
        }
        clickCount++;
        if (clickCount === 1) {
            clearTimeout(clickTimeoutId);
            clickTimeoutId = setTimeout(() => {
                // console.log(`关联块左键单击 : ${event.type} ${event.button}`);
                clickCount = 0;
                addIncludeRelatedDefBlockCondition(defBlock);
            }, doubleClickTimeout);
        } else {
            // console.log(`关联块左键双击 : ${event.type} ${event.button}`);
            clearTimeout(clickTimeoutId);
            clickCount = 0;
            addExcludeRelatedDefBlockCondition(defBlock);
        }
    }
    function handleRelatedDefBlockContextmenu(event, defBlock: DefBlock) {
        if (event) {
        }
        // console.log(`关联块右键单击 : ${event.type} ${event.button}`);
        addExcludeRelatedDefBlockCondition(defBlock);
    }

    // 处理文档块点击事件
    function handleRelatedDocBlockClick(event: MouseEvent, defBlock: DefBlock) {
        if (event) {
        }
        if (event.shiftKey) {
            addExcludeRelatedDocBlockCondition(defBlock);
            return;
        }
        clickCount++;
        if (clickCount === 1) {
            clearTimeout(clickTimeoutId);
            clickTimeoutId = setTimeout(() => {
                // console.log(`文档块左键单击 : ${event.type} ${event.button}`);
                clickCount = 0;
                addIncludeRelatedDocBlockCondition(defBlock);
            }, doubleClickTimeout);
        } else {
            // console.log(`文档块左键双击 : ${event.type} ${event.button}`);
            clearTimeout(clickTimeoutId);
            clickCount = 0;
            addExcludeRelatedDocBlockCondition(defBlock);
        }
    }

    function handleRelatedDocBlockContextmenu(event, defBlock: DefBlock) {
        if (event) {
        }
        // console.log(`文档块右键单击 : ${event.type} ${event.button}`);
        addExcludeRelatedDocBlockCondition(defBlock);
    }

    function addIncludeRelatedDefBlockCondition(defBlock: DefBlock) {
        let includeRelatedDefBlockIds = queryParams.includeRelatedDefBlockIds;
        let defBlockId = defBlock.id;
        let recover = recoverDefBlockStatus(defBlock);
        if (!recover) {
            includeRelatedDefBlockIds.add(defBlockId);
        }

        updateRenderData();
    }

    function addExcludeRelatedDefBlockCondition(defBlock: DefBlock) {
        let excludeRelatedDefBlockIds = queryParams.excludeRelatedDefBlockIds;
        let defBlockId = defBlock.id;
        let recover = recoverDefBlockStatus(defBlock);
        if (!recover) {
            excludeRelatedDefBlockIds.add(defBlockId);
        }

        updateRenderData();
    }

    function addIncludeRelatedDocBlockCondition(defBlock: DefBlock) {
        let includeDocumentIds = queryParams.includeDocumentIds;
        let defBlockId = defBlock.id;
        let recover = recoverDocBlockStatus(defBlock);
        if (!recover) {
            includeDocumentIds.add(defBlockId);
        }

        updateRenderData();
    }

    function addExcludeRelatedDocBlockCondition(defBlock: DefBlock) {
        let excludeDocumentIds = queryParams.excludeDocumentIds;
        let defBlockId = defBlock.id;
        let recover = recoverDocBlockStatus(defBlock);
        if (!recover) {
            excludeDocumentIds.add(defBlockId);
        }

        updateRenderData();
    }

    function recoverDefBlockStatus(defBlock: DefBlock): boolean {
        let includeRelatedDefBlockIds = queryParams.includeRelatedDefBlockIds;
        let excludeRelatedDefBlockIds = queryParams.excludeRelatedDefBlockIds;
        let defBlockId = defBlock.id;
        if (includeRelatedDefBlockIds.has(defBlockId)) {
            includeRelatedDefBlockIds.delete(defBlockId);
            return true;
        }
        if (excludeRelatedDefBlockIds.has(defBlockId)) {
            excludeRelatedDefBlockIds.delete(defBlockId);
            return true;
        }
        return false;
    }

    function recoverDocBlockStatus(defBlock: DefBlock): boolean {
        let includeDocumentIds = queryParams.includeDocumentIds;
        let excludeDocumentIds = queryParams.excludeDocumentIds;
        let defBlockId = defBlock.id;
        if (includeDocumentIds.has(defBlockId)) {
            includeDocumentIds.delete(defBlockId);
            return true;
        }
        if (excludeDocumentIds.has(defBlockId)) {
            excludeDocumentIds.delete(defBlockId);
            return true;
        }
        return false;
    }

    function handleCriteriaConfirm() {
        if (isStrBlank(saveCriteriaInputText)) {
            return;
        }
        let savedQueryParams: IPanelRednerFilterQueryParams = JSON.parse(
            JSON.stringify(queryParams),
        );
        if (!savedQueryParamMap) {
            savedQueryParamMap = new Map();
        }
        console.log(
            "handleCriteriaConfirm saveCriteriaInputText : ",
            saveCriteriaInputText,
            " savedQueryParams : ",
            savedQueryParams,
        );
        savedQueryParamMap.set(saveCriteriaInputText, savedQueryParams);
        BacklinkFilterPanelAttributeService.ins.updatePanelSavedCriteriaMap(
            rootId,
            savedQueryParamMap,
        );
        savedQueryParamMap = savedQueryParamMap;

        saveCriteriaInputText = "";
        showSaveCriteriaInputBox = false;
    }
    function handleCriteriaCancel() {
        saveCriteriaInputText = "";
        showSaveCriteriaInputBox = false;
    }
    function hadnleSavedPanelCriteriaClick(name: string) {
        let savedQueryParam = savedQueryParamMap.get(name);
        if (!savedQueryParam) {
            return;
        }
        // 根据配置重置状态
        if (SettingService.ins.SettingConfig.scrollLoading) {
            resetScrollLoadingState();
        } else {
            // 翻页模式下重置分页状态
            queryParams.pageNum = 1;
        }
        queryParams.backlinkCurDocDefBlockType =
            savedQueryParam.backlinkCurDocDefBlockType;
        queryParams.backlinkBlockSortMethod =
            savedQueryParam.backlinkBlockSortMethod;
        queryParams.backlinkKeywordStr = savedQueryParam.backlinkKeywordStr;
        queryParams.includeRelatedDefBlockIds =
            savedQueryParam.includeRelatedDefBlockIds;
        queryParams.excludeRelatedDefBlockIds =
            savedQueryParam.excludeRelatedDefBlockIds;
        queryParams.includeDocumentIds = savedQueryParam.includeDocumentIds;
        queryParams.excludeDocumentIds = savedQueryParam.excludeDocumentIds;
        queryParams.filterPanelCurDocDefBlockSortMethod =
            savedQueryParam.filterPanelCurDocDefBlockSortMethod;
        queryParams.filterPanelCurDocDefBlockKeywords =
            savedQueryParam.filterPanelCurDocDefBlockKeywords;
        queryParams.filterPanelRelatedDefBlockType =
            savedQueryParam.filterPanelRelatedDefBlockType;
        queryParams.filterPanelRelatedDefBlockSortMethod =
            savedQueryParam.filterPanelRelatedDefBlockSortMethod;
        queryParams.filterPanelRelatedDefBlockKeywords =
            savedQueryParam.filterPanelRelatedDefBlockKeywords;
        queryParams.filterPanelBacklinkDocumentSortMethod =
            savedQueryParam.filterPanelBacklinkDocumentSortMethod;
        queryParams.filterPanelBacklinkDocumentKeywords =
            savedQueryParam.filterPanelBacklinkDocumentKeywords;

        console.log("hadnleSavedPanelCriteriaClick", queryParams);

        updateRenderData();
    }
    function hadnleSavedPanelCriteriaDeleteClick(name: string) {
        savedQueryParamMap.delete(name);
        BacklinkFilterPanelAttributeService.ins.updatePanelSavedCriteriaMap(
            rootId,
            savedQueryParamMap,
        );
        savedQueryParamMap = savedQueryParamMap;
    }

    function handleBacklinkKeywordInput() {
        // 清除之前的定时器
        clearTimeout(inputChangeTimeoutId);

        inputChangeTimeoutId = setTimeout(() => {
            updateRenderData();
        }, 450);
    }

    function handleFilterPanelInput() {
        // 清除之前的定时器
        clearTimeout(inputChangeTimeoutId);

        inputChangeTimeoutId = setTimeout(() => {
            refreshFilterDisplayData();
        }, 100);
    }

    function getBlockTypeIconHrefByBlock(block: Block) {
        if (!block) {
            return "";
        }
        return getBlockTypeIconHref(block.type, block.subtype);
    }

    function handleKeyDownDefault(event) {
        console.log(event.key);
    }

    function getEditors(): Protyle[] {
        if (currentTab) {
            return currentTab.editors;
        }
        return defalutEditors;
    }
    function clearEditors() {
        if (currentTab) {
            currentTab.editors = [];
        }
        defalutEditors = [];
    }

    
    /* 滚动加载相关函数 */
    function resetScrollLoadingState() {
        currentPage = 1;
        isLoadingMore = false;
        hasMoreData = true;
        totalItems = 0;
    }
    
    function initScrollListener() {
        console.log('初始化滚动监听器');
        // console.log('backlinkULElement:', backlinkULElement);
        
        // 监听最近的具有滚动条的父容器
        const scrollContainer = findScrollableContainer();
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            console.log('滚动监听器已绑定到:', scrollContainer);
        } else {
            // 如果没有找到合适的容器，监听window
            window.addEventListener('scroll', handleScroll);
            console.log('滚动监听器已绑定到window');
        }
    }
    
    function findScrollableContainer(): HTMLElement | null {
        if (!backlinkULElement) return null;
        
        // 从backlinkULElement开始向上查找具有滚动条的父容器
        let parent = backlinkULElement.parentElement;
        while (parent) {
            const { scrollHeight, clientHeight } = parent;
            if (scrollHeight > clientHeight) {
                console.log('找到可滚动容器:', parent);
                return parent;
            }
            parent = parent.parentElement;
        }
        
        return null;
    }
    
    function handleScroll(event: Event) {
        const target = event.target as HTMLElement;
        let scrollTop: number, scrollHeight: number, clientHeight: number;
        
        if (target === window) {
            // 如果是window滚动
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
        } else {
            // 如果是容器滚动
            scrollTop = target.scrollTop;
            scrollHeight = target.scrollHeight;
            clientHeight = target.clientHeight;
        }
        
        // console.log('Scroll position:', scrollTop, scrollHeight, clientHeight);

        // 当滚动到距离底部50px时触发加载
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            // console.log('触发加载更多数据');
            // console.log(hasMoreData);
            // console.log()
            loadMoreData();
        }
    }
    
    async function loadMoreData() {
        if (isLoadingMore || !hasMoreData) {
            return;
        }
        
        isLoadingMore = true;
        currentPage++;
        
        try {
            // 重新获取数据，但只取当前页的数据
            const moreData = await getBacklinkPanelRenderData(
                backlinkFilterPanelBaseData,
                {
                    ...queryParams,
                    pageNum: currentPage,
                    pageSize: pageSize
                }
            );
            
            console.log('加载更多数据:', moreData);

            if (moreData.rootId != rootId) {
                return;
            }
            
            // 追加新数据
            if (moreData.backlinkDataArray && moreData.backlinkDataArray.length > 0) {
                // 更新渲染数据
                backlinkFilterPanelRenderData.backlinkDataArray = [
                    ...backlinkFilterPanelRenderData.backlinkDataArray,
                    ...moreData.backlinkDataArray
                ];
                
                // 继续渲染新的反链数据
                appendBacklinkProtyle(
                    backlinkFilterPanelRenderData.backlinkDocumentArray,
                    moreData.backlinkDataArray
                );
                
                totalItems += moreData.backlinkDataArray.length;
                
                // 如果返回的数据少于页面大小，说明没有更多数据了
                if (moreData.backlinkDataArray.length < pageSize) {
                    hasMoreData = false;
                }
            } else {
                hasMoreData = false;
            }
            
        } catch (error) {
            console.error('加载更多数据失败:', error);
            currentPage--; // 失败时回退页码
        } finally {
            isLoadingMore = false;
        }
    }
    

</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="backlink-panel__area">
    {#if !rootId}
        <p style="padding: 10px 20px;">
            没有获取到当前文档信息，请切换文档重试
        </p>
    {/if}
    {#if displayHintPanelBaseDataCacheUsage}
        <p style="padding: 10px 20px;">此次面板使用了缓存数据</p>
    {/if}
    <div class="backlink-panel__header">
        <div
            class="panel__title filter-panel__title block__icons"
            on:click={() => {
                panelFilterViewExpand = !panelFilterViewExpand;
            }}
            on:keydown={handleKeyDownDefault}
        >
            <div class="block__logo" style="font-weight: bold;">
                <svg class="block__logoicon"
                    ><use xlink:href="#iconFilter"></use></svg
                >筛选面板
            </div>
            <span class="fn__flex-1"></span>
            <span class="fn__space"></span>
            <span
                class="block__icon ariaLabel"
                aria-label="恢复默认"
                on:click|stopPropagation={resetFilterQueryParametersToDefault}
                on:keydown={handleKeyDownDefault}
                ><svg class=""
                    ><use xlink:href="#iconResetInitialization"></use></svg
                ></span
            >
            <span class="fn__space"></span>
            <span class="fn__space"></span>
            <span
                class="block__icon ariaLabel"
                aria-label="清除缓存并刷新"
                on:click|stopPropagation={clearCacheAndRefresh}
                on:keydown={handleKeyDownDefault}
                ><svg class=""><use xlink:href="#iconRefresh"></use></svg></span
            >
            <span class="fn__space"></span>
            <span class="fn__space"></span>
            {#if panelFilterViewExpand}
                <span class="block__icon ariaLabel" aria-label="折叠">
                    <svg><use xlink:href="#iconUp"></use></svg>
                </span>
            {/if}
            {#if !panelFilterViewExpand}
                <span class="block__icon ariaLabel" aria-label="展开">
                    <svg><use xlink:href="#iconDown"></use></svg>
                </span>
            {/if}
        </div>
    </div>
    <!-- 筛选条件区域 -->
    {#if backlinkFilterPanelRenderData && panelFilterViewExpand}
        <div class="backlink-panel-filter">
            <div class="fn__flex">
                <div class="filter-panel__sub_title">定义块范围：</div>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={queryCurDocDefBlockRange}
                    on:change={initBaseData}
                    style="flex: 0.7;"
                >
                    {#each CUR_DOC_DEF_BLOCK_TYPE_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value == queryCurDocDefBlockRange}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={queryParams.filterPanelCurDocDefBlockSortMethod}
                    on:change={refreshFilterDisplayData}
                >
                    {#each CUR_DOC_DEF_BLOCK_SORT_METHOD_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.filterPanelCurDocDefBlockSortMethod}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <input
                    class="b3-text-field fn__size200"
                    on:input={handleFilterPanelInput}
                    bind:value={queryParams.filterPanelCurDocDefBlockKeywords}
                />
            </div>
            <div>
                <div class="defblock-list">
                    {#each backlinkFilterPanelRenderData.curDocDefBlockArray as defBlock (defBlock.id)}
                        {#if !defBlock.filterStatus}
                            <div
                                id={defBlock.id}
                                class="tag ariaLabel {defBlock.selectionStatus.toLowerCase()}"
                                aria-label={getDefBlockAriaLabel(
                                    defBlock,
                                    true,
                                )}
                                on:click|preventDefault={(event) =>
                                    handleRelatedDefBlockClick(event, defBlock)}
                                on:contextmenu|preventDefault={(event) =>
                                    handleRelatedDefBlockContextmenu(
                                        event,
                                        defBlock,
                                    )}
                                on:keydown={handleKeyDownDefault}
                            >
                                <svg class="b3-list-item__graphic">
                                    <use
                                        xlink:href={getBlockTypeIconHrefByBlock(
                                            defBlock,
                                        )}
                                    ></use>
                                </svg>
                                <span class="block-content">
                                    {defBlock.content}
                                </span>
                                <span class="count">{defBlock.refCount}</span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
            <div class="fn__flex">
                <div class="filter-panel__sub_title">关联的定义块：</div>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={queryParams.filterPanelRelatedDefBlockType}
                    on:change={refreshFilterDisplayData}
                    style="flex: 0.5;"
                >
                    {#each RELATED_DEF_BLOCK_TYPE_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.filterPanelRelatedDefBlockType}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={
                        queryParams.filterPanelRelatedDefBlockSortMethod
                    }
                    on:change={refreshFilterDisplayData}
                >
                    {#each RELATED_DEF_BLOCK_SORT_METHOD_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.filterPanelRelatedDefBlockSortMethod}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <input
                    class="b3-text-field fn__size200"
                    on:input={handleFilterPanelInput}
                    bind:value={queryParams.filterPanelRelatedDefBlockKeywords}
                />
            </div>
            <div>
                <div class="defblock-list">
                    {#each backlinkFilterPanelRenderData.relatedDefBlockArray as defBlock (defBlock.id)}
                        {#if !defBlock.filterStatus}
                            <div
                                class="tag ariaLabel {defBlock.selectionStatus.toLowerCase()}"
                                aria-label={getDefBlockAriaLabel(
                                    defBlock,
                                    true,
                                )}
                                on:click={(event) =>
                                    handleRelatedDefBlockClick(event, defBlock)}
                                on:contextmenu|preventDefault={(event) =>
                                    handleRelatedDefBlockContextmenu(
                                        event,
                                        defBlock,
                                    )}
                                on:keydown={handleKeyDownDefault}
                            >
                                <svg class="b3-list-item__graphic">
                                    <use
                                        xlink:href={getBlockTypeIconHrefByBlock(
                                            defBlock,
                                        )}
                                    ></use>
                                </svg>
                                <span class="block-content">
                                    {defBlock.content}
                                </span>
                                <span class="count">{defBlock.refCount}</span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
            <div class="fn__flex">
                <div class="filter-panel__sub_title">反链所在文档：</div>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={
                        queryParams.filterPanelBacklinkDocumentSortMethod
                    }
                    on:change={refreshFilterDisplayData}
                >
                    {#each RELATED_DOCMUMENT_SORT_METHOD_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.filterPanelBacklinkDocumentSortMethod}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <input
                    class="b3-text-field fn__size200"
                    on:input={handleFilterPanelInput}
                    bind:value={queryParams.filterPanelBacklinkDocumentKeywords}
                />
            </div>

            <div>
                <div class="defblock-list">
                    {#each backlinkFilterPanelRenderData.backlinkDocumentArray as defBlock (defBlock.id)}
                        {#if !defBlock.filterStatus}
                            <!-- svelte-ignore a11y-no-static-element-interactions -->
                            <div
                                class="tag ariaLabel {defBlock.selectionStatus.toLowerCase()}"
                                aria-label={getDefBlockAriaLabel(
                                    defBlock,
                                    true,
                                )}
                                on:click={(event) =>
                                    handleRelatedDocBlockClick(event, defBlock)}
                                on:contextmenu|preventDefault={(event) =>
                                    handleRelatedDocBlockContextmenu(
                                        event,
                                        defBlock,
                                    )}
                                on:keydown={handleKeyDownDefault}
                            >
                                <svg class="b3-list-item__graphic">
                                    <use
                                        xlink:href={getBlockTypeIconHrefByBlock(
                                            defBlock,
                                        )}
                                    ></use>
                                </svg>
                                <span class="block-content">
                                    {defBlock.content}
                                </span>
                                <span class="count">{defBlock.refCount}</span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
            <!-- <hr /> -->
            <div>
                <p>
                    <button
                        style="margin-right: 12px;"
                        class="b3-button save-button"
                        on:click={() => {
                            showSaveCriteriaInputBox = true;
                        }}>保存当前条件</button
                    >
                    {#if savedQueryParamMap}
                        {#each savedQueryParamMap.keys() as name}
                            <div class="tag optional" style="padding: 4px;">
                                <span
                                    class="block-content"
                                    style="min-width:30px;"
                                    on:click={() => {
                                        hadnleSavedPanelCriteriaClick(name);
                                    }}
                                    on:keydown={handleKeyDownDefault}
                                >
                                    {name}
                                </span>
                                <span
                                    class="block__icon"
                                    style="padding: 2px 6px"
                                    on:click={() => {
                                        hadnleSavedPanelCriteriaDeleteClick(
                                            name,
                                        );
                                    }}
                                    on:keydown={handleKeyDownDefault}
                                >
                                    <svg style="width: 8px;"
                                        ><use xlink:href="#iconClose"
                                        ></use></svg
                                    >
                                </span>
                            </div>
                        {/each}
                    {/if}
                </p>
                {#if showSaveCriteriaInputBox}
                    <div class="input-box">
                        <input
                            type="text"
                            bind:value={saveCriteriaInputText}
                            class="b3-text-field input-field"
                            placeholder="请输入名称"
                        />
                        <div class="buttons">
                            <button
                                class="cancel-button b3-button b3-button--outline"
                                on:click={handleCriteriaCancel}>取消</button
                            >
                            <button
                                class="confirm-button b3-button"
                                on:click={handleCriteriaConfirm}>确定</button
                            >
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
    <!-- 反链块展示区 -->
    <div class="backlink-panel__header">
        <div
            class="panel__title backlink-panel__title block__icons"
            on:click={() => {
                panelBacklinkViewExpand = !panelBacklinkViewExpand;
            }}
            on:keydown={handleKeyDownDefault}
        >
            <div class="block__logo" style="font-weight: bold;">
                <svg class="block__logoicon"
                    ><use xlink:href="#iconLink"></use></svg
                >反向链接
            </div>
            <span class="fn__flex-1"></span>
            <span class="fn__space"></span>
            <span
                class="block__icon b3-tooltips b3-tooltips__sw"
                aria-label="恢复默认"
                on:click|stopPropagation={resetBacklinkQueryParametersToDefault}
                on:keydown={handleKeyDownDefault}
                ><svg class=""
                    ><use xlink:href="#iconResetInitialization"></use></svg
                ></span
            >
            <span class="fn__space"></span>
            <span class="fn__space"></span>

            {#if panelBacklinkViewExpand}
                <span
                    class="block__icon b3-tooltips b3-tooltips__sw"
                    aria-label="折叠"
                >
                    <svg><use xlink:href="#iconUp"></use></svg>
                </span>
            {/if}
            {#if !panelBacklinkViewExpand}
                <span
                    class="block__icon b3-tooltips b3-tooltips__sw"
                    aria-label="展开"
                >
                    <svg><use xlink:href="#iconDown"></use></svg>
                </span>
            {/if}
        </div>
        {#if panelBacklinkViewExpand && queryParams}
            <div class="fn__flex" style="padding: 5px 15px; maragin:0px;">
                <select
                    class="b3-select fn__flex-center ariaLabel"
                    bind:value={queryParams.backlinkCurDocDefBlockType}
                    on:change={updateRenderData}
                    style="flex: 0.5;"
                    aria-label="当前文档定义块类型"
                >
                    {#each RELATED_DEF_BLOCK_TYPE_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.backlinkCurDocDefBlockType}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <select
                    class="b3-select fn__flex-center"
                    bind:value={queryParams.backlinkBlockSortMethod}
                    on:change={updateRenderData}
                >
                    {#each BACKLINK_BLOCK_SORT_METHOD_ELEMENT() as element}
                        <option
                            value={element.value}
                            selected={element.value ==
                                queryParams.backlinkBlockSortMethod}
                        >
                            {element.name}
                        </option>
                    {/each}
                </select>
                <span class="fn__space"></span>
                <input
                    class="b3-text-field fn__size200"
                    on:input={handleBacklinkKeywordInput}
                    bind:value={queryParams.backlinkKeywordStr}
                />

                <span
                    class="block__icon b3-tooltips b3-tooltips__sw"
                    aria-label="展开所有文档"
                    on:click={expandAllBacklinkDocument}
                    on:contextmenu={expandAllBacklinkListItemNode}
                    on:keydown={handleKeyDownDefault}
                >
                    <svg><use xlink:href="#iconExpand"></use></svg>
                </span>
                <span class="fn__space"></span>
                <span
                    class="block__icon b3-tooltips b3-tooltips__sw"
                    aria-label="折叠所有文档"
                    on:click={collapseAllBacklinkDocument}
                    on:contextmenu={collapseAllBacklinkListItemNode}
                    on:keydown={handleKeyDownDefault}
                >
                    <svg><use xlink:href="#iconContract"></use></svg>
                </span>
            </div>
        {/if}
        {#if panelBacklinkViewExpand && backlinkFilterPanelRenderData && isArrayNotEmpty(backlinkFilterPanelRenderData.backlinkDataArray)}
            <div
                class="block__icons"
                style="overflow:auto;style=color:var(--b3-theme-on-background);"
            >
                <span class="fn__flex-shrink ft__selectnone">
                    <span class="fn__space"></span>
                    <span class="">
                        {EnvConfig.ins.i18n.findInBacklink?.replace(
                            "${x}",
                            SettingService.ins.SettingConfig.scrollLoading 
                                ? (`${totalItems}/${backlinkFilterPanelRenderData.backlinkBlockNodeArray.length}` )
                                : backlinkFilterPanelRenderData.backlinkBlockNodeArray.length,
                        )}
                    </span>
                </span>
                <span class="fn__space"></span>
                <span class="fn__flex-1" style="min-height: 100%"></span>

                {#if SettingService.ins.SettingConfig.scrollLoading}
                    <!-- 滚动加载模式 -->
                    {#if isLoadingMore}
                        <span class="fn__flex-shrink ft__selectnone">
                            加载中...
                        </span>
                    {:else if !hasMoreData}
                        <span class="fn__flex-shrink ft__selectnone">
                            已加载全部
                        </span>
                    {:else}
                        <span class="fn__flex-shrink ft__selectnone">
                            滚动加载更多
                        </span>
                    {/if}
                {:else}
                    <!-- 翻页加载模式 -->
                    <span
                        class="fn__flex-shrink ft__selectnone {backlinkFilterPanelRenderData.totalPage ==
                            null || backlinkFilterPanelRenderData.totalPage == 0
                            ? 'fn__none'
                            : ''}"
                    >
                        {backlinkFilterPanelRenderData.pageNum}/{backlinkFilterPanelRenderData.totalPage}
                    </span>
                    <span class="fn__space"></span>
                    <span
                        data-position="9bottom"
                        class="block__icon block__icon--show ariaLabel {backlinkFilterPanelRenderData.pageNum <=
                        1
                            ? 'disabled'
                            : ''}"
                        aria-label={EnvConfig.ins.i18n.previousLabel}
                        on:click={() => {
                            pageTurning(backlinkFilterPanelRenderData.pageNum - 1);
                        }}
                        on:keydown={handleKeyDownDefault}
                        ><svg><use xlink:href="#iconLeft"></use></svg></span
                    >
                    <span class="fn__space"></span>
                    <span
                        data-position="9bottom"
                        class="block__icon block__icon--show ariaLabel {backlinkFilterPanelRenderData.pageNum >=
                        backlinkFilterPanelRenderData.totalPage
                            ? 'disabled'
                            : ''}"
                        aria-label={EnvConfig.ins.i18n.nextLabel}
                        on:click={() => {
                            pageTurning(backlinkFilterPanelRenderData.pageNum + 1);
                        }}
                        on:keydown={handleKeyDownDefault}
                        ><svg><use xlink:href="#iconRight"></use></svg></span
                    >
                {/if}
                <span class="fn__space"></span>
            </div>
        {/if}
    </div>
    <div
        class="backlinkList fn__flex-1 {panelBacklinkViewExpand
            ? ''
            : 'fn__none'}"
    >
        <div class="sy__backlink">
            {#if displayHintBacklinkBlockCacheUsage}
                <div>此次查询使用了缓存数据</div>
            {/if}
            <div class="block__icons" style="display: none;"></div>
            <div class="fn__flex-1">
                <ul
                    bind:this={backlinkULElement}
                    class="b3-list b3-list--background {hideBacklinkProtyleBreadcrumb
                        ? 'hide-breadcrumb'
                        : ''}"
                ></ul>
            </div>
        </div>
    </div>
</div>

<style>
    .tag {
        display: inline-flex;
        align-items: center;
        padding: 3px 17px 3px 3px;
        margin: 4px 4px 4px 2px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        position: relative; /* 为了绝对定位的小数字 */
        max-width: 120px;
        max-height: 30px;
        overflow: hidden; /* 隐藏超出部分的文本 */
        text-overflow: ellipsis; /* 超出部分显示省略号 */
        vertical-align: top; /* 垂直对齐 */
        font-size: 12px;
        white-space: nowrap; /* 禁止换行 */
        opacity: 0.9;
    }

    .selected {
        background-color: rgba(26, 188, 156, 1);
        color: white;
        border: 1px solid rgba(26, 188, 156, 0.4);
    }
    .tag.selected:hover {
        background-color: rgba(26, 188, 156, 0.9);
    }
    .excluded {
        background-color: black;
        color: white;
        border: 1px solid rgba(0, 0, 0, 0.6);
    }
    .tag.excluded:hover {
        background-color: rgba(0, 0, 0, 0.7);
    }
    .optional {
        background-color: var(--b3-theme-background);
        color: var(--b3-theme-on-background);
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    .tag.optional:hover {
        background-color: rgba(0, 0, 0, 0.08);
    }
    .tag:active {
        transform: scale(0.95);
    }
    .b3-list-item__graphic {
        margin: 1px 0px 0px;
        height: 11px;
        padding: 0px 0px;
    }
    .block-content {
        text-overflow: ellipsis; /* 显示省略号 */
        overflow: hidden; /* 隐藏溢出部分 */
        white-space: nowrap; /* 禁止换行 */
        flex-shrink: 1; /* 允许文本缩小以适应容器 */
    }
    .count {
        position: absolute;
        top: 0px;
        right: 0px;
        /* background: red; */
        /* color: white; */
        border-radius: 20%;
        padding: 2px 5px;
        font-size: 10px;
    }

    .panel__title {
        /* color: var(--b3-theme-on-surface); */
        cursor: pointer;
        border: 0;
        opacity: 1;
        background: rgba(0, 0, 0, 0);
        flex-shrink: 0;
        padding: 2px 10px;
        display: flex;
        align-items: center;
        border-radius: var(--b3-border-radius);
        transition:
            var(--b3-transition),
            opacity 0.3s cubic-bezier(0, 0, 0.2, 1) 0ms;
        line-height: 14px;
        min-height: 25px;
        height: 30px;
        border-radius: 10px;
    }
    .filter-panel__title:hover {
        color: var(--b3-theme-on-background);
        background-color: var(--b3-list-icon-hover);
    }

    .backlink-panel-filter {
        margin: 5px 5px;
        padding: 0px 3px 3px 13px;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease;
    }
    /* 悬停效果 */
    .backlink-panel-filter:hover {
        /* border: 1px solid #ccc; */
        /* transform: translateY(-2px); 悬浮效果 */
        /* box-shadow: */
        /* 上边的阴影 */
        /* 0 2px 4px rgba(0, 0, 0, 0.2), */
        /* 四周的阴影 */
        /* 0 3px 10px rgba(0, 0, 0, 0.19); */
    }
    .defblock-list {
        min-height: 33px;
        max-height: 96px; /* 设置最大高度 */
        overflow-y: auto; /* 当内容超过最大高度时显示垂直滚动条 */
        padding: 6px 0px 6px 10px; /* 内边距 */
        /* background-color: var(--b3-list-hover); 背景颜色 */
        border-radius: 6px;
    }

    .backlink-panel__title:hover {
        color: var(--b3-theme-on-background);
        background-color: var(--b3-list-icon-hover);
    }
    select {
        /* max-width: 120px; */
        padding-right: 23px;
        width: 100%;
        flex: 1;
    }
    input {
        /* max-width: 100px; */
        width: 100%;
        flex: 1;
    }
    .filter-panel__sub_title {
        font-size: 1.06em;
        font-weight: bold;
        margin: 6px 0px;
    }
    .block__icon {
        opacity: 1;
    }

    .backlink-panel__header {
        position: sticky;
        top: 0;
        text-align: center;
        padding: 0px 0px;
        z-index: 2;
        background-color: var(--b3-theme-surface);
        margin-bottom: 10px;
        border-radius: 10px;
    }

    .backlink-panel__header .b3-text-field:not(.b3-text-field:focus) {
        box-shadow: inset 0 0 0 1px var(--b3-layout-resize);
    }

    .save-button {
        padding: 3px 6px;
        font-size: 11px;
        cursor: pointer;
    }

    .save-button:hover {
        box-shadow:
            0 2px 5px -3px rgb(0 0 0 / 0.2),
            0 5px 10px 1px rgb(0 0 0 / 0.14),
            0 0px 14px 2px rgb(0 0 0 / 0.12);
    }

    .input-box {
        width: 180px;
        position: relative;
        top: 6px;
        /* left: 20px; */

        background: #fff;
        border: 1px solid #ccc;
        padding: 0px 0px 5px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 10px;
    }

    .input-box::before {
        content: "";
        position: relative;
        bottom: 10px;
        left: -60px;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid white;
    }

    .input-field {
        margin-bottom: 6px;
        padding: 1px;
        width: 80%;
    }

    .buttons {
        display: flex;
        gap: 10px;
    }

    .confirm-button,
    .cancel-button {
        padding: 3px 6px;
        font-size: 11px;
        cursor: pointer;
    }
</style>
