这是一只恐龙，路过的人必须夸它可爱。

## 支持：

- 快捷添加书签
	- 块菜单打开事件增加快捷添加书签

- 提取标注至新文档
	- 文档菜单打开事件新增提取当前文档的标注至新文档。

- 随机/固定浏览
  - 在界面右上角生成一个随机图标，点击可跳转指定 id 条目；由于跳转通过 SQL 配置，你也可以配置固定跳转到某个块或文档。

- 随机头图
  - 支持配置本地文件夹/自定义 URL

- 自动获取标题链接
  - 粘贴网站时自动获取标题并以 markdown 形式的链接粘贴

- 中文排版优化
  - 右上角增加机器人图标/块菜单打开事件增加格式化文档的功能；注意有损坏数据风险。

- 行内元素转换
  - 块菜单/文档菜单打开事件增加行内元素转换的功能

- 块内容分享至某处
  - 块菜单事件提供将选中内容发送到配置链接的功能

- 配置某些引用下的子元素展示（id 截取生成的）创建时间
  - 配置 ID，该 ID 引用下的子节点将在右上角展示创建时间

- 左上边栏扩充
  - 在左上边栏新增图标固定打开链接或文档（块）


每项的具体说明见 `src/siyuan-*/README.md`

## 参考及致谢

- [【教程】把随机题头图换成自己的图片，让思源笔记更加赏心悦目 - 链滴](https://ld246.com/article/1694612740828)
- [TinkMingKingsiyuan-plugins-index Plugin for SiYuan](https://github.com/TinkMingKing/siyuan-plugins-index)
- [siyuan-noteplugin-sample-vite-svelte SiYuan plugin sample with vite and svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte)
- 以及其它开发时用到的资料
