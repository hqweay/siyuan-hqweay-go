/**
 * backlink-loader.ts — API interaction + concurrency-limited batch loading.
 * Extracted from backlink-data.ts to separate I/O from data transformation.
 */

import { getBacklink2, getBacklinkDoc, sql } from "@/lets-syplugin-backlink-panel/utils/api";
import {
    generateGetBacklinkBlockArraySql,
    generateGetBacklinkListItemBlockArraySql,
    generateGetBlockArraySql,
    generateGetChildBlockArraySql,
    generateGetHeadlineChildDefBlockArraySql,
    generateGetListItemChildBlockArraySql,
    generateGetListItemtSubMarkdownArraySql,
    generateGetParenListItemtDefBlockArraySql,
    generateGetParentDefBlockArraySql,
} from "./backlink-sql";
import {
    IBacklinkBlockNode,
    IBacklinkBlockQueryParams,
} from "@/lets-syplugin-backlink-panel/models/backlink-model";
import {
    countOccurrences,
    isStrNotBlank,
    longestCommonSubstring,
} from "@/lets-syplugin-backlink-panel/utils/string-util";
import {
    intersectionSet,
    isArrayEmpty,
    isArrayNotEmpty,
    isSetEmpty,
    isSetNotEmpty,
} from "@/lets-syplugin-backlink-panel/utils/array-util";
import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
import { SettingService } from "../setting/SettingService";
import { getBacklinkBlockId, formatBacklinkDocApiKeyword } from "./backlink-parser";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-syplugin-backlink-panel");


// ─── Concurrency Helper ──────────────────────────────────────────────────────

/**
 * Run async tasks in chunks of `batchSize` to prevent flooding the kernel.
 * Returns a flat array of all results.
 */
async function runInChunks<T>(
    tasks: (() => Promise<T>)[],
    batchSize: number = 5,
): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
        const batch = tasks.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(fn => fn()));
        results.push(...batchResults);
    }
    return results;
}


// ─── Batch Backlink Doc Loading ──────────────────────────────────────────────

export interface IBacklinkCacheData {
    backlinks: IBacklinkData[];
    usedCache: boolean;
}


export async function getBatchBacklinkDoc(
    curRootId: string,
    backlinkBlockNodeArray: IBacklinkBlockNode[],
): Promise<IBacklinkCacheData> {
    const startTime = performance.now();
    const defIdRefTreeIdKeywordMap = new Map<string, string>();
    const backlinkBlockIdOrderMap = new Map<string, number>();
    const backlinkBlockNodeMap = new Map<string, IBacklinkBlockNode>();
    const backlinkBlockParentNodeMap = new Map<string, IBacklinkBlockNode>();
    for (const [index, node] of backlinkBlockNodeArray.entries()) {
        let backlinkRootId = node.block.root_id;
        let backlinkContent = node.block.content;
        let defId = intersectionSet(node.includeCurBlockDefBlockIds, node.includeDirectDefBlockIds)[0];
        let mapKey = defId + "<->" + backlinkRootId;
        let keyword = defIdRefTreeIdKeywordMap.get(mapKey);
        if (keyword === undefined) {
            keyword = backlinkContent;
        } else {
            keyword = longestCommonSubstring(keyword, backlinkContent);
        }
        defIdRefTreeIdKeywordMap.set(mapKey, keyword);

        backlinkBlockIdOrderMap.set(node.block.id, index);
        backlinkBlockIdOrderMap.set(node.block.parent_id, index - 0.1);
        backlinkBlockNodeMap.set(node.block.id, node);
        backlinkBlockParentNodeMap.set(node.block.parent_id, node);
    }

    let usedCache = false;

    // Build task array for chunked execution
    const keys = Array.from(defIdRefTreeIdKeywordMap.keys());
    const tasks = keys.map((key) => async () => {
        let keySplit = key.split("<->");
        let defId = keySplit[0];
        let refTreeId = keySplit[1];
        let keyword = defIdRefTreeIdKeywordMap.get(key);
        let data = await getBacklinkDocByApiOrCache(curRootId, defId, refTreeId, keyword, false);
        if (data.usedCache) {
            usedCache = true;
        }
        return data.backlinks;
    });

    // Execute in chunks of 5 instead of unbounded Promise.all
    const allBacklinksArray: IBacklinkData[] = (await runInChunks(tasks, 5)).flat();

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
        log.info("反链过滤面板插件 疑似 getBacklinkDoc 接口数据不全，如果清除缓存刷新后还是不全，请反馈开发者。 ");
        log.info("backlinkBlockNodeArray ", backlinkBlockNodeArray, " ,backlinkDcoDataResult ", backlinkDcoDataResult);
        getBacklink2(curRootId, "", "", "3", "3")
    }

    let result: IBacklinkCacheData = { backlinks: backlinkDcoDataResult, usedCache: usedCache };

    const endTime = performance.now();
    const executionTime = endTime - startTime;
    log.info(
        `反链面板 批量获取反链文档信息 消耗时间 : ${executionTime} ms `,
    );
    return result;
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
    const startTime = performance.now();
    const data: { backlinks: IBacklinkData[] } =
        await getBacklinkDoc(defId, refTreeId, keyword, containChildren);
    backlinks = data.backlinks;
    const endTime = performance.now();
    const executionTime = endTime - startTime;

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


// ─── Block Query Helpers ─────────────────────────────────────────────────────

export async function getBacklinkBlockArray(queryParams: IBacklinkBlockQueryParams): Promise<BacklinkBlock[]> {
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


export async function getHeadlineChildBlockArray(queryParams: IBacklinkBlockQueryParams)
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


export async function getListItemChildBlockArray(queryParams: IBacklinkBlockQueryParams)
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

export async function getParentBlockArray(queryParams: IBacklinkBlockQueryParams)
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


export async function getBlockInfoMap(blockIds: string[]) {
    let getBlockArraySql = generateGetBlockArraySql(blockIds);
    let blockArray: DefBlock[] = await sql(getBlockArraySql);
    blockArray = blockArray ? blockArray : [];
    let blockMap = new Map<string, DefBlock>();
    for (const block of blockArray) {
        blockMap.set(block.id, block);
    }
    return blockMap;
}

export async function getBacklinkEmbedBlockInfo(
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

    return { embedBlockmarkdown, relatedDefBlockIdArray };
}

import { getQueryStrByBlock } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";
