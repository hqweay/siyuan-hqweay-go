# 反链面板插件 (Backlink Panel Plugin)

一个功能强大的思源笔记插件，在文档底部显示反链列表，支持自定义SQL查询和动态加载功能。

## 主要功能

### 📊 反链显示
- 在文档底部/顶部自动显示反链面板
- 展示引用当前文档的所有块引用
- 显示引用内容预览和元数据信息
- 支持点击跳转到引用源

### 🔍 自定义SQL查询
- 提供SQL标签页执行自定义查询
- 支持任意SQL语句执行
- 实时显示查询结果
- 动态加载更多结果

### ⚡ 动态加载
- 替代传统分页，使用滚动加载
- 首次加载指定数量的反链
- 滚动到底部时自动加载更多
- 性能优化，避免一次性加载大量数据

### 🎛️ 灵活配置
- 面板显示位置（顶部/底部）
- 加载数量配置
- 内容显示选项
- 自动展开设置

## 安装和配置

### 启用插件
1. 在思源笔记设置中启用"反链面板"插件
2. 配置相关设置选项
3. 插件将在文档切换时自动显示

### 配置选项

#### 基本设置
- **启用反链面板**: 控制是否在文档中显示面板
- **显示位置**: 选择面板显示在文档顶部还是底部
- **自动展开**: 页面加载时是否自动展开面板

#### 加载设置
- **初始加载数量**: 首次加载的反链数量（默认20）
- **滚动加载数量**: 每次滚动加载的数量（默认10）

#### 显示设置
- **显示文档标题**: 是否显示引用文档的标题
- **显示引用上下文**: 是否显示引用内容的预览
- **上下文预览长度**: 引用内容预览的最大字符数

#### 自定义SQL设置
- **启用自定义SQL标签页**: 是否启用SQL查询功能
- **默认自定义SQL**: 预置的SQL查询模板

## 使用方法

### 基本使用
1. 打开任意思源笔记文档
2. 插件会自动在文档底部创建反链面板
3. 点击面板头部展开/收起面板
4. 浏览反链列表，点击任意项跳转到引用源

### 自定义SQL查询
1. 点击"自定义SQL"标签页
2. 在文本框中输入SQL查询语句
3. 点击"执行查询"按钮
4. 查看实时显示的查询结果
5. 滚动到底部自动加载更多结果

### 反链获取逻辑

插件使用与原版 `syplugin-backlink-panel` 相同的反链获取逻辑：

1. **获取定义块**: 
   ```sql
   SELECT * FROM blocks WHERE id in (
     SELECT DISTINCT def_block_id 
     FROM refs
     WHERE def_block_root_id = '${docId}'
   )
   ```

2. **查找引用**: 使用 `generateAndInConditions` 函数生成正确的 IN 子句
   ```sql
   SELECT b.* FROM blocks b
   WHERE b.id IN (SELECT block_id FROM refs WHERE 1 = 1 AND def_block_id IN (...))
   ```

3. **组合数据**: 将反链块与其所在文档信息组合
4. **上下文提取**: 从引用内容中提取上下文信息

**关键改进**：
- 使用与原版相同的 SQL 生成逻辑
- 正确的 `refs` 表关联查询
- 准确的定义块识别算法

### 示例SQL查询

```sql
-- 查询最近修改的文档
SELECT * FROM blocks WHERE type = 'd' ORDER BY updated DESC LIMIT 10

-- 查询特定类型的块
SELECT * FROM blocks WHERE type = 'p' AND content LIKE '%关键词%'

-- 查询特定路径下的文档
SELECT * FROM blocks WHERE path LIKE '%/日记/%' AND type = 'd'

-- 查询引用特定定义块的块
SELECT b.* FROM blocks b 
INNER JOIN refs r ON b.id = r.block_id 
WHERE r.def_block_id = '20231208123456-abcdefg'

-- 查询包含特定属性的块
SELECT * FROM blocks b JOIN attributes a ON b.id = a.block_id 
WHERE a.name = 'custom-type' AND a.value = 'important'
```

## 技术特性

### 架构设计
- 基于模块化插件架构
- 使用Svelte构建响应式UI
- 集成思源笔记插件系统
- 支持动态组件加载

### 性能优化
- 懒加载Svelte组件
- 滚动事件节流处理
- 内存管理和资源清理
- 异步数据获取

### 用户体验
- 响应式设计，支持移动端
- 无缝集成思源笔记界面
- 键盘快捷键支持
- 流畅的动画效果

## 文件结构

```
src/lets-backlink-panel/
├── index.ts              # 主插件类
├── plugin.ts             # 插件元数据和配置
├── BacklinkPanel.svelte  # 主UI组件
└── README.md            # 说明文档
```

## 开发信息

### 技术栈
- **语言**: TypeScript
- **框架**: Svelte
- **API**: 思源笔记插件API
- **构建工具**: Vite

### 核心类
- `BacklinkPanelPlugin`: 主插件类，处理生命周期和事件
- `BacklinkPanel`: Svelte组件，负责UI渲染和交互

### 主要方法
- `getBacklinks()`: 获取反链数据
- `executeCustomSql()`: 执行自定义SQL查询
- `openBlock()`: 跳转到指定块
- `loadMoreData()`: 动态加载更多数据

## 兼容性

- **思源笔记版本**: 支持最新版本
- **桌面端**: 完全支持
- **移动端**: 响应式适配
- **主题**: 支持深色/浅色主题

## 更新日志

### v1.0.0
- ✨ 初始版本发布
- 📊 反链列表显示功能
- 🔍 自定义SQL查询功能
- ⚡ 动态加载机制
- 🎛️ 完整的配置选项
- 📱 响应式UI设计

## 贡献

欢迎提交Issue和Pull Request来改进这个插件！

## 许可证

MIT License