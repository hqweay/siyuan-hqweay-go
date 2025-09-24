import { formateElement } from "@/siyuan-typography-go";
import { addProtyleSlash } from "@/myscripts/syUtils";
export const loadSlash = () => {
  //自用
  if (window.siyuan.user.userName !== "hqweay") return;
  addProtyleSlash({
    filter: ["fcb"],
    html: "格式化当前块",
    id: "format-current-block",
    callback: async (event, node) => {
      const protyle = event.protyle;
      formateElement(node, protyle);
      event.insert(window.Lute.Caret, false, false);
    },
  });
};
