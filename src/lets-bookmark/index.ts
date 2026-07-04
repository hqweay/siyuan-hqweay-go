import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { SubPluginBase } from "@/libs/sub-plugin-base";
import { IOperation } from "siyuan";

export default class Bookmark extends SubPluginBase {
  override onload(): void {}
  override onunload(): void {}
  regexOfHighLight = /==([^=]+)==/;

  private async addTo({ detail, bookmarkName }) {
    const doOperations: IOperation[] = [];

    detail.blockElements.forEach((item: HTMLElement) => {
      item.setAttribute("bookmark", bookmarkName);

      doOperations.push({
        id: item.dataset.nodeId,
        data: item.outerHTML,
        action: "update",
      });
    });

    detail.protyle.getInstance().transaction(doOperations);
  }
  public blockIconEvent({ detail }) {
    const items = settings.getBySpace("quick-bookmark", "items");

    if (!items || items.length <= 0) {
      return;
    }
    const bookNames = items.split("\n");

    detail.menu.addItem({
      iconHTML: "",
      label: this.t("lets-bookmark.addToBookmark"),
      click: () => {
        this.addTo({ detail, bookmarkName: bookNames[0] });
      },
      submenu: bookNames.map((ele) => {
        return {
          iconHTML: "",
          label: `${ele}`,
          click: () => {
            this.addTo({ detail, bookmarkName: ele });
          },
        };
      }),
    });
  }
}
