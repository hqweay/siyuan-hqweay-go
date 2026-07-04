import { openByUrl } from "@/myscripts/syUtils";
import { SubPlugin } from "@/types/plugin";
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-dockPlus");

export default class DockPlugin implements SubPlugin {
  location = "dockLeft-top";
  icon = `😝`;
  id = "";

  label = "";
  defaultIcon = `😝`;
  thisElement;

  constructor(location: string, icon: string, id: string, label: string) {
    this.location = location;
    this.icon = icon;
    this.id = id;
    this.label = label;
  }

  onload(): void {}
  onunload() {
    this.thisElement && this.thisElement.remove();
  }
  onLayoutReady() {
    if (document.getElementById(this.id) || this.thisElement) {
      return;
    }

    this.addIconThenClick();
  }
  async exec() {
    openByUrl(this.id);
  }

  addIconThenClick = () => {
    const [x, y] = this.location.split("-");

    const dockEles = document.getElementById(`${x}`);
    log.info("dockEles", dockEles);
    if (!dockEles) {
      return;
    }

    let dockEle = null;
    if (y === "top") {
      dockEle = dockEles.firstChild;
    } else if (y === "bottom") {
      dockEle = dockEles.lastChild;
    } else if (y === "left") {
      //获取第四个元素
      dockEle = dockEles.children[3];
    } else if (y === "right") {
      //右上角 取 barMode
      dockEle = document.getElementById(`barMode`);
    } else {
      return;
    }

    if (!dockEle) return;

    // 创建要插入的子元素
    let childElement = document.createElement("span");
    this.thisElement = childElement;
    childElement.setAttribute(`id`, `${this.id}`);
    childElement.setAttribute(
      `aria-label`,
      `${this.label ? this.label : this.icon}`
    );
    childElement.innerHTML = `${this.icon ? this.icon : this.defaultIcon}`;

    if (x === "toolbar") {
      childElement.setAttribute(
        `class`,
        `dock-plugin-hqweay ariaLabel toolbar__item`
      );
      // 将元素插在当前元素前面
      dockEle.insertAdjacentElement("beforebegin", childElement);
    } else {
      childElement.setAttribute(
        `class`,
        `dock-plugin-hqweay dock__item b3-tooltips b3-tooltips__e`
      );
      // 获取父元素的第一个子元素
      const firstChild = dockEle.firstChild;
      // 将子元素插入到第一个子元素之前
      dockEle.insertBefore(childElement, firstChild);
    }

    childElement.addEventListener(
      "click",
      (e) => {
        this.exec();
        e.stopPropagation();
        e.preventDefault();
      },
      true
    );
  };
}
