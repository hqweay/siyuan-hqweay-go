export const en = {
  "lets-randomHeaderImage.displayName": "Random Header Image",
  "lets-randomHeaderImage.description": "Configure local folders / custom URLs",
  "lets-randomHeaderImage.isCached": "Cache local images?",
  "lets-randomHeaderImage.isCachedDesc": "If enabled, reduces directory traversal but new images won't take effect immediately.",
  "lets-randomHeaderImage.bing": "Bing",
  "lets-randomHeaderImage.bingDesc": "Use https://bing.img.run/api.html for random wallpapers",
  "lets-randomHeaderImage.xjh": "XJH Image",
  "lets-randomHeaderImage.xjhDesc": "Use https://img.xjh.me/random_img.php for random images",
  "lets-randomHeaderImage.folderPaths": "Local folder / Custom URL",
  "lets-randomHeaderImage.folderPathsDesc": `0\uFE0F\u20E3 Can configure local folder or URL returning image URLs (response must contain image URL)<br/>
1\uFE0F\u20E3 Multiple paths supported, separated by newlines;<br/>
2\uFE0F\u20E3 Local folder must be absolute path;<br/>
3\uFE0F\u20E3 Local folder must be under Siyuan data directory (Siyuan/data/**/), e.g., Siyuan/data/assets/images;<br/>
4\uFE0F\u20E3 Local folder can use symlinks to external directories;<br/>
5\uFE0F\u20E3 Usage: 1) Configure; 2) Click \"Random Header\" in doc; 3) Right-click \"Random\".`,
  "lets-randomHeaderImage.checkFolderPath": "Please check the random image folder path configuration~",
  "lets-randomHeaderImage.checkConfig": "Please check the random image configuration~",
};

export const zhCN: typeof en = {
  "lets-randomHeaderImage.displayName": "随机题头图",
  "lets-randomHeaderImage.description": "支持配置本地文件夹/自定义 URL",
  "lets-randomHeaderImage.isCached": "本地图片进入缓存？",
  "lets-randomHeaderImage.isCachedDesc": "如果打开，会减少从文件夹遍历获取图片，但新添加到文件夹的图片不会及时生效。",
  "lets-randomHeaderImage.bing": "必应",
  "lets-randomHeaderImage.bingDesc": "使用 https://bing.img.run/api.html 的 API 获取历史随机壁纸",
  "lets-randomHeaderImage.xjh": "岁月小筑",
  "lets-randomHeaderImage.xjhDesc": "使用 https://img.xjh.me/random_img.php 的 API 获取随机图片",
  "lets-randomHeaderImage.folderPaths": "本地文件夹/自定义 URL",
  "lets-randomHeaderImage.folderPathsDesc": `0\uFE0F\u20E3可配置本地文件夹或能返回图片地址的 URL（返回值包含图片地址即可）<br/>
1\uFE0F\u20E3可配置多个路径，以换行分隔；<br/>
2\uFE0F\u20E3本地文件夹路径需配置为绝对路径；<br/>
3\uFE0F\u20E3本地文件夹需在 Siyuan 工作目录（Siyuan/data/**/）下，比如 Siyuan/data/assets/images；<br/>
4\uFE0F\u20E3本地文件夹可使用软链接引用 Siyuan 工作目录外的文件夹。<br/>
5\uFE0F\u20E3使用：1）配置；2\uFE0F\u20E3）在文档点击「随机题头图」；3\uFE0F\u20E3）右键点击「随机」。`,
  "lets-randomHeaderImage.checkFolderPath": "请检查随机图片文件夹的路径配置～",
  "lets-randomHeaderImage.checkConfig": "请检查随机图片的配置～",
};
