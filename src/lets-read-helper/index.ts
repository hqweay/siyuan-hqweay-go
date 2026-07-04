import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { SubPluginBase } from "@/libs/sub-plugin-base";

export default class ReadHelper extends SubPluginBase {
  override onload(): void {}

  override onunload(): void {}

  updateProtyleToolbar(toolbar) {
    if (settings.getBySpace("readHelper", "markAndCopyRef")) {
      toolbar.push({
        name: "markAndCopyRef",
        icon: "iconStar",
        tipPosition: "n",
        tip: this.t("lets-readHelper.markAndCopyRef"),
        click: (protyle) => {
          this.markAndCopyRef(protyle.protyle);
        },
      });
    }
    if (settings.getBySpace("readHelper", "markAndCopyTextRef")) {
      toolbar.push({
        name: "markAndCopyTextRef",
        icon: "iconUp",
        tipPosition: "n",
        tip: this.t("lets-readHelper.markAndCopyTextRef"),
        click: (protyle) => {
          this.markAndCopyTextRef(protyle.protyle);
        },
      });
    }
    if (settings.getBySpace("readHelper", "markAndCopyTextRefNoHighlight")) {
      toolbar.push({
        name: "markAndCopyTextRefNoHighlight",
        icon: "iconDown",
        tipPosition: "n",
        tip: this.t("lets-readHelper.markAndCopyTextRefNoHighlight"),
        click: (protyle) => {
          this.markAndCopyTextRefNoHighlight(protyle.protyle);
        },
      });
    }
    return toolbar;
  }

  private markAndCopyTextRefNoHighlight(protyle) {
    protyle.toolbar.setInlineMark(protyle, "mark", "range");
    const text = `((${this.getSelectedParentNodeId()} "*"))`;
    navigator.clipboard.writeText(text);
  }
  private markAndCopyRef(protyle) {
    protyle.toolbar.setInlineMark(protyle, "mark", "range");
    const text = `((${this.getSelectedParentNodeId()} "${
      protyle.toolbar.range
    }"))`;
    navigator.clipboard.writeText(text);
  }

  private markAndCopyTextRef(protyle) {
    protyle.toolbar.setInlineMark(protyle, "mark", "range");
    const text = `${
      protyle.toolbar.range
    }((${this.getSelectedParentNodeId()} "*"))`;
    navigator.clipboard.writeText(text);
  }

  getSelectedParentNodeId() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let selectedNode = range.startContainer;
      const endNode = range.endContainer;

      if (
        endNode.previousSibling &&
        endNode.previousSibling.nodeType === Node.ELEMENT_NODE
      ) {
        const previousSibling = endNode.previousSibling;
        if (
          previousSibling.tagName.toLowerCase() === "span" &&
          previousSibling.classList.contains("render-node")
        ) {
          selectedNode = previousSibling;
        }
      }

      let parentElement =
        selectedNode.nodeType === Node.TEXT_NODE
          ? selectedNode.parentNode
          : selectedNode;
      while (parentElement && !parentElement.hasAttribute("data-node-id")) {
        parentElement = parentElement.parentElement;
      }

      return parentElement.getAttribute("data-node-id");
    }
    // 清空选区
    selection.removeAllRanges();
    return null;
  }
}
