import { setBlockAttrs } from "@/api";
import InsertCSS from "@/myscripts/insertCSS";
import { settings } from "@/settings";
let menus = [
  {
    name: "转换为表格",
    key: "f",
    value: "bg",
  },
  {
    name: "转换为导图",
    key: "f",
    value: "dt",
  },
  {
    name: "转换为时间线",
    key: "f",
    value: "timeline",
  },
];

function parseArrayString(str) {
  try {
    return new Function(`return ${str}`)();
  } catch (error) {
    console.error("解析失败:", error);
    return menus;
  }
}

export default class BlockAttr extends InsertCSS {
  public blockIconEvent({ detail }: any) {
    menus = parseArrayString(settings.get("quickAttrConfig")["attrs"]);
    detail.menu.addItem({
      iconHTML: "",
      label: "快捷添加属性",
      submenu: menus.map((menu) => ({
        iconHTML: "",
        label: menu.name,
        click: () => {
          ViewMonitor(detail, menu);
        },
      })),
    });
  }
}

function ViewMonitor(event, menu) {
  let id = event.blockElements[0].dataset.nodeId; //event.currentTarget.getAttribute("data-node-id");

  setBlockAttrs(id, { [`custom-${menu.key}`]: menu.value });
}

// const importCss = [
//   "list2map.css",
//   "table.css",
//   "list2timeline.css",
//   "list2table.css",
// ];
// const CUSTOM_CSS_SNIPPET_ID = "snippetCSS-hqweay-custom-css-snippet";
// const updateCustomCSSFile = async () => {
//   importCss.forEach(async (cssFile) => {
//     const res = await fetch(`/public/${cssFile}`, {
//       cache: "no-store",
//     });
//     if (res.ok) {
//       let css = await res.text();
//       updateStyleDom(CUSTOM_CSS_SNIPPET_ID, css);
//     }
//   });
// };
