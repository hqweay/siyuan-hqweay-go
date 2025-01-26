这是一只恐龙，路过的人必须夸它可爱。

## update

- 新增 VoiceNotes 的同步。设置界面可进行全量同步，右上角添加一个录音图标，点击可同步最新的 20 条笔记。感谢 [voicenotes-sync](https://github.com/mysticcoders/voicenotes-sync)

## 支持：

- 标题转换
  - 文档菜单打开事件增加标题转换（块级标题转换可使用本体自带的「转换为」）
- 增加代码片段合集 Demo。
- 随机题头图支持直接启用必应、岁月小筑
- 发送到
  - 新增支持获取块链接，可实现将块链接添加到提醒事项（自定义链接的名称包含「添加块链接到提醒事项」时会获取选中块的超链接）
  - 如 Mac 用户可新建 通过剪切板创建提醒事项 的快捷指令，命名为「从剪贴板添加提醒事项」；在发送到的自定义链接里配置「添加块链接到提醒事项====shortcuts://run-shortcut?name=从剪贴板添加提醒事项」
- 块内容处理
  - 块菜单事件提供将选中内容分享到配置链接的功能
    - 通过 Google 搜索
    - 自定义链接
    - chatGPT 支持查询参数了，可以这样配置下：`ChatGPT 总结====https://chat.openai.com/chat?q=请帮我总结：${content}`
  - 通过卡片分享
    - 支持样式配置
    - 分享时可编辑修改
    - 支持模板
    - 支持在卡片页面展开/折叠列表
- 中文排版优化
  - 右上角增加机器人图标/块菜单打开事件增加格式化文档的功能；**注意有损坏数据风险。**
    - 中文使用全角标点
    - 英文使用半角标点
    - 中英文混合排版……
    - 支持图片居中
    - 支持调整图片宽度
  - 配置格式化后是否自动执行思源提供的「排版优化」以插入空格
  - 配置格式化后是否自动执行思源提供的「网络资源文件转换本地」
- 为不同文档配置打开时是否同时打开/关闭边栏
  - 可为不同文档配置不同操作：打开边栏、关闭边栏
  - 可配置左边栏、右边栏
  - 可配置是否同时打开/关闭停靠栏
- 快捷添加书签
  - 块菜单打开事件增加快捷添加书签
- 提取元素至新文档
  - 文档菜单打开事件新增提取当前文档的标注至新文档。
    - 提取时是否包含标注的上下文
    - 新文档内的标注是否添加一个 \* 引用指向原文块
- 随机/固定浏览
  - 在界面右上角生成一个随机图标，点击可跳转指定 id 条目；由于跳转通过 SQL 配置，你也可以配置固定跳转到某个块或文档。
- 随机题头图
  - 支持配置图片来源：本地文件夹/自定义 URL
  - 可配置多组
- 自动获取链接标题
  - 粘贴链接时自动获取标题并以 markdown 形式的链接粘贴
- 行内元素转换
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
- 配置某些引用下的子元素展示（id 截取生成的）创建时间
  - 配置 ID，该 ID 引用下的子节点将在右上角展示创建时间
  - 是否为该 ID 文档下的大纲元素启用
- 左上边栏扩充
  - 在左上边栏新增图标固定打开链接或文档（块）

每项的具体说明见 `src/siyuan-*/README.md`

## 参考及致谢

- [【教程】把随机题头图换成自己的图片，让思源笔记更加赏心悦目 - 链滴](https://ld246.com/article/1694612740828)
- [TinkMingKingsiyuan-plugins-index Plugin for SiYuan](https://github.com/TinkMingKing/siyuan-plugins-index)
- [siyuan-noteplugin-sample-vite-svelte SiYuan plugin sample with vite and svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte)
- 以及其它开发时用到的资料
