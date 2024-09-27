import { settings } from "@/settings";
import { plugin } from "@/utils";
export default class AdjustTitleLevel {
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "调整标题",
      submenu: Array.from({ length: 8 }, (v, i) => i + 1).map((originNum) => {
        return {
          iconHTML: "",
          label: `调整 H${originNum} 为`,
          submenu: Array.from({ length: 8 }, (v, i) => i + 1)
            .filter((toNum) => toNum !== originNum)
            .map((toNum) => {
              return {
                iconHTML: "",
                label: `H${toNum}`,
                click: () => {
                  this.adjustOriginTitleTo(
                    detail,
                    `h${originNum}`,
                    `h${toNum}`
                  );
                },
              };
            }),
        };
      }),
    });
  }

  public blockIconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "调整标题",
      submenu: Array.from({ length: 8 }, (v, i) => i + 1).map((num) => {
        return {
          iconHTML: "",
          label: `调整为 H${num}`,
          click: () => {
            this.adjustTitle(detail, `h${num}`);
          },
        };
      }),
    });
  }

  private adjustTitle(detail, toTitleLevel) {
    const doOperations: IOperation[] = [];

    detail.blockElements
      .filter((item) => {
        return item.getAttribute("data-type") === "NodeHeading";
      })
      .forEach((editElement: HTMLElement) => {
        editElement.setAttribute("data-subtype", toTitleLevel);
        editElement.setAttribute("class", toTitleLevel);

        doOperations.push({
          id: editElement.dataset.nodeId,
          data: editElement.outerHTML,
          action: "update",
        });
      });

    doOperations.length > 0 &&
      detail.protyle.getInstance().transaction(doOperations);
  }

  private adjustOriginTitleTo(detail, originTitleLevel, toTitleLevel) {
    const doOperations: IOperation[] = [];

    const editElements = detail.protyle.wysiwyg.element.querySelectorAll(
      `[data-type="NodeHeading"][data-subtype="${originTitleLevel}"]`
    );

    editElements.forEach((item: HTMLElement) => {
      item.setAttribute("data-subtype", toTitleLevel);
      item.setAttribute("class", toTitleLevel);

      doOperations.push({
        id: item.dataset.nodeId,
        data: item.outerHTML,
        action: "update",
      });
    });

    doOperations.length > 0 &&
      detail.protyle.getInstance().transaction(doOperations);
  }
}
