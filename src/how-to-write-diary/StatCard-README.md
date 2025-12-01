# StatCard 组件扩展功能文档

## 概述

StatCard.svelte 组件已经扩展，支持多种卡片类型，用于在不同场景下展示数据。

## 统一样式尺寸

为了确保所有卡片展示一致美观，StatCard 组件已添加统一的尺寸约束：

- **最小宽度**: 200px
- **最小高度**: 120px  
- **最大宽度**: 300px
- **布局方式**: Flex 布局，内容居中对齐

所有卡片类型都遵循这些尺寸标准，无论内容多少都能保持视觉一致性。

## 支持的类型

### 1. text（文字类型）
只显示文字标签，适合显示描述性信息。

```svelte
<StatCard type="text" label="项目描述" />
```

### 2. number（数字类型）
只显示数字，适合简单的数值展示。

```svelte
<StatCard type="number" number={42} />
```

### 3. text+number（默认类型）
同时显示文字标签和数字，默认类型。

```svelte
<StatCard number={128} label="总数" />
```

### 4. progress（进度条类型）
显示进度条和百分比。

**属性：**
- `percentage`: 0-100 的进度百分比

```svelte
<StatCard 
  type="progress" 
  label="任务完成度" 
  percentage={75} 
/>
```

### 5. percentage（百分比环图类型）
显示圆形进度环图。

**属性：**
- `percentage`: 0-100 的百分比值

```svelte
<StatCard 
  type="percentage" 
  label="完成率" 
  percentage={68} 
/>
```

### 6. trend（趋势类型）
显示数字和趋势指示器（上升/下降/稳定）。

**属性：**
- `trend`: "up" | "down" | "stable"

```svelte
<StatCard 
  type="trend" 
  label="本月销量" 
  number={1250} 
  trend="up" 
/>
```

### 7. icon（图标类型）
显示图标、数字和文字标签。

**属性：**
- `icon`: 图标字符（可以使用 emoji 或图标字体）

```svelte
<StatCard 
  type="icon" 
  icon="💡" 
  number={25} 
  label="新想法" 
/>
```

### 8. status（状态类型）
显示状态指示器和数据。

**属性：**
- `status`: "normal" | "success" | "warning" | "error"

```svelte
<StatCard 
  type="status" 
  number={15} 
  label="在线用户" 
  status="success" 
/>
```

### 9. time（时间类型）
显示时间相关数据。

**属性：**
- `time`: 时间字符串（可选，如果不提供则显示 `number`）

```svelte
<StatCard 
  type="time" 
  label="今日写作时间" 
  time="2:34:15" 
/>
```

### 10. badge（徽章类型）
显示带状态点的徽章样式。

**属性：**
- `status`: "normal" | "success" | "warning" | "error"

```svelte
<StatCard 
  type="badge" 
  number={42} 
  label="新消息" 
  status="warning" 
/>
```

### 11. multi-number（多数字对比类型）
显示两个数字的对比（如 25:18）。

**属性：**
- `subNumbers`: 对象，包含 `left` 和 `right` 属性

```svelte
<StatCard 
  type="multi-number" 
  label="今日对比" 
  subNumbers={{left: 25, right: 18}} 
/>
```

## 通用属性

所有类型都支持的属性：

- `type`: 卡片类型
- `number`: 数字值
- `label`: 文字标签
- `className`: 自定义 CSS 类名
- `clickable`: 是否可点击（布尔值）
- `className`: 自定义样式类

## 响应式支持

所有卡片都支持响应式设计，在移动设备上会自动调整布局。

## 交互性

通过设置 `clickable={true}` 可以让卡片响应点击事件：

```svelte
<StatCard 
  type="progress" 
  label="点击查看详情" 
  percentage={80}
  clickable={true}
  on:click={(event) => console.log('Card clicked:', event.detail)}
/>
```

## 样式自定义

可以通过 `className` 属性添加自定义样式：

```svelte
<StatCard 
  type="number" 
  number={100}
  className="custom-highlight"
/>
```

在 CSS 中定义：

```css
.custom-highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

## 使用建议

1. **数据展示**：根据数据类型选择合适的卡片类型
2. **视觉层次**：重要数据使用 `percentage` 或 `trend` 类型
3. **状态指示**：使用 `status` 或 `badge` 类型显示系统状态
4. **对比数据**：使用 `multi-number` 类型进行数据对比
5. **时间信息**：使用 `time` 类型显示时间相关数据

## 示例文件

查看 `StatCardExamples.svelte` 文件可以查看所有类型的实际效果示例。