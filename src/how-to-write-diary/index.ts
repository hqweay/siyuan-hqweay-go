import { getBlockAttrs, setBlockAttrs } from "@/api";
import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { isMobile, plugin } from "@/utils";
import { Dialog, Menu, openTab, showMessage } from "siyuan";

import DashboardComponent from "./dashboard.svelte";

const TAB_TYPE = "custom_tab";

export default class DiaryTools {
  id = "hqweay-diary-tools";
  label = "获取天气并插入当前文档属性";
  icon = `📝`;

  onload(topBarElement) {
    if (isMobile) {
      this.addMenu();
    } else {
      let rect = topBarElement.getBoundingClientRect();
      // 如果被隐藏，则使用更多按钮
      if (rect.width === 0) {
        rect = document.querySelector("#barMore").getBoundingClientRect();
      }
      if (rect.width === 0) {
        rect = document.querySelector("#barPlugins").getBoundingClientRect();
      }
      this.addMenu(rect);
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

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("hqweay-diary-tools-menu");
    // 添加获取天气并插入当前文档属性选项
    if (settings.getBySpace("createDailyNoteConfig", "topBar") && !isMobile) {
      menu.addItem({
        label: "获取当前天气并插入当前文档属性",
        iconHTML: "🌤️",
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
            "createDailyNoteConfig",
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

    // 添加打开日记仪表盘选项
    if (settings.getFlag("diaryPlus")) {
      menu.addItem({
        label: "打开日记仪表盘",
        iconHTML: "🌤️",
        click: async () => {
          if (isMobile) {
            let dialog = new Dialog({
              title: "日记仪表盘",
              content: `<div id="hqweay-diary-dashboard" style="height: 600px;"></div>`,
              width: "400px",
              destroyCallback: (options) => {
                pannel.$destroy();
              },
            });

            let pannel = new DashboardComponent({
              target: dialog.element.querySelector("#hqweay-diary-dashboard"),
            });
          } else {
            let tabDiv = document.createElement("div");
            new DashboardComponent({
              target: tabDiv,
            });
            plugin.addTab({
              type: TAB_TYPE,
              init() {
                this.element.appendChild(tabDiv);
              },
            });
            openTab({
              app: plugin.app,
              custom: {
                icon: "",
                title: "日记仪表盘",
                data: {},
                id: plugin.name + TAB_TYPE,
              },
            });
          }
        },
      });
    }

    if (isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
}
