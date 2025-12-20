# SQL面板优化完成

## 优化概述

根据用户需求，对SQL面板进行了全面优化，实现了基于文档属性的SQL管理功能。

## 主要改进

### 1. 智能Tab结构
- **反链Tab**: 保持原有的反链面板功能
- **保存的SQL Tab**: 每个保存的SQL查询作为独立Tab显示
- **新增SQL Tab**: 提供SQL创建和管理界面

### 2. 自适应SQL界面
- **有保存SQL时**: 显示保存的SQL列表和管理功能
- **无保存SQL时**: 显示原来的CustomSqlPanel界面（保留原有功能）
- **渐进增强**: 在保存的SQL列表中也可以添加新的SQL

### 2. 文档属性存储
- **属性名**: `custom-tab-panel-sqls`
- **数据格式**: JSON数组，包含name和sql字段
- **存储位置**: 文档的block attributes中

### 3. 核心功能

#### SQL管理面板 (`sql-management-panel.svelte`)
- **专注新增功能**: 专门用于创建和管理新的SQL查询
- **表单式输入**: 简洁的SQL名称和内容输入
- **数据持久化**: 自动保存到文档属性
- **状态通知**: 通知父组件更新Tab列表

#### Tab智能分配
- **保存的SQL Tab**: 每个保存的SQL创建独立Tab，使用CustomSqlPanel显示
- **新增SQL Tab**: 使用SqlManagementPanel进行SQL创建
- **参数传递**: 保存的SQL内容通过presetSql参数传递给CustomSqlPanel

#### Tab生成逻辑
```typescript
// 为每个保存的SQL创建独立Tab
savedSqlList.forEach((sqlItem, index) => {
  tabs.push({
    id: `sql-${index}`,
    name: sqlItem.name,
    component: CustomSqlPanel,
    presetSql: sqlItem.sql  // 传递SQL内容
  });
});

// 新增SQL Tab
tabs.push({
  id: "sql",
  name: "新增SQL",
  component: SqlManagementPanel
});
```

#### Tab面板优化 (`backlink-tab-panel.svelte`)
- **动态Tab生成**: 根据保存的SQL自动生成Tab
- **状态同步**: 实时更新Tab列表
- **事件处理**: 统一的SQL执行事件管理

### 4. 数据流程

```
1. 初始化 → loadSavedSqlList() → 获取文档属性
2. 解析JSON → 更新本地状态 → 重新生成Tabs
3. 用户操作 → 更新本地状态 → 保存到文档属性 → 触发更新事件
```

### 5. API调用

#### 获取SQL列表
```typescript
POST /api/block/getBlockAttrs
{
  "id": "rootId"
}
```

#### 保存SQL
```typescript
POST /api/block/setBlockAttrs
{
  "id": "rootId",
  "attrs": {
    "custom-tab-panel-sqls": "JSON.stringify(sqlList)"
  }
}
```

### 6. 用户界面

#### 新增SQL界面
- SQL名称输入框
- SQL内容文本区域
- 保存/取消按钮

#### SQL列表界面
- 每个SQL项目显示名称和内容预览
- 执行按钮（播放图标）
- 删除按钮（垃圾桶图标）

#### 响应式设计
- 移动端自动隐藏Tab文字
- 紧凑的布局适配

### 7. 事件系统

#### 内部事件
- `sqlUpdated`: SQL列表更新事件
- `execute-sql`: SQL执行事件

#### 状态管理
- 父组件控制数据流向
- 子组件通过事件反馈状态变更

## 技术实现

### 1. 组件架构
```
backlink-tab-panel.svelte
├── BacklinkFilterPanelPage (反链面板)
└── SqlManagementPanel (SQL管理)
    ├── SQL列表展示
    ├── 新增SQL表单
    └── SQL执行功能
```

### 2. 状态管理
- **本地状态**: 组件内部的加载状态和表单数据
- **共享状态**: 保存的SQL列表在父子组件间同步
- **事件驱动**: 通过自定义事件实现组件间通信

### 3. 错误处理
- 网络请求失败处理
- JSON解析错误处理
- 用户友好的错误提示

## 使用指南

### 1. 保存SQL查询
1. 点击"新增SQL"Tab
2. 输入SQL名称和内容
3. 点击"保存"按钮
4. 系统自动创建新的Tab

### 2. 执行SQL查询
1. 在SQL列表中找到目标查询
2. 点击执行按钮（播放图标）
3. SQL将在现有SQL执行系统中运行

### 3. 管理SQL查询
- **删除**: 点击删除按钮（垃圾桶图标）
- **重命名**: 暂时不支持，需要删除后重新创建

## 兼容性

- **向后兼容**: 不影响现有的反链面板功能
- **渐进增强**: 如果没有保存的SQL，仍然可以使用新增功能
- **移动端适配**: 完整的响应式设计

## 后续改进建议

1. **重命名功能**: 添加SQL查询重命名功能
2. **分类管理**: 支持SQL查询分类
3. **导入导出**: 支持SQL查询的批量导入导出
4. **执行历史**: 记录SQL执行历史和结果
5. **模板系统**: 提供常用SQL模板

## 文件变更

### 新增文件
- `src/lets-syplugin-backlink-panel/components/panel/sql-management-panel.svelte`

### 修改文件
- `src/lets-syplugin-backlink-panel/components/panel/backlink-tab-panel.svelte`

## 重要修复说明

### 关键问题修复
根据用户反馈，修复了之前的设计缺陷：

#### 原始问题
- **逻辑错误**: 之前是显示保存的SQL列表，而不是让每个SQL有自己的Tab
- **功能缺失**: CustomSqlPanel不支持接收预设的SQL参数

#### 修复方案
- **独立Tab**: 每个保存的SQL现在都有自己的独立Tab
- **参数传递**: CustomSqlPanel新增presetSql属性，支持接收预设SQL
- **精确显示**: 点击保存的SQL Tab时，该Tab中显示该SQL的内容

#### Tab结构优化
```
Tab结构:
├── 反链
├── SQL查询1 (使用CustomSqlPanel, presetSql="SELECT ...")
├── SQL查询2 (使用CustomSqlPanel, presetSql="SELECT ...")
└── 新增SQL (使用SqlManagementPanel)
```

### CustomSqlPanel功能增强

#### presetSql属性支持
```typescript
// 接收预设的SQL
<CustomSqlPanel presetSql={savedSqlItem.sql} {rootId} />

// 组件内部处理
onMount(() => {
  if (presetSql) {
    inputSQL = presetSql; // 预填充SQL
  }
});
```

#### 新增保存功能
现在CustomSqlPanel也支持直接保存SQL：
- **保存按钮**: 在SQL输入框旁边新增"保存SQL"按钮
- **保存表单**: 点击后显示SQL名称输入表单
- **数据持久化**: 直接保存到文档属性中
- **事件通知**: 保存成功后通知父组件更新Tab列表

```typescript
// 保存SQL功能
async function saveSqlToDocument(name: string, sql: string) {
  // 获取现有SQL列表
  const result = await getBlockAttrs(rootId);
  let savedSqlList = JSON.parse(result["custom-tab-panel-sqls"] || "[]");
  
  // 添加新SQL并保存
  const updatedList = [...savedSqlList, { name, sql }];
  await setBlockAttrs(rootId, {
    "custom-tab-panel-sqls": JSON.stringify(updatedList)
  });
  
  // 通知父组件更新
  dispatch("sqlUpdated", { savedSqlList: updatedList });
}
```

#### 统一保存体验
用户现在可以在两个地方保存SQL：
1. **新增SQL Tab**: 专门用于创建和管理SQL
2. **CustomSqlPanel**: 在任何SQL编辑界面中直接保存

两者都会：
- 保存到相同的文档属性位置
- 触发相同的事件更新Tab列表
- 创建相同结构的保存数据

### 保留原有功能
完全保留`CustomSqlPanel.svelte`的所有功能：
- SQL输入和执行功能
- 丰富的示例SQL库（分类显示）
- 结果展示（EntryList和ImageGallery）
- SQL语法验证
- 键盘快捷键支持（Ctrl+Enter执行）

现在每个保存的SQL都有独立的Tab，点击即可查看和执行，完全符合用户的使用习惯。

### 最新功能：CustomSqlPanel保存功能

为了提供更便捷的用户体验，我们在CustomSqlPanel中也添加了保存功能：

#### 新增功能
- **保存按钮**: SQL输入框旁边新增"保存SQL"按钮
- **快速保存**: 在任何SQL编辑界面中都可以直接保存
- **表单验证**: 确保SQL名称和内容都不为空
- **成功反馈**: 保存成功后显示确认信息

#### 智能默认值
为了提高用户体验，系统会自动为SQL名称提供智能默认值：

```typescript
// 智能名称提取逻辑
function extractDefaultSqlName(sql: string): string {
  // 1. 尝试从FROM子句提取表名
  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (fromMatch) return `查询_${fromMatch[1]}`;
  
  // 2. 尝试从SELECT子句提取字段名
  const selectMatch = sql.match(/SELECT\s+(\w+)/i);
  if (selectMatch) return `查询_${selectMatch[1]}`;
  
  // 3. 尝试从WHERE子句提取条件字段
  const whereMatch = sql.match(/WHERE\s+(\w+)/i);
  if (whereMatch) return `查询_${whereMatch[1]}`;
  
  // 4. 默认名称：SQL查询 + 时间戳
  return `SQL查询_${timestamp}`;
}
```

#### 智能更新机制
- **重复检查**: 保存时自动检查SQL名称是否已存在
- **更新提示**: 如果名称存在，显示"更新成功"而非"保存成功"
- **无缝更新**: 更新时替换现有SQL内容，Tab名称保持不变

#### 使用流程
1. 在CustomSqlPanel中输入或编辑SQL
2. 点击"保存SQL"按钮（系统自动生成默认名称）
3. 修改SQL名称（可选）
4. 点击"确认保存"完成保存
5. 如果名称存在则更新，不存在则新建Tab并更新列表

#### 双重保存入口
用户现在有两个地方可以保存SQL：
- **新增SQL Tab**: 专门的管理界面
- **CustomSqlPanel**: 就地保存功能

两者功能完全一致，用户可以根据使用习惯选择合适的保存方式。

### 最新改进：智能保存体验

根据用户反馈，我们对保存功能进行了两项重要改进：

#### 1. 智能SQL名称默认值
**问题**: 之前保存时SQL名称输入框是空白的，用户需要手动输入
**解决**: 系统现在会自动从SQL内容中智能提取默认名称

**智能提取规则**:
- **表名优先**: `SELECT * FROM blocks` → "查询_blocks"
- **字段名次之**: `SELECT id FROM` → "查询_id"  
- **条件字段**: `WHERE type = 'd'` → "查询_type"
- **时间戳默认**: `SELECT * FROM` → "SQL查询_143025" (当前时间)

#### 2. 智能更新机制
**问题**: 之前同名SQL会创建重复条目
**解决**: 现在会检查名称是否存在，存在则更新，不存在则新建

**更新逻辑**:
```typescript
// 检查是否已存在
const existingIndex = savedSqlList.findIndex(item => item.name === name);

if (existingIndex !== -1) {
  // 更新已存在的SQL
  savedSqlList[existingIndex] = { name, sql };
  alert(`SQL "${name}" 更新成功！`);
} else {
  // 添加新的SQL
  savedSqlList = [...savedSqlList, { name, sql }];
  alert(`SQL "${name}" 保存成功！`);
}
```

#### 用户体验提升
- **更少输入**: 大部分情况下用户只需直接点击保存
- **避免重复**: 同名SQL自动更新，不产生冗余
- **明确反馈**: 保存和更新显示不同的成功消息
- **智能命名**: 默认名称具有可读性，便于管理

这些改进大大提升了SQL保存的便捷性和智能化水平。

所有功能已完整实现并经过测试，用户现在可以在反链面板中享受完整的SQL查询管理功能，同时保持原有的使用习惯。

### 最新功能：SQL删除功能

为了完善SQL管理的完整生命周期（增删改查），我们为CustomSqlPanel新增了删除功能。

#### 功能特点
- **完整生命周期**: 现在支持SQL的完整管理流程：增加、保存、删除
- **安全删除**: 提供二次确认机制，防止误删
- **智能验证**: 检查SQL名称是否存在，提供友好错误提示
- **状态反馈**: 删除过程中有加载状态和成功提示

#### 实现方式
**新增状态管理**:
```typescript
// 删除相关状态
let showDeleteForm = false;
let isDeleting = false;
let deleteSqlName = "";
```

**删除核心逻辑**:
```typescript
async function deleteSqlFromDocument(name: string) {
  // 获取现有SQL列表
  const result = await getBlockAttrs(rootId);
  let savedSqlList = JSON.parse(result["custom-tab-panel-sqls"] || "[]");
  
  // 查找并删除指定的SQL
  const targetIndex = savedSqlList.findIndex(item => item.name === name);
  
  if (targetIndex === -1) {
    alert(`未找到名为 "${name}" 的SQL配置`);
    return;
  }
  
  // 确认删除
  if (!confirm(`确定要删除SQL配置 "${name}" 吗？此操作不可撤销。`)) {
    return;
  }
  
  // 从列表中移除并保存
  savedSqlList.splice(targetIndex, 1);
  await setBlockAttrs(rootId, {
    "custom-tab-panel-sqls": JSON.stringify(savedSqlList)
  });
  
  // 通知父组件更新
  dispatch("sqlUpdated", { savedSqlList });
}
```

#### 用户界面
**新增删除按钮**: 在保存按钮旁边添加红色"删除SQL"按钮
**删除表单**: 简洁的SQL名称输入框和确认按钮
**样式设计**: 使用红色主题区分危险操作

#### 使用流程
1. 点击"删除SQL"按钮
2. 输入要删除的SQL名称
3. 点击"确认删除"
4. 在确认对话框中确认删除操作
5. 系统删除SQL并更新Tab列表

#### 错误处理
- **不存在SQL**: 提示"未找到名为...的SQL配置"
- **空名称**: 提示"请输入要删除的SQL名称"
- **网络错误**: 显示"删除失败，请重试"
- **取消删除**: 点击取消按钮或确认对话框中的取消

#### 界面优化
- **红色主题**: 删除按钮和表单使用红色强调危险操作
- **加载状态**: 删除过程中按钮显示"删除中..."
- **成功反馈**: 删除成功后显示"SQL '名称' 删除成功！"

现在用户可以在CustomSqlPanel中完成SQL的完整管理：创建、保存、删除，真正实现了增删改查的完整功能。