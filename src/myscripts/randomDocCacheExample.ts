/**
 * 随机文档缓存使用示例
 * 演示如何使用RandomDocCache类来优化随机文档访问
 */

import { RandomDocCache, getRandomDocId, preloadRandomDocCache, randomDocCache } from "./randomDocCache";

/**
 * 示例1: 基本使用 - 获取随机文档ID
 */
export async function example1_basicUsage() {
    const sql = "SELECT * FROM blocks WHERE type = 'd'";
    
    try {
        // 获取一个随机文档ID
        const docId = await getRandomDocId(sql);
        console.log("随机文档ID:", docId);
        
        // 继续获取更多随机文档ID
        for (let i = 0; i < 5; i++) {
            const id = await getRandomDocId(sql);
            console.log(`第${i + 1}个随机文档ID:`, id);
        }
    } catch (error) {
        console.error("获取随机文档失败:", error);
    }
}

/**
 * 示例2: 预加载缓存
 */
export async function example2_preloadCache() {
    const sql = "SELECT * FROM blocks WHERE type = 'd'";
    
    try {
        // 预加载缓存，提高后续访问速度
        await preloadRandomDocCache(sql);
        console.log("缓存预加载完成");
        
        // 现在获取随机文档会更快
        const docId = await getRandomDocId(sql);
        console.log("从预加载缓存获取的文档ID:", docId);
    } catch (error) {
        console.error("预加载缓存失败:", error);
    }
}

/**
 * 示例3: 自定义缓存配置
 */
export async function example3_customConfig() {
    // 创建自定义配置的缓存管理器
    const customCache = new RandomDocCache({
        cacheSize: 50,        // 缓存50条记录
        maxCacheAge: 30 * 60 * 1000, // 30分钟过期
        enableAutoCleanup: true,
    });
    
    const sql = "SELECT * FROM blocks WHERE type = 'd'";
    
    try {
        // 使用自定义缓存
        const docId = await customCache.getRandomDocId(sql);
        console.log("自定义缓存获取的文档ID:", docId);
        
        // 查看缓存统计
        const stats = customCache.getCacheStats();
        console.log("缓存统计:", stats);
        
        // 清理自定义缓存
        customCache.destroy();
    } catch (error) {
        console.error("自定义缓存使用失败:", error);
    }
}

/**
 * 示例4: 缓存管理和监控
 */
export async function example4_cacheManagement() {
    const sql = "SELECT * FROM blocks WHERE type = 'd'";
    
    try {
        // 获取一些随机文档以填充缓存
        for (let i = 0; i < 10; i++) {
            await getRandomDocId(sql);
        }
        
        // 检查缓存状态
        const hasCache = randomDocCache.hasCache(sql);
        console.log("是否已有缓存:", hasCache);
        
        const remainingCount = randomDocCache.getRemainingCount(sql);
        console.log("缓存中剩余ID数量:", remainingCount);
        
        // 查看详细统计
        const stats = randomDocCache.getCacheStats();
        console.log("详细缓存统计:", JSON.stringify(stats, null, 2));
        
        // 清理指定SQL的缓存
        randomDocCache.clearCache(sql);
        console.log("已清理指定SQL的缓存");
        
    } catch (error) {
        console.error("缓存管理失败:", error);
    }
}

/**
 * 示例5: 实际应用场景 - 随机笔记功能
 */
export async function example5_randomNoteFeature() {
    // 模拟一个随机笔记功能的实现
    const randomNoteSql = `
        SELECT id FROM blocks 
        WHERE type = 'd' 
        AND path LIKE '%日记%' 
        ORDER BY RANDOM() 
        LIMIT 1
    `;
    
    try {
        // 预加载相关缓存
        await preloadRandomDocCache(randomNoteSql);
        
        // 提供随机笔记功能
        const getRandomNote = async () => {
            const noteId = await getRandomDocId(randomNoteSql);
            if (noteId) {
                // 打开随机笔记
                window.open(`siyuan://blocks/${noteId}`, "_self");
                return noteId;
            } else {
                throw new Error("没有找到可用的随机笔记");
            }
        };
        
        const noteId = await getRandomNote();
        console.log("随机笔记ID:", noteId);
        
    } catch (error) {
        console.error("随机笔记功能失败:", error);
    }
}

/**
 * 示例6: 批量预加载多个SQL的缓存
 */
export async function example6_batchPreload() {
    const sqlQueries = [
        "SELECT * FROM blocks WHERE type = 'd'",
        "SELECT * FROM blocks WHERE type = 'd' AND path LIKE '%日记%'",
        "SELECT * FROM blocks WHERE type = 'd' AND path LIKE '%笔记%'",
    ];
    
    try {
        // 批量预加载缓存
        const preloadPromises = sqlQueries.map(sql => preloadRandomDocCache(sql));
        await Promise.all(preloadPromises);
        
        console.log("所有缓存预加载完成");
        
        // 现在可以从任意SQL快速获取随机文档
        for (const sql of sqlQueries) {
            const docId = await getRandomDocId(sql);
            console.log(`SQL: ${sql.substring(0, 50)}... -> 文档ID: ${docId}`);
        }
        
    } catch (error) {
        console.error("批量预加载失败:", error);
    }
}

/**
 * 运行所有示例的便利函数
 */
export async function runAllExamples() {
    console.log("=== 开始运行随机文档缓存示例 ===");
    
    console.log("\n--- 示例1: 基本使用 ---");
    await example1_basicUsage();
    
    console.log("\n--- 示例2: 预加载缓存 ---");
    await example2_preloadCache();
    
    console.log("\n--- 示例3: 自定义配置 ---");
    await example3_customConfig();
    
    console.log("\n--- 示例4: 缓存管理 ---");
    await example4_cacheManagement();
    
    console.log("\n--- 示例5: 实际应用 ---");
    await example5_randomNoteFeature();
    
    console.log("\n--- 示例6: 批量预加载 ---");
    await example6_batchPreload();
    
    console.log("\n=== 所有示例运行完成 ===");
}

// 如果直接运行此文件，执行所有示例
if (typeof window !== 'undefined' && window.location) {
    // 在浏览器环境中，可以直接调用
    (window as any).runRandomDocCacheExamples = runAllExamples;
}