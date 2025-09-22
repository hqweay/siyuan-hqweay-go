import InsertCSS from "@/myscripts/insertCSS";
import { settings } from "@/settings";

export default class Memo extends InsertCSS {
  id = "snippetCSS-hqweay-memo";

  onload() {
    const dataID = settings.getBySpace("memoConfig", "id");

    const ids = dataID.trim().split("\n");
    let result = ``;

    if (ids.length <= 0) {
      return;
    }

    for (const id of ids) {
      result += `span[data-id="${id}"], `;
    }

    result = result.substring(0, result.length - 2);

    let styleElement = document.createElement("style");
    styleElement.id = this.id;
    styleElement.textContent = `
div[data-type="NodeListItem"]:has(${result}) div[data-type="NodeListItem"]::after {
  content: attr(data-node-id);
  width: 84px;
  white-space:nowrap;
overflow: hidden;
  position: absolute;
  top: -5px;
  right: 0;

  font-size: 10px;
  color: #333;
  border-bottom-left-radius: 2px;
}

.protyle-background__img img::before {
  /* 图片加载失败时默认展示 content: url(img link) */
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background-image: inherit;
}


`;

    const activeDoc = settings.getBySpace("memoConfig", "activeDoc");

    if (activeDoc) {
      let docResult = ``;
      for (const id of ids) {
        docResult += `div[data-node-id="${id}"], `;
      }
      docResult = docResult.substring(0, docResult.length - 2);
      styleElement.textContent += `
div[class="protyle-content protyle-content--transition"]:has(${docResult}) div[data-type="NodeListItem"]::after {
  content: attr(data-node-id);
  width: 84px;
  white-space:nowrap;
overflow: hidden;
  position: absolute;
  top: -5px;
  right: 0;

  font-size: 10px;
  color: #333;
  border-bottom-left-radius: 2px;
}`;
    }
    document.head.appendChild(styleElement);
  }
}
