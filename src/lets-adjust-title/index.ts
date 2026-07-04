import { request, sql } from "@/api";
import { SubPluginBase } from "@/libs/sub-plugin-base";
import { IOperation, showMessage } from "siyuan";
export default class AdjustTitleLevel extends SubPluginBase {
  override onload(): void {}
  override onunload(): void {}

  availableBlocks = ["NodeParagraph", "NodeHeading"];

  maxTitleLevel = 6;

  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: this.t("lets-adjust-title.adjustAllHeadings"),
      submenu: [
        {
          iconHTML: "",
          label: this.t("lets-adjust-title.adjustAllHeadingsTo"),
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
              label: this.t("lets-adjust-title.adjustHTo").replace("{originNum}", String(originNum)),
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
      label: this.t("lets-adjust-title.adjustAllHeadingsWithSub"),
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
              label: this.t("lets-adjust-title.adjustHTo").replace("{originNum}", String(originNum)),
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
      label: this.t("lets-adjust-title.adjustHeading"),
      submenu: Array.from({ length: this.maxTitleLevel }, (v, i) => i + 1).map(
        (num) => {
          return {
            iconHTML: "",
            label: this.t("lets-adjust-title.adjustToH").replace("{num}", String(num)),
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
    showMessage(this.t("lets-adjust-title.adjusting"));
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

      if (includeSub) {
        response.doOperations.forEach(
          (operation: IOperation, index: number) => {
            detail.protyle.wysiwyg.element
              .querySelectorAll(`[data-node-id="${operation.id}"]`)
              .forEach((itemElement: HTMLElement) => {
                itemElement.outerHTML = operation.data;
              });
          }
        );
        doOperations.push(...response.doOperations);
        undoOperations.push(...response.undoOperations);
      } else {
        detail.protyle.wysiwyg.element
          .querySelectorAll(`[data-node-id="${response.doOperations[0].id}"]`)
          .forEach((itemElement: HTMLElement) => {
            itemElement.outerHTML = response.doOperations[0].data;
          });

        doOperations.push(response.doOperations[0]);
        undoOperations.push(response.undoOperations[0]);
      }
    }

    doOperations.length > 0 &&
      detail.protyle.getInstance().transaction(doOperations, undoOperations);

    doOperations.length > 0 &&
      (await request("/api/outline/getDocOutline", {
        id: detail.data.rootID,
        preview: false,
      }));
    showMessage(this.t("lets-adjust-title.done"));
  }
}
