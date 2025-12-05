export default {
  name: "randomHeaderImage",
  displayName: "随机题头图",
  description: "支持配置本地文件夹/自定义 URL",
  version: "1.0.0",
  author: "hqweay",
  defaultConfig: {
    enabled: false,
    folderPaths: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
    isCached: true,
    bing: false,
    xjh: false,
  },
  settings: {
    随机题头图: [
      {
        type: "checkbox",
        title: "本地图片进入缓存？",
        description:
          "如果打开，会减少从文件夹遍历获取图片，但新添加到文件夹的图片不会及时生效。",
        key: "isCached",
        value: false,
      },
      {
        type: "checkbox",
        title: "必应",
        description:
          "使用 https://bing.img.run/api.html 的 API 获取历史随机壁纸",
        key: "bing",
        value: false,
      },
      {
        type: "checkbox",
        title: "岁月小筑",
        description:
          "使用 https://img.xjh.me/random_img.php 的 API 获取随机图片",
        key: "xjh",
        value: false,
      },
      {
        type: "textarea",
        title: "本地文件夹/自定义 URL",
        description: `0️⃣可配置本地文件夹或能返回图片地址的 URL（返回值包含图片地址即可）<br/>
            1️⃣可配置多个路径，以换行分隔；<br/>
            2️⃣本地文件夹路径需配置为绝对路径；<br/>
            3️⃣本地文件夹需在 Siyuan 工作目录（Siyuan/data/**/）下，比如 Siyuan/data/assets/images；<br/>
            4️⃣本地文件夹可使用软链接引用 Siyuan 工作目录外的文件夹。<br/>
            5️⃣使用：1）配置；2️）在文档点击「随机题头图」；3️）右键点击「随机」。`,
        key: "folderPaths",
        value: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
        placeholder: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
      },
    ],
  },
};
