import { getRefBlockId } from "@/lets-syplugin-backlink-panel/service/backlink/backlink-data";
import { isArrayEmpty, isArrayNotEmpty, isSetNotEmpty } from "@/lets-syplugin-backlink-panel/utils/array-util";
import { isStrNotBlank } from "@/lets-syplugin-backlink-panel/utils/string-util";

export interface IBacklinkFilterPanelDataQueryParams {
    rootId: string;
    focusBlockId?: string;
    queryParentDefBlock?: boolean;
    querrChildDefBlockForListItem?: boolean;
    queryChildDefBlockForHeadline?: boolean;
    queryCurDocDefBlockRange: string;

}


export interface IBacklinkBlockQueryParams {
    queryParentDefBlock?: boolean;
    querrChildDefBlockForListItem?: boolean;
    // querrChildDefBlockForListItemSameLogseq?: boolean;
    queryChildDefBlockForHeadline?: boolean;
    defBlockIds?: string[];
    backlinkBlockIds?: string[];
    backlinkBlocks?: BacklinkBlock[];
    backlinkAllParentBlockIds?: string[];
    backlinkParentListItemBlockIds?: string[];
    // queryAllContentUnderHeadline?: boolean;
    // includeTypes: string[];
    // relatedDefBlockIdArray?: string[];
}



export interface IBacklinkBlockNode {
    block: DefBlock;
    documentBlock: DefBlock;
    parentMarkdown: string;
    listItemChildMarkdown: string;
    headlineChildMarkdown: string;
    // 存放包含当前文档定义块的定义块id
    includeDirectDefBlockIds: Set<string>;
    // 存放包含关联定义块的id；关联的定义：非当前文档的定义块
    includeRelatedDefBlockIds: Set<string>;
    // 存放当前块的定义块。
    includeCurBlockDefBlockIds: Set<string>;
    // 存放子级块的定义块。反链块是列表项或标题就会有子级。
    // 废弃，列表项的子级定义块用 parentListItemTreeNode 获取。标题的子级定义块在 includeRelatedDefBlockIds 中。
    // includeChildDefBlockIds: Set<string>;
    // 存放父级块存在的定义块。
    includeParentDefBlockIds: Set<string>;
    dynamicAnchorMap: Map<string, Set<string>>;
    staticAnchorMap: Map<string, Set<string>>;
    parentListItemTreeNode?: ListItemTreeNode;
}

export class ListItemTreeNode {
    id: string;
    parentId: string;
    type: string;
    parentIdPath: string;
    parentInAttrConcat: string;
    subMarkdown: string;
    subInAttrConcat: string;
    includeDefBlockIds: Set<string>;
    children: ListItemTreeNode[];
    excludeChildIdArray: string[];
    includeChildIdArray: string[];

    constructor(id: string) {
        this.id = id;
        this.children = [];
    }

    existsKeywords(keywordArray: string[]): boolean {
        if (keywordArray || keywordArray.length == 0) {
            return true;
        }
        let newKeywordArray = keywordArray.slice();
        for (const keywordStr of keywordArray) {
            if (this.subMarkdown.includes(keywordStr)) {
                newKeywordArray.filter(element => element !== keywordStr);
            }
        }
        if (newKeywordArray.length == 0) {
            return true;
        }
        // 递归检查子节点
        this.children.forEach(child => {
            const childMatches = child.existsKeywords(newKeywordArray);
            if (childMatches) {
                return true;
            }
        });

        if (newKeywordArray.length == 0) {
            return true;
        } else {
            return false;
        }
    }

    resetExcludeItemIdArray(parentDefBlockIdArray: string[], excludeDefBlockIdArray: string[]): string[] {
        let result = [];
        if (isArrayEmpty(excludeDefBlockIdArray)) {
            this.excludeChildIdArray = result;
            return result;
        }
        let newParentDefBlockIdArray = [...parentDefBlockIdArray];
        if (isSetNotEmpty(this.includeDefBlockIds)) {
            newParentDefBlockIdArray.push(...this.includeDefBlockIds);
        }
        if (isSetNotEmpty(this.includeDefBlockIds)) {
            let exclude = excludeDefBlockIdArray.some(value => newParentDefBlockIdArray.includes(value))
            if (exclude) {
                result.push(this.id);
                this.excludeChildIdArray = result;
                return result;
            }
        }
        if (isArrayNotEmpty(this.children)) {
            this.children.forEach(item => {
                let itemResult = item.resetExcludeItemIdArray(newParentDefBlockIdArray, excludeDefBlockIdArray);
                if (itemResult) {
                    result = result.concat(itemResult);

                }
            });
        }
        this.excludeChildIdArray = result;
        return result;
    }


    resetIncludeItemIdArray(parentDefBlockIdArray: string[], includeDefBlockIdArray: string[]): string[] {
        let itemArray = this.getIncludeItemArray(parentDefBlockIdArray, includeDefBlockIdArray);
        let itemIdSet = new Set<string>();
        for (const item of itemArray) {
            itemIdSet.add(item.id);
            if (item.parentIdPath) {
                let parentIdArray = item.parentIdPath.split("->");
                for (const parentId of parentIdArray) {
                    itemIdSet.add(parentId);
                }
            }
            let childIdArray = item.getAllChildIds();
            for (const childId of childIdArray) {
                itemIdSet.add(childId);
            }
        }
        this.includeChildIdArray = Array.from(itemIdSet);
        return this.includeChildIdArray;
    }

    getIncludeItemArray(parentDefBlockIdArray: string[], includeDefBlockIdArray: string[]): ListItemTreeNode[] {
        let result: ListItemTreeNode[] = [];
        let newParentDefBLockIdArray = [...parentDefBlockIdArray];
        if (isSetNotEmpty(this.includeDefBlockIds)) {
            newParentDefBLockIdArray.push(...this.includeDefBlockIds);
        }

        if (isArrayEmpty(includeDefBlockIdArray)) {
            result.push(this);
            return result;
        }
        if (isSetNotEmpty(this.includeDefBlockIds)) {
            let includeAll = includeDefBlockIdArray.every(value => newParentDefBLockIdArray.includes(value))
            if (includeAll) {
                result.push(this);
                return result;
            }
        }
        if (isArrayNotEmpty(this.children)) {
            this.children.forEach(item => {
                let itemResult = item.getIncludeItemArray(newParentDefBLockIdArray, includeDefBlockIdArray);
                if (itemResult) {
                    result = result.concat(itemResult);
                }
            });
        }
        return result;

    }
    // 获取当前节点的所有子节点ID
    getAllChildIds(): string[] {
        let ids: string[] = [];

        // 递归获取所有子节点的ID
        this.children.forEach(child => {
            ids.push(child.id);
            ids = ids.concat(child.getAllChildIds());
        });

        return ids;
    }

    // 获取当前节点的所有子节点中的引用ID
    getAllDefBlockIds(): string[] {

        return this.getFilterDefBlockIds(null, null);
    }

    getFilterDefBlockIds(includeChildIdArray: string[], excludeChildIdArray: string[]): string[] {
        let childMarkdown = this.getFilterMarkdown(includeChildIdArray, excludeChildIdArray);
        let defBlockIds = getRefBlockId(childMarkdown);
        return defBlockIds;
    }

    getAllMarkdown(): string {

        return this.getFilterMarkdown(null, null);
    }


    getFilterMarkdown(includeChildIdArray: string[], excludeChildIdArray: string[]): string {
        let markdown: string = isStrNotBlank(this.subMarkdown) ? this.subMarkdown : ""
        markdown += isStrNotBlank(this.parentInAttrConcat) ? this.parentInAttrConcat : "";
        markdown += isStrNotBlank(this.subInAttrConcat) ? this.subInAttrConcat : "";

        for (const child of this.children) {
            if (isArrayNotEmpty(excludeChildIdArray) && excludeChildIdArray.includes(child.id)) {
                continue;
            }
            if (isArrayNotEmpty(includeChildIdArray) && !includeChildIdArray.includes(child.id)) {
                continue;
            }
            let childMarkdown = child.getFilterMarkdown(includeChildIdArray, excludeChildIdArray)
            markdown += childMarkdown;
        }

        return markdown;
    }



    static buildTree(data: BacklinkChildBlock[]): ListItemTreeNode[] | null {
        const rootNodes: Record<string, ListItemTreeNode> = {};

        data.forEach(item => {
            const pathIds = item.parentIdPath.split('->');
            let currentNode: ListItemTreeNode | undefined = rootNodes[pathIds[0]];

            // 如果根节点不存在，则创建它
            if (!currentNode) {
                currentNode = new ListItemTreeNode(pathIds[0]);
                rootNodes[pathIds[0]] = currentNode;
            }

            for (let i = 1; i < pathIds.length; i++) {
                const nodeId = pathIds[i];
                let childNode = currentNode.children.find(node => node.id === nodeId);

                // 如果子节点不存在，则创建它
                if (!childNode) {
                    childNode = new ListItemTreeNode(nodeId);
                    currentNode.children.push(childNode);
                }

                currentNode = childNode;
            }

            // 为最后一个节点填充内容
            if (currentNode) {
                currentNode.parentId = item.parent_id;
                currentNode.type = item.type;
                currentNode.parentIdPath = item.parentIdPath;
                currentNode.parentInAttrConcat = item.parentInAttrConcat;
                currentNode.subMarkdown = item.subMarkdown;
                currentNode.subInAttrConcat = item.subInAttrConcat

                currentNode.includeDefBlockIds = new Set(getRefBlockId(currentNode.subMarkdown));

            }
        });

        // 返回构建的树的根节点（假设只有一个根节点）
        const rootNodeArray = Object.values(rootNodes);
        return rootNodeArray;
    }
}


export interface IBacklinkFilterPanelData {
    rootId?: string;
    backlinkBlockNodeArray: IBacklinkBlockNode[];
    // 当前文档的定义块
    curDocDefBlockArray: DefBlock[];
    // 有关联的定义块
    relatedDefBlockArray: DefBlock[];
    // 反链块所属的文档
    backlinkDocumentArray: DefBlock[];

    userCache?: boolean;

    // 关联块文档数据结构，不采用文档方式
    // documentNodeArray: DocumentNode[];
}

export interface IPanelRenderBacklinkQueryParams {
    pageNum: number;
    pageSize: number;
    backlinkCurDocDefBlockType: string;
    backlinkBlockSortMethod: BlockSortMethod;
    backlinkKeywordStr: string;
    includeRelatedDefBlockIds: Set<string>;
    excludeRelatedDefBlockIds: Set<string>;
    includeDocumentIds: Set<string>;
    excludeDocumentIds: Set<string>;

}

export interface IPanelRednerFilterQueryParams extends IPanelRenderBacklinkQueryParams {
    filterPanelCurDocDefBlockSortMethod: BlockSortMethod;
    filterPanelCurDocDefBlockKeywords: string;

    filterPanelRelatedDefBlockType: string;
    filterPanelRelatedDefBlockSortMethod: BlockSortMethod;
    filterPanelRelatedDefBlockKeywords: string;

    filterPanelBacklinkDocumentSortMethod: BlockSortMethod;
    filterPanelBacklinkDocumentKeywords: string;
}



export interface IBacklinkPanelRenderData {
    rootId: string;

    backlinkDataArray: IBacklinkData[];

    backlinkBlockNodeArray: IBacklinkBlockNode[];
    // 当前文档的定义块
    curDocDefBlockArray: DefBlock[];
    // 有关联的定义块
    relatedDefBlockArray: DefBlock[];
    // 反链块所属的文档块信息
    backlinkDocumentArray: DefBlock[];

    pageNum: number;
    pageSize: number;
    totalPage: number;
    usedCache: boolean;
}

export class BacklinkPanelFilterCriteria {
    // backlinkPanelBaseDataQueryParams: BacklinkPanelBaseDataQueryParams;
    queryParams: IPanelRednerFilterQueryParams;
    backlinkPanelFilterViewExpand: boolean;
    // backlinkPanelBacklinkViewExpand: boolean;

}