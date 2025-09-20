import AddIconThenClick from "@/myscripts/addIconThenClick";

export default class DockLeft extends AddIconThenClick {
  id = "";
  label = "";
  icon = `😝`;
  defaultIcon = `😝`;
  type = "dockLeft";

  async exec() {
    if (this.id === "") {
      return;
    } else if (this.id.startsWith("siyuan://") || this.id.startsWith("http")) {
      window.open(this.id);
      return;
    } else {
      window.open("siyuan://blocks/" + this.id);
    }
  }

  addIcon = () => {
    const dockLeftEle = document.getElementById(`dockLeft`);
    if (!dockLeftEle) {
      return;
    }
    const dockLeft = dockLeftEle.firstChild;

    // 创建要插入的子元素
    let childElement = document.createElement("span");
    this.thisElement = childElement;
    childElement.setAttribute(`id`, `dock-left-custom-${this.id}`);
    childElement.setAttribute(`class`, `dock__item b3-tooltips b3-tooltips__e`);
    childElement.setAttribute(
      `aria-label`,
      `${this.label ? this.label : this.icon}`
    );
    childElement.innerHTML = `${this.icon ? this.icon : this.defaultIcon}`;

    // 获取父元素的第一个子元素
    const firstChild = dockLeft.firstChild;

    // 将子元素插入到第一个子元素之前
    dockLeft.insertBefore(childElement, firstChild);

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
