# 随机文档缓存管理器 (RandomDocCache)

一个用于统一管理思源笔记中随机文档缓存的工具类，通过缓存机制显著提高随机文档访问性能，减少SQL查询次数。

## 功能特性

### 🚀 核心功能
- **统一缓存管理**: 使用SQL语句作为key，缓存对应的文档ID数组
- **智能预取**: 根据SQL自动预取20条随机记录（可配置）
- **自动补充**: 当缓存用完时自动重新获取
- **过期管理**: 支持缓存过期时间设置，自动清理过期缓存

### 📊 缓存策略
- **Key设计**: 使用标准化后的SQL语句作为缓存key
- **Value结构**: 存储文档ID数组和当前索引位置
- **预取数量**: 默认缓存20条记录（可配置1-100条）
- **过期时间**: 默认1小时过期（可配置）

### 🔧 管理功能
- **缓存统计**: 查看缓存数量、使用情况、剩余ID数量
- **手动清理**: 支持清理指定SQL或所有缓存
- **预加载**: 支持提前加载缓存以提高响应速度
- **自动清理**: 可选择启用定时清理过期缓存

## 使用方法

### 基础使用

```typescript
import { getRandomDocId } from "@/myscripts/randomDocCache";

// 获取随机文档ID
const sql = "SELECT * FROM blocks WHERE type = 'd'";
const docId = await getRandomDocId(sql);

if (docId) {
    console.log("随机文档ID:", docId);
    // 使用docId进行后续操作
}
```

### 预加载缓存

```typescript
import { preloadRandomDocCache } from "@/myscripts/randomDocCache";

// 预加载缓存，提高后续访问速度
await preloadRandomDocCache(sql);

// 现在获取随机文档会更快
const docId = await getRandomDocId(sql);
```

### 自定义配置

```typescript
import { RandomDocCache } from "@/myscripts/randomDocCache";

// 创建自定义配置的缓存管理器
const customCache = new RandomDocCache({
    cacheSize: 50,        // 缓存50条记录
    maxCacheAge: 30 * 60 * 1000, // 30分钟过期
    enableAutoCleanup: true,
});

const docId = await customCache.getRandomDocId(sql);
```

### 缓存管理

```typescript
import { randomDocCache } from "@/myscripts/randomDocCache";

// 检查缓存状态
const hasCache = randomDocCache.hasCache(sql);
console.log("是否已有缓存:", hasCache);

// 获取剩余数量
const remaining = randomDocCache.getRemainingCount(sql);
console.log("剩余ID数量:", remaining);

// 查看统计信息
const stats = randomDocCache.getCacheStats();
console.log("缓存统计:", stats);

// 清理缓存
randomDocCache.clearCache(sql);     // 清理指定SQL
randomDocCache.clearAllCache();     // 清理所有缓存
```

## 配置选项

```typescript
interface CacheConfig {
    cacheSize?: number;        // 缓存数量，默认20 (范围: 1-100)
    maxCacheAge?: number;      // 缓存最大年龄（毫秒），默认1小时
    enableAutoCleanup?: boolean; // 是否启用自动清理，默认true
}
```

## API 参考

### 主要方法

#### `getRandomDocId(sql: string): Promise<string | null>`
获取随机文档ID
- **参数**: `sql` - SQL查询语句
- **返回值**: 文档ID字符串，如果无缓存则返回null
- **说明**: 会自动管理缓存的加载和补充

#### `preloadCache(sql: string): Promise<void>`
预加载指定SQL的缓存
- **参数**: `sql` - SQL查询语句
- **说明**: 提前加载缓存，提高后续访问速度

#### `clearCache(sql: string): void`
清理指定SQL的缓存
- **参数**: `sql` - SQL查询语句

#### `clearAllCache(): void`
清理所有缓存

#### `hasCache(sql: string): boolean`
检查SQL是否已缓存
- **参数**: `sql` - SQL查询语句
- **返回值**: 是否已缓存且未过期

#### `getRemainingCount(sql: string): number`
获取缓存中的剩余ID数量
- **参数**: `sql` - SQL查询语句
- **返回值**: 剩余ID数量

#### `getCacheStats(): CacheStats`
获取缓存统计信息
- **返回值**: 包含缓存总数和详细信息的对象

### 便捷函数

```typescript
// 便捷函数，直接获取随机文档ID
export const getRandomDocId = (sql: string) => randomDocCache.getRandomDocId(sql);

// 预加载缓存
export const preloadRandomDocCache = (sql: string) => randomDocCache.preloadCache(sql);

// 清理缓存
export const clearRandomDocCache = (sql?: string) => {
    if (sql) {
        randomDocCache.clearCache(sql);
    } else {
        randomDocCache.clearAllCache();
    }
};
```

## 实际应用场景

### 1. 随机笔记功能

```typescript
import { getRandomDocId, preloadRandomDocCache } from "@/myscripts/randomDocCache";

export async function getRandomNote() {
    const noteSql = `
        SELECT id FROM blocks 
        WHERE type = 'd' 
        AND path LIKE '%日记%' 
        ORDER BY RANDOM() 
        LIMIT 1
    `;
    
    // 预加载缓存
    await preloadRandomDocCache(noteSql);
    
    // 获取随机笔记
    const noteId = await getRandomDocId(noteSql);
    if (noteId) {
        window.open(`siyuan://blocks/${noteId}`, "_self");
        return noteId;
    }
    
    throw new Error("没有找到可用的随机笔记");
}
```

### 2. 批量预加载

```typescript
import { preloadRandomDocCache } from "@/myscripts/randomDocCache";

const sqlQueries = [
    "SELECT * FROM blocks WHERE type = 'd'",
    "SELECT * FROM blocks WHERE type = 'd' AND path LIKE '%日记%'",
    "SELECT * FROM blocks WHERE type = 'd' AND path LIKE '%笔记%'",
];

// 批量预加载所有缓存
await Promise.all(sqlQueries.map(sql => preloadRandomDocCache(sql)));
```

### 3. 性能监控

```typescript
import { randomDocCache } from "@/myscripts/randomDocCache";

export function logCacheStats() {
    const stats = randomDocCache.getCacheStats();
    console.log(`当前有 ${stats.totalCaches} 个缓存`);
    
    stats.cacheDetails.forEach(detail => {
        console.log(`SQL: ${detail.sql}`);
        console.log(`  - 缓存大小: ${detail.cacheSize}`);
        console.log(`  - 当前索引: ${detail.currentIndex}`);
        console.log(`  - 剩余数量: ${detail.remainingIds}`);
        console.log(`  - 最后更新: ${new Date(detail.lastUpdated).toLocaleString()}`);
    });
}
```

## 性能优化建议

### 1. 合理设置缓存大小
- **小缓存** (10-20): 内存占用少，适合频繁切换不同SQL
- **大缓存** (50-100): 减少重新获取次数，适合单一SQL大量访问

### 2. 预加载策略
- 在应用启动时预加载常用SQL的缓存
- 用户操作前预先加载可能用到的缓存

### 3. 缓存生命周期
- 根据数据更新频率设置合适的过期时间
- 启用自动清理避免内存泄漏

### 4. 错误处理
- 始终检查返回值是否为null
- 捕获并处理SQL执行错误

## 注意事项

1. **SQL标准化**: 缓存key基于SQL的标准化版本，格式不同但内容相同的SQL会共享缓存
2. **内存管理**: 大量缓存会占用内存，定期清理不需要的缓存
3. **并发安全**: 类设计为单例使用，避免多实例竞争
4. **错误恢复**: SQL执行失败时会设置空缓存，避免重复失败请求

## 最佳实践

```typescript
// ✅ 推荐：预加载 + 错误处理
try {
    await preloadRandomDocCache(sql);
    const docId = await getRandomDocId(sql);
    if (docId) {
        // 使用docId
    } else {
        console.log("没有可用的随机文档");
    }
} catch (error) {
    console.error("随机文档获取失败:", error);
}

// ❌ 不推荐：频繁调用不预加载
for (let i = 0; i < 100; i++) {
    const docId = await getRandomDocId(sql); // 性能较差
}
```

通过合理使用RandomDocCache，可以显著提升思源笔记插件中随机文档功能的性能和用户体验。