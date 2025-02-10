import { request, sql } from "@/api";
export default class AdjustTitleLevel {
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  maxTitleLevel = 6;

  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "调整所有标题",
      submenu: [
        {
          iconHTML: "",
          label: `调整所有标题为`,
          submenu: Array.from(
            { length: this.maxTitleLevel },
            (v, i) => i + 1
          ).map((num) => {
            return {
              iconHTML: "",
              label: `H${num}`,
              click: () => {
                Array.from(
                  { length: this.maxTitleLevel },
                  (v, i) => i + 1
                ).forEach(async (index) => {
                  await this.adjustOriginTitleTo(
                    detail,
                    `${index}`,
                    `${num}`,
                    false
                  );
                });
              },
            };
          }),
        },
        ...Array.from({ length: this.maxTitleLevel }, (v, i) => i + 1).map(
          (originNum) => {
            return {
              iconHTML: "",
              label: `调整 H${originNum} 为`,
              submenu: Array.from(
                { length: this.maxTitleLevel },
                (v, i) => i + 1
              )
                .filter((toNum) => toNum !== originNum)
                .map((toNum) => {
                  return {
                    iconHTML: "",
                    label: `H${toNum}`,
                    click: () => {
                      this.adjustOriginTitleTo(
                        detail,
                        `${originNum}`,
                        `${toNum}`,
                        false
                      );
                    },
                  };
                }),
            };
          }
        ),
      ],
    });

    detail.menu.addItem({
      iconHTML: "",
      label: "调整所有标题（带子标题）",
      submenu: [
        // {
        //   iconHTML: "",
        //   label: `调整所有标题为`,
        //   submenu: Array.from(
        //     { length: this.maxTitleLevel },
        //     (v, i) => i + 1
        //   ).map((num) => {
        //     return {
        //       iconHTML: "",
        //       label: `H${num}`,
        //       click: () => {
        //         Array.from(
        //           { length: this.maxTitleLevel },
        //           (v, i) => i + 1
        //         ).forEach(async (index) => {
        //           await this.adjustOriginTitleTo(detail, `${index}`, `${num}`);
        //         });
        //       },
        //     };
        //   }),
        // },
        ...Array.from({ length: this.maxTitleLevel }, (v, i) => i + 1).map(
          (originNum) => {
            return {
              iconHTML: "",
              label: `调整 H${originNum} 为`,
              submenu: Array.from(
                { length: this.maxTitleLevel },
                (v, i) => i + 1
              )
                .filter((toNum) => toNum !== originNum)
                .map((toNum) => {
                  return {
                    iconHTML: "",
                    label: `H${toNum}`,
                    click: () => {
                      this.adjustOriginTitleTo(
                        detail,
                        `${originNum}`,
                        `${toNum}`,
                        true
                      );
                    },
                  };
                }),
            };
          }
        ),
      ],
    });
  }

  public blockIconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "调整标题",
      submenu: Array.from({ length: this.maxTitleLevel }, (v, i) => i + 1).map(
        (num) => {
          return {
            iconHTML: "",
            label: `调整为 H${num}`,
            click: () => {
              this.adjustTitle(detail, `h${num}`);
            },
          };
        }
      ),
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

  private async adjustOriginTitleTo(
    detail,
    originTitleLevel,
    toTitleLevel,
    includeSub = true
  ) {
    let res = await sql(
      `select id from blocks where root_id = '${detail.data.rootID}' and subtype = 'h${originTitleLevel}'`
    );

    const doOperations: IOperation[] = [];
    const undoOperations: IOperation[] = [];
    for (const item of res) {
      const response = await request("/api/block/getHeadingLevelTransaction", {
        id: item.id,
        level: Number(toTitleLevel),
      });

      response.doOperations.forEach((operation: IOperation, index: number) => {
        detail.protyle.wysiwyg.element
          .querySelectorAll(`[data-node-id="${operation.id}"]`)
          .forEach((itemElement: HTMLElement) => {
            itemElement.outerHTML = operation.data;
          });
      });
      if (includeSub) {
        doOperations.push(...response.doOperations);
        undoOperations.push(...response.undoOperations);
      } else {
        doOperations.push(response.doOperations[0]);
        undoOperations.push(response.undoOperations[0]);
      }
    }

    doOperations.length > 0 &&
      detail.protyle.getInstance().transaction(doOperations, undoOperations);

    await request("/api/outline/getDocOutline", {
      id: detail.data.rootID,
      preview: false,
    });
  }

  private adjustOriginTitleToByDom(detail, originTitleLevel, toTitleLevel) {
    const doOperations: IOperation[] = [];

    const editElements = detail.protyle.wysiwyg.element.querySelectorAll(
      `[data-type="NodeHeading"][data-subtype="h${originTitleLevel}"]`
    );

    editElements.forEach((item: HTMLElement) => {
      item.setAttribute("data-subtype", `h${toTitleLevel}`);
      item.setAttribute("class", `h${toTitleLevel}`);

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
