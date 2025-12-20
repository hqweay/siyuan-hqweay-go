import { BacklinkPanelFilterCriteria, IBacklinkFilterPanelData } from "@/lets-syplugin-backlink-panel/models/backlink-model";
import { CacheUtil, generateKey } from "@/lets-syplugin-backlink-panel/utils/cache-util";
import Instance from "@/lets-syplugin-backlink-panel/utils/Instance";


const DESTROY_BACKLINK_TAB_CACHE_KEY = "DESTORY_BACKLINK_TAB_CACHE_KEY"

export class CacheManager {


    public static get ins(): CacheManager {
        return Instance.get(CacheManager);
    }

    private backlinkPanelBaseDataCache: CacheUtil = new CacheUtil();
    private backlinkDocApiDataCache: CacheUtil = new CacheUtil();
    private backlinkFilterPanelLastCriteriaCache: CacheUtil = new CacheUtil();
    private backlinkPanelSavedCriteriaCache: CacheUtil = new CacheUtil();

    // 毫秒
    private dayTtl: number = 24 * 60 * 60 * 1000;



    public setBacklinkPanelBaseData(rootId: string, value: IBacklinkFilterPanelData, ttlSeconds: number) {
        this.backlinkPanelBaseDataCache.set(rootId, value, ttlSeconds * 1000);
    }
    public getBacklinkPanelBaseData(rootId: string): IBacklinkFilterPanelData {
        return this.backlinkPanelBaseDataCache.get(rootId);
    }
    public deleteBacklinkPanelBaseData(rootId: string) {
        this.backlinkPanelBaseDataCache.delete(rootId);
    }

    public setBacklinkDocApiData(defId: string, rootId: string, keyword: string, value: any, ttlSeconds: number) {
        let key = generateKey(defId, rootId, keyword);
        this.backlinkDocApiDataCache.set(key, value, ttlSeconds * 1000);
    }
    public getBacklinkDocApiData(rootId: string, defId: string, backlinkRootId: string, keyword: string): any {
        let key = generateKey(rootId, defId, backlinkRootId, keyword);
        return this.backlinkDocApiDataCache.get(key);
    }
    public deleteBacklinkDocApiData(defId: string,) {
        this.backlinkDocApiDataCache.clearByPrefix(defId);
    }

    public deleteBacklinkPanelAllCache(rootId: string) {
        this.deleteBacklinkPanelBaseData(rootId);
        this.deleteBacklinkDocApiData(rootId);
    }


    public setBacklinkFilterPanelLastCriteria(rootId: string, value: BacklinkPanelFilterCriteria) {
        this.backlinkFilterPanelLastCriteriaCache.set(rootId, value, this.dayTtl);
    }
    public getBacklinkFilterPanelLastCriteria(rootId: string): BacklinkPanelFilterCriteria {
        return this.backlinkFilterPanelLastCriteriaCache.get(rootId);
    }


    public setBacklinkPanelSavedCriteria(rootId: string, value: any) {
        this.backlinkPanelSavedCriteriaCache.set(rootId, value, this.dayTtl);
    }
    public getBacklinkPanelSavedCriteria(rootId: string): any {
        return this.backlinkPanelSavedCriteriaCache.get(rootId);
    }


    public addBacklinkDestoryTabDocId(docId: string) {
        this.backlinkPanelSavedCriteriaCache.setByPrefix(DESTROY_BACKLINK_TAB_CACHE_KEY, docId, docId, 2 * 3600 * 1000);
    }

    public getAndRemoveBacklinkDestoryTabDocIdArray(): string[] {
        return this.backlinkPanelSavedCriteriaCache.popByPrefix(DESTROY_BACKLINK_TAB_CACHE_KEY);
    }
}