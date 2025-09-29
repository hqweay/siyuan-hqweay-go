---
title: 恐龙工具箱
date: "2025-09-29 00:41:47"
updated: "2025-09-29 01:49:55"
tags:
  - Project
comments: true
toc: true
---

> 这是一只恐龙，路过的人必须夸它可爱。

「恐龙工具箱」是[思源笔记](https://b3log.org/siyuan/download.html)的一款插件。

## 快捷添加属性

块菜单中增加快捷添加属性；属性可在插件设置里配置。

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004410-rus2kgk.png)

默认值：

```json
[
  {
    name: "恢复转换效果",
    key: "f",
    value: "",
    enabled: true,
  },
  {
    name: "转换为表格",
    key: "f",
    value: "bg",
    enabled: true,
  },
  {
    name: "转换为导图",
    key: "f",
    value: "dt",
    enabled: true,
  },
  {
    name: "转换为时间线",
    key: "f",
    value: "timeline",
    enabled: true,
  },
  {
    name: "转换为看板",
    key: "f",
    value: "kb",
    enabled: true,
  },
  {
    name: "转换为Tab",
    key: "f",
    value: "list2tab",
    enabled: true,
  }
];
```

效果：

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004313-j04auku.png)

### 默认提供了 5 个属性，支持列表转为其它视图：🙏[Achuan-2/siyuan-themes-tsundoku](https://GitHub.com/Achuan-2/siyuan-themes-tsundoku)

- 默认

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005348-2luy7wx.png)

- 表格

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005252-orhmins.png)

- 导图

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005256-489ekb4.png)

- 时间线

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005355-emdexy4.png)

- 看板

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005359-abz1349.png)

- Tab

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005301-77i9sfb.png)

### 可选（便利贴样式）

在代码片段合集里启用「便利贴」，会为思源注入便利贴样式的 CSS，为块添加自定义属性 `custom-f` 可启用，支持值：

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929194427-jm2x4nb.png)

```css
"qsr": "格纹复古",
"qsy": "浅色黄",
"qsg": "浅色绿",
"qsb": "浅色蓝",
"ssr": "深色红",
"ssy": "深色橙",
"ssg": "深色绿",
"ssb": "深色蓝",
"jb": "渐变黄",
"ay": "棕顶栏",
"ayx": "金边",
```

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929195138-188860p.png)

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929194655-ndypjlx.png)

可搭配「快捷添加属性」使用，配置：

```json
[
  { "name": "格纹复古", "value": "qsr", "key": "f", "enabled": true },
  { "name": "浅色黄", "value": "qsy", "key": "f", "enabled": true },
  { "name": "浅色绿", "value": "qsg", "key": "f", "enabled": true },
  { "name": "浅色蓝", "value": "qsb", "key": "f", "enabled": true },
  { "name": "深色红", "value": "ssr", "key": "f", "enabled": true },
  { "name": "深色橙", "value": "ssy", "key": "f", "enabled": true },
  { "name": "深色绿", "value": "ssg", "key": "f", "enabled": true },
  { "name": "深色蓝", "value": "ssb", "key": "f", "enabled": true },
  { "name": "渐变黄", "value": "jb", "key": "f", "enabled": true },
  { "name": "棕顶栏", "value": "ay", "key": "f", "enabled": true },
  { "name": "金边", "value": "ayx", "key": "f", "enabled": true }
]
```

## 日记相关工具

**快捷小窗写日记** ：🙏[suka233/siyuan-knote](https://GitHub.com/suka233/siyuan-knote)

- 支持全局快捷键（默认 F10）弹出一个小窗打开今日日记

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004846-lv6yln9.png)

slash 新增「cdn/创建日记引用」提供日历选择器快捷创建指定日期的日记并插入块引：🙏[frostime/siyuan-plugin-kits](https://GitHub.com/frostime/siyuan-plugin-kits)（好用！）

- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004927-l06jg1y.png)
- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004930-kmxwxzx.png)
- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929004933-9ailpyy.png)

## 移动端导航，方便移动端浏览

![7F3FB2D0-82D1-450D-A8EC-4B395F487F98_1_201_a](https://raw.githubusercontent.com/hqweay/picbed/master/img/7F3FB2D0-82D1-450D-A8EC-4B395F487F98_1_201_a-20250921140756-6jl9bvd.jpeg)

- 支持前进后退
- 支持打开今日日记
- 随机跳转
- 配置跳转（想结合「文档流」插件达到一键打开日记流的效果，但[目前思源移动端还不支持插件 url 跳转](https://GitHub.com/siyuan-note/siyuan/issues/15892)。）
- 上下文档切换：🙏[frostime/sy-f-misc](https://GitHub.com/frostime/sy-f-misc/blob/a4915d2f6281503055529ff8e585a6d828089fd0/src/func/doc-context.tsx)
- 可配置快捷添加到数据库：🙏[wilsons](https://ld246.com/article/1746153210116)

## VoiceNotes 笔记同步：🙏[voicenotes-sync](https://GitHub.com/mysticcoders/voicenotes-sync)

- [Voicenotes: AI Notes and Meetings](https://voicenotes.com/app)
- 设置界面可进行全量同步，右上角添加一个录音图标，点击可同步最新的 20 条笔记。

## 阅读帮助

toolbar 支持标注并复制块引

- 标注并复制块引
- 标注并复制 Text\* 块引
- 标注并复制 \* 块引
- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929005854-vt49lk6.png)

## 新增在文档标题下展示自定义属性的值

- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010151-zno3suf.png)
- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010203-zcrsmje.png)
- ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010206-uf5lamv.png)

## 标题转换

- 文档菜单打开事件增加标题转换

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010249-qk7z238.png)

## 随机题头图：🙏[【教程】把随机题头图换成自己的图片，让思源笔记更加赏心悦目 - 链滴](https://ld246.com/article/1694612740828)

- 使用：

  - 1）配置；

    - 目前必应的 API 可正常使用

      - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010612-znos93r.png)
      - 可以配置一个随机返回图片的链接
      - 也可以配置本地图片的文件夹

  - 2）在文档点击「随机题头图」；
  - 3）右键点击「随机」

    - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010540-rw34lj6.png)

## 发送到

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010749-j967uwg.png)

- 块菜单事件提供将选中内容分享到配置链接的功能

  - 通过 Google 搜索
  - chatGPT 支持查询参数了，可以这样配置下：`ChatGPT 总结====https://chat.openai.com/chat?q=请帮我总结：${content}`
  - 自定义链接

    - 例子， **搭配快捷指令将块发送到提醒事项**

      - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010943-j2jo03b.png)
      - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929010921-til4loz.png)

- 通过 Script 分享，目前只支持卡片分享

  - 支持在卡片页面展开/折叠列表
  - 支持模板
  - 分享时可编辑修改
  - 支持样式配置
  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929011207-tsf1lmd.png)

## 中文排版优化

- 右上角增加机器人图标/块菜单打开事件增加格式化文档的功能；**注意有损坏数据风险。**

  - 中文使用全角标点
  - 英文使用半角标点
  - 中英文混合排版……
  - 支持图片居中
  - 支持调整图片宽度

- 配置格式化后是否自动执行思源提供的「排版优化」以插入空格
- 配置格式化后是否自动执行思源提供的「网络资源文件转换本地」

## 为不同文档配置打开时是否同时打开/关闭边栏

使用场景示例：某文档包含长表格/数据库，需要打开时自动关闭侧边栏以展示更多区域。

- 可为不同文档配置不同操作：打开边栏、关闭边栏
- 可配置左边栏、右边栏
- 可配置是否同时打开/关闭停靠栏

## 快捷添加书签

- 块菜单打开事件增加快捷添加书签

## 提取元素至新文档

场景：主要用于阅读时先标注，再一次性提取为二次材料。

- 文档菜单打开事件新增提取当前文档的标注至新文档。

  - 提取时是否包含标注的上下文
  - 新文档内的标注是否添加一个 \* 引用指向原文块

## 随机/固定浏览

- 在界面右上角生成一个随机图标，点击可跳转指定 id 条目；由于跳转通过 SQL 配置，你也可以配置固定跳转到某个块或文档。

## 粘贴时对数据进行预处理

原理：切入粘贴事件，再粘贴前对粘贴板里的数据进行预处理。

### 自动获取链接标题：🙏[zolrathobsidian-auto-link-title Automatically fetch the titles of pasted links](https://GitHub.com/zolrath/obsidian-auto-link-title)

- 粘贴链接时自动获取标题并以 markdown 形式的链接粘贴

### 矩形标注粘贴时转为「图片 📌」

[PDF 阅读「矩形标注」粘贴 · Issue #15928 · siyuan-note/siyuan · GitHub](https://GitHub.com/siyuan-note/siyuan/issues/15928)

思源笔记在矩形标注时粘贴为：

![CleanShot 2025-09-07 at 01.03.10@2x](https://raw.githubusercontent.com/hqweay/picbed/master/img/CleanShot%202025-09-07%20at%2001.03.10%402x-20250907010400-6ct3grc.png)

调整后以 RemNote 的形式粘贴：

![CleanShot 2025-09-07 at 01.06.23@2x](https://raw.githubusercontent.com/hqweay/picbed/master/img/CleanShot%202025-09-07%20at%2001.06.23%402x-20250907010637-gajnwwa.png)

## 行内元素转换

- 块菜单/文档菜单打开事件增加行内元素转换的功能

  - 块超链接 👉 引用
  - 引用 👉 块超链接
  - 引用/块超链接 👉 文本
  - 引用/链接 👉 文本
  - 加粗 👉 文本
  - 标注 👉 文本
  - 标签 👉 文本
  - 斜体 👉 文本
  - 清理文档自身的引用
  - 清理 \* 引用

## 配置某些引用下的子元素展示（id 截取生成的）创建时间

- 配置 ID，该 ID 引用下的子节点将在右上角展示创建时间
- 是否为该 ID 文档下的大纲元素启用

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929012250-mv4mhp3.png)

## 左上边栏扩充

- 在左上边栏新增图标固定打开链接或文档（块）

  - > 加个快捷方式。我目前配置了文档流插件打开日记流

## 【实验】增加代码片段合集 Demo

插件会拉取[代码片段合集](https://GitHub.com/hqweay/siyuan-hqweay-go/issues/4)配置的代码片段，可直接启用。详见该 issue。

目前配置了俩：

- 隐藏按钮：启用后会隐藏一些按钮
- 便利贴样式：搭配快捷添加属性使用，将块以便利贴样式展示

![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929194427-jm2x4nb.png)

## 参考及致谢

- [TinkMingKingsiyuan-plugins-index Plugin for SiYuan](https://GitHub.com/TinkMingKing/siyuan-plugins-index)
- [siyuan-noteplugin-sample-vite-svelte SiYuan plugin sample with vite and svelte](https://GitHub.com/siyuan-note/plugin-sample-vite-svelte)
- 其余涉及到的参考有在具体功能中提及，若插件有所帮助皆归功于他们。对插件中功能感兴趣的可参考源码实现

  - ![image](https://raw.githubusercontent.com/hqweay/picbed/master/img/image-20250929012737-7rcr39k.png)
