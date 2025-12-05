# 插件系统重构

## 概述

本次重构将原来的手动插件管理方式改为自动插件发现和装配系统，使得新增功能时只需要在子文件夹中实现插件，而不需要修改主入口文件。

## 架构

### 核心组件

1. **SubPlugin 接口** (`src/types/plugin.d.ts`)
   - 定义了子插件的标准接口
   - 包含生命周期方法和配置定义

2. **PluginRegistry 类** (`src/plugin-registry.ts`)
   - 负责插件的自动发现和加载
   - 管理插件实例和配置

3. **动态配置系统**
   - `settings.ts`: 支持动态插件配置
   - `setting.svelte`: 动态生成设置UI

### 插件结构

每个子插件文件夹应包含：

```
plugin-folder/
├── plugin.json      # 插件元数据和配置定义
├── index.ts         # 插件入口，导出插件实例
└── [其他文件]       # 插件实现文件
```

#### plugin.json 格式

```json
{
  "name": "plugin-name",
  "displayName": "显示名称",
  "description": "插件描述",
  "version": "1.0.0",
  "author": "作者",
  "settings": {
    "配置组名": [
      {
        "type": "checkbox|textinput|textarea|select|number|button",
        "title": "设置项标题",
        "description": "设置项描述",
        "key": "设置键名",
        "value": "默认值",
        "placeholder": "占位符",
        "options": {"选项1": "值1"} // select类型专用
      }
    ]
  }
}
```

#### index.ts 格式

```typescript
import { SubPlugin } from "@/types/plugin";

export default class MyPlugin implements SubPlugin {
  name = "plugin-name";
  displayName = "显示名称";
  description = "插件描述";
  version = "1.0.0";
  enabled = false;

  async onload() {
    // 插件加载逻辑
  }

  onunload() {
    // 插件卸载逻辑
  }

  // 其他生命周期方法...
}
```

## 已迁移的插件

- ✅ epub-reader: EPUB 阅读器
- ✅ how-to-write-diary: 日记相关工具
- ✅ ocr: OCR 图片识别

## 使用方法

### 添加新插件

1. 在 `src/` 下创建新的插件文件夹
2. 创建 `plugin.json` 定义插件信息和配置
3. 创建 `index.ts` 实现插件逻辑
4. 插件会自动被发现和加载

### 配置管理

插件配置会自动集成到主设置面板中，按照 `plugin.json` 中的定义生成UI。

### 生命周期

插件系统会在适当的时机调用插件的生命周期方法：

- `onload()`: 插件启用时调用
- `onunload()`: 插件禁用时调用
- `onLayoutReady()`: 界面准备就绪时调用
- `onDataChanged()`: 数据变化时调用

## 向后兼容

系统保持了对现有代码的兼容性，旧的插件仍然可以正常工作。

## 优势

1. **模块化**: 每个功能都是独立的模块
2. **自动发现**: 无需手动注册插件
3. **配置统一**: 所有配置集中管理
4. **维护性**: 新增功能无需修改核心代码
5. **扩展性**: 易于添加新功能和配置