import { Plugin, showMessage, confirm, fetchSyncPost, fetchPost } from "siyuan";

import { formatUtil } from "./utils";

import { plugin } from "@/utils";
import { settings } from "@/settings";

import AddIconThenClick from "@/myscripts/addIconThenClick";

export default class TypographyGo extends AddIconThenClick {
  id = "hqweay-format-note";
  label = "格式化文本";
  icon = `<svg t="1711874745467" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1408" width="32" height="32"><path d="M28.668 367.46H114.8v36H28.668z" fill="#4A4A4A" p-id="1409"></path><path d="M904.944 637.676c0 72.088-58.976 131.068-131.064 131.068H245.864c-72.088 0-131.068-58.976-131.068-131.068V186.984c0-72.088 58.98-131.068 131.068-131.068h528.02c72.084 0 131.064 58.98 131.064 131.068v450.692z" fill="#B9B9BF" p-id="1410"></path><path d="M773.884 786.744H245.864c-82.196 0-149.068-66.868-149.068-149.068V186.984c0-82.196 66.872-149.068 149.068-149.068h528.02c82.196 0 149.072 66.872 149.072 149.068v450.692c-0.012 82.2-66.876 149.068-149.072 149.068zM245.864 73.916c-62.344 0-113.068 50.724-113.068 113.068v450.692c0 62.344 50.724 113.068 113.068 113.068h528.02c62.344 0 113.072-50.724 113.072-113.068V186.984c0-62.344-50.728-113.068-113.072-113.068H245.864z" fill="#4A4A4A" p-id="1411"></path><path d="M337.612 292.892m-121.704 0a121.704 121.704 0 1 0 243.408 0 121.704 121.704 0 1 0-243.408 0Z" fill="#94E5FF" p-id="1412"></path><path d="M337.612 432.596c-77.032 0-139.704-62.672-139.704-139.708 0-77.032 62.672-139.704 139.704-139.704 77.036 0 139.708 62.672 139.708 139.704 0 77.036-62.672 139.708-139.708 139.708z m0-243.412c-57.184 0-103.704 46.52-103.704 103.704s46.52 103.708 103.704 103.708c57.184 0 103.708-46.524 103.708-103.708S394.796 189.184 337.612 189.184z" fill="#4A4A4A" p-id="1413"></path><path d="M683.548 292.892m-121.704 0a121.704 121.704 0 1 0 243.408 0 121.704 121.704 0 1 0-243.408 0Z" fill="#94E5FF" p-id="1414"></path><path d="M683.548 432.596c-77.036 0-139.708-62.672-139.708-139.708 0-77.032 62.672-139.704 139.708-139.704 77.032 0 139.704 62.672 139.704 139.704 0 77.036-62.672 139.708-139.704 139.708z m0-243.412c-57.188 0-103.708 46.52-103.708 103.704s46.52 103.708 103.708 103.708c57.18 0 103.704-46.524 103.704-103.708s-46.524-103.704-103.704-103.704zM901.204 367.46h86.128v36h-86.128z" fill="#4A4A4A" p-id="1415"></path><path d="M396.168 986.668v-217.924h220.94v217.924" fill="#8A8A8A" p-id="1416"></path><path d="M337.612 546.484h345.936v104.856H337.612z" fill="#8A8A8A" p-id="1417"></path><path d="M683.548 669.34H337.612a18 18 0 0 1-18-18v-104.856c0-9.936 8.06-18 18-18h345.936c9.936 0 18 8.064 18 18v104.856c0 9.94-8.064 18-18 18z m-327.936-36h309.936v-68.856H355.612v68.856z" fill="#4A4A4A" p-id="1418"></path><path d="M575.408 669.34a18.004 18.004 0 0 1-18-18v-104.856a18.004 18.004 0 0 1 36 0v104.856a18 18 0 0 1-18 18zM448.084 669.34a18 18 0 0 1-18-18v-104.856a18.004 18.004 0 0 1 36 0v104.856a18 18 0 0 1-18 18zM396.168 822.928h220.94v36H396.168zM396.168 895.512h220.94v36H396.168z" fill="#4A4A4A" p-id="1419"></path><path d="M338 298m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z" fill="#4A4A4A" p-id="1420"></path><path d="M683.548 298m-32 0a32 32 0 1 0 64 0 32 32 0 1 0-64 0Z" fill="#4A4A4A" p-id="1421"></path></svg>`;

  // availableBlocks = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9"];
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  public blockIconEvent({ detail }: any) {
    detail.menu.addItem({
      iconHTML: "",
      // label: plugin.i18n.removeSpace,
      label: plugin.i18n.formatContent,
      click: () => {
        const doOperations: IOperation[] = [];

        // console.log(detail.blockElements);
        detail.blockElements.forEach((item: HTMLElement) => {
          const editElements = item.querySelectorAll(
            this.availableBlocks
              .map((item) => {
                return `[data-type=${item}] [contenteditable="true"]`;
              })
              .join(",")
          );

          editElements.forEach((editElement: HTMLElement) => {
            if (!editElement) {
              return;
            }

            // 检查是否有元素子节点，忽略虚拟引用
            const hasElementChildren = Array.from(editElement.childNodes).some(
              (node) =>
                node.nodeType === Node.ELEMENT_NODE &&
                (node as HTMLElement).getAttribute("data-type") !==
                  "virtual-block-ref"
            );

            if (hasElementChildren) {
              //只更新纯文本内容，不更新代码块之类的行内元素
              //思源笔记编辑文本时会将文本当作多个文本块插入，因此这里的 childNotes 会有多个
              // 你"好"吗？——像这样的文本可能会因为引号被当做单独的文本，因此格式化失败
              editElement.childNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  let formatContent = formatUtil.formatContent(
                    node.textContent
                  );
                  //若内容未变更，不更新
                  if (formatContent == node.textContent) {
                    return;
                  }
                  node.textContent = formatContent;
                }
              });
            } else {
              let formatContent = formatUtil.formatContent(
                editElement.textContent
              );
              //若内容未变更，不更新
              if (formatContent == editElement.textContent) {
                return;
              }
              editElement.textContent = formatContent;
            }

            //todo 清理空行有 bug
            if (!editElement.innerText.trim()) {
              // editElement.remove();
            }
            if (!item.innerText.trim()) {
              // item.remove();
            }

            this.imageCenter(editElement);
          });
          doOperations.push({
            id: item.dataset.nodeId,
            data: item.outerHTML,
            action: "update",
          });
        });
        detail.protyle.getInstance().transaction(doOperations);
      },
    });
  }

  async imageCenter(editElement) {
    const imageCenter = settings.getBySpace("typographyConfig", "imageCenter");
    if (!imageCenter || imageCenter < 10 || imageCenter > 100) {
      return;
    }

    // const body = document.querySelector(
    //   ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
    // ).parentElement.nextSibling;

    const images = editElement.querySelectorAll("span[data-type='img']");

    images.forEach(async (item) => {
      item.setAttribute("style", `display: block; width: ${imageCenter}%;`);

      await fetchSyncPost("/api/block/updateBlock", {
        dataType: "dom",
        data: item.parentElement.parentElement.outerHTML,
        id: item.parentElement.parentElement.getAttribute("data-node-id"),
      });
      console.log(item);
    });
  }

  async exec() {
    //寻找当前编辑的文档的id
    let parentId = formatUtil.getDocid();
    if (parentId == null) {
      showMessage("error");
      return;
    }
    const closeTip = settings.getBySpace("typographyConfig", "closeTip");
    if (closeTip) {
      await this.formatDoc(parentId);
    } else {
      confirm(
        "⚠️操作前强烈建议先对数据进行备份，若转换效果不理想可从历史页面恢复。",
        "确认格式化吗？",
        async () => {
          await this.formatDoc(parentId);
        },
        () => {
          return;
        }
      );
    }
  }

  async formatDoc(parentId) {
    let childrenResult = await fetchSyncPost("/api/block/getChildBlocks", {
      id: parentId,
    });
    let childrenBlocks = childrenResult.data;

    // const currentDoc = formatUtil.getCurrentDocument();

    // const allEmements =
    //   currentDoc.querySelectorAll("[data-node-index]");

    // //如果界面已经加载了文档所有内容，通过元素操作来更新
    // if (allEmements && allEmements.length === childrenBlocks.length) {

    const formatCount = 100;
    for (let i = 0; i < childrenBlocks.length; i++) {
      if (i === 0 || i % formatCount === 0) {
        showMessage(
          `正在格式化第${i + 1}至第${
            i + formatCount
          }个内容块，请勿进行其它操作。`
        );
      }
      let type = childrenBlocks[i].type;
      let id = childrenBlocks[i].id;
      if (type != "p" && type != "b" && type != "l" && type != "h") {
        continue;
      }
      let response = await fetchSyncPost("/api/block/getBlockKramdown", {
        id: id,
      });
      let result = response.data;

      //空内容块
      if (/^\{:.*\}$/.test(result.kramdown)) {
        const deleteEmptyClock = true;
        if (deleteEmptyClock) {
          await fetchSyncPost("/api/block/deleteBlock", {
            id: id,
          });
        }
        continue;
      }
      //为备注时，即便内容没有变动重新更新也会导致样式出问题，因此跳过
      if (/\^[（(].*[）)]\^/.test(result.kramdown)) {
        continue;
      }

      //行内块包含背景色等情况，即便内容没有变动重新更新也会导致样式出问题，因此跳过
      let matches = /(\{:.*?\})/.exec(result.kramdown);
      if (matches) {
        if (
          matches[1].search("style") > 0 &&
          matches[1].search("parent-style") <= 0
        ) {
          continue;
        }
      }

      let formatResult = formatUtil.formatContent(result.kramdown);

      //如果内容无变动就不更新了
      if (formatResult == result.kramdown) {
        continue;
      }

      await fetchSyncPost("/api/block/updateBlock", {
        dataType: "markdown",
        data: formatResult,
        id: id,
      });
    }

    const netImg2LocalAssets = settings.getBySpace(
      "typographyConfig",
      "netImg2LocalAssets"
    );
    if (netImg2LocalAssets) {
      // await sleep(6000);
      await fetchSyncPost("/api/format/netImg2LocalAssets", {
        id: parentId,
      });
    }

    const autoSpace = settings.getBySpace("typographyConfig", "autoSpace");

    if (autoSpace) {
      await fetchSyncPost("/api/format/autoSpace", {
        id: parentId,
      });
    }

    showMessage(`格式化完成！`);
  }
}
// 使用 Promise 封装 setTimeout 函数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
