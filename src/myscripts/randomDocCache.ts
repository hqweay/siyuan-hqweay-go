/**
 * 随机文档缓存管理器
 * 用于统一管理随机文档的缓存，提高性能并减少SQL查询
 */

import { sql as executeSql } from "@/api";
import { getCurrentDocId, openBlockByID } from "./syUtils";
import { openMobileFileById, openTab, showMessage } from "siyuan";
import { mobileUtils } from "@/lets-nav-helper/utils";
import { isMobile, plugin } from "@/utils";
import { navigation } from "@/lets-nav-helper/navigation";
import { getLogger } from "@/libs/logger";
const log = getLogger("randomDocCache");

interface CacheEntry {
  ids: string[];
  currentIndex: number;
  lastUpdated: number;
  sql: string;
}

interface CacheConfig {
  cacheSize?: number; // 缓存数量，默认20
  maxCacheAge?: number; // 缓存最大年龄（毫秒），默认1小时
  enableAutoCleanup?: boolean; // 是否启用自动清理
}

export class RandomDocCache {
  private cache = new Map<string, CacheEntry>();
  private config: Required<CacheConfig>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      cacheSize: config.cacheSize ?? 20,
      maxCacheAge: config.maxCacheAge ?? 60 * 60 * 1000, // 1小时
      enableAutoCleanup: config.enableAutoCleanup ?? true,
    };

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * 获取随机文档ID
   * @param sql 原始SQL查询语句
   * @returns 随机文档ID，如果缓存为空则返回null
   */
  async getRandomDocId(
    sql: string = "SELECT id FROM blocks WHERE type = 'd'"
  ): Promise<string | null> {
    const cacheKey = this.normalizeSql(sql);
    let cacheEntry = this.cache.get(cacheKey);

    // 如果缓存不存在或已过期，重新加载
    if (!cacheEntry || this.isCacheExpired(cacheEntry)) {
      await this.reloadCache(cacheKey, sql);
      cacheEntry = this.cache.get(cacheKey);
    }

    if (!cacheEntry || cacheEntry.ids.length === 0) {
      return null;
    }

    // 获取当前索引的ID
    const docId = cacheEntry.ids[cacheEntry.currentIndex];
    cacheEntry.currentIndex++;

    // 如果缓存用完了，重新加载
    if (cacheEntry.currentIndex >= cacheEntry.ids.length) {
      this.reloadCache(cacheKey, sql).catch(err => log.error(err));
    }

    return docId;
  }

  /**
   * 预加载缓存
   * @param sql SQL查询语句
   */
  async preloadCache(sql: string): Promise<void> {
    const cacheKey = this.normalizeSql(sql);
    if (!this.cache.has(cacheKey)) {
      await this.reloadCache(cacheKey, sql);
    }
  }

  /**
   * 清理指定SQL的缓存
   * @param sql SQL查询语句
   */
  clearCache(sql: string): void {
    const cacheKey = this.normalizeSql(sql);
    this.cache.delete(cacheKey);
  }

  /**
   * 清理所有缓存
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalCaches: number;
    cacheDetails: Array<{
      sql: string;
      cacheSize: number;
      currentIndex: number;
      lastUpdated: number;
      remainingIds: number;
    }>;
  } {
    const details = Array.from(this.cache.entries()).map(([key, entry]) => ({
      sql: entry.sql,
      cacheSize: entry.ids.length,
      currentIndex: entry.currentIndex,
      lastUpdated: entry.lastUpdated,
      remainingIds: entry.ids.length - entry.currentIndex,
    }));

    return {
      totalCaches: this.cache.size,
      cacheDetails: details,
    };
  }

  /**
   * 获取缓存中的剩余ID数量
   * @param sql SQL查询语句
   */
  getRemainingCount(sql: string): number {
    const cacheKey = this.normalizeSql(sql);
    const cacheEntry = this.cache.get(cacheKey);

    if (!cacheEntry) {
      return 0;
    }

    return Math.max(0, cacheEntry.ids.length - cacheEntry.currentIndex);
  }

  /**
   * 检查SQL是否已缓存
   * @param sql SQL查询语句
   */
  hasCache(sql: string): boolean {
    const cacheKey = this.normalizeSql(sql);
    const cacheEntry = this.cache.get(cacheKey);

    return cacheEntry !== undefined && !this.isCacheExpired(cacheEntry);
  }

  /**
   * 销毁缓存管理器，清理资源
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clearAllCache();
  }

  /**
   * 重新加载缓存
   */
  private async reloadCache(cacheKey: string, sql: string): Promise<void> {
    try {
      // 避免全表随机排序，改为拉取后 JS 内存洗牌
      // 如果调用方不慎使用了 SELECT *，尝试替换为 SELECT id 提高网络性能
      const optimizedSql = sql.replace(/select\s+\*/i, "SELECT id");
      const result = await executeSql(optimizedSql);
      let ids = result?.map((item: any) => item.id).filter(Boolean) || [];

      // Fisher-Yates 洗牌算法
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }

      // 只截取所需缓存大小
      if (ids.length > this.config.cacheSize) {
        ids = ids.slice(0, this.config.cacheSize);
      }

      const cacheEntry: CacheEntry = {
        ids,
        currentIndex: 0,
        lastUpdated: Date.now(),
        sql,
      };

      this.cache.set(cacheKey, cacheEntry);

      log.info(`随机文档缓存已更新: ${sql} -> ${ids.length} 条记录`);
    } catch (error) {
      log.error("重新加载随机文档缓存失败:", error);

      // 如果加载失败，设置为空缓存以避免重复尝试
      const cacheEntry: CacheEntry = {
        ids: [],
        currentIndex: 0,
        lastUpdated: Date.now(),
        sql,
      };
      this.cache.set(cacheKey, cacheEntry);
    }
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(cacheEntry: CacheEntry): boolean {
    return Date.now() - cacheEntry.lastUpdated > this.config.maxCacheAge;
  }

  /**
   * 标准化SQL语句（去除多余空格和换行）
   */
  private normalizeSql(sql: string): string {
    return sql.trim().replace(/\s+/g, " ").toLowerCase();
  }

  /**
   * 启动自动清理定时器
   */
  private startAutoCleanup(): void {
    // 每10分钟清理一次过期缓存
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);
  }

  /**
   * 清理过期的缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cacheEntry] of this.cache.entries()) {
      if (this.isCacheExpired(cacheEntry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log.info(`自动清理完成: 清理了 ${cleanedCount} 个过期缓存`);
    }
  }
}

// 创建全局实例
export const randomDocCache = new RandomDocCache();

// 导出便捷方法
export const getRandomDocId = (sql: string) =>
  randomDocCache.getRandomDocId(sql);
export const preloadRandomDocCache = (sql: string) =>
  randomDocCache.preloadCache(sql);
export const clearRandomDocCache = (sql?: string) => {
  if (sql) {
    randomDocCache.clearCache(sql);
  } else {
    randomDocCache.clearAllCache();
  }
};

/**
 * 跳转到随机文档
 */
export const goToRandomBlock = async (sql: string) => {
  try {
    const randomDocId = await getRandomDocId(sql);

    // isMobile
    //   ? openMobileFileById(plugin.app, randomDocId)
    //   : openTab({
    //       app: plugin.app,
    //       doc: {
    //         id: randomDocId,
    //         // action: ["cb-get-focus", "cb-get-all"],
    //         action: ["cb-get-all"],
    //       },
    //     });
    openBlockByID(randomDocId);
    showMessage("已跳转到随机文档");
    mobileUtils.vibrate(50);
  } catch (error) {
    log.error("跳转到随机文档失败:", error);
    showMessage("跳转到随机文档失败");
  }
};
