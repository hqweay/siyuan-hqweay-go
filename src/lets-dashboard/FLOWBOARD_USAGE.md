# FlowBoard SQL 查询面板使用指南

## 概述

FlowBoard 是一个强大的 SQL 查询面板，允许用户通过输入自定义 SQL 语句来查询思源笔记数据库，并在页面上方显示 EntryList（文档列表）或 ImageGallery（图片库）。

## 访问方式

### 方式一：通过 URL 直接访问
在思源笔记中打开以下 URL：
```
siyuan://plugins/siyuan-hqweay-go/flow-board?title=SQL查询面板
```

### 方式二：添加到仪表盘
可以在 dashboard.svelte 中添加一个按钮来打开 FlowBoard。

## 功能特点

### 1. SQL 输入区域
- 提供一个大的文本输入框，支持多行 SQL 语句输入
- 支持语法高亮的占位符提示
- 实时验证输入内容

### 2. 执行查询
- 点击"执行查询"按钮执行 SQL
- 显示加载状态，防止重复提交
- 错误处理和用户友好的错误提示

### 3. 示例 SQL
提供多个分类示例 SQL：
- **少量示例时**：直接显示在页面上，点击即可使用
- **大量示例时**：显示"更多示例"下拉按钮，点击展开分类菜单

**示例分类包括**：
- **文档查询**：基础文档查询、内容搜索、路径筛选等
- **图片查询**：JPG/PNG图片查询、按时间排序等
- **高级查询**：时间范围查询、标签搜索、计数查询等
- **时间范围**：按日期区间、按月份、相对时间查询等

**智能显示**：
- 每个示例支持可选的 `name` 字段
- 有 `name` 时显示友好名称（如"所有文档"）
- 无 `name` 时显示 SQL 片段
- 鼠标悬停显示完整 SQL 语句

当示例数量较少（≤4个）时，直接显示按钮；当示例较多时，右侧显示下拉菜单。

### 4. 智能渲染
根据查询结果自动判断显示类型：
- 如果结果包含 `asset_path` 字段 → 显示 ImageGallery（图片库）
- 否则 → 显示 EntryList（文档列表）

### 5. 结果展示
- 显示查询结果数量
- 标明当前渲染类型（文档列表/图片库）
- 支持分页加载（继承自 EntryList 和 ImageGallery）

## 使用示例

### 示例 1：查询所有文档
```sql
SELECT * FROM blocks WHERE type = 'd' ORDER BY created DESC LIMIT 50
```

### 示例 2：查询图片资源
```sql
SELECT assets.path as asset_path, assets.created 
FROM assets 
WHERE assets.path LIKE '%.jpg' OR assets.path LIKE '%.png'
ORDER BY created DESC LIMIT 30
```

### 示例 3：按内容搜索
```sql
SELECT id, content, created, updated 
FROM blocks 
WHERE content LIKE '%关键词%' 
ORDER BY created DESC LIMIT 20
```

### 示例 4：查询特定时间范围的文档
```sql
SELECT * FROM blocks
WHERE type = 'd'
AND created >= '20241201000000'
AND created <= '20241231235959'
ORDER BY created DESC
```

### 示例 5：按月份查询
```sql
SELECT * FROM blocks
WHERE substr(created, 1, 6) = '202412'
ORDER BY created DESC
```

### 示例 6：查询标签内容
```sql
SELECT id, content, created
FROM blocks
WHERE content LIKE '%#标签%'
LIMIT 25
```

### 示例 7：统计文档总数
```sql
SELECT COUNT(*) as total
FROM blocks
WHERE type = 'd'
```

### 示例 8：查询近30天的文档
```sql
SELECT * FROM blocks
WHERE created >= date('now', '-30 days')
ORDER BY created DESC
LIMIT 20
```

## 注意事项

1. **SQL 语法**：请确保 SQL 语法正确，否则会显示错误信息
2. **权限**：执行的 SQL 受到思源笔记数据库权限限制
3. **性能**：避免查询大量数据，建议使用 LIMIT 限制返回记录数
4. **字段名**：
   - 文档查询使用：`id`, `content`, `created`, `updated` 等字段
   - 图片查询必须包含：`asset_path` 字段作为图片路径
5. **排序**：建议使用 `ORDER BY` 子句对结果进行排序
6. **示例格式**：示例 SQL 支持两种格式
   - 字符串格式：`"SELECT * FROM blocks WHERE type = 'd'"`
   - 对象格式：`{ name: "友好名称", sql: "SELECT * FROM blocks WHERE type = 'd'" }`

## 技术实现

- 基于 Svelte 框架开发
- 使用思源笔记的 `sql()` API 执行查询
- 集成现有的 EntryList 和 ImageGallery 组件
- 响应式设计，支持移动端和桌面端

## 扩展建议

可以根据需要扩展以下功能：
- SQL 历史记录
- 保存常用查询
- 查询结果导出
- 更多示例 SQL 模板
- 语法高亮和自动补全
- 自定义示例 SQL 分类
- 示例 SQL 搜索功能
- 键盘快捷键支持