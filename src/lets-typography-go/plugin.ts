export default {
  name: "typography",
  displayName: "lets-typography.displayName",
  description: "lets-typography.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "checkbox",
      title: "lets-typography.slashFormat",
      description: "",
      key: "slashFormat",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-typography.autoSpace",
      description: "lets-typography.autoSpaceDesc",
      key: "autoSpace",
      value: true,
    },
    {
      type: "checkbox",
      title: "lets-typography.netImg2LocalAssets",
      description: "lets-typography.netImg2LocalAssetsDesc",
      key: "netImg2LocalAssets",
      value: false,
    },
    {
      type: "checkbox",
      title: "lets-typography.closeTip",
      description: "lets-typography.closeTipDesc",
      key: "closeTip",
      value: false,
    },
    {
      type: "number",
      title: "lets-typography.imageCenter",
      description: "lets-typography.imageCenterDesc",
      key: "imageCenter",
      value: 50,
    },
  ],
};
