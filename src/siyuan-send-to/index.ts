import CardView from "./pages/card.svelte";
import { Plugin, showMessage, confirm, fetchSyncPost, Dialog } from "siyuan";
import { plugin } from "@/utils";
import { settings } from "@/settings";

export default class SendTo {
  availableBlocks = ["NodeParagraph", "NodeHeading"];

  public blockIconEvent({ detail }) {
    if (!settings.getFlag("sendTo")) {
      return;
    }
    let resultText = this.getContent(detail);

    const blockURL = detail.blockElements
      .map((editElement: HTMLElement) => {
        return `siyuan://blocks/${editElement.getAttribute(
          "data-node-id"
        )} ${editElement.textContent.substring(0, 20).concat("...")}`;
      })
      .join("\n");

    detail.menu.addItem({
      iconHTML: "",
      label: plugin.i18n.menuByURL,
      submenu: this.initMenuByURL(resultText, blockURL),
    });
    detail.menu.addItem({
      iconHTML: "",
      label: plugin.i18n.menuByScript,
      submenu: this.initMenuByScript(resultText, detail),
    });
  }

  //@todo 可以自定义内容获取逻辑
  private getContent(detail) {
    let resultText = "";
    const separator = settings.get("sendToConfig")["separator"]; //plugin.settingUtils.get("separator") || "";

    detail.blockElements &&
      detail.blockElements.forEach((element) => {
        resultText += element.innerText + separator;
      });
    return resultText;
  }

  //@todo 可以自定义内容处理逻辑
  private initMenuByScript(resultText, detail) {
    return [
      {
        iconHTML: "",
        label: "卡片分享",
        click: () => {
          // showMessage("尚未实现");
          this.showDialog(resultText, detail);
        },
      },
      {
        iconHTML: "",
        label: "自定义脚本处理",
        click: () => {
          showMessage("尚未实现");
        },
      },
    ];
  }
  private writeToClipboard(resultText) {
    if (settings.get("sendToConfig")["isToClipboard"] && navigator.clipboard) {
      navigator.clipboard.writeText(resultText).then(
        function () {
          console.log("文本已成功复制到剪贴板");
        },
        function (err) {
          // 创建一个临时输入元素
          const tempInput = document.createElement("input");
          tempInput.value = resultText;
          document.body.appendChild(tempInput);

          // 选中临时输入元素的内容
          tempInput.select();
          tempInput.setSelectionRange(0, 99999); // 兼容移动端

          // 执行复制操作
          document.execCommand("copy");

          // 移除临时输入元素
          document.body.removeChild(tempInput);
        }
      );
    } else {
      console.warn("浏览器不支持 Clipboard API");
    }
  }

  private jumpTo(resultText, url) {
    resultText = encodeURIComponent(resultText);
    url = url.replace("${content}", resultText);

    window.open(url);
  }
  private initMenuByURL(resultText, blockURL) {
    return settings
      .get("sendToConfig")
      ["inputArea"].split("\n")
      .map((line) => {
        const item = line.split("====");
        if (item.length !== 2) {
          showMessage(`配置有误，请检查`);
        }

        if (item[1].includes("${content}")) {
          return {
            iconHTML: "",
            label: item[0],
            click: () => {
              this.writeToClipboard(resultText);
              this.jumpTo(resultText, item[1]);
            },
          };
        } else if (item[0].includes("添加块链接到提醒事项")) {
          return {
            iconHTML: "",
            label: item[0],
            click: () => {
              this.writeToClipboard(blockURL);
              this.jumpTo(resultText, item[1]);
            },
          };
        } else {
          return {
            iconHTML: "",
            label: item[0],
            click: () => {
              this.writeToClipboard(resultText);
              this.jumpTo(resultText, item[1]);
            },
          };
        }
      });
  }

  private showDialog(resultText, detail) {
    let dialog = new Dialog({
      title: `卡片分享`,
      content: `<div id="cardPanel" class="b3-dialog__content"></div>`,
      // width: plugin.isMobile ? "92vw" : "720px",
      width: "720px",
      height: "600px",
      destroyCallback(options) {
        pannel.$destroy();
      },
    });

    var cardPanel = dialog.element.querySelector("#cardPanel");
    cardPanel.style.margin = "0 auto";
    // console.log(resultText);
    let pannel = new CardView({
      props: {
        content: resultText,
        // originBlockElements: detail.blockElements,
        originDetail: detail,
      },
      target: dialog.element.querySelector("#cardPanel"),
    });
  }
}
