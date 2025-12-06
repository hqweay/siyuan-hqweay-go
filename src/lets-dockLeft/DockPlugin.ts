import AddIconThenClick from "@/myscripts/addIconThenClick";
import { openByUrl } from "@/myscripts/syUtils";

export default class DockPlugin extends AddIconThenClick {
  id = "";
  label = "";
  icon = `😝`;
  defaultIcon = `😝`;
  location = "dockLeft-top";
  type = "dock";

  constructor(location: string, icon: string, id: string) {
    super();
    this.location = location;
    this.icon = icon;
    this.id = id;
  }

  async exec() {
    openByUrl(this.id);
  }

  addIcon = () => {
    const [x, y] = this.location.split("-");

    const dockEles = document.getElementById(`${x}`);
    console.log("dockEles", dockEles);
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
      dockEle = dockEles.lastChild;
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
      // 将元素插在当前元素后面
      dockEle.insertAdjacentElement("afterend", childElement);
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
