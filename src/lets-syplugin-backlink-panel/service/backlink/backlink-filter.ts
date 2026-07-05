/**
 * backlink-filter.ts — Filtering, validation, and sorting logic
 * extracted from backlink-data.ts to separate concerns.
 */

import {
    IBacklinkBlockNode,
    IBacklinkFilterPanelData,
    IPanelRenderBacklinkQueryParams,
    ListItemTreeNode,
} from "@/lets-syplugin-backlink-panel/models/backlink-model";
import {
    containsAllKeywords,
    isStrBlank,
    matchKeywords,
    splitKeywordStringToArray,
} from "@/lets-syplugin-backlink-panel/utils/string-util";
import {
    isArrayEmpty,
    isSetEmpty,
    isSetNotEmpty,
} from "@/lets-syplugin-backlink-panel/utils/array-util";
import { DefinitionBlockStatus } from "@/lets-syplugin-backlink-panel/models/backlink-constant";
import { getBatchBlockIdIndex } from "@/lets-syplugin-backlink-panel/utils/api";
import { getQueryStrByBlock } from "@/lets-syplugin-backlink-panel/utils/siyuan-util";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-syplugin-backlink-panel");


// ─── Query Param Validation ──────────────────────────────────────────────────

// 清理失效的查询条件，比如保存的一个查询定义块id，以前存在，现在不存在了。
export function cleanInvalidQueryParams(
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


// ─── Block Validation ─────────────────────────────────────────────────────────

export function isBacklinkBlockValid(
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


// ─── DefBlock Filtering ───────────────────────────────────────────────────────

export function filterExistingDefBlocks(
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


export function filterBacklinkDocumentBlocks(
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


// ─── Sorting ──────────────────────────────────────────────────────────────────

export async function backlinkBlockNodeArraySort(
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
                log.info("dynamicAnchorText defBlock ", defBlock)
                defBlock.filterStatus = true;
            } else if (defBLockType == "staticAnchorText" && isStrBlank(defBlock.staticAnchor)) {
                log.info("staticAnchorText defBlock ", defBlock)
                defBlock.filterStatus = true;
            }
        }
    }
    let keywordArray = splitKeywordStringToArray(keywordStr);
    if (isArrayEmpty(keywordArray)) {
        return;
    }
    for (const defBlock of defBlockArray) {
        let staticAnchor = defBlock.staticAnchor ? defBlock.staticAnchor + "-static- -\u9759\u6001\u951A\u6587\u672C- -\u951A- -\u951A\u94FE\u63A5-" : "";
        let blockContent = defBlock.content + defBlock.name + defBlock.alias + defBlock.memo + staticAnchor;
        let containsAll = containsAllKeywords(blockContent, keywordArray);
        if (!containsAll) {
            defBlock.filterStatus = true;
        }
    }
}


// ─── Internal Helpers ─────────────────────────────────────────────────────────

export function getBlockIds(blockList: DefBlock[]): string[] {
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


export function updateMapCount(map: Map<string, number>, key: string, initialValue = 1) {
    let refCount = map.get(key);
    refCount = refCount ? refCount + 1 : initialValue;
    map.set(key, refCount);
}


export function formatDefBlockMap(defBlockArray: DefBlock[]): Map<string, DefBlock> {
    let map: Map<string, DefBlock> = new Map();
    if (!defBlockArray) {
        return map;
    }
    for (const defBlock of defBlockArray) {
        map.set(defBlock.id, defBlock);
    }
    return map;
}

export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
    if (itemsPerPage <= 0) {
        return 0;
    }
    return Math.ceil(totalItems / itemsPerPage);
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


// ─── Search Syntax Parser ─────────────────────────────────────────────────────

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

    const terms = splitKeywordStringToArray(query);

    for (const term of terms) {
        if (
            term.startsWith("%-") ||
            term.startsWith("-%")
        ) {
            excludeAnchor.push(term.slice(2));
        } else if (term.startsWith("%")) {
            includeAnchor.push(term.slice(1));
        } else if (term.startsWith("-")) {
            excludeText.push(term.slice(1));
        } else {
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
    const regex = /\(\(\d{14}-\w{7}\s['"]([^'"]+)['"]\)\)/g;
    return input.replace(regex, (_, p1) => p1);
}

export function updateMaxValueMap(map: Map<string, string>, key: string, value: string) {
    if (!value) {
        return;
    }
    let oldValue = map.get(key);
    if (!oldValue || parseFloat(oldValue) < parseFloat(value)) {
        map.set(key, value);
    }
}
