import { CacheManager } from "@/lets-syplugin-backlink-panel/config/CacheManager";
import { IPanelRednerFilterQueryParams, BacklinkPanelFilterCriteria } from "@/lets-syplugin-backlink-panel/models/backlink-model";

import { getBlockAttrs, setBlockAttrs } from "@/lets-syplugin-backlink-panel/utils/api";
import Instance from "@/lets-syplugin-backlink-panel/utils/Instance";
import { SettingService } from "./SettingService";
import { setReplacer, setReviver } from "@/lets-syplugin-backlink-panel/utils/json-util";
import { mergeObjects } from "@/lets-syplugin-backlink-panel/utils/object-util";

const BACKLINK_FILTER_PANEL_LAST_CRITERIA_ATTRIBUTE_KEY = "custom-backlink-filter-panel-last-criteria";
const BACKLINK_FILTER_PANEL_SAVED_CRITERIA_ATTRIBUTE_KEY = "custom-backlink-filter-panel-saved-criteria";
export const DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY = "custom-document-bottom-show-backlink-filter-panel";
export class BacklinkFilterPanelAttributeService {

    public static get ins(): BacklinkFilterPanelAttributeService {
        return Instance.get(BacklinkFilterPanelAttributeService);
    }


    public async getPanelCriteria(rootId: string): Promise<BacklinkPanelFilterCriteria> {
        let documentPanelCriteria = CacheManager.ins.getBacklinkFilterPanelLastCriteria(rootId);
        let defaultQueryParams = this.getDefaultQueryParams();
        let queryParams;
        // 存在缓存数据
        if (documentPanelCriteria) {
            documentPanelCriteria.queryParams.pageNum = 1;
            queryParams = mergeObjects(documentPanelCriteria.queryParams, defaultQueryParams);
        } else {
            let attrsMap = await getBlockAttrs(rootId);
            // 存在保存的最后查询条件
            if (attrsMap && Object.keys(attrsMap).includes(BACKLINK_FILTER_PANEL_LAST_CRITERIA_ATTRIBUTE_KEY)) {
                let json = attrsMap[BACKLINK_FILTER_PANEL_LAST_CRITERIA_ATTRIBUTE_KEY];
                let parseObject = JSON.parse(json) as BacklinkPanelFilterCriteria;
                if ("queryParams" in parseObject) {
                    documentPanelCriteria = parseObject;
                    parseObject.queryParams.backlinkKeywordStr = "";
                    queryParams = mergeObjects(documentPanelCriteria.queryParams, defaultQueryParams);
                }
            }
            if (!documentPanelCriteria) {
                queryParams = defaultQueryParams;
                documentPanelCriteria = new BacklinkPanelFilterCriteria();
                documentPanelCriteria.backlinkPanelFilterViewExpand = SettingService.ins.SettingConfig.filterPanelViewExpand;
                // documentPanelCriteria.backlinkPanelBacklinkViewExpand = SettingService.ins.SettingConfig.backlinkPanelViewExpand;;
            }
            queryParams.includeRelatedDefBlockIds = new Set<string>();
            queryParams.excludeRelatedDefBlockIds = new Set<string>();
            queryParams.includeDocumentIds = new Set<string>();
            queryParams.excludeDocumentIds = new Set<string>();
            CacheManager.ins.setBacklinkFilterPanelLastCriteria(rootId, documentPanelCriteria);
        }

        documentPanelCriteria.queryParams = queryParams;


        // console.log("getBacklinkPanelFilterCriteria queryParams", queryParams)
        return documentPanelCriteria;
    }


    public async updatePanelCriteria(rootId: string, criteria: BacklinkPanelFilterCriteria) {
        if (!rootId) {
            return;
        }
        let lastCriteria = await this.getPanelCriteria(rootId);
        let lastCriteriaJson = "";
        if (lastCriteria) {
            lastCriteriaJson = JSON.stringify(lastCriteria);
        }
        let criteriaJson = JSON.stringify(criteria);
        if (criteriaJson == lastCriteriaJson) {
            return;
        }

        CacheManager.ins.setBacklinkFilterPanelLastCriteria(rootId, criteria);

        // 持久缓存删除 关键字。
        let criteriaCloned : BacklinkPanelFilterCriteria= JSON.parse(criteriaJson);
        criteriaCloned.queryParams.backlinkKeywordStr = "";
        let criteriaClonedJson = JSON.stringify(criteriaCloned);
        let attrs = {};
        attrs[BACKLINK_FILTER_PANEL_LAST_CRITERIA_ATTRIBUTE_KEY] = criteriaClonedJson;
        setBlockAttrs(rootId, attrs);
    }


    public async getPanelSavedCriteriaMap(rootId: string): Promise<Map<string, IPanelRednerFilterQueryParams>> {
        let savedCriteriaMap = CacheManager.ins.getBacklinkPanelSavedCriteria(rootId);
        if (savedCriteriaMap && savedCriteriaMap.size > 0) {
            return savedCriteriaMap
        }

        let attrsMap = await getBlockAttrs(rootId);
        // console.log("getPanelSavedCriteriaMap attrsMap : ", attrsMap)
        if (attrsMap && Object.keys(attrsMap).includes(BACKLINK_FILTER_PANEL_SAVED_CRITERIA_ATTRIBUTE_KEY)) {
            let json = attrsMap[BACKLINK_FILTER_PANEL_SAVED_CRITERIA_ATTRIBUTE_KEY];
            let parseObject = JSON.parse(json, setReviver);
            if (parseObject) {
                const resultMap = new Map<string, IPanelRednerFilterQueryParams>(Object.entries(parseObject));
                CacheManager.ins.setBacklinkPanelSavedCriteria(rootId, resultMap);
                return resultMap;
            }
        }

        return new Map();
    }


    public async updatePanelSavedCriteriaMap(rootId: string, criteriaMap: Map<string, IPanelRednerFilterQueryParams>) {
        if (!rootId) {
            return;
        }
        // let lastCriteriaMap = await this.getPanelSavedCriteriaMap(rootId);
        // let lastCriteriaJson = "";
        // if (lastCriteriaMap) {
        //     const obj = Object.fromEntries(lastCriteriaMap);
        //     lastCriteriaJson = JSON.stringify(obj, setReplacer);
        // }
        const mapObject = Object.fromEntries(criteriaMap);
        let criteriaJson = JSON.stringify(mapObject, setReplacer);
        // if (criteriaJson == lastCriteriaJson) {
        //     return;
        // }

        CacheManager.ins.setBacklinkPanelSavedCriteria(rootId, criteriaMap);

        let attrs = {};
        attrs[BACKLINK_FILTER_PANEL_SAVED_CRITERIA_ATTRIBUTE_KEY] = criteriaJson;
        setBlockAttrs(rootId, attrs);
    }


    public async getDocumentBottomShowPanel(rootId: string): Promise<number> {

        let attrsMap = await getBlockAttrs(rootId);
        if (attrsMap && Object.keys(attrsMap).includes(DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY)) {
            let json = attrsMap[DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY];
            return Number(json);
        }

        return null;
    }


    public async updateDocumentBottomShowPanel(rootId: string, value: number) {
        if (!rootId) {
            return;
        }
        let valueStr;
        if (value) {
            valueStr = String(value);
        }
        if (!valueStr) {
            valueStr = "";
        }

        let attrs = {};
        attrs[DOCUMENT_BOTTOM_SHOW_BACKLINK_FILTER_PANEL_ATTRIBUTE_KEY] = valueStr;
        setBlockAttrs(rootId, attrs);
    }


    getDefaultQueryParams(): IPanelRednerFilterQueryParams {
        let settingConfig = SettingService.ins.SettingConfig;
        let backlinkBlockSortMethod = "modifiedDesc";
        let filterPanelCurDocDefBlockSortMethod = "typeAndContent";
        let filterPanelRelatedDefBlockSortMethod = "modifiedDesc";
        let filterPanelbacklinkDocumentSortMethod = "createdDesc";
        if (settingConfig) {
            backlinkBlockSortMethod = settingConfig.backlinkBlockSortMethod ? settingConfig.backlinkBlockSortMethod : backlinkBlockSortMethod;
            filterPanelCurDocDefBlockSortMethod = settingConfig.filterPanelCurDocDefBlockSortMethod ? settingConfig.filterPanelCurDocDefBlockSortMethod : filterPanelCurDocDefBlockSortMethod;
            filterPanelRelatedDefBlockSortMethod = settingConfig.filterPanelRelatedDefBlockSortMethod ? settingConfig.filterPanelRelatedDefBlockSortMethod : filterPanelRelatedDefBlockSortMethod;
            filterPanelbacklinkDocumentSortMethod = settingConfig.filterPanelBacklinkDocumentSortMethod ? settingConfig.filterPanelBacklinkDocumentSortMethod : filterPanelbacklinkDocumentSortMethod;
        }
        let queryParams = {
            pageNum: 1,
            backlinkCurDocDefBlockType: "all",
            backlinkBlockSortMethod: backlinkBlockSortMethod,
            backlinkKeywordStr: "",
            includeRelatedDefBlockIds: new Set<string>(),
            excludeRelatedDefBlockIds: new Set<string>(),
            includeDocumentIds: new Set<string>(),
            excludeDocumentIds: new Set<string>(),
            filterPanelCurDocDefBlockSortMethod: filterPanelCurDocDefBlockSortMethod,
            filterPanelCurDocDefBlockKeywords: "",
            filterPanelRelatedDefBlockType: "all",
            filterPanelRelatedDefBlockSortMethod: filterPanelRelatedDefBlockSortMethod,
            filterPanelRelatedDefBlockKeywords: "",
            filterPanelBacklinkDocumentSortMethod: filterPanelbacklinkDocumentSortMethod,
            filterPanelBacklinkDocumentKeywords: "",
        } as IPanelRednerFilterQueryParams;

        return queryParams;
    }


}


