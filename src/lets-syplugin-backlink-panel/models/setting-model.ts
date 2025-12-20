import { isStrNotBlank } from "@/lets-syplugin-backlink-panel/utils/string-util";


export class SettingConfig {
    /* 插件设置 */
    dockDisplay: Boolean;
    // 文档底部显示反链面板
    documentBottomDisplay: boolean;
    // 闪卡底部显示反链面板
    flashCardBottomDisplay: boolean;
    // 顶部栏显示页签按钮
    topBarDisplay: boolean;
    // 缓存
    cacheAfterResponseMs: number;
    cacheExpirationTime: number;
    usePraentIdIdx: boolean;
    // 双击阈值
    doubleClickTimeout: number;

    // 文档底部反链面板宽度
    documentBottomBacklinkPaddingWidth: number



    /* 筛选面板 */
    filterPanelViewExpand: boolean;
    queryParentDefBlock: boolean;
    querrChildDefBlockForListItem: boolean;
    queryChildDefBlockForHeadline: boolean;
    filterPanelCurDocDefBlockSortMethod: BlockSortMethod;
    filterPanelRelatedDefBlockSortMethod: BlockSortMethod;
    filterPanelBacklinkDocumentSortMethod: BlockSortMethod;
    // 默认选中查看块
    defaultSelectedViewBlock: boolean;


    /* 反链面板 */
    docBottomBacklinkPanelViewExpand: boolean;
    pageSize: number;
    backlinkBlockSortMethod: BlockSortMethod;
    hideBacklinkProtyleBreadcrumb: boolean;
    defaultExpandedListItemLevel: number;
    // queryAllContentUnderHeadline: boolean;



}


interface ITabProperty {
    key: string;
    name: string;
    props: Array<ItemProperty>;
    iconKey?: string;
}


export class TabProperty {
    key: string;
    name: string;
    iconKey: string;
    props: ItemProperty[];

    constructor({ key, name, iconKey, props }: ITabProperty) {
        this.key = key;
        this.name = name;
        if (isStrNotBlank(iconKey)) {
            this.iconKey = iconKey;
        } else {
            this.iconKey = "setting";
        }
        this.props = props;

    }

}

export interface IOption {
    name: string;
    desc?: string;
    value: string;
}




export class ItemProperty {
    key: string;
    type: IItemPropertyType;
    name: string;
    description: string;
    tips?: string;

    min?: number;
    max?: number;
    btndo?: () => void;
    options?: IOption[];


    constructor({ key, type, name, description, tips, min, max, btndo, options }: ItemProperty) {
        this.key = key;
        this.type = type;
        this.min = min;
        this.max = max;
        this.btndo = btndo;
        this.options = options ?? [];
        this.name = name;
        this.description = description;
        this.tips = tips;
    }

}
