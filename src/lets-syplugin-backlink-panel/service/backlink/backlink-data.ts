import { getBacklink2, getBacklinkDoc, getBatchBlockIdIndex, sql } from "@/lets-syplugin-backlink-panel/utils/api";
import {
    generateGetBacklinkBlockArraySql,
    generateGetBacklinkListItemBlockArraySql,
    generateGetBlockArraySql,
    generateGetChildBlockArraySql,
    generateGetDefBlockArraySql,
    generateGetHeadlineChildDefBlockArraySql,
    generateGetListItemChildBlockArraySql,
    generateGetListItemtSubMarkdownArraySql,
    generateGetParenListItemtDefBlockArraySql,
    generateGetParentDefBlockArraySql
} from "./backlink-sql";
import {
    IBacklinkBlockNode,
    IBacklinkBlockQueryParams,
    IBacklinkFilterPanelData,
    IBacklinkFilterPanelDataQueryParams,
    IBacklinkPanelRenderData,
    IPanelRenderBacklinkQueryParams,
    ListItemTreeNode
} from "@/lets-syplugin-backlink-panel/models/backlink-model";
import {
    containsAllKeywords,
    countOccurrences,
    isStrBlank,
    isStrNotBlank,
    longestCommonSubstring,
    matchKeywords,
    splitKeywordStringToArray
} from "@/lets-syplugin-backlink-panel/utils/string-util";
import { intersectionSet, isArrayEmpty, isArrayNotEmpty, isSetEmpty, isSetNotEmpty, paginate } from "@/lets-syplugin-backlink-panel/utils/array-util";
import { DefinitionBlockStatus } from "@/lets-syplugin-backlink-panel/models/backlink-constant";
import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
import { SettingService } from "../setting/SettingService";
import { stringToDom } from "@/lets-syplugin-backlink-panel/utils/html-util";
import { getQueryStrByBlock, NewNodeID } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";


export async function getBacklinkPanelRenderData(
    backlinkPanelData: IBacklinkFilterPanelData,
    queryParams: IPanelRenderBacklinkQueryParams,
): Promise<IBacklinkPanelRenderData> {
    const startTime = performance.now(); // 记录开始时间

    if (!backlinkPanelData || !queryParams) {
        return
    }
    let pageNum = 1;
    let pageSize = SettingService.ins.SettingConfig.pageSize;
    let rootId = backlinkPanelData.rootId;

    cleanInvalidQueryParams(queryParams, backlinkPanelData);

    let backlinkBlockNodeArray = backlinkPanelData.backlinkBlockNodeArray;
    let validBacklinkBlockNodeArray: IBacklinkBlockNode[] = [];
    for (const backlinkBlockNode of backlinkBlockNodeArray) {
        let valid = isBacklinkBlockValid(queryParams, backlinkBlockNode);
        if (!valid) {
            continue;
        }
        validBacklinkBlockNodeArray.push(backlinkBlockNode);
    }
    let totalPage = calculateTotalPages(validBacklinkBlockNodeArray.length, pageSize);
    // if (pageNum > totalPage) {
    //     pageNum = 1;
    // }

    backlinkBlockNodeArraySort(validBacklinkBlockNodeArray, queryParams.backlinkBlockSortMethod);
    let pageBacklinkBlockArray = paginate(validBacklinkBlockNodeArray, pageNum, pageSize);
    let backlinkCacheData: IBacklinkCacheData = await getBatchBacklinkDoc(rootId, pageBacklinkBlockArray);
    // highlightBacklinkContent(backlinkCacheData.backlinks, queryParams.keywordStr);

    let backlinkDataArray = backlinkCacheData.backlinks;
    let usedCache = backlinkCacheData.usedCache;

    let filterCurDocDefBlockArray = filterExistingDefBlocks(
        backlinkPanelData.curDocDefBlockArray,
        validBacklinkBlockNodeArray,
        queryParams,
    );
    let filterRelatedDefBlockArray = filterExistingDefBlocks(
        backlinkPanelData.relatedDefBlockArray,
        validBacklinkBlockNodeArray,
        queryParams,
    );
    let filterBacklinkDocumentArray = filterBacklinkDocumentBlocks(
        backlinkPanelData.backlinkDocumentArray,
        validBacklinkBlockNodeArray,
        queryParams,
    );

    queryParams.pageNum = pageNum;


    let backlinkPanelRenderDataResult: IBacklinkPanelRenderData = {
        rootId,
        backlinkDataArray: backlinkDataArray,
        backlinkBlockNodeArray: validBacklinkBlockNodeArray,
        curDocDefBlockArray: filterCurDocDefBlockArray,
        relatedDefBlockArray: filterRelatedDefBlockArray,
        backlinkDocumentArray: filterBacklinkDocumentArray,
        pageNum,
        pageSize,
        totalPage,
        usedCache,
    };

    const endTime = performance.now(); // 记录结束时间
    const executionTime = endTime - startTime; // 计算时间差
    console.log(
        `反链面板 生成渲染数据 消耗时间 : ${executionTime} ms `,
        // `, backlinkPanelRenderDataResult `, backlinkPanelRenderDataResult,
    );

    return backlinkPanelRenderDataResult;
}


export async function getTurnPageBacklinkPanelRenderData(
    rootId: string,
    validBacklinkBlockNodeArray: IBacklinkBlockNode[],
    queryParams: IPanelRenderBacklinkQueryParams,
): Promise<IBacklinkPanelRenderData> {
    const startTime = performance.now(); // 记录开始时间
    let pageNum = queryParams.pageNum;
    let pageSize = SettingService.ins.SettingConfig.pageSize;
    let totalPage = calculateTotalPages(validBacklinkBlockNodeArray.length, pageSize);
    if (pageNum < 1) {
        pageNum = 1;
    }
    if (pageNum > totalPage) {
        pageNum = totalPage;
    }

    backlinkBlockNodeArraySort(validBacklinkBlockNodeArray, queryParams.backlinkBlockSortMethod);
    let pageBacklinkBlockArray = paginate(validBacklinkBlockNodeArray, pageNum, pageSize);
    let backlinkCacheData: IBacklinkCacheData = await getBatchBacklinkDoc(rootId, pageBacklinkBlockArray);
    // highlightBacklinkContent(backlinkCacheData.backlinks, queryParams.keywordStr);

    let backlinkDataArray = backlinkCacheData.backlinks;
    let usedCache = backlinkCacheData.usedCache;
    let backlinkPanelRenderDataResult: IBacklinkPanelRenderData = {
        rootId,
        backlinkDataArray: backlinkDataArray,
        backlinkBlockNodeArray: null,
        curDocDefBlockArray: null,
        relatedDefBlockArray: null,
        backlinkDocumentArray: null,
        pageNum,
        pageSize,
        totalPage,
        usedCache,
    };
    const endTime = performance.now(); // 记录结束时间
    const executionTime = endTime - startTime; // 计算时间差
    console.log(
        `反链面板 翻页 消耗时间 : ${executionTime} ms `,
        // `, backlinkPanelRenderDataResult `, backlinkPanelRenderDataResult,
    );

    return backlinkPanelRenderDataResult;
}


// 清理失效的查询条件，比如保存的一个查询定义块id，以前存在，现在不存在了。
function cleanInvalidQueryParams(
    queryParams: IPanelRenderBacklinkQueryParams,
    backlinkPanelData: IBacklinkFilterPanelData,
) {
    let invalidDefBlockId = new Set<string>();
    let invalidDocumentId = new Set<string>();

    let relatedDefBlockIds = getBlockIds([...backlinkPanelData.curDocDefBlockArray, ...backlinkPanelData.relatedDefBlockArray]);
    let backlinkDocumentIds = getBlockIds(backlinkPanelData.backlinkDocumentArray);
    let backlinkBlockNodeArray = backlinkPanelData.backlinkBlockNodeArray;

    if (!queryParams.includeRelatedDefBlockIds || !(queryParams.includeRelatedDefBlockIds instanceof Set)) {
        queryParams.includeRelatedDefBlockIds = new Set();
    }
    for (const defBlockId of queryParams.includeRelatedDefBlockIds) {
        if (!relatedDefBlockIds.includes(defBlockId)) {
            invalidDefBlockId.add(defBlockId);
        }
    }
    if (!queryParams.excludeRelatedDefBlockIds || !(queryParams.excludeRelatedDefBlockIds instanceof Set)) {
        queryParams.excludeRelatedDefBlockIds = new Set();
    }
    for (const defBlockId of queryParams.excludeRelatedDefBlockIds) {
        if (!relatedDefBlockIds.includes(defBlockId)) {
            invalidDefBlockId.add(defBlockId);
        }
    }
    if (!queryParams.includeDocumentIds || !(queryParams.includeDocumentIds instanceof Set)) {
        queryParams.includeDocumentIds = new Set();
    }
    for (const defBlockId of queryParams.includeDocumentIds) {
        if (!backlinkDocumentIds.includes(defBlockId)) {
            invalidDocumentId.add(defBlockId);
        }
    }
    if (!queryParams.excludeDocumentIds || !(queryParams.excludeDocumentIds instanceof Set)) {
        queryParams.excludeDocumentIds = new Set();
    }
    for (const defBlockId of queryParams.excludeDocumentIds) {
        if (!backlinkDocumentIds.includes(defBlockId)) {
            invalidDocumentId.add(defBlockId);
        }
    }

    for (const blockId of invalidDefBlockId) {
        queryParams.includeRelatedDefBlockIds.delete(blockId);
        queryParams.excludeRelatedDefBlockIds.delete(blockId);
    }
    for (const blockId of invalidDocumentId) {
        queryParams.includeDocumentIds.delete(blockId);
        queryParams.excludeDocumentIds.delete(blockId);
    }

    for (const node of backlinkBlockNodeArray) {
        if (node.parentListItemTreeNode) {
            node.parentListItemTreeNode.includeChildIdArray = null;
            node.parentListItemTreeNode.excludeChildIdArray = null;
        }
    }

}

function filterExistingDefBlocks(
    existingDefBlockArray: DefBlock[],
    validBacklinkBlockNodeArray: IBacklinkBlockNode[],
    queryParams: IPanelRenderBacklinkQueryParams,
): DefBlock[] {
    let existingDefBlockIdMap = formatDefBlockMap(existingDefBlockArray);
    let validDefBlockIdSet: Set<string> = new Set();
    let validDefBlockCountMap: Map<string, number> = new Map<string, number>();
    for (const backlinkBlockNode of validBacklinkBlockNodeArray) {
        let verifyRelateDefBlockIds = backlinkBlockNode.includeRelatedDefBlockIds;
        let parentListItemTreeNode = backlinkBlockNode.parentListItemTreeNode;
        if (parentListItemTreeNode) {
            verifyRelateDefBlockIds.clear();
            backlinkBlockNode.includeCurBlockDefBlockIds.forEach((defBlockId) => verifyRelateDefBlockIds.add(defBlockId));
            backlinkBlockNode.includeParentDefBlockIds.forEach((defBlockId) => verifyRelateDefBlockIds.add(defBlockId));
            // parentListItemTreeNode.includeDefBlockIds.forEach((defBlockId) => verifyRelateDefBlockIds.add(defBlockId));
            let listItemDefBLockIdArray = parentListItemTreeNode
                .getFilterDefBlockIds(parentListItemTreeNode.includeChildIdArray, parentListItemTreeNode.excludeChildIdArray);
            listItemDefBLockIdArray.forEach((defBlockId) => verifyRelateDefBlockIds.add(defBlockId));
        }

        for (const blockId of verifyRelateDefBlockIds) {
            // 这一步主要是为了区分当前文档定义块和关联定义块.
            if (!existingDefBlockIdMap.has(blockId)) {
                continue;
            }
            updateMapCount(validDefBlockCountMap, blockId);
            validDefBlockIdSet.add(blockId);
        }
    }
    let includeRelatedDefBlockIds = queryParams.includeRelatedDefBlockIds;
    let excludeRelatedDefBlockIds = queryParams.excludeRelatedDefBlockIds;


    // 需要把包含（选中）的关联定义块ID加进去
    for (const defBlockId of includeRelatedDefBlockIds) {
        // 这一步主要是为了区分当前文档定义块和关联定义块.
        if (!existingDefBlockIdMap.has(defBlockId)) {
            continue;
        }
        validDefBlockIdSet.add(defBlockId);
    }

    // 需要把排除的关联定义块ID加进去
    for (const defBlockId of excludeRelatedDefBlockIds) {
        // 这一步主要是为了区分当前文档定义块和关联定义块.
        if (!existingDefBlockIdMap.has(defBlockId)) {
            continue;
        }
        validDefBlockIdSet.add(defBlockId);
    }

    let validDefBlockArray: DefBlock[] = [];

    for (let blockId of validDefBlockIdSet) {
        let defBlock = existingDefBlockIdMap.get(blockId);
        if (!defBlock) {
            continue;
        }
        let refCount = validDefBlockCountMap.get(defBlock.id);
        refCount = refCount ? refCount : 0;
        let selectionStatus = DefinitionBlockStatus.OPTIONAL;
        if (includeRelatedDefBlockIds.has(blockId)) {
            selectionStatus = DefinitionBlockStatus.SELECTED;
        }
        if (excludeRelatedDefBlockIds.has(blockId)) {
            selectionStatus = DefinitionBlockStatus.EXCLUDED;
        }
        defBlock.refCount = refCount;
        defBlock.selectionStatus = selectionStatus
        validDefBlockArray.push(defBlock);
    }

    return validDefBlockArray;
}


function filterBacklinkDocumentBlocks(
    existingDocBlockArray: DefBlock[],
    validBacklinkBlockNodeArray: IBacklinkBlockNode[],
    queryParams: IPanelRenderBacklinkQueryParams,
): DefBlock[] {
    let curDocBlockIdMap = formatDefBlockMap(existingDocBlockArray);
    let includeDocumentIds = queryParams.includeDocumentIds;
    let excludeDocumentIds = queryParams.excludeDocumentIds;

    let validDocBlockMap: Map<string, DefBlock> = new Map();
    for (const backlinkBlockNode of validBacklinkBlockNodeArray) {
        let blockRootId = backlinkBlockNode.block.root_id;
        let defBlock = validDocBlockMap.get(blockRootId);
        let refCount = 1;
        if (defBlock) {
            refCount = defBlock.refCount + 1;
        } else {
            defBlock = curDocBlockIdMap.get(blockRootId);
        }
        if (!defBlock) {
            continue;
        }

        let selectionStatus = DefinitionBlockStatus.OPTIONAL;
        if (includeDocumentIds.has(blockRootId)) {
            selectionStatus = DefinitionBlockStatus.SELECTED;
        }
        defBlock.selectionStatus = selectionStatus;
        defBlock.refCount = refCount;
        validDocBlockMap.set(blockRootId, defBlock);
    }
    //需要把包含（选中）的文档ID加进去
    for (const rootId of includeDocumentIds) {
        if (!validDocBlockMap.has(rootId)) {
            let defBlock = curDocBlockIdMap.get(rootId);
            let filterStatus = DefinitionBlockStatus.SELECTED;
            defBlock.selectionStatus = filterStatus
            validDocBlockMap.set(rootId, defBlock);
        }
    }
    //需要把排除的文档ID加进去
    for (const rootId of excludeDocumentIds) {
        let defBlock = curDocBlockIdMap.get(rootId);
        let filterStatus = DefinitionBlockStatus.EXCLUDED;
        defBlock.selectionStatus = filterStatus
        defBlock.refCount = 0;
        validDocBlockMap.set(rootId, defBlock);
    }
    let validDocBlockArray = Array.from(validDocBlockMap.values())

    return validDocBlockArray;
}

async function getBatchBacklinkDoc(
    curRootId: string,
    backlinkBlockNodeArray: IBacklinkBlockNode[],
): Promise<IBacklinkCacheData> {
    const startTime = performance.now(); // 记录开始时间
    // 等后续接口修改了，多穿一个 containChildren 参数。
    const defIdRefTreeIdKeywordMap = new Map<string, string>();
    const backlinkBlockIdOrderMap = new Map<string, number>();
    const backlinkBlockNodeMap = new Map<string, IBacklinkBlockNode>();
    const backlinkBlockParentNodeMap = new Map<string, IBacklinkBlockNode>();
    for (const [index, node] of backlinkBlockNodeArray.entries()) {
        let backlinkRootId = node.block.root_id;
        // 提取反链块中的共同关键字
        let backlinkContent = node.block.content;
        let defId = intersectionSet(node.includeCurBlockDefBlockIds, node.includeDirectDefBlockIds)[0];
        // let defId = node.includeCurBlockDefBlockIds.values().next().value;
        let mapKey = defId + "<->" + backlinkRootId;
        let keyword = defIdRefTreeIdKeywordMap.get(mapKey);
        if (keyword === undefined) {
            keyword = backlinkContent;
        } else {
            // 一手动态规划提取连续相同的字符串！ 好像出现一些字符串导致查询不到数据，需要观察一下。
            // 单引号无法查询 "'" ，在查询的时候过滤吧。
            // 破案了，原因是后端使用了缓存，但是在查询缓存的时候，会把 “mark"标记给缓存到内容中，这样其他查询的地方，会使用缓存，导致无法命中。
            keyword = longestCommonSubstring(keyword, backlinkContent);
        }
        defIdRefTreeIdKeywordMap.set(mapKey, keyword);

        backlinkBlockIdOrderMap.set(node.block.id, index);
        backlinkBlockIdOrderMap.set(node.block.parent_id, index - 0.1);
        backlinkBlockNodeMap.set(node.block.id, node);
        backlinkBlockParentNodeMap.set(node.block.parent_id, node);
    }

    let usedCache = false;
    // 并发查询所有反链文档信息
    const allBacklinksArray: IBacklinkData[] = (
        await Promise.all(
            Array.from(defIdRefTreeIdKeywordMap.keys()).map(
                async (key) => {
                    let keySplit = key.split("<->");
                    let defId = keySplit[0];
                    let refTreeId = keySplit[1];
                    let keyword = defIdRefTreeIdKeywordMap.get(key);
                    let data = await getBacklinkDocByApiOrCache(curRootId, defId, refTreeId, keyword, false)
                    if (data.usedCache) {
                        usedCache = true;
                    }
                    return data.backlinks;
                },
            ),
        )
    ).flat();

    let backlinkDcoDataMap: Map<string, IBacklinkData> = new Map<string, IBacklinkData>();

    for (const backlink of allBacklinksArray) {
        let backlinkBlockId: string = getBacklinkBlockId(backlink.dom);
        if (backlinkDcoDataMap.has(backlinkBlockId)) {
            continue;
        }
        let backlinkBlockNode: IBacklinkBlockNode = backlinkBlockNodeMap.get(backlinkBlockId);
        if (!backlinkBlockNode) {
            backlinkBlockNode = backlinkBlockParentNodeMap.get(backlinkBlockId);
        }
        if (backlinkBlockNode) {
            backlink.dom = backlink.dom.replace(/search-mark/g, "");
            backlink.backlinkBlock = backlinkBlockNode.block;
            backlinkDcoDataMap.set(backlinkBlockId, backlink)
            if (backlinkBlockNode.parentListItemTreeNode) {
                backlink.includeChildListItemIdArray = backlinkBlockNode.parentListItemTreeNode.includeChildIdArray;
                backlink.excludeChildLisetItemIdArray = backlinkBlockNode.parentListItemTreeNode.excludeChildIdArray;
            }
        }
    }
    let backlinkDcoDataResult: IBacklinkData[] = Array.from(backlinkDcoDataMap.values());
    /* 排序 */
    // 根据 orderMap 中的顺序对 arr 进行排序
    backlinkDcoDataResult.sort((a, b) => {
        let aId = getBacklinkBlockId(a.dom);
        let bId = getBacklinkBlockId(b.dom);
        const indexA = backlinkBlockIdOrderMap.has(aId)
            ? backlinkBlockIdOrderMap.get(aId)!
            : Infinity;
        const indexB = backlinkBlockIdOrderMap.has(bId)
            ? backlinkBlockIdOrderMap.get(bId)!
            : Infinity;
        return indexA - indexB;
    });

    // 碰到一种奇怪的现象， getBacklinkDoc 接口返回数据不全时，调用一下 getBacklink2 就好了。。
    if (backlinkBlockNodeArray.length > backlinkDcoDataResult.length) {
        console.log("反链过滤面板插件 疑似 getBacklinkDoc 接口数据不全，如果清除缓存刷新后还是不全，请反馈开发者。 ");
        console.log("backlinkBlockNodeArray ", backlinkBlockNodeArray, " ,backlinkDcoDataResult ", backlinkDcoDataResult);
        getBacklink2(curRootId, "", "", "3", "3")
    }

    let result: IBacklinkCacheData = { backlinks: backlinkDcoDataResult, usedCache: usedCache };

    const endTime = performance.now(); // 记录结束时间
    const executionTime = endTime - startTime; // 计算时间差
    // console.log(
    //     `反链面板 批量获取反链文档信息 消耗时间 : ${executionTime} ms `,
    // );
    return result;
}

function getBacklinkBlockId(dom: string): string {
    if (isStrBlank(dom)) {
        return NewNodeID();
    }
    let backklinkDom = stringToDom(dom);
    if (!backklinkDom) {
        return NewNodeID();
    }
    let id = backklinkDom.getAttribute("data-node-id");
    if (isStrBlank(id)) {
        return NewNodeID();
    }
    return id;
}

async function getBacklinkDocByApiOrCache(
    rootId: string, defId: string, refTreeId: string, keyword: string, containChildren: boolean
): Promise<IBacklinkCacheData> {
    keyword = formatBacklinkDocApiKeyword(keyword);
    keyword = "";

    let backlinks = CacheManager.ins.getBacklinkDocApiData(rootId, defId, refTreeId, keyword);
    ;
    let result: IBacklinkCacheData = { backlinks: backlinks, usedCache: false };
    if (backlinks) {
        result.usedCache = true;
        return result;
    }
    const startTime = performance.now(); // 记录开始时间
    const data: { backlinks: IBacklinkData[] } =
        await getBacklinkDoc(defId, refTreeId, keyword, containChildren);
    backlinks = data.backlinks;
    const endTime = performance.now(); // 记录结束时间
    const executionTime = endTime - startTime; // 计算时间差

    let cacheAfterResponseMs = SettingService.ins.SettingConfig.cacheAfterResponseMs;
    let cacheExpirationTime = SettingService.ins.SettingConfig.cacheExpirationTime;

    if (cacheAfterResponseMs >= 0
        && cacheExpirationTime >= 0
        && executionTime > cacheAfterResponseMs) {
        CacheManager.ins.setBacklinkDocApiData(defId, refTreeId, keyword, data.backlinks, cacheExpirationTime);
    }

    result.backlinks = backlinks;
    result.usedCache = false;
    return result;
}

function formatBacklinkDocApiKeyword(keyword: string): string {
    if (isStrBlank(keyword)) {
        return "";
    }
    let keywordSplitArray = keyword.split("'");
    // 初始值设为空字符串
    let longestSubstring = "";
    // 遍历所有子字符串，找到最长的那个
    for (const substring of keywordSplitArray) {
        if (substring.length > longestSubstring.length) {
            longestSubstring = substring;
        }
    }
    longestSubstring = longestSubstring.substring(0, 80);
    // 返回最长的子字符串
    return longestSubstring;


}

function isBacklinkBlockValid(
    queryParams: IPanelRenderBacklinkQueryParams,
    backlinkBlockNode: IBacklinkBlockNode,
): boolean {
    let keywordStr = queryParams.backlinkKeywordStr;

    let includeRelatedDefBlockIds = queryParams.includeRelatedDefBlockIds;
    let excludeRelatedDefBlockIds = queryParams.excludeRelatedDefBlockIds;
    let includeDocumentIds = queryParams.includeDocumentIds;
    let excludeDocumentIds = queryParams.excludeDocumentIds;
    let backlinkCurDocDefBlockType = queryParams.backlinkCurDocDefBlockType;

    let backlinkBlockInfo = backlinkBlockNode.block;
    let backlinkDirectDefBlockIds = backlinkBlockNode.includeDirectDefBlockIds;
    let backlinkRelatedDefBlockIds = backlinkBlockNode.includeRelatedDefBlockIds;
    let backlinkParentDefBlockIds = backlinkBlockNode.includeParentDefBlockIds;
    let parentListItemTreeNode = backlinkBlockNode.parentListItemTreeNode;

    let dynamicAnchorMap = backlinkBlockNode.dynamicAnchorMap;
    let staticAnchorMap = backlinkBlockNode.staticAnchorMap;

    if (isSetNotEmpty(includeDocumentIds)
        && !includeDocumentIds.has(backlinkBlockInfo.root_id)
    ) {
        return false;
    }
    if (isSetNotEmpty(excludeDocumentIds)
        && excludeDocumentIds.has(backlinkBlockInfo.root_id)
    ) {
        return false;
    }
    if (isSetNotEmpty(excludeRelatedDefBlockIds)) {
        if (parentListItemTreeNode) {
            let excludeItemIdArray = parentListItemTreeNode.resetExcludeItemIdArray([...backlinkParentDefBlockIds], Array.from(excludeRelatedDefBlockIds));
            if (excludeItemIdArray.includes(parentListItemTreeNode.id)) {
                return false;
            }
        } else {
            for (const defBlockIds of excludeRelatedDefBlockIds) {
                if (backlinkRelatedDefBlockIds.has(defBlockIds)) {
                    return false;
                }
            }
        }
    }

    if (isSetNotEmpty(includeRelatedDefBlockIds)) {
        if (parentListItemTreeNode) {
            let includeItemIdArray = parentListItemTreeNode.resetIncludeItemIdArray([...backlinkParentDefBlockIds], Array.from(includeRelatedDefBlockIds));
            if (!includeItemIdArray.includes(parentListItemTreeNode.id)) {
                return false;
            }
        } else {
            for (const defBlockIds of includeRelatedDefBlockIds) {
                if (!backlinkRelatedDefBlockIds.has(defBlockIds)) {
                    return false;
                }
            }
        }
    }

    if (keywordStr) {
        let keywordObj = parseSearchSyntax(keywordStr.toLowerCase());

        let selfMarkdown = getQueryStrByBlock(backlinkBlockNode.block);
        let selfDocumendMarkdown = getQueryStrByBlock(backlinkBlockNode.documentBlock);
        let docContent = getQueryStrByBlock(backlinkBlockNode.documentBlock)
        let parentMarkdown = backlinkBlockNode.parentMarkdown;
        let headlineChildMarkdown = backlinkBlockNode.headlineChildMarkdown;
        let listItemChildMarkdown = "";
        if (parentListItemTreeNode) {
            listItemChildMarkdown = parentListItemTreeNode.getFilterMarkdown(parentListItemTreeNode.includeChildIdArray, parentListItemTreeNode.excludeChildIdArray);
        }

        let backlinkConcatContent = selfMarkdown + selfDocumendMarkdown + docContent + parentMarkdown + headlineChildMarkdown + listItemChildMarkdown;
        let backlinkAllAnchorText = getMardownAnchorTextArray(backlinkConcatContent).join(" ");

        backlinkConcatContent = removeMarkdownRefBlockStyle(backlinkConcatContent).toLowerCase();
        let matchText = matchKeywords(backlinkConcatContent, keywordObj.includeText, keywordObj.excludeText);
        let matchAnchor = matchKeywords(backlinkAllAnchorText, keywordObj.includeAnchor, keywordObj.excludeAnchor);
        if (!matchText || !matchAnchor) {
            return false;
        }

    }

    if (backlinkCurDocDefBlockType) {
        if (backlinkCurDocDefBlockType == "dynamicAnchorText") {
            if (dynamicAnchorMap.size <= 0) {
                return false;
            } else {
                let noDynamicAnchor = true;
                for (const blockId of dynamicAnchorMap.keys()) {
                    if (backlinkDirectDefBlockIds.has(blockId)) {
                        noDynamicAnchor = false;
                        break;
                    }
                }
                if (noDynamicAnchor) {
                    return false;
                }
            }
        } else if (backlinkCurDocDefBlockType == "staticAnchorText") {
            if (staticAnchorMap.size <= 0) {
                return false;
            } else {
                let noStaticAnchor = true;
                for (const blockId of staticAnchorMap.keys()) {
                    if (backlinkDirectDefBlockIds.has(blockId)) {
                        noStaticAnchor = false;
                        break;
                    }
                }
                if (noStaticAnchor) {
                    return false;
                }
            }
        }
    }


    return true;
}


export async function getBacklinkPanelData(
    queryParams: IBacklinkFilterPanelDataQueryParams
): Promise<IBacklinkFilterPanelData> {
    const startTime = performance.now(); // 记录开始时间
    let rootId = queryParams.rootId;
    let focusBlockId = queryParams.focusBlockId;
    focusBlockId = null;
    let queryCurDocDefBlockRange = queryParams.queryCurDocDefBlockRange;

    let cacheResult = CacheManager.ins.getBacklinkPanelBaseData(rootId);

    if (cacheResult) {
        cacheResult.userCache = true;
        return cacheResult;
    }


    let getDefBlockArraySql = generateGetDefBlockArraySql({ rootId, focusBlockId, queryCurDocDefBlockRange });
    let curDocDefBlockArray: DefBlock[] = await sql(getDefBlockArraySql);
    if (isArrayEmpty(curDocDefBlockArray)) {
        let result: IBacklinkFilterPanelData = {
            rootId: rootId,
            backlinkBlockNodeArray: [],
            curDocDefBlockArray: [],
            relatedDefBlockArray: [],
            backlinkDocumentArray: [],
        }
        return result;
    }
    // let docRefDefBlockIdArray: string[] = [];
    // for (const defBlock of curDocDefBlockArray) {
    //     if (defBlock.root_id != rootId && defBlock.refBlockId) {
    //         docRefDefBlockIdArray.push(defBlock.refBlockId);
    //     }
    // }
    // if (isArrayNotEmpty(docRefDefBlockIdArray)) {
    //     let getBlockArraySql = generateGetBlockArraySql(docRefDefBlockIdArray);
    //     let curRefBlockArray: DefBlock[] = await sql(getBlockArraySql);
    //     for (const tempBlock of curRefBlockArray) {
    //         let refBlockId = tempBlock.id;
    //         for (const defBlock of curDocDefBlockArray) {
    //             if (defBlock.refBlockId == refBlockId) {
    //                 defBlock.refBlockType = tempBlock.type;
    //             }
    //         }
    //     }
    // }


    let defBlockIds = getBlockIds(curDocDefBlockArray);
    let backlinkBlockQueryParams: IBacklinkBlockQueryParams = {
        queryParentDefBlock: queryParams.queryParentDefBlock,
        querrChildDefBlockForListItem: queryParams.querrChildDefBlockForListItem,
        queryChildDefBlockForHeadline: queryParams.queryChildDefBlockForHeadline,
        defBlockIds: defBlockIds
    };

    let backlinkBlockArray: BacklinkBlock[] = await getBacklinkBlockArray(backlinkBlockQueryParams);
    backlinkBlockQueryParams.backlinkBlocks = backlinkBlockArray;
    backlinkBlockQueryParams.backlinkBlockIds = getBlockIds(backlinkBlockArray);

    // let [
    //     backlinkParentBlockArray,
    //     headlinkBacklinkChildBlockArray,
    //     listItemBacklinkChildBlockArray
    // ] = await Promise.all([
    //     getParentBlockArray(backlinkBlockQueryParams),
    //     getHeadlineChildBlockArray(backlinkBlockQueryParams),
    //     getListItemChildBlockArray(backlinkBlockQueryParams)
    // ]);

    let backlinkParentBlockArray: BacklinkParentBlock[] = await getParentBlockArray(backlinkBlockQueryParams);

    let headlinkBacklinkChildBlockArray: BacklinkChildBlock[] = await getHeadlineChildBlockArray(backlinkBlockQueryParams);

    let listItemBacklinkChildBlockArray: BacklinkChildBlock[] = await getListItemChildBlockArray(backlinkBlockQueryParams);


    let backlinkPanelData: IBacklinkFilterPanelData = await buildBacklinkPanelData({
        rootId,
        curDocDefBlockArray,
        backlinkBlockArray,
        headlinkBacklinkChildBlockArray,
        listItemBacklinkChildBlockArray,
        backlinkParentBlockArray,
    });

    const endTime = performance.now(); // 记录结束时间
    const executionTime = endTime - startTime; // 计算时间差
    console.log(
        `反链面板 获取和处理数据 消耗时间 : ${executionTime} ms `,
        // `, 数据 : backlinkPanelData `, backlinkPanelData
    );
    let cacheAfterResponseMs = SettingService.ins.SettingConfig.cacheAfterResponseMs;
    let cacheExpirationTime = SettingService.ins.SettingConfig.cacheExpirationTime;

    if (cacheAfterResponseMs >= 0
        && cacheExpirationTime >= 0
        && executionTime > cacheAfterResponseMs) {
        CacheManager.ins.setBacklinkPanelBaseData(rootId, backlinkPanelData, cacheExpirationTime);
    }
    // console.log(" blockTreeNodeArray : ", backlinkPanelData)

    return backlinkPanelData;
}

async function getBacklinkBlockArray(queryParams: IBacklinkBlockQueryParams): Promise<BacklinkBlock[]> {
    if (!queryParams) {
        return [];
    }
    let backlinkBlockArray: BacklinkBlock[];
    if (queryParams.querrChildDefBlockForListItem) {
        let backlinkListItemBlockArraySql = generateGetBacklinkListItemBlockArraySql(queryParams);
        backlinkBlockArray = await sql(backlinkListItemBlockArraySql);
    } else {
        let getBacklinkBlockArraySql = generateGetBacklinkBlockArraySql(queryParams);
        backlinkBlockArray = await sql(getBacklinkBlockArraySql);
    }
    backlinkBlockArray = backlinkBlockArray ? backlinkBlockArray : [];
    return backlinkBlockArray;
}


async function getHeadlineChildBlockArray(queryParams: IBacklinkBlockQueryParams)
    : Promise<BacklinkChildBlock[]> {
    if (!queryParams || !queryParams.queryChildDefBlockForHeadline
        || isArrayEmpty(queryParams.backlinkBlocks)
    ) {
        return [];
    }

    let headlineBacklinkIdArray = [];
    for (const backlinkBlock of queryParams.backlinkBlocks) {
        if (backlinkBlock.type == 'h') {
            headlineBacklinkIdArray.push(backlinkBlock.id);
        }
    }
    if (isArrayEmpty(headlineBacklinkIdArray)) {
        return [];
    }

    let getHeadlineChildBlockSql = generateGetHeadlineChildDefBlockArraySql(queryParams);
    let headlineChildBlockArray: BacklinkChildBlock[] = await sql(getHeadlineChildBlockSql);
    headlineChildBlockArray = headlineChildBlockArray ? headlineChildBlockArray : [];

    let backlinkChildBlockArray: BacklinkChildBlock[] = [];
    for (const childBlock of headlineChildBlockArray) {
        if (childBlock.parentIdPath.includes("->")) {
            backlinkChildBlockArray.push(childBlock);
        }
    }
    return backlinkChildBlockArray;
}


async function getListItemChildBlockArray(queryParams: IBacklinkBlockQueryParams)
    : Promise<BacklinkChildBlock[]> {
    if (!queryParams || !queryParams.querrChildDefBlockForListItem) {
        return [];
    }
    let backlinkParentListItemBlockIds = new Set<string>();
    if (queryParams.backlinkBlocks) {
        for (const backlinkBlock of queryParams.backlinkBlocks) {
            if (backlinkBlock && backlinkBlock.parentBlockType == 'i') {
                backlinkParentListItemBlockIds.add(backlinkBlock.parent_id);
            }
        }
    }
    if (isSetEmpty(backlinkParentListItemBlockIds)) {
        return;
    }
    queryParams.backlinkParentListItemBlockIds = Array.from(backlinkParentListItemBlockIds);

    let getHeadlineChildBlockSql = generateGetListItemChildBlockArraySql(queryParams);
    let listItemChildBlockArray: BacklinkChildBlock[] = await sql(getHeadlineChildBlockSql);

    if (listItemChildBlockArray) {
        let listItemIdSet = new Set<string>();
        for (const itemBlock of listItemChildBlockArray) {
            if (itemBlock.type == 'i') {
                listItemIdSet.add(itemBlock.id)
            }
        }
        let getSubMarkdownSql = generateGetListItemtSubMarkdownArraySql(Array.from(listItemIdSet));
        if (isStrNotBlank(getSubMarkdownSql)) {
            let subMarkdownArray: BacklinkChildBlock[] = await sql(getSubMarkdownSql);
            subMarkdownArray = subMarkdownArray ? subMarkdownArray : [];
            let parentInAttrMap = new Map<string, string>();
            let subMarkdownMap = new Map<string, string>();
            let subInAttrMap = new Map<string, string>();
            for (const parentListItemBlock of subMarkdownArray) {
                parentInAttrMap.set(parentListItemBlock.parent_id, parentListItemBlock.parentInAttrConcat);
                subMarkdownMap.set(parentListItemBlock.parent_id, parentListItemBlock.subMarkdown);
                subInAttrMap.set(parentListItemBlock.parent_id, parentListItemBlock.subInAttrConcat);
            }
            for (const itemBlock of listItemChildBlockArray) {
                if (itemBlock.type == 'i') {
                    let subMarkdown = subMarkdownMap.get(itemBlock.id);
                    if (subMarkdown) {
                        itemBlock.parentInAttrConcat = parentInAttrMap.get(itemBlock.id);
                        itemBlock.subMarkdown = subMarkdown;
                        itemBlock.subInAttrConcat = subInAttrMap.get(itemBlock.id)
                    }
                }
            }
        }
    }


    listItemChildBlockArray = listItemChildBlockArray ? listItemChildBlockArray : [];

    return listItemChildBlockArray;
}

async function getParentBlockArray(queryParams: IBacklinkBlockQueryParams)
    : Promise<BacklinkParentBlock[]> {
    if (!queryParams || !queryParams.queryParentDefBlock) {
        return [];
    }

    let getParentBlockArraySql = generateGetParentDefBlockArraySql(queryParams);
    let parentBlockArray: BacklinkParentBlock[] = await sql(getParentBlockArraySql);
    parentBlockArray = parentBlockArray ? parentBlockArray : [];

    let backlinkParentListItemBlockIdSet: Set<string> = new Set<string>;
    for (const parentBlock of parentBlockArray) {
        if (parentBlock.type == 'i') {
            let count = countOccurrences(parentBlock.childIdPath, "->");
            // 用于过滤反链块所在的列表项块
            if (count > 2) {
                backlinkParentListItemBlockIdSet.add(parentBlock.id);
            }
        }
    }
    if (isSetNotEmpty(backlinkParentListItemBlockIdSet)) {
        queryParams.backlinkAllParentBlockIds = Array.from(backlinkParentListItemBlockIdSet);
        let getSubMarkdownSql = generateGetParenListItemtDefBlockArraySql(queryParams);
        let subMarkdownArray: BacklinkParentBlock[] = await sql(getSubMarkdownSql);
        subMarkdownArray = subMarkdownArray ? subMarkdownArray : [];
        let subMarkdownMap = new Map<string, string>();
        for (const parentListItemBlock of subMarkdownArray) {
            subMarkdownMap.set(parentListItemBlock.parent_id, parentListItemBlock.subMarkdown + parentListItemBlock.inAttrConcat);
        }
        for (const parentBlock of parentBlockArray) {
            if (parentBlock.type == 'i') {
                let subMarkdown = subMarkdownMap.get(parentBlock.id);
                if (subMarkdown) {
                    parentBlock.subMarkdown = subMarkdown;
                }
            }
        }
    }


    return parentBlockArray;

}


function getBlockIds(blockList: DefBlock[]): string[] {
    let blockIds: string[] = [];
    if (!blockList || blockList.length == 0) {
        return blockIds
    }
    for (const block of blockList) {
        if (!block) {
            continue;
        }
        blockIds.push(block.id);
    }

    return blockIds;
}

async function buildBacklinkPanelData(
    paramObj: {
        rootId,
        curDocDefBlockArray: DefBlock[],
        backlinkBlockArray: BacklinkBlock[],
        headlinkBacklinkChildBlockArray: BacklinkChildBlock[],
        listItemBacklinkChildBlockArray: BacklinkChildBlock[],
        backlinkParentBlockArray: BacklinkParentBlock[],
    }
): Promise<IBacklinkFilterPanelData> {
    let curDocDefBlockIdArray = getBlockIds(paramObj.curDocDefBlockArray);

    // 创建一个id到节点的映射
    const backlinkBlockMap: { [key: string]: IBacklinkBlockNode } = {};
    let relatedDefBlockCountMap = new Map<string, number>();
    let backlinkDocumentCountMap = new Map<string, number>();
    let relatedDefBlockDynamicAnchorMap = new Map<string, Set<string>>();
    let relatedDefBlockStaticAnchorMap = new Map<string, Set<string>>();
    // 整个活，把关联的块的时间修改为反链块的时间。 map 的键是关联块的id
    let backlinkBlockCreatedMap = new Map<string, string>();
    let backlinkBlockUpdatedMap = new Map<string, string>();

    for (const backlinkBlock of paramObj.backlinkBlockArray) {
        let backlinkBlockNode: IBacklinkBlockNode = {
            block: { ...backlinkBlock, refCount: null },
            documentBlock: null,
            parentMarkdown: "",
            listItemChildMarkdown: "",
            headlineChildMarkdown: "",
            includeDirectDefBlockIds: new Set<string>(),
            includeRelatedDefBlockIds: new Set<string>(),
            includeCurBlockDefBlockIds: new Set<string>(),
            // includeChildDefBlockIds: new Set<string>(),
            includeParentDefBlockIds: new Set<string>(),
            dynamicAnchorMap: new Map<string, Set<string>>(),
            staticAnchorMap: new Map<string, Set<string>>(),
        };

        let relatedDefBlockIdArray: string[] = [];
        if (backlinkBlock.type == "query_embed") {
            let result = await getBacklinkEmbedBlockInfo(backlinkBlock, paramObj.curDocDefBlockArray);
            backlinkBlock.markdown = result.embedBlockmarkdown;
            backlinkBlockNode.block.markdown = result.embedBlockmarkdown;
            relatedDefBlockIdArray.push(...result.relatedDefBlockIdArray)
        }

        let markdown = backlinkBlock.markdown;
        relatedDefBlockIdArray.push(...getRefBlockId(markdown));

        for (const relatedDefBlockId of relatedDefBlockIdArray) {
            backlinkBlockNode.includeRelatedDefBlockIds.add(relatedDefBlockId)
            backlinkBlockNode.includeCurBlockDefBlockIds.add(relatedDefBlockId)
            if (curDocDefBlockIdArray.includes(relatedDefBlockId)) {
                backlinkBlockNode.includeDirectDefBlockIds.add(relatedDefBlockId);
            } else {
                updateMaxValueMap(backlinkBlockCreatedMap, relatedDefBlockId, backlinkBlock.created);
                updateMaxValueMap(backlinkBlockUpdatedMap, relatedDefBlockId, backlinkBlock.updated);
                updateMapCount(relatedDefBlockCountMap, relatedDefBlockId);
            }
        }

        updateDynamicAnchorMap(backlinkBlockNode.dynamicAnchorMap, backlinkBlock.markdown);
        updateStaticAnchorMap(backlinkBlockNode.staticAnchorMap, backlinkBlock.markdown);

        updateMaxValueMap(backlinkBlockCreatedMap, backlinkBlock.root_id, backlinkBlock.created);
        updateMaxValueMap(backlinkBlockUpdatedMap, backlinkBlock.root_id, backlinkBlock.updated);
        updateMapCount(backlinkDocumentCountMap, backlinkBlock.root_id);
        // 更新所有关联块的动静态锚文本
        updateDynamicAnchorMap(relatedDefBlockDynamicAnchorMap, markdown);
        updateStaticAnchorMap(relatedDefBlockStaticAnchorMap, markdown);
        backlinkBlockMap[backlinkBlockNode.block.id] = backlinkBlockNode;
    }
    // 这里必须再生成一个关联块ID Set，用来区分下面父级关联块 markdown 中存在该关联块，防止set里的关联块重新计数
    let relatedDefBlockIdSet = new Set(relatedDefBlockCountMap.keys());

    for (const childBlock of paramObj.headlinkBacklinkChildBlockArray) {
        let markdown = childBlock.markdown;
        let backlnikChildDefBlockIdArray = getRefBlockId(markdown);
        markdown += childBlock.subInAttrConcat;
        let backlinkBlockId = childBlock.parentIdPath.split("->")[0];
        let backlinkBlockNode = backlinkBlockMap[backlinkBlockId];
        if (backlinkBlockNode) {
            for (const childDefBlockId of backlnikChildDefBlockIdArray) {
                backlinkBlockNode.includeRelatedDefBlockIds.add(childDefBlockId);
                // backlinkBlockNode.includeChildDefBlockIds.add((childDefBlockId))
                if (curDocDefBlockIdArray.includes(childDefBlockId)) {
                    backlinkBlockNode.includeDirectDefBlockIds.add(childDefBlockId);
                } else if (!relatedDefBlockIdSet.has(childDefBlockId)) {
                    updateMaxValueMap(backlinkBlockCreatedMap, childDefBlockId, backlinkBlockNode.block.created);
                    updateMaxValueMap(backlinkBlockUpdatedMap, childDefBlockId, backlinkBlockNode.block.updated);
                    updateMapCount(relatedDefBlockCountMap, childDefBlockId);
                }
            }
            backlinkBlockNode.headlineChildMarkdown += markdown;
            updateDynamicAnchorMap(relatedDefBlockDynamicAnchorMap, markdown);
            updateStaticAnchorMap(relatedDefBlockStaticAnchorMap, markdown);
        }
    }


    if (isArrayNotEmpty(paramObj.listItemBacklinkChildBlockArray)) {
        let listItemTreeNodeArray = ListItemTreeNode.buildTree(paramObj.listItemBacklinkChildBlockArray);
        for (const treeNode of listItemTreeNodeArray) {
            let listItemBlockId = treeNode.id;
            let backlinkBlockNode: IBacklinkBlockNode;
            for (const node of Object.values(backlinkBlockMap)) {
                if (node.block.parent_id == listItemBlockId) {
                    backlinkBlockNode = node
                    break;
                }
            }
            if (!backlinkBlockNode) {
                continue;
            }
            backlinkBlockNode.parentListItemTreeNode = treeNode;
            let backlinkBlock = backlinkBlockNode.block;
            let markdown = treeNode.getAllMarkdown();
            markdown = markdown.replace(backlinkBlock.markdown, " ");
            let childDefBlockIdArray = getRefBlockId(markdown);

            for (const childDefBlockId of childDefBlockIdArray) {
                backlinkBlockNode.includeRelatedDefBlockIds.add(childDefBlockId)
                // backlinkBlockNode.includeChildDefBlockIds.add(defBlockId);
                if (curDocDefBlockIdArray.includes(childDefBlockId)) {
                    backlinkBlockNode.includeDirectDefBlockIds.add(childDefBlockId);
                } else {
                    updateMaxValueMap(backlinkBlockCreatedMap, childDefBlockId, backlinkBlock.created);
                    updateMaxValueMap(backlinkBlockUpdatedMap, childDefBlockId, backlinkBlock.updated);
                    updateMapCount(relatedDefBlockCountMap, childDefBlockId);
                }
            }
            updateMaxValueMap(backlinkBlockCreatedMap, backlinkBlock.root_id, backlinkBlock.created);
            updateMaxValueMap(backlinkBlockUpdatedMap, backlinkBlock.root_id, backlinkBlock.updated);
            updateMapCount(backlinkDocumentCountMap, backlinkBlock.root_id);
            updateDynamicAnchorMap(relatedDefBlockDynamicAnchorMap, markdown);
            updateStaticAnchorMap(relatedDefBlockStaticAnchorMap, markdown);
        }
    }

    for (const parentBlock of paramObj.backlinkParentBlockArray) {
        let markdown = parentBlock.markdown;
        let inAttrConcat = parentBlock.inAttrConcat;
        if (parentBlock.type == 'i' && parentBlock.subMarkdown) {
            markdown = parentBlock.subMarkdown;
            // console.log("backlinkParentBlockArray subMarkdown  ", markdown)
        }
        markdown += inAttrConcat;
        // console.log("backlinkParentBlockArray markdown  ", markdown)

        let backlnikParentDefBlockIdArray = getRefBlockId(markdown);
        let backlinkBlockId = parentBlock.childIdPath.split("->")[0];
        let backlinkBlockNode = backlinkBlockMap[backlinkBlockId];
        if (backlinkBlockNode) {
            for (const parentDefBlockId of backlnikParentDefBlockIdArray) {
                backlinkBlockNode.includeRelatedDefBlockIds.add(parentDefBlockId);
                backlinkBlockNode.includeParentDefBlockIds.add(parentDefBlockId);
                if (curDocDefBlockIdArray.includes(parentDefBlockId)) {
                    backlinkBlockNode.includeDirectDefBlockIds.add(parentDefBlockId);
                } else if (!relatedDefBlockIdSet.has(parentDefBlockId)) {
                    updateMapCount(relatedDefBlockCountMap, parentDefBlockId);
                }
            }
            backlinkBlockNode.parentMarkdown += markdown;
            updateDynamicAnchorMap(relatedDefBlockDynamicAnchorMap, markdown);
            updateStaticAnchorMap(relatedDefBlockStaticAnchorMap, markdown);
            // updateMapCount(backlinkDocumentCountMap, parentBlock.root_id);
        }
    }

    const blockIdArray = [...relatedDefBlockCountMap.keys(), ...backlinkDocumentCountMap.keys()];

    let relatedDefBlockAndDocumentMap = await getBlockInfoMap(blockIdArray);

    let relatedDefBlockArray: DefBlock[] = [];
    let backlinkDocumentArray: DefBlock[] = [];

    for (const defBlock of paramObj.curDocDefBlockArray) {
        let blockId = defBlock.id;
        let dnaymicAnchor = "";
        let staticAnchor = "";
        let dynamicAnchorSet = relatedDefBlockDynamicAnchorMap.get(blockId);
        if (isSetNotEmpty(dynamicAnchorSet)) {
            dnaymicAnchor = Array.from(dynamicAnchorSet).join(' ');
        }
        let staticAnchorSet = relatedDefBlockStaticAnchorMap.get(blockId);
        if (isSetNotEmpty(staticAnchorSet)) {
            staticAnchor = Array.from(staticAnchorSet).join(' ');
        }
        defBlock.dynamicAnchor = dnaymicAnchor
        defBlock.staticAnchor = staticAnchor;
    }


    for (const blockId of relatedDefBlockCountMap.keys()) {
        let blockCount = relatedDefBlockCountMap.get(blockId);
        let blockInfo = relatedDefBlockAndDocumentMap.get(blockId);

        let created = backlinkBlockCreatedMap.get(blockId);
        let updated = backlinkBlockUpdatedMap.get(blockId);

        let dnaymicAnchor = "";
        let staticAnchor = "";
        let dynamicAnchorSet = relatedDefBlockDynamicAnchorMap.get(blockId);
        if (isSetNotEmpty(dynamicAnchorSet)) {
            dnaymicAnchor = Array.from(dynamicAnchorSet).join(' ');
        }
        let staticAnchorSet = relatedDefBlockStaticAnchorMap.get(blockId);
        if (isSetNotEmpty(staticAnchorSet)) {
            staticAnchor = Array.from(staticAnchorSet).join(' ');
        }


        if (blockInfo) {
            let refBlockInfo: DefBlock = {
                ...blockInfo,
                refCount: blockCount,
                selectionStatus: DefinitionBlockStatus.OPTIONAL
            };

            refBlockInfo.created = created ? created : refBlockInfo.created;
            refBlockInfo.updated = updated ? updated : refBlockInfo.updated;

            refBlockInfo.dynamicAnchor = dnaymicAnchor
            refBlockInfo.staticAnchor = staticAnchor;

            relatedDefBlockArray.push(refBlockInfo);
        } else {
            let refBlockInfo = {} as DefBlock;
            if (isSetEmpty(dynamicAnchorSet) && isSetEmpty(staticAnchorSet)) {
                continue;
            }
            let dnaymicAnchor = "";
            let staticAnchor = "";
            let content = isSetNotEmpty(dynamicAnchorSet) ? dynamicAnchorSet.values().next().value : staticAnchorSet.values().next().value;

            refBlockInfo.id = blockId;
            refBlockInfo.content = content;
            refBlockInfo.refCount = blockCount;
            refBlockInfo.created = created;
            refBlockInfo.updated = updated;
            refBlockInfo.dynamicAnchor = dnaymicAnchor
            refBlockInfo.staticAnchor = staticAnchor;
            refBlockInfo.selectionStatus = DefinitionBlockStatus.OPTIONAL
            // console.log("不存在的定义块 : ", refBlockInfo)
            relatedDefBlockArray.push(refBlockInfo);
        }
    }

    for (const key of backlinkDocumentCountMap.keys()) {
        let blockCount = backlinkDocumentCountMap.get(key);
        let blockInfo = relatedDefBlockAndDocumentMap.get(key);
        if (blockInfo) {
            let documentBlockInfo: DefBlock = {
                ...blockInfo,
                refCount: blockCount,
                selectionStatus: DefinitionBlockStatus.OPTIONAL
            };
            let created = backlinkBlockCreatedMap.get(blockInfo.id);
            documentBlockInfo.created = created ? created : documentBlockInfo.created;
            let updated = backlinkBlockUpdatedMap.get(blockInfo.id);
            documentBlockInfo.updated = updated ? updated : documentBlockInfo.updated;
            backlinkDocumentArray.push(documentBlockInfo);
        }
    }

    // 关联反链块所在的文档块信息
    for (const node of Object.values(backlinkBlockMap)) {
        let docBlockInfo = relatedDefBlockAndDocumentMap.get(node.block.root_id);
        node.documentBlock = docBlockInfo;
    }

    // let rootId = paramObj.curDocDefBlockArray[0].root_id;
    let backlinkBlockNodeArray: IBacklinkBlockNode[] = Object.values(backlinkBlockMap);

    let backlinkPanelData: IBacklinkFilterPanelData = {
        rootId: paramObj.rootId,
        backlinkBlockNodeArray,
        curDocDefBlockArray: paramObj.curDocDefBlockArray,
        relatedDefBlockArray,
        backlinkDocumentArray: backlinkDocumentArray,
    };

    return backlinkPanelData;

}

async function getBlockInfoMap(blockIds: string[]) {
    let getBlockArraySql = generateGetBlockArraySql(blockIds);
    let blockArray: DefBlock[] = await sql(getBlockArraySql);
    blockArray = blockArray ? blockArray : [];
    let blockMap = new Map<string, DefBlock>();
    for (const block of blockArray) {
        blockMap.set(block.id, block);
    }
    return blockMap;
}

async function getBacklinkEmbedBlockInfo(
    backlinkBlock: BacklinkBlock,
    curDocDefBlockArray: DefBlock[],
): Promise<{ embedBlockmarkdown: string, relatedDefBlockIdArray: string[] }> {
    let embedBlockmarkdown = "";
    let relatedDefBlockIdArray: string[] = [];
    for (const defBlock of curDocDefBlockArray) {
        if (defBlock
            && isStrNotBlank(defBlock.backlinkBlockIdConcat)
            && defBlock.backlinkBlockIdConcat.includes(backlinkBlock.id)
        ) {
            let type = defBlock.type;
            relatedDefBlockIdArray.push(defBlock.id);
            embedBlockmarkdown += defBlock.markdown;
            let embedChildblockArray = null;
            if (type == 'd') {
                embedChildblockArray = await sql(`SELECT * FROM blocks WHERE root_id = '${defBlock.id}'`);
            } else if (type == 'h') {
                let getChildBlockArraySql = generateGetChildBlockArraySql(defBlock.root_id, defBlock.id);
                embedChildblockArray = await sql(getChildBlockArraySql);
            } else if (type == 'query_embed') {
                let embedSql = defBlock.markdown.replace("{{", "").replace("}}", "");
                embedChildblockArray = await sql(embedSql);

            }
            if (isArrayNotEmpty(embedChildblockArray)) {
                for (const block of embedChildblockArray) {
                    embedBlockmarkdown += getQueryStrByBlock(block);
                }
            }
        }
    }
    // backlinkBlock.markdown = embedBlockmarkdown;

    return { embedBlockmarkdown, relatedDefBlockIdArray };
}


export function getRefBlockId(markdown: string): string[] {
    const matches = [];
    if (!markdown) {
        return matches;
    }

    let regex = /\(\((\d{14}-\w{7})\s'[^']+'\)\)/g;
    regex = /\(\((\d{14}-\w{7})\s['"][^'"]+['"]\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}


async function backlinkBlockNodeArraySort(
    backlinkBlockArray: IBacklinkBlockNode[],
    blockSortMethod: BlockSortMethod,
) {
    if (!backlinkBlockArray || backlinkBlockArray.length <= 0) {
        return;
    }

    let backlinkBlockNodeSortFun;
    switch (blockSortMethod) {
        case "documentAlphabeticAsc":
            backlinkBlockNodeSortFun = function (
                a: IBacklinkBlockNode,
                b: IBacklinkBlockNode,
            ): number {
                let aDocContent = a.documentBlock.content.replace("<mark>", "").replace("</mark>", "");
                let bDocContent = b.documentBlock.content.replace("<mark>", "").replace("</mark>", "");
                let result = aDocContent.localeCompare(bDocContent, undefined, {
                    sensitivity: 'base',
                    usage: 'sort',
                    numeric: true
                });

                if (result == 0) {
                    let aContent = a.block.content.replace("<mark>", "").replace("</mark>", "");
                    let bContent = b.block.content.replace("<mark>", "").replace("</mark>", "");
                    result = aContent.localeCompare(bContent, undefined, {
                        sensitivity: 'base',
                        usage: 'sort',
                        numeric: true
                    });
                }

                if (result == 0) {
                    result = Number(a.block.created) - Number(b.block.created);
                }
                return result;
            };
            break;
        case "documentAlphabeticDesc":
            backlinkBlockNodeSortFun = function (
                a: IBacklinkBlockNode,
                b: IBacklinkBlockNode,
            ): number {
                let aDocContent = a.documentBlock.content.replace("<mark>", "").replace("</mark>", "");
                let bDocContent = b.documentBlock.content.replace("<mark>", "").replace("</mark>", "");
                let result = bDocContent.localeCompare(aDocContent, undefined, {
                    sensitivity: 'base',
                    usage: 'sort',
                    numeric: true
                });

                if (result == 0) {
                    let aContent = a.block.content.replace("<mark>", "").replace("</mark>", "");
                    let bContent = b.block.content.replace("<mark>", "").replace("</mark>", "");
                    result = bContent.localeCompare(aContent, undefined, {
                        sensitivity: 'base',
                        usage: 'sort',
                        numeric: true
                    });
                }

                if (result == 0) {
                    result = Number(b.block.created) - Number(a.block.created);
                }
                return result;
            };
            break;
        default:
            let blockSortFun: (
                a: DefBlock,
                b: DefBlock,
            ) => number = getDefBlockSortFun(blockSortMethod);
            if (blockSortFun) {
                backlinkBlockNodeSortFun = (a: IBacklinkBlockNode, b: IBacklinkBlockNode): number => {
                    let aBlock = a.block;
                    let bBlock = b.block;
                    return blockSortFun(aBlock, bBlock);
                };

            }
            break;
    }

    if (backlinkBlockNodeSortFun) {
        backlinkBlockArray.sort(backlinkBlockNodeSortFun);
    }
}


export async function defBlockArraySort(
    defBlockArray: DefBlock[],
    defBlockSortMethod: BlockSortMethod,
) {
    if (isArrayEmpty(defBlockArray)
        || !defBlockSortMethod
    ) {
        return;
    }
    if (defBlockSortMethod == "content") {
        await searchItemSortByContent(defBlockArray);
    } else if (defBlockSortMethod == "typeAndContent") {
        await searchItemSortByTypeAndContent(defBlockArray);
    } else {
        let blockSortFun: (
            a: DefBlock,
            b: DefBlock,
        ) => number = getDefBlockSortFun(defBlockSortMethod);
        if (blockSortFun) {
            defBlockArray.sort(blockSortFun);
        }
    }
}

export async function defBlockArrayTypeAndKeywordFilter(
    defBlockArray: DefBlock[],
    defBLockType: string,
    keywordStr: string,
) {
    if (isArrayEmpty(defBlockArray)) {
        return;
    }
    for (const defBlock of defBlockArray) {
        defBlock.filterStatus = false;
    }

    if (defBLockType) {
        for (const defBlock of defBlockArray) {
            if (defBLockType == "dynamicAnchorText" && isStrBlank(defBlock.dynamicAnchor)) {
                console.log("dynamicAnchorText defBlock ", defBlock)
                defBlock.filterStatus = true;
            } else if (defBLockType == "staticAnchorText" && isStrBlank(defBlock.staticAnchor)) {
                console.log("staticAnchorText defBlock ", defBlock)
                defBlock.filterStatus = true;
            }
        }
    }
    let keywordArray = splitKeywordStringToArray(keywordStr);
    if (isArrayEmpty(keywordArray)) {
        return;
    }
    for (const defBlock of defBlockArray) {
        let staticAnchor = defBlock.staticAnchor ? defBlock.staticAnchor + "-static- -静态锚文本- -锚- -锚链接-" : "";
        let blockContent = defBlock.content + defBlock.name + defBlock.alias + defBlock.memo + staticAnchor;
        let containsAll = containsAllKeywords(blockContent, keywordArray);
        if (!containsAll) {
            defBlock.filterStatus = true;
        }
    }
}


async function searchItemSortByContent(blockArray: DefBlock[]) {
    let ids = blockArray.map(item => item.id);
    let idMap: Map<string, number> = await getBatchBlockIdIndex(ids);
    blockArray.sort((a, b) => {
        let statusNum = getFilterStatusSortResult(a, b);
        if (statusNum != null) {
            return statusNum;
        }
        let aIndex = idMap.get(a.id) || 0;
        let bIndex = idMap.get(b.id) || 0;
        let result = aIndex - bIndex;
        if (result == 0) {
            result = Number(a.created) - Number(b.created);
        }
        if (result == 0) {
            result = a.sort - b.sort;
        }
        return result;
    });

    return blockArray;
}


async function searchItemSortByTypeAndContent(blockArray: DefBlock[]) {
    let ids: string[] = [];
    for (const block of blockArray) {
        let blockId = block.id;
        ids.push(blockId);
    }

    let idMap: Map<string, number> = await getBatchBlockIdIndex(ids);
    blockArray.sort((a, b) => {
        let statusNum = getFilterStatusSortResult(a, b);
        if (statusNum != null) {
            return statusNum;
        }

        let result = a.sort - b.sort;
        if (result == 0) {
            let aBlockId = a.id;
            let bBlockId = b.id;
            let aIndex = idMap.get(aBlockId) || 0;
            let bIndex = idMap.get(bBlockId) || 0;
            result = aIndex - bIndex;
        }
        if (result == 0) {
            result = Number(b.refCount) - Number(a.refCount);
        }
        return result;
    });

    return blockArray;
}


function getDefBlockSortFun(contentBlockSortMethod: BlockSortMethod) {
    let blockSortFun: (
        a: DefBlock,
        b: DefBlock,
    ) => number;
    switch (contentBlockSortMethod) {
        case "type":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                let result = a.sort - b.sort;
                if (result == 0) {
                    result = Number(b.updated) - Number(a.updated);
                }
                return result;
            };
            break;
        case "modifiedAsc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                return Number(a.updated) - Number(b.updated);
            };
            break;
        case "modifiedDesc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                return Number(b.updated) - Number(a.updated);
            };
            break;
        case "createdAsc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                return Number(a.created) - Number(b.created);
            };
            break;
        case "createdDesc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                return Number(b.created) - Number(a.created);
            };
            break;
        case "refCountAsc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }
                let result = Number(a.refCount) - Number(b.refCount);
                if (result == 0) {
                    result = Number(b.updated) - Number(a.updated);
                }
                return result;
            };
            break;
        case "refCountDesc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }
                let result = Number(b.refCount) - Number(a.refCount);
                if (result == 0) {
                    result = Number(b.updated) - Number(a.updated);
                }

                return result;
            };
            break;
        case "alphabeticAsc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                let aContent = a.content.replace("<mark>", "").replace("</mark>", "");
                let bContent = b.content.replace("<mark>", "").replace("</mark>", "");
                let result = aContent.localeCompare(bContent, undefined, {
                    sensitivity: 'base',
                    usage: 'sort',
                    numeric: true
                });
                if (result == 0) {
                    result = Number(b.updated) - Number(a.updated);
                }
                return result;
            };
            break;
        case "alphabeticDesc":
            blockSortFun = function (
                a: DefBlock,
                b: DefBlock,
            ): number {
                let statusNum = getFilterStatusSortResult(a, b);
                if (statusNum != null) {
                    return statusNum;
                }

                let aContent = a.content.replace("<mark>", "").replace("</mark>", "");
                let bContent = b.content.replace("<mark>", "").replace("</mark>", "");
                let result = bContent.localeCompare(aContent, undefined, {
                    sensitivity: 'base',
                    usage: 'sort',
                    numeric: true
                });
                if (result == 0) {
                    result = Number(b.updated) - Number(a.updated);
                }
                return result;
            };
            break;
    }
    return blockSortFun;

}

function getFilterStatusSortResult(a: DefBlock, b: DefBlock): number {
    if (a.selectionStatus !== b.selectionStatus) {
        if (a.selectionStatus == "SELECTED") {
            return -1;
        } else if (b.selectionStatus == "SELECTED") {
            return 1;
        } else if (a.selectionStatus == "EXCLUDED") {
            return -1;
        } else if (b.selectionStatus == "EXCLUDED") {
            return 1;
        }
    }
    return null;
}

function updateMaxValueMap(map: Map<string, string>, key: string, value: string) {
    if (!value) {
        return;
    }
    let oldValue = map.get(key);
    if (!oldValue || parseFloat(oldValue) < parseFloat(value)) {
        map.set(key, value);
    }
}

function updateMapCount(map: Map<string, number>, key: string, initialValue = 1) {
    let refCount = map.get(key);
    refCount = refCount ? refCount + 1 : initialValue;
    map.set(key, refCount);
}

function updateDynamicAnchorMap(map: Map<string, Set<string>>, markdown: string) {
    let regex = /\(\((\d{14}-\w{7})\s'([^']+)'\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        let id = match[1];
        let anchor = match[2];
        if (id && anchor) {
            let anchorSet = map.get(id);
            anchorSet = anchorSet ? anchorSet : new Set<string>();
            anchorSet.add(anchor);
            map.set(id, anchorSet);
        }
    }
}

function updateStaticAnchorMap(map: Map<string, Set<string>>, markdown: string) {
    let regex = /\(\((\d{14}-\w{7})\s"([^"]+)"\)\)/g;
    let match;
    while ((match = regex.exec(markdown)) !== null) {
        let id = match[1];
        let anchor = match[2];
        if (id && anchor) {
            let anchorSet = map.get(id);
            anchorSet = anchorSet ? anchorSet : new Set<string>();
            anchorSet.add(anchor);
            map.set(id, anchorSet);
        }
    }
}


function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
    if (itemsPerPage <= 0) {
        return 0;
    }
    return Math.ceil(totalItems / itemsPerPage);
}

function formatDefBlockMap(defBlockArray: DefBlock[])
    : Map<string, DefBlock> {
    let map: Map<string, DefBlock> = new Map();
    if (!defBlockArray) {
        return map;
    }
    for (const defBlock of defBlockArray) {
        map.set(defBlock.id, defBlock);
    }

    return map;
}

function getMardownAnchorTextArray(markdown: string): string[] {
    const regex = /\(\(\d{14}-\w{7}\s['"]([^'"]+)['"]\)\)/g;
    let match;
    let result: string[] = [];

    while ((match = regex.exec(markdown)) !== null) {
        let anchor = match[1];
        if (anchor) {
            result.push(anchor);
        }
    }

    return result;
}

function removeMarkdownRefBlockStyle(input) {

    // regex = /\(\((\d{14}-\w{7})\s['"][^'"]+['"]\)\)/g;
    const regex = /\(\(\d{14}-\w{7}\s['"]([^'"]+)['"]\)\)/g;

    // 使用正则表达式替换匹配的字符串
    return input.replace(regex, (_, p1) => p1);
}


function parseSearchSyntax(query: string): {
    includeText: string[],
    excludeText: string[],
    includeAnchor: string[],
    excludeAnchor: string[]
} {
    const includeText: string[] = [];
    const excludeText: string[] = [];
    const includeAnchor: string[] = [];
    const excludeAnchor: string[] = [];

    // 按空格拆分查询字符串
    const terms = splitKeywordStringToArray(query);

    for (const term of terms) {
        if (
            term.startsWith("%-") ||
            term.startsWith("-%")
        ) {
            // 以 `!-` 开头的排除锚文本
            excludeAnchor.push(term.slice(2));
        } else if (term.startsWith("%")) {
            // 以 `!` 开头的包含锚文本
            includeAnchor.push(term.slice(1));
        } else if (term.startsWith("-")) {
            // 以 `-` 开头的排除普通文本
            excludeText.push(term.slice(1));
        } else {
            // 普通文本包含项
            includeText.push(term);
        }
    }

    return {
        includeText,
        excludeText,
        includeAnchor,
        excludeAnchor,
    };
}