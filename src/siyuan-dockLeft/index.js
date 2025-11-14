import { sql } from "@/api";
import AddIconThenClick from "@/myscripts/addIconThenClick";
import { plugin } from "@/utils";
import { openTab } from "siyuan";

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
    } else if (this.id.trim().startsWith("select ")) {
      const sqlTemp = `select id from (${this.id.trim()}) limit 1`;
      let data = await sql(sqlTemp);
      console.log(data[0].id);
      if (data) {
        openTab({
          app: plugin.app,
          doc: {
            // @ts-ignore
            id: data[0].id,
          },
        });
      }
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
    if (!dockLeft) return;

    // 创建要插入的子元素
    let childElement = document.createElement("span");
    this.thisElement = childElement;
    childElement.setAttribute(`id`, `${this.id}`);
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
