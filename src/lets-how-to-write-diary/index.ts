import { getBlockAttrs, setBlockAttrs } from "@/api";
import { datePickerDialog } from "@/myscripts/dialog";
import { addProtyleSlash } from "@/myscripts/syUtils";
import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { createDailynote } from "@frostime/siyuan-plugin-kits";
import { showMessage } from "siyuan";
import { quickNoteOnload } from "./quick-note/quickNote";

const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";
const docks = [
  "LeftTop",
  "LeftBottom",
  "RightTop",
  "RightBottom",
  "BottomLeft",
  "BottomRight",
];

export default class DiaryTools implements SubPlugin {
  private id = "hqweay-diary-tools";
  private label = "获取天气并插入当前文档属性";
  private icon = `<svg t="1765029971721" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5764" width="32" height="32"><path d="M448.6 455c0-57.1 17.1-110.2 46.3-154.5-7-0.8-14-1.2-21.2-1.2-79 0-150.8 49.7-178.7 123.6l-9.4 24.9-26.5-2.3c-4.2-0.4-8-0.5-11.5-0.5-72 0-130.6 58.6-130.6 130.6s58.6 130.6 130.6 130.6h355.6C511.5 659.9 448.6 564.8 448.6 455z" fill="#E6EBEF" p-id="5765"></path><path d="M733 458.5c25.6 5.4 49 17 68.6 33 23.5-17.4 38.8-45.2 38.8-76.7 0-52.6-42.8-95.4-95.4-95.4-21.9 0-42 7.5-58.2 19.9 24.5 34.5 40.9 75.2 46.2 119.2z" fill="#FFF370" p-id="5766"></path><path d="M745 269.2c-40.1 0-78.6 16.8-105.9 45.7-0.5-0.5-1-0.9-1.5-1.4-1.3-1.2-2.7-2.5-4.1-3.7-1.5-1.3-2.9-2.6-4.4-3.8-1.4-1.2-2.8-2.3-4.2-3.5-1.5-1.2-3.1-2.4-4.6-3.6-1.5-1.1-2.9-2.2-4.4-3.3-1.6-1.2-3.2-2.3-4.8-3.4-1.5-1-3-2.1-4.6-3.1-1.6-1.1-3.3-2.1-5-3.2-1.6-1-3.1-1.9-4.7-2.9-1.7-1-3.4-2-5.2-3l-4.8-2.7c-1.8-0.9-3.5-1.8-5.3-2.7-1.6-0.8-3.3-1.6-4.9-2.4-1.8-0.9-3.7-1.7-5.5-2.5-1.7-0.7-3.3-1.5-5-2.2-1.9-0.8-3.8-1.5-5.7-2.2-1.7-0.7-3.4-1.3-5.1-1.9-1.9-0.7-3.9-1.3-5.9-2-1.7-0.6-3.4-1.2-5.2-1.7-2-0.6-4-1.2-6.1-1.7-1.7-0.5-3.4-1-5.2-1.4l-6.3-1.5c-1.7-0.4-3.4-0.8-5.1-1.1l-6.6-1.2c-1.7-0.3-3.3-0.6-5-0.9-2.4-0.4-4.7-0.6-7.1-0.9-1.6-0.2-3.1-0.4-4.7-0.6-2.6-0.3-5.3-0.4-8-0.6-1.4-0.1-2.7-0.2-4-0.3-4-0.2-8.1-0.3-12.2-0.3-3.6 0-7.2 0.1-10.9 0.3-1.3 0.1-2.7 0.1-4 0.2-2.2 0.1-4.3 0.3-6.4 0.5-1.7 0.2-3.4 0.3-5.2 0.5l-2.7 0.3c-61.5 7.5-116 38.1-154.3 83-0.4 0.5-0.8 0.9-1.2 1.4-1.2 1.4-2.4 2.9-3.6 4.4-1.1 1.4-2.2 2.8-3.3 4.3-0.9 1.1-1.7 2.3-2.6 3.4-1.8 2.4-3.6 4.9-5.3 7.4-0.2 0.3-0.4 0.5-0.5 0.8-2.1 3-4 6.2-6 9.3-0.2 0.4-0.5 0.8-0.7 1.1-1.7 2.8-3.3 5.7-4.9 8.5-0.3 0.5-0.5 0.9-0.8 1.4-3.3 6.1-6.4 12.4-9.2 18.8-1.6 0-3.1-0.1-4.6-0.1-99.7 0-180.8 81.1-180.8 180.8S148 756.3 247.7 756.3h318.8c8.3 0 15.1-6.7 15.1-15.1 0-8.3-6.7-15.1-15.1-15.1H247.6c-83.1 0-150.7-67.6-150.7-150.7 0-81.1 64.4-147.4 144.7-150.6-5.8 20.7-9 42.6-9 65.2 0 26.8 4.4 53.2 13 78.3 2.1 6.2 8 10.2 14.3 10.2 1.6 0 3.3-0.3 4.9-0.8 7.9-2.7 12.1-11.3 9.4-19.1-7.6-22-11.4-45.1-11.4-68.6 0-32.6 7.4-63.5 20.7-91.1 0.2-0.3 0.3-0.7 0.5-1 1.3-2.6 2.6-5.2 4-7.7 0.2-0.5 0.5-0.9 0.7-1.4 1.4-2.6 2.9-5.1 4.4-7.6 0.2-0.3 0.3-0.5 0.5-0.8 1.7-2.8 3.5-5.5 5.3-8.2 0.2-0.3 0.4-0.6 0.7-0.9l4.5-6.3c0.8-1.1 1.6-2.2 2.4-3.2 0.9-1.2 1.8-2.4 2.8-3.6 1.1-1.4 2.2-2.8 3.4-4.1 0.4-0.5 0.9-1 1.4-1.6 33.8-39.1 81.4-65.2 133.5-71.8 0.9-0.1 1.8-0.2 2.7-0.4 1.6-0.2 3.3-0.3 4.9-0.5 1.8-0.2 3.6-0.3 5.4-0.4 1.2-0.1 2.5-0.2 3.7-0.2 3.2-0.1 6.4-0.2 9.6-0.2 116.3 0 211 94.6 211 211 0 8.3 6.7 15.1 15.1 15.1 60.9 0 110.5 49.6 110.5 110.5S760.9 726.1 700 726.1h-46.9c-8.3 0-15.1 6.7-15.1 15.1 0 8.3 6.7 15.1 15.1 15.1H700c77.6 0 140.7-63.1 140.7-140.7 0-27.7-8-53.5-21.9-75.2 44.3-25.9 72.1-73.4 72.1-125.7-0.2-80.2-65.6-145.5-145.9-145.5z m54.5 247.5c-22.3-22.4-52-37.4-85.1-40.8-0.1-1.9-0.3-3.7-0.5-5.6-0.1-1.8-0.3-3.7-0.5-5.5-0.2-2.2-0.6-4.4-0.8-6.7-0.2-1.7-0.4-3.5-0.7-5.2-0.4-2.4-0.8-4.7-1.3-7-0.3-1.5-0.5-3.1-0.8-4.6-0.6-2.8-1.2-5.5-1.9-8.2-0.3-1.1-0.5-2.1-0.7-3.2-1-3.8-2-7.5-3.2-11.2-0.4-1.3-0.9-2.5-1.3-3.8-0.8-2.4-1.6-4.9-2.5-7.3-0.5-1.5-1.2-3-1.7-4.5-0.8-2.1-1.6-4.2-2.5-6.3-0.7-1.6-1.4-3.1-2.1-4.6-0.9-2-1.7-3.9-2.6-5.9-0.8-1.6-1.6-3.1-2.4-4.7-0.9-1.9-1.9-3.7-2.8-5.5-0.8-1.6-1.7-3.1-2.6-4.6-1-1.8-2-3.6-3.1-5.3-0.9-1.5-1.9-3-2.9-4.6-1.1-1.7-2.1-3.4-3.3-5.1-1-1.5-2.1-3-3.1-4.5-1.1-1.6-2.3-3.3-3.5-4.9-1.1-1.5-2.2-2.9-3.3-4.3-1.2-1.6-2.4-3.1-3.7-4.7-0.4-0.5-0.7-1-1.1-1.4 21.9-24 52.3-37.6 85.3-37.6 63.7 0 115.5 51.8 115.5 115.5 0.2 43.2-23.4 82.1-60.8 102.1zM669.1 250c2.2 6.1 8 9.9 14.2 9.9 1.7 0 3.4-0.3 5.1-0.9 7.8-2.8 11.9-11.5 9-19.3l-10.3-28.3c-2.8-7.8-11.5-11.9-19.3-9-7.8 2.8-11.9 11.5-9 19.3l10.3 28.3zM815.1 264.7c2.1 1 4.2 1.4 6.4 1.4 5.7 0 11.1-3.2 13.7-8.7l12.8-27.3c3.5-7.5 0.3-16.5-7.3-20s-16.5-0.3-20 7.3l-12.8 27.3c-3.6 7.5-0.3 16.4 7.2 20zM957.4 337.7c-2.8-7.8-11.5-11.9-19.3-9L909.8 339c-7.8 2.8-11.9 11.5-9 19.3 2.2 6.1 8 9.9 14.2 9.9 1.7 0 3.4-0.3 5.1-0.9l28.3-10.3c7.9-2.9 11.9-11.5 9-19.3zM942.5 490.5l-27.3-12.8c-7.6-3.5-16.5-0.3-20 7.3-3.5 7.5-0.3 16.5 7.3 20l27.3 12.8c2.1 1 4.2 1.4 6.4 1.4 5.7 0 11.1-3.2 13.7-8.7 3.4-7.5 0.2-16.5-7.4-20zM689.7 796.6H415.1c-8.3 0-15.1 6.7-15.1 15.1s6.7 15.1 15.1 15.1h274.6c8.3 0 15.1-6.7 15.1-15.1s-6.8-15.1-15.1-15.1zM329.7 796.6h-82.1c-8.3 0-15.1 6.7-15.1 15.1s6.7 15.1 15.1 15.1h82.1c8.3 0 15.1-6.7 15.1-15.1s-6.8-15.1-15.1-15.1z" fill="#4F3D3B" p-id="5767"></path></svg>`;
  private thisElement: HTMLElement | null = null;

  // async onLayoutReady() {
  //   // Setup menu for mobile or desktop

  // }
  onload(): void {
    settings.getBySpace("diaryTools", "quickInput") && quickNoteOnload();
    if (settings.getBySpace("diaryTools", "slashDiaryNote")) {
      addProtyleSlash({
        filter: ["cdn"],
        html: "创建日记引用",
        id: "create-daily-note-ref",
        callback: async (event, node) => {
          datePickerDialog({
            title: "选择日记",
            confirm: async (choosedDate) => {
              const noteBookID = settings.getBySpace(
                "diaryTools",
                "noteBookID"
              );
              const dailyNoteId = await createDailynote(
                noteBookID,
                new Date(choosedDate)
              );
              event.insert(`((${dailyNoteId} "${choosedDate}"))`, false, false);
            },
          });
        },
      });
    }
  }
  onunload(): void {}

  //获取天气并插入当前文档属性
  getTodayWeatherInfo(data) {
    console.log(data);
    const today = data.data.forecast[0]; //  forecast数组第一个就是当天的预报
    const baseInfo = data.data;
    return {
      // 基础信息
      city: data.cityInfo.city,
      province: data.cityInfo.parent,
      updateTime: data.cityInfo.updateTime,
      date: today.ymd,
      week: today.week,

      // 天气状况
      weatherType: today.type,
      temperature: baseInfo.wendu + "℃", // 当前温度
      highTemp: today.high,
      lowTemp: today.low,

      // 环境指标
      humidity: baseInfo.shidu,
      airQuality: baseInfo.quality,
      pm25: baseInfo.pm25,
      pm10: baseInfo.pm10,

      // 风力信息
      windDirection: today.fx,
      windPower: today.fl,

      // 生活提示
      notice: today.notice,
      healthTip: baseInfo.ganmao,

      // 日出日落
      sunrise: today.sunrise,
      sunset: today.sunset,
    };
  }

  addMenuItem(menu) {
    // 添加获取天气并插入当前文档属性选项
    if (settings.getBySpace("diaryTools", "topBar")) {
      console.log("addMenuItem");
      menu.addItem({
        label: "获取当前天气并插入当前文档属性",
        iconHTML: `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="${this.label}" >${this.icon}</div>`,
        click: async () => {
          const docID = document
            .querySelector(
              ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
            )
            ?.getAttribute("data-node-id");

          if (!docID) {
            console.warn("无法获取当前文档ID，操作取消");
            return;
          }

          const cityCode = settings.getBySpace(
            "diaryTools",
            "getWeatherSetAttrs"
          );

          if (!cityCode) {
            showMessage("未配置城市代码，操作取消", 2000);
            return;
          }

          const attrs = await getBlockAttrs(docID);
          if (attrs["custom-diary-weather-type"]) {
            showMessage("已存在天气属性，操作取消", 2000);
            return;
          }

          const response = await fetch(
            `http://t.weather.itboy.net/api/weather/city/${cityCode}`
          );
          const weatherData = await response.json();
          const todayWeather = this.getTodayWeatherInfo(weatherData);

          await setBlockAttrs(docID, {
            "custom-diary-weather-type": todayWeather.weatherType,
            "custom-diary-temperature": todayWeather.temperature,
            "custom-diary-air-quality": todayWeather.airQuality,
            "custom-diary-pm25": `${todayWeather.pm25}`,
            "custom-diary-pm10": `${todayWeather.pm10}`,
            "custom-diary-wind-power": todayWeather.windPower,
            "custom-diary-city": todayWeather.city,
          });
          showMessage("天气属性已插入当前文档属性", 2000);
        },
      });
    }
  }
}
