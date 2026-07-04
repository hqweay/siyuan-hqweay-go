import { PluginMetadata } from "@/types/plugin";

export const pluginMetadata: PluginMetadata = {
  name: "diaryTools",
  displayName: "lets-how-to-write-diary.displayName",
  description: "lets-how-to-write-diary.description",
  version: "1.0.0",
  author: "hqweay",
  settings: [
    {
      type: "textinput",
      title: "lets-how-to-write-diary.noteBookID",
      description: "",
      key: "noteBookID",
      value: "20240330144726-gs2xey6",
      placeholder: "20240330144726-gs2xey6",
    },
    {
      type: "checkbox",
      title: "lets-how-to-write-diary.quickInput",
      description: "",
      key: "quickInput",
      value: true,
    },
    {
      type: "checkbox",
      title: "lets-how-to-write-diary.slashDiaryNote",
      description: "",
      key: "slashDiaryNote",
      value: true,
    },
    {
      type: "checkbox",
      title: "lets-how-to-write-diary.topBar",
      description: "",
      key: "topBar",
      value: false,
    },
    {
      type: "textinput",
      title: "lets-how-to-write-diary.getWeather",
      description: "https://www.sojson.com/blog/305.html",
      key: "getWeatherSetAttrs",
      value: "101270101",
      placeholder: "配置城市代码，如：101270101",
    },
  ],
};
export default pluginMetadata;
