
type BacklinkParentBlock = DefBlock & {
    childIdPath: string;
    inAttrConcat: string;
    subMarkdown: string;
};


type BacklinkChildBlock = DefBlock & {
    parentIdPath: string;
    parentInAttrConcat: string;
    subMarkdown: string;
    subInAttrConcat: string;
};



type BacklinkBlock = DefBlock & {
    parentBlockType: string;
    parentListItemMarkdown: string;
};


type DefBlock = Block & {
    refCount: number;
    backlinkBlockIdConcat: string;
    dynamicAnchor: string;
    staticAnchor: string;
    selectionStatus: string;
    filterStatus: boolean;
    // 额外字段，用来保存引用的定义块所在的块id
    // refBlockId?: string;
    // refBlockType?: string;
};

type BlockSortMethod =
    | "type"
    | "content"
    | "typeAndContent"
    | "modifiedAsc"
    | "modifiedDesc"
    | "createdAsc"
    | "createdDesc"
    | "rankAsc"
    | "rankDesc"
    | "refCountAsc"
    | "refCountDesc"
    | "alphabeticAsc"
    | "alphabeticDesc"
    | "documentAlphabeticAsc"
    | "documentAlphabeticDesc"
    ;


interface IBacklinkCacheData {
    backlinks: IBacklinkData[];
    usedCache: boolean;
}


type IItemPropertyType =
    "select" |
    "text" |
    "number" |
    "button" |
    "textarea" |
    "switch" |
    "order" |
    "tips";