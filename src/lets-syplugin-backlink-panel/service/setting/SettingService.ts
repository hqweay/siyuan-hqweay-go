import { EnvConfig } from "@/lets-syplugin-backlink-panel/config/EnvConfig";
import { SettingConfig } from "@/lets-syplugin-backlink-panel/models/setting-model";
import { sql } from "@/lets-syplugin-backlink-panel/utils/api";
import Instance from "@/lets-syplugin-backlink-panel/utils/Instance";
import { getCreateBlocksParentIdIdxSql } from "../backlink/backlink-sql";
import { setReplacer } from "@/lets-syplugin-backlink-panel/utils/json-util";
import { mergeObjects } from "@/lets-syplugin-backlink-panel/utils/object-util";

const SettingFileName = 'backlink-panel-setting.json';

export class SettingService {

    public static get ins(): SettingService {
        return Instance.get(SettingService);
    }

    private _settingConfig: SettingConfig;

    public get SettingConfig() {
        if (this._settingConfig) {
            return this._settingConfig;
        }
        this.init()
        return getDefaultSettingConfig()

    }

    public async init() {
        let persistentConfig = await getPersistentConfig();
        this._settingConfig = mergeObjects(persistentConfig, getDefaultSettingConfig());
        // console.log("init this._settingConfig ", this._settingConfig)

        if (this._settingConfig.usePraentIdIdx) {
            this.createBlocksParentIdIdx();
        }
    }

    // public async getSettingConfig(): Promise<SettingConfig> {
    //     if (!this.settingConfig) {
    //         await this.init();
    //     }
    //     if (this.settingConfig) {
    //         return this.settingConfig;
    //     }
    //     let defaultSettingConfig = getDefaultSettingConfig();
    //     console.error(`反链面板 异常，返回默认设置: `, defaultSettingConfig);
    //     return defaultSettingConfig;
    // }

    public async updateSettingCofnigValue(key: string, newValue: any) {
        let oldValue = this._settingConfig[key];
        if (oldValue == newValue) {
            return;
        }

        this._settingConfig[key] = newValue;
        let paramJson = JSON.stringify(this._settingConfig, setReplacer);
        let plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return;
        }
        console.log(`反链面板 更新设置配置文件: ${paramJson}`);
        plugin.saveData(SettingFileName, paramJson);
    }

    public async updateSettingCofnig(settingConfigParam: SettingConfig) {
        let plugin = EnvConfig.ins.plugin;
        if (!plugin) {
            return;
        }

        let curSettingConfigJson = "";
        if (this._settingConfig) {
            curSettingConfigJson = JSON.stringify(this._settingConfig, setReplacer);
        }
        let paramJson = JSON.stringify(settingConfigParam, setReplacer);
        if (paramJson == curSettingConfigJson) {
            return;
        }
        console.log(`反链面板 更新设置配置文件: ${paramJson}`);
        this._settingConfig = { ...settingConfigParam };
        plugin.saveData(SettingFileName, paramJson);
    }

    public async createBlocksParentIdIdx() {
        let createdSql = getCreateBlocksParentIdIdxSql();
        sql(createdSql);
    }

}



async function getPersistentConfig(): Promise<SettingConfig> {
    let plugin = EnvConfig.ins.plugin;
    let settingConfig = null;
    if (!plugin) {
        return settingConfig;
    }
    let loaded = await plugin.loadData(SettingFileName);
    if (loaded == null || loaded == undefined || loaded == '') {
        console.info(`反链面板插件 没有配置文件，使用默认配置`)
    } else {
        //如果有配置文件，则使用配置文件
        // console.info(`读入配置文件: ${SettingFileName}`)
        if (typeof loaded === 'string') {
            loaded = JSON.parse(loaded);
        }
        try {
            settingConfig = new SettingConfig();
            for (let key in loaded) {
                setKeyValue(settingConfig, key, loaded[key]);
            }
        } catch (error_msg) {
            console.log(`Setting load error: ${error_msg}`);
        }
    }
    return settingConfig;
}

function setKeyValue(settingConfig, key: any, value: any) {
    if (!(key in settingConfig)) {
        console.error(`"${key}" is not a setting`);
        return;
    }
    settingConfig[key] = value;
}

function getDefaultSettingConfig() {
    let defaultConfig = new SettingConfig();

    defaultConfig.dockDisplay = true;
    defaultConfig.documentBottomDisplay = false;
    defaultConfig.flashCardBottomDisplay = false;
    defaultConfig.topBarDisplay = true;

    defaultConfig.cacheAfterResponseMs = -1;
    defaultConfig.cacheExpirationTime = 5 * 60;
    defaultConfig.usePraentIdIdx = false;
    defaultConfig.doubleClickTimeout = 0;


    defaultConfig.documentBottomBacklinkPaddingWidth = null;


    // 筛选面板
    defaultConfig.filterPanelViewExpand = false;
    defaultConfig.queryParentDefBlock = true;
    defaultConfig.querrChildDefBlockForListItem = true;
    defaultConfig.queryChildDefBlockForHeadline = false;
    defaultConfig.filterPanelCurDocDefBlockSortMethod = "typeAndContent";
    defaultConfig.filterPanelRelatedDefBlockSortMethod = "modifiedDesc";
    defaultConfig.filterPanelBacklinkDocumentSortMethod = "createdDesc";
    defaultConfig.defaultSelectedViewBlock = false;


    // 反链面板
    defaultConfig.docBottomBacklinkPanelViewExpand = true;
    defaultConfig.pageSize = 8;
    defaultConfig.backlinkBlockSortMethod = "modifiedDesc";
    defaultConfig.hideBacklinkProtyleBreadcrumb = false;
    defaultConfig.defaultExpandedListItemLevel = 0;
    // defaultConfig.queryAllContentUnderHeadline = false;



    return defaultConfig;
}


