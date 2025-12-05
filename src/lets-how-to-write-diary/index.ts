import { getBlockAttrs, setBlockAttrs } from "@/api";
import { settings } from "@/settings";
import { isMobile, plugin } from "@/utils";
import { Dialog, Menu, openMobileFileById, openTab, showMessage } from "siyuan";
import { SubPlugin } from "@/types/plugin";

import DashboardComponent from "./dashboard.svelte";

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
  name = "diaryTools";
  displayName = "日记相关工具";
  description = "提供日记相关的工具，包括仪表盘、天气信息插入等功能";
  version = "1.0.0";
  enabled = settings.getBySpace("diaryToolsConfig", "enabled");

  private id = "hqweay-diary-tools";
  private label = "获取天气并插入当前文档属性";
  private icon = `📝`;
  private thisElement: HTMLElement | null = null;

  addDock() {
    const addToDock = settings.getBySpace("diaryToolsConfig", "addToDock");

    console.log("addToDock", addToDock);
    if (docks.includes(addToDock)) {
      plugin.addDock({
        config: {
          position: addToDock,
          size: { width: 200, height: 0 },
          icon: "iconAttr",
          title: "仪表盘",
          hotkey: "⌥⌘W",
        },
        data: { text: "This is my custom dock" },
        type: DOCK_TYPE + "aaa",
        resize() {
          console.log(DOCK_TYPE + " resize");
        },
        update() {
          console.log(DOCK_TYPE + " update");
        },
        init: (dock) => {
          new DashboardComponent({
            target: dock.element,
          });
        },
        destroy() {
          console.log("destroy dock:", DOCK_TYPE);
        },
      });
    }
  }

  async onload() {
    console.log("diary-tools onload");
    // Add icon to toolbar
    this.addIconToToolbar();

    // Add dock if configured
    this.addDock();

    // Setup menu for mobile or desktop
    if (isMobile) {
      this.addMenu();
    }
  }

  private addIconToToolbar() {
    this.showMenu();
  }

  private showMenu() {
    console.log("showMenu");
    this.thisElement = plugin.addTopBar({
      icon: "iconBookmark",
      title: "恐龙工具箱",
      position: "right",
      callback: () => {
        if (isMobile) {
          this.addMenu();
        } else {
          let rect = this.thisElement?.getBoundingClientRect();
          if (!rect || rect.width === 0) {
            rect = document.querySelector("#barMore")?.getBoundingClientRect();
          }
          if (!rect || rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              ?.getBoundingClientRect();
          }
          if (rect) {
            this.addMenu(rect);
          }
        }
        // diaryTools handles its own menu display
      },
    });
  }

  onunload(): void {
    // 查询所有匹配的元素并删除
    document
      .querySelectorAll('[id^="plugin_siyuan-hqweay-go_"]')
      .forEach((element) => {
        element.remove();
      });
  }

  openSiyuanUrlPluginEvent({ detail }) {
    const urlObj = new URL(detail.url);
    const method = urlObj.pathname.split("/").pop();
    if (method === "open") {
      const indexParam = urlObj.searchParams.get("index");
      const type = urlObj.searchParams.get("type");

      const index =
        //@ts-ignore
        indexParam && !isNaN(indexParam) ? Number(indexParam) : indexParam || 0;

      if (isMobile) {
        let dialog = new Dialog({
          title: "仪表盘",
          content: `<div id="hqweay-diary-dashboard" style="height: 700px;"></div>`,
          width: "400px",
          destroyCallback: (options) => {
            pannel.$destroy();
          },
        });

        let pannel = new DashboardComponent({
          target: dialog.element.querySelector("#hqweay-diary-dashboard"),
          props: { selectedConfig: index, type },
        });
      } else {
        let tabDiv = document.createElement("div");
        tabDiv.setAttribute("id", "hqweay-diary-dashboard" + index);
        new DashboardComponent({
          target: tabDiv,
          props: { selectedConfig: index, type },
        });
        plugin.addTab({
          type: TAB_TYPE + index,
          init() {
            this.element.appendChild(tabDiv);
          },
        });
        openTab({
          app: plugin.app,
          custom: {
            icon: "",
            title: "仪表盘",
            data: {},
            id: plugin.name + TAB_TYPE + index,
          },
        });
      }
    }
  }

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
    if (settings.getBySpace("createDailyNoteConfig", "topBar")) {
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

    // 添加打开仪表盘选项
    if (settings.getFlag("diaryTools")) {
      menu.addItem({
        label: "打开仪表盘",
        iconHTML: "🌤️",
        click: async () => {
          if (isMobile) {
            let dialog = new Dialog({
              title: "仪表盘",
              content: `<div id="hqweay-diary-dashboard" style="height: 700px;"></div>`,
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
                title: "仪表盘",
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
