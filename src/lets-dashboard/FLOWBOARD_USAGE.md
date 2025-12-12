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
提供三个常用示例 SQL：
- 文档查询：`SELECT * FROM blocks WHERE type = 'd' LIMIT 20`
- 图片查询：`SELECT assets.path as asset_path FROM assets LIMIT 20`  
- 内容搜索：`SELECT * FROM blocks WHERE content LIKE '%日记%' LIMIT 10`

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

## 注意事项

1. **SQL 语法**：请确保 SQL 语法正确，否则会显示错误信息
2. **权限**：执行的 SQL 受到思源笔记数据库权限限制
3. **性能**：避免查询大量数据，建议使用 LIMIT 限制返回记录数
4. **字段名**：
   - 文档查询使用：`id`, `content`, `created`, `updated` 等字段
   - 图片查询必须包含：`asset_path` 字段作为图片路径
5. **排序**：建议使用 `ORDER BY` 子句对结果进行排序

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