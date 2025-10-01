import { settings } from "@/settings";
import { plugin } from "@/utils";
import { IOperation } from "siyuan";

export default class HrefToRef {
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  cleanRef({ detail, exec }) {
    const doOperations: IOperation[] = [];

    const editElements = detail.protyle.wysiwyg.element.querySelectorAll(
      this.availableBlocks
        .map((item) => {
          return `[data-type=${item}] [contenteditable="true"]`;
        })
        .join(",")
    );
    editElements.forEach((item: HTMLElement) => {
      let count = 0;
      item
        // 只获取笔记内部的引用
        .querySelectorAll('[data-type="block-ref"]')
        .forEach((ele) => {
          // console.log(ele);
          if (exec(ele)) {
            ele.remove();
            count++;
          }
        });
      count > 0 &&
        doOperations.push({
          id: item.parentElement.dataset.nodeId,
          data: item.parentElement.outerHTML,
          action: "update",
        });
    });

    doOperations.length != 0 &&
      detail.protyle.getInstance().transaction(doOperations);
  }

  covertSubMenu = [
    {
      key: "标题块中",
      availableBlocks: ["NodeHeading"],
    },
    {
      key: "段落块中",
      availableBlocks: ["NodeParagraph"],
    },
    {
      key: "以上所有块中",
      availableBlocks: ["NodeParagraph", "NodeHeading"],
    },
  ];

  public onload() {
    //太多了，添加好麻烦，算了
    // 添加全局快捷键命令
    // plugin.addCommand({
    //   langKey: "openQuickInput",
    //   hotkey: "F10", // 默认使用F10快捷键
    //   editorCallback: (protyle: IProtyle) => {},
    // });
  }

  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "🧹",
      label: plugin.i18n.cleanRefSelf,
      click: () => {
        const doOperations: IOperation[] = [];

        const docID = document
          .querySelector(
            ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
          )
          ?.getAttribute("data-node-id");

        const editElements = detail.protyle.wysiwyg.element.querySelectorAll(
          this.availableBlocks
            .map((item) => {
              return `[data-type=${item}] [contenteditable="true"]`;
            })
            .join(",")
        );

        editElements.forEach((editElement: HTMLElement) => {
          let count = 0;
          editElement
            // 只获取笔记内部的引用
            .querySelectorAll('[data-type="block-ref"]')
            .forEach((ele) => {
              // console.log(ele);
              if (ele.getAttribute("data-id") === docID) {
                // 往父级遍历，找到第一个 data-type="NodeList" 的元素
                let parentElement = ele.parentElement;
                ele.remove();
                count++;

                if (parentElement && parentElement.textContent.trim() !== "") {
                  return;
                }

                let maxDepth = 9;
                let currentDepth = 0;

                while (
                  parentElement &&
                  parentElement !== document.body &&
                  currentDepth < maxDepth
                ) {
                  const dataType = parentElement.getAttribute("data-type");

                  if (dataType === "NodeList") {
                    // 找到所有 NodeListItem 子元素
                    const nodeListItems = Array.from(
                      parentElement.children
                    ).filter(
                      (child) =>
                        child.getAttribute("data-type") === "NodeListItem"
                    );

                    // 处理每个 NodeListItem
                    nodeListItems.forEach((nodeListItem) => {
                      // 找到 NodeListItem 下的所有 NodeList 子元素
                      const nestedNodeLists = Array.from(
                        nodeListItem.children
                      ).filter(
                        (child) =>
                          child.getAttribute("data-type") === "NodeList"
                      );

                      // 将每个嵌套子列表 的 NodeList 的内容移出来
                      nestedNodeLists.forEach((nestedNodeList) => {
                        parentElement.parentElement.appendChild(nestedNodeList);
                      });
                    });

                    parentElement.remove();
                    break;
                  }
                  parentElement = parentElement.parentElement;
                  currentDepth++;
                }
              }
            });
          count > 0 &&
            doOperations.push({
              id: editElement.parentElement.dataset.nodeId,
              data: editElement.parentElement.outerHTML,
              action: "update",
            });
        });

        doOperations.length != 0 &&
          detail.protyle.getInstance().transaction(doOperations);
      },
    });

    detail.menu.addItem({
      iconHTML: "",
      label: "清理文档的 * 引用",
      click: () => {
        this.cleanRef({
          detail,
          exec: (ele) => {
            return ele.textContent === "*";
          },
        });
      },
    });

    detail.menu.addItem({
      iconHTML: "",
      label: plugin.i18n.convertMenu,
      submenu: this.covertSubMenu.map((menuItem) => {
        return {
          iconHTML: "",
          label: `${menuItem.key}`,
          submenu: [
            {
              iconHTML: "",
              label: plugin.i18n.wikiToLink,
              click: () => {
                // console.log(menuItem);
                // console.log(this);
                const doOperations: IOperation[] = [];
                const editElements =
                  detail.protyle.wysiwyg.element.querySelectorAll(
                    menuItem.availableBlocks
                      .map((item) => {
                        return `[data-type=${item}] [contenteditable="true"]`;
                      })
                      .join(",")
                  );

                editElements.forEach((item: HTMLElement) => {
                  let count = 0;
                  // data-type~="block-ref" 模糊匹配
                  item
                    .querySelectorAll("[data-type=block-ref]")
                    .forEach((ele) => {
                      ele.setAttribute("data-type", "a");
                      // 去除 subtype 属性是因为官方的 转换为链接 会这么做
                      ele.removeAttribute("data-subtype");
                      ele.setAttribute(
                        "data-href",
                        `siyuan://blocks/${ele.getAttribute("data-id")}`
                      );
                      ele.removeAttribute("data-id");
                      count++;
                    });
                  count > 0 &&
                    doOperations.push({
                      id: item.parentElement.dataset.nodeId,
                      data: item.parentElement.outerHTML,
                      action: "update",
                    });
                });

                detail.protyle.getInstance().transaction(doOperations);
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.linkToWiki,
              click: () => {
                const doOperations: IOperation[] = [];

                const editElements =
                  detail.protyle.wysiwyg.element.querySelectorAll(
                    menuItem.availableBlocks
                      .map((item) => {
                        return `[data-type=${item}] [contenteditable="true"]`;
                      })
                      .join(",")
                  );

                editElements.forEach((item: HTMLElement) => {
                  // data-type~="block-ref" 模糊匹配

                  let count = 0;
                  item
                    .querySelectorAll('[data-type=a][data-href^="siyuan://"]')
                    .forEach((ele) => {
                      ele.setAttribute("data-type", "block-ref");
                      // 增加 subtype 属性是因为官方的 链接转引用 会这么添加一个属性：s
                      ele.setAttribute("data-subtype", `s`);
                      ele.setAttribute(
                        "data-id",
                        `${ele
                          .getAttribute("data-href")
                          .replace("siyuan://blocks/", "")}`
                      );
                      ele.removeAttribute("data-href");
                      count++;
                    });
                  count > 0 &&
                    doOperations.push({
                      id: item.parentElement.dataset.nodeId,
                      data: item.parentElement.outerHTML,
                      action: "update",
                    });
                });

                detail.protyle.getInstance().transaction(doOperations);
              },
            },
            {
              iconHTML: "",
              label: "下列所有行内元素👉文本",
              click: () => {
                this.pageToText(menuItem, detail, '[data-type~="a"]');
                this.pageToText(menuItem, detail, '[data-type~="block-ref"]');
                this.pageToText(menuItem, detail, '[data-type~="strong"]');
                this.pageToText(menuItem, detail, '[data-type~="mark"]');
                this.pageToText(menuItem, detail, '[data-type~="tag"]');
                this.pageToText(menuItem, detail, '[data-type~="em"]');
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.hrefToText,
              click: () => {
                // 获取引用和笔记内块超链接
                this.pageToText(
                  menuItem,
                  detail,
                  '[data-type~="a"][data-href^="siyuan://"]'
                );
                this.pageToText(menuItem, detail, '[data-type~="block-ref"]');
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.hrefToTextIncludeA,
              click: () => {
                // 获取引用和笔记内链接
                // @todo data-type="a" 使用全匹配，避免 [data-type="a strong"] 这类情况转换后失去样式
                this.pageToText(menuItem, detail, '[data-type~="a"]');
                this.pageToText(menuItem, detail, '[data-type~="block-ref"]');
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.strongToText,
              click: () => {
                // 获取粗体
                // @todo data-type="strong" 使用全匹配，避免 [data-type="a strong"] 这类情况转换后失去样式
                this.pageToText(menuItem, detail, '[data-type~="strong"]');
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.markToText,
              click: () => {
                // 获取高亮
                // @todo data-type="mark" 使用全匹配，避免 [data-type="a mark"] 这类情况转换后失去样式
                this.pageToText(menuItem, detail, '[data-type~="mark"]');
              },
            },
            {
              iconHTML: "",
              label: plugin.i18n.tagToText,
              click: () => {
                this.pageToText(menuItem, detail, '[data-type~="tag"]');
              },
            },
            {
              iconHTML: "",
              label: "斜体👉文本",
              click: () => {
                this.pageToText(menuItem, detail, '[data-type~="em"]');
              },
            },
          ],
        };
      }),
    });
  }

  public blockIconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: plugin.i18n.convertMenu,
      submenu: [
        {
          iconHTML: "",
          label: plugin.i18n.wikiToLink,
          click: () => {
            const doOperations: IOperation[] = [];

            detail.blockElements.forEach((item: HTMLElement) => {
              const editElements = item.querySelectorAll(
                this.availableBlocks
                  .map((item) => {
                    return `[data-type=${item}] [contenteditable="true"]`;
                  })
                  .join(",")
              );

              editElements.forEach((editElement: HTMLElement) => {
                //data-type 从 block-ref 转为 a
                editElement
                  // data-type~="block-ref" 模糊匹配
                  .querySelectorAll("[data-type=block-ref]")
                  .forEach((ele) => {
                    ele.setAttribute("data-type", "a");
                    // 去除 subtype 属性是因为官方的 转换为链接 会这么做
                    ele.removeAttribute("data-subtype");
                    ele.setAttribute(
                      "data-href",
                      `siyuan://blocks/${ele.getAttribute("data-id")}`
                    );
                    ele.removeAttribute("data-id");
                  });
              });
              doOperations.push({
                id: item.dataset.nodeId,
                data: item.outerHTML,
                action: "update",
              });
            });
            detail.protyle.getInstance().transaction(doOperations);
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.linkToWiki,
          click: () => {
            const doOperations: IOperation[] = [];

            detail.blockElements.forEach((item: HTMLElement) => {
              const editElements = item.querySelectorAll(
                this.availableBlocks
                  .map((item) => {
                    return `[data-type=${item}] [contenteditable="true"]`;
                  })
                  .join(",")
              );

              editElements.forEach((editElement: HTMLElement) => {
                //data-type 从 a 转为 block-ref
                editElement
                  // 只获取笔记内部的单向链接
                  .querySelectorAll('[data-type=a][data-href^="siyuan://"]')
                  .forEach((ele) => {
                    ele.setAttribute("data-type", "block-ref");
                    // 增加 subtype 属性是因为官方的 链接转引用 会这么添加一个属性：s
                    ele.setAttribute("data-subtype", `s`);
                    ele.setAttribute(
                      "data-id",
                      `${ele
                        .getAttribute("data-href")
                        .replace("siyuan://blocks/", "")}`
                    );
                    ele.removeAttribute("data-href");
                  });
              });
              doOperations.push({
                id: item.dataset.nodeId,
                data: item.outerHTML,
                action: "update",
              });
            });
            detail.protyle.getInstance().transaction(doOperations);
          },
        },
        {
          iconHTML: "",
          label: "下列所有行内元素👉文本",
          click: () => {
            this.blockToText(detail, '[data-type~="a"]');
            this.blockToText(detail, '[data-type~="block-ref"]');
            this.blockToText(detail, '[data-type~="strong"]');
            this.blockToText(detail, '[data-type~="mark"]');
            this.blockToText(detail, '[data-type~="tag"]');
            this.blockToText(detail, '[data-type~="em"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.hrefToText,
          click: () => {
            // 获取引用和笔记内块超链接
            this.blockToText(
              detail,
              '[data-type~="a"][data-href^="siyuan://"]'
            );
            this.blockToText(detail, '[data-type~="block-ref"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.hrefToTextIncludeA,
          click: () => {
            // 获取引用和笔记内链接
            // @todo data-type="a" 使用全匹配，避免 [data-type="a strong"] 这类情况转换后失去样式
            this.blockToText(detail, '[data-type~="a"]');
            this.blockToText(detail, '[data-type~="block-ref"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.strongToText,
          click: () => {
            // @todo data-type="strong" 使用全匹配，避免 [data-type="a strong"] 这类情况转换后失去样式
            this.blockToText(detail, '[data-type~="strong"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.markToText,
          click: () => {
            // @todo data-type="mark" 使用全匹配，避免 [data-type="a mark"] 这类情况转换后失去样式
            this.blockToText(detail, '[data-type~="mark"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.tagToText,
          click: () => {
            this.blockToText(detail, '[data-type~="tag"]');
          },
        },
        {
          iconHTML: "",
          label: "斜体👉文本",
          click: () => {
            this.blockToText(detail, '[data-type~="em"]');
          },
        },
        {
          iconHTML: "",
          label: plugin.i18n.cleanRefSelf,
          click: () => {
            const doOperations: IOperation[] = [];

            const docID = document
              .querySelector(
                ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
              )
              ?.getAttribute("data-node-id");
            detail.blockElements.forEach((item: HTMLElement) => {
              const editElements = item.querySelectorAll(
                this.availableBlocks
                  .map((item) => {
                    return `[data-type=${item}] [contenteditable="true"]`;
                  })
                  .join(",")
              );

              editElements.forEach((editElement: HTMLElement) => {
                editElement
                  // 只获取笔记内部的引用
                  .querySelectorAll('[data-type="block-ref"]')
                  .forEach((ele) => {
                    // console.log(ele);
                    if (ele.getAttribute("data-id") === docID) {
                      let parentElement = ele.parentElement;
                      ele.remove();

                      if (
                        parentElement &&
                        parentElement.textContent.trim() !== ""
                      ) {
                        return;
                      }
                      let maxDepth = 9;
                      let currentDepth = 0;

                      while (
                        parentElement &&
                        parentElement !== document.body &&
                        currentDepth < maxDepth
                      ) {
                        const dataType =
                          parentElement.getAttribute("data-type");

                        if (dataType === "NodeList") {
                          // 找到所有 NodeListItem 子元素
                          const nodeListItems = Array.from(
                            parentElement.children
                          ).filter(
                            (child) =>
                              child.getAttribute("data-type") === "NodeListItem"
                          );

                          // 处理每个 NodeListItem
                          nodeListItems.forEach((nodeListItem) => {
                            // 找到 NodeListItem 下的所有 NodeList 子元素
                            const nestedNodeLists = Array.from(
                              nodeListItem.children
                            ).filter(
                              (child) =>
                                child.getAttribute("data-type") === "NodeList"
                            );

                            // 将每个嵌套子列表 的 NodeList 的内容移出来
                            nestedNodeLists.forEach((nestedNodeList) => {
                              parentElement.parentElement.appendChild(
                                nestedNodeList
                              );
                            });
                          });

                          parentElement.remove();
                          break;
                        }
                        parentElement = parentElement.parentElement;
                        currentDepth++;
                      }
                    }
                  });
              });
              doOperations.push({
                id: item.dataset.nodeId,
                data: item.outerHTML,
                action: "update",
              });
            });
            detail.protyle.getInstance().transaction(doOperations);
          },
        },
        {
          iconHTML: "",
          label: "清理 * 引用",
          click: () => {
            const doOperations: IOperation[] = [];

            detail.blockElements.forEach((item: HTMLElement) => {
              const editElements = item.querySelectorAll(
                this.availableBlocks
                  .map((item) => {
                    return `[data-type=${item}] [contenteditable="true"]`;
                  })
                  .join(",")
              );

              editElements.forEach((editElement: HTMLElement) => {
                editElement
                  // 只获取笔记内部的引用
                  .querySelectorAll('[data-type="block-ref"]')
                  .forEach((ele) => {
                    // console.log(ele);
                    if (ele.textContent == "*") {
                      ele.remove();
                    }
                  });
              });
              doOperations.push({
                id: item.dataset.nodeId,
                data: item.outerHTML,
                action: "update",
              });
            });
            detail.protyle.getInstance().transaction(doOperations);
          },
        },
      ],
    });
  }

  private blockToText(detail, querySelectorAllStr) {
    const doOperations: IOperation[] = [];

    const styleNesting = settings.getBySpace("convertConfig", "styleNesting");

    // 现在这样写理论上数组只会有一个元素
    const extractedElements = [];
    if (styleNesting) {
      const pattern = /\[data-type~="([^"]+)"\]/g;

      let match;
      while ((match = pattern.exec(querySelectorAllStr)) !== null) {
        extractedElements.push(match[1]);
      }
    }

    detail.blockElements.forEach((item: HTMLElement) => {
      const editElements = item.querySelectorAll(
        this.availableBlocks
          .map((item) => {
            return `[data-type=${item}] [contenteditable="true"]`;
          })
          .join(",")
      );

      editElements.forEach((editElement: HTMLElement) => {
        editElement.querySelectorAll(querySelectorAllStr).forEach((ele) => {
          const currentType = ele.getAttribute("data-type");
          //非嵌套样式，直接取消
          if (currentType.trim().split(" ").length === 1) {
            const textNode = document.createTextNode(ele.textContent);
            ele.parentNode.replaceChild(textNode, ele);
          } else {
            if (styleNesting) {
              const updatedType = currentType.replace(extractedElements[0], "");
              if (updatedType.trim() === "") {
                ele.removeAttribute("data-type");
              } else {
                ele.setAttribute("data-type", updatedType);
              }
              //非嵌套样式，直接取消
            } else {
              return;
            }
          }
        });
      });
      doOperations.push({
        id: item.dataset.nodeId,
        data: item.outerHTML,
        action: "update",
      });
    });
    detail.protyle.getInstance().transaction(doOperations);
  }

  private pageToText(menuItem, detail, querySelectorAllStr) {
    const doOperations: IOperation[] = [];

    const styleNesting = settings.getBySpace("convertConfig", "styleNesting");

    // 现在这样写理论上数组只会有一个元素：需要清理的元素
    const extractedElements = [];
    if (styleNesting) {
      const pattern = /\[data-type~="([^"]+)"\]/g;

      let match;
      while ((match = pattern.exec(querySelectorAllStr)) !== null) {
        extractedElements.push(match[1]);
      }
    }

    const editElements = detail.protyle.wysiwyg.element.querySelectorAll(
      menuItem.availableBlocks
        .map((item) => {
          return `[data-type=${item}] [contenteditable="true"]`;
        })
        .join(",")
    );
    editElements.forEach((item: HTMLElement) => {
      let count = 0;
      item.querySelectorAll(querySelectorAllStr).forEach((ele) => {
        //获取当前文本的元素
        const currentType = ele.getAttribute("data-type");

        //若只有一种元素 直接清理
        if (currentType.trim().split(" ").length === 1) {
          const textNode = document.createTextNode(ele.textContent);
          ele.parentNode.replaceChild(textNode, ele);
        } else {
          //若有多种元素且开启嵌套元素清理，则清理该元素
          if (styleNesting) {
            const updatedType = currentType.replace(extractedElements[0], "");
            if (updatedType.trim() === "") {
              ele.removeAttribute("data-type");
            } else {
              ele.setAttribute("data-type", updatedType);
            }
            //否则，不对该文本进行处理
          } else {
            return;
          }
        }
        count++;
      });
      count > 0 &&
        doOperations.push({
          id: item.parentElement.dataset.nodeId,
          data: item.parentElement.outerHTML,
          action: "update",
        });
    });

    detail.protyle.getInstance().transaction(doOperations);
  }
}
