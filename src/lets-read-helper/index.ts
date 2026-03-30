import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { plugin } from "@/utils";

export default class ReadHelper implements SubPlugin {
  onload(): void {}

  onunload(): void {}

  updateProtyleToolbar(toolbar) {
    // https://github.com/siyuan-note/siyuan/blob/fe4523fff2c84d6b06856331e735cc2938c2c5b0/app/src/plugin/index.ts#L93
    // 应该是构造时有异步加载的问题，这段逻辑不能正常给 toolbar 添加快捷键。所以需要手动addCommand
    if (settings.getBySpace("readHelper", "markAndCopyRef")) {
      toolbar.push({
        name: "markAndCopyRef",
        icon: "iconStar",
        tipPosition: "n",
        tip: "标注并复制块引",
        click: (protyle) => {
          this.markAndCopyRef(protyle.protyle);
        },
      });
      plugin.addCommand({
        langKey: "markAndCopyRef",
        hotkey: "",
      });
    }
    if (settings.getBySpace("readHelper", "markAndCopyTextRef")) {
      toolbar.push({
        name: "markAndCopyTextRef",
        icon: "iconUp",
        tipPosition: "n",
        tip: "标注并复制 Text*",
        click: (protyle) => {
          this.markAndCopyTextRef(protyle.protyle);
        },
      });
      plugin.addCommand({
        langKey: "markAndCopyTextRef",
        hotkey: "",
      });
    }
    if (settings.getBySpace("readHelper", "markAndCopyTextRefNoHighlight")) {
      toolbar.push({
        name: "markAndCopyTextRefNoHighlight",
        icon: "iconDown",
        tipPosition: "n",
        tip: "标注并复制 *",
        click: (protyle) => {
          this.markAndCopyTextRefNoHighlight(protyle.protyle);
        },
      });
      plugin.addCommand({
        langKey: "markAndCopyRef",
        hotkey: "",
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
