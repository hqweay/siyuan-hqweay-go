export default {
  name: "randomHeaderImage",
  displayName: "lets-randomHeaderImage.displayName",
  description: "lets-randomHeaderImage.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "lets-randomHeaderImage.isCached",
      description: "lets-randomHeaderImage.isCachedDesc",
      key: "isCached",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-randomHeaderImage.bing",
      description: "lets-randomHeaderImage.bingDesc",
      key: "bing",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-randomHeaderImage.xjh",
      description: "lets-randomHeaderImage.xjhDesc",
      key: "xjh",
      value: false,
    },
    {
      type: "textarea",
      title: "lets-randomHeaderImage.folderPaths",
      description: "lets-randomHeaderImage.folderPathsDesc",
      key: "folderPaths",
      value: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
      placeholder: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
    },
  ],
};
