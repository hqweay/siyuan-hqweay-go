// export default AddIconThenClick;

export default class AddIconThenClick {
  id: string = "";
  label: string = "";
  icon: string = "";
  type: string = "barMode";

  thisElement;

  onunload() {
    this.thisElement && this.thisElement.remove();
  }

  onload() {
    if (document.getElementById(this.id) || this.thisElement) {
      return;
    }
    this.addIconThenClick();
  }

  exec() {}

  addIconThenClick() {
    if (document.getElementById(this.id)) {
      return;
    }
    console.log("addIconThenClick", this.id, this.label, this.icon, this.type);
    if ("barMode" === this.type) {
      // 添加一个按钮
      this.addBarMode();
    } else {
      this.addIcon();
    }
  }

  addIcon;

  private addDockLeft() {}

  private addBarMode() {
    console.log("addBarMode");
    const barMode = document.getElementById("barMode");
    console.log("barMode", barMode);
    if (!barMode) {
      return;
    }
    barMode.insertAdjacentHTML(
      "beforebegin",
      `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="${this.label}" ></div>`
    );
    const btn = document.getElementById(`${this.id}`);
    this.thisElement = btn;
    btn.style.width = "auto";
    btn.innerHTML = this.icon;
    btn.addEventListener(
      "click",
      (e) => {
        this.exec();
        e.stopPropagation();
        e.preventDefault();
      },
      true
    );
  }
}
