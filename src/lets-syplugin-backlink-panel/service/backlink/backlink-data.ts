/**
 * backlink-data.ts — Orchestrator / Facade
 *
 * Previously 1800 lines of monolithic code. Now delegates to:
 *   - backlink-filter.ts  — filtering, validation, sorting
 *   - backlink-loader.ts  — API interaction, concurrency-limited batch loading
 *   - backlink-parser.ts  — DOM/Markdown parsing, anchor extraction
 */

import { sql } from "@/lets-syplugin-backlink-panel/utils/api";
import {
    generateGetDefBlockArraySql,
} from "./backlink-sql";
import {
    IBacklinkBlockNode,
    IBacklinkBlockQueryParams,
    IBacklinkFilterPanelData,
    IBacklinkFilterPanelDataQueryParams,
    IBacklinkPanelRenderData,
    IPanelRenderBacklinkQueryParams,
    ListItemTreeNode,
} from "@/lets-syplugin-backlink-panel/models/backlink-model";
import {
    isArrayEmpty,
    isArrayNotEmpty,
    isSetNotEmpty,
    paginate,
} from "@/lets-syplugin-backlink-panel/utils/array-util";
import { DefinitionBlockStatus } from "@/lets-syplugin-backlink-panel/models/backlink-constant";
import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
import { SettingService } from "../setting/SettingService";
import { getQueryStrByBlock } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-syplugin-backlink-panel");

// ─── Re-exports from extracted modules ────────────────────────────────────────
// Maintain backward compatibility for consumers that import from this file.

export {
    cleanInvalidQueryParams,
    isBacklinkBlockValid,
    filterExistingDefBlocks,
    filterBacklinkDocumentBlocks,
    backlinkBlockNodeArraySort,
    defBlockArraySort,
    defBlockArrayTypeAndKeywordFilter,
    getBlockIds,
    updateMapCount,
    formatDefBlockMap,
    calculateTotalPages,
    updateMaxValueMap,
} from "./backlink-filter";

export {
    getBacklinkBlockId,
    getRefBlockId,
    updateDynamicAnchorMap,
    updateStaticAnchorMap,
    formatBacklinkDocApiKeyword,
} from "./backlink-parser";

export type { IBacklinkCacheData } from "./backlink-loader";
export {
    getBatchBacklinkDoc,
    getBacklinkBlockArray,
    getHeadlineChildBlockArray,
    getListItemChildBlockArray,
    getParentBlockArray,
    getBlockInfoMap,
    getBacklinkEmbedBlockInfo,
} from "./backlink-loader";

// ─── Import from extracted modules for local use ──────────────────────────────

import {
    cleanInvalidQueryParams,
    isBacklinkBlockValid,
    filterExistingDefBlocks,
    filterBacklinkDocumentBlocks,
    backlinkBlockNodeArraySort,
    getBlockIds,
    updateMapCount,
    calculateTotalPages,
    updateMaxValueMap,
} from "./backlink-filter";

import {
    getRefBlockId,
    updateDynamicAnchorMap,
    updateStaticAnchorMap,
} from "./backlink-parser";

import {
    IBacklinkCacheData,
    getBatchBacklinkDoc,
    getBacklinkBlockArray,
    getHeadlineChildBlockArray,
    getListItemChildBlockArray,
    getParentBlockArray,
    getBlockInfoMap,
    getBacklinkEmbedBlockInfo,
} from "./backlink-loader";


// ─── Main Entry Points ──────────────────────────────────────────────────────

export async function getBacklinkPanelRenderData(
    backlinkPanelData: IBacklinkFilterPanelData,
    queryParams: IPanelRenderBacklinkQueryParams,
): Promise<IBacklinkPanelRenderData> {
    const startTime = performance.now();

    if (!backlinkPanelData || !queryParams) {
        return
    }
    let pageNum = queryParams.pageNum || 1;
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

    backlinkBlockNodeArraySort(validBacklinkBlockNodeArray, queryParams.backlinkBlockSortMethod);
    let pageBacklinkBlockArray = paginate(validBacklinkBlockNodeArray, pageNum, pageSize);
    let backlinkCacheData: IBacklinkCacheData = await getBatchBacklinkDoc(rootId, pageBacklinkBlockArray);

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

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    log.info(
        `反链面板 生成渲染数据 消耗时间 : ${executionTime} ms `,
    );

    return backlinkPanelRenderDataResult;
}


export async function getTurnPageBacklinkPanelRenderData(
    rootId: string,
    validBacklinkBlockNodeArray: IBacklinkBlockNode[],
    queryParams: IPanelRenderBacklinkQueryParams,
): Promise<IBacklinkPanelRenderData> {
    const startTime = performance.now();
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
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    log.info(
        `反链面板 翻页 消耗时间 : ${executionTime} ms `,
    );

    return backlinkPanelRenderDataResult;
}


export async function getBacklinkPanelData(
    queryParams: IBacklinkFilterPanelDataQueryParams
): Promise<IBacklinkFilterPanelData> {
    const startTime = performance.now();
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

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    log.info(
        `反链面板 获取和处理数据 消耗时间 : ${executionTime} ms `,
    );
    let cacheAfterResponseMs = SettingService.ins.SettingConfig.cacheAfterResponseMs;
    let cacheExpirationTime = SettingService.ins.SettingConfig.cacheExpirationTime;

    if (cacheAfterResponseMs >= 0
        && cacheExpirationTime >= 0
        && executionTime > cacheAfterResponseMs) {
        CacheManager.ins.setBacklinkPanelBaseData(rootId, backlinkPanelData, cacheExpirationTime);
    }

    return backlinkPanelData;
}


// ─── Build Panel Data (assembly of all query results) ─────────────────────────

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
        updateDynamicAnchorMap(relatedDefBlockDynamicAnchorMap, markdown);
        updateStaticAnchorMap(relatedDefBlockStaticAnchorMap, markdown);
        backlinkBlockMap[backlinkBlockNode.block.id] = backlinkBlockNode;
    }
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
        }
        markdown += inAttrConcat;

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