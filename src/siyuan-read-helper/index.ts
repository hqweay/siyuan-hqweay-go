import { settings } from "@/settings";

export default class ReadHelper {
  updateProtyleToolbar(toolbar) {
    settings.getBySpace("readHelperConfig", "markAndCopyRef") &&
      toolbar.push({
        name: "markAndCopyRef",
        icon: "iconStar",
        tipPosition: "n",
        tip: "标注并复制块引",
        click: (protyle) => {
          this.markAndCopyRef(protyle.protyle);
        },
      });

    settings.getBySpace("readHelperConfig", "markAndCopyTextRef") &&
      toolbar.push({
        name: "markAndCopyTextRef",
        icon: "iconUp",
        tipPosition: "n",
        tip: "标注并复制 Text*",
        click: (protyle) => {
          this.markAndCopyTextRef(protyle.protyle);
        },
      });
    settings.getBySpace("readHelperConfig", "markAndCopyTextRefNoHighlight") &&
      toolbar.push({
        name: "markAndCopyTextRefNoHighlight",
        icon: "iconDown",
        tipPosition: "n",
        tip: "标注并复制 *",
        click: (protyle) => {
          this.markAndCopyTextRefNoHighlight(protyle.protyle);
        },
      });

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
