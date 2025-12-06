import { getBlockByID, listDocsByPath } from "@/api";
import { plugin } from "@/utils";

import { openMobileFileById, showMessage } from "siyuan";
// export function getActiveDoc() {
//   let tab = document.querySelector(
//     "div.layout__wnd--active ul.layout-tab-bar>li.item--focus"
//   );
//   let dataId: string = tab?.getAttribute("data-id");
//   if (!dataId) {
//     return null;
//   }
//   const activeTab: HTMLDivElement = document.querySelector(
//     `.layout-tab-container.fn__flex-1>div.protyle[data-id="${dataId}"]`
//   ) as HTMLDivElement;
//   if (!activeTab) {
//     return;
//   }
//   const eleTitle = activeTab.querySelector(".protyle-title");
//   let docId = eleTitle?.getAttribute("data-node-id");
//   return docId;
// }
export const listChildDocs = async (doc: any) => {
  let data = await listDocsByPath(doc.box, doc.path);
  // console.log(data);
  return data?.files;
};
export const getSibling = async (path: string, box: string) => {
  path = path.replace(".sy", "");
  const parts = path.split("/");

  if (parts.length > 0) {
    parts.pop();
  }

  let parentPath = parts.join("/");
  parentPath = parentPath || "/";

  let siblings = await listChildDocs({ path: parentPath, box });
  return siblings;
};
export const goToSibling = async (delta: -1 | 1) => {
  let docId = getMobileCurrentDocId();
  if (!docId) return;
  let doc = await getBlockByID(docId);
  let { path, box } = doc;

  let siblings: { id: string; path: string }[] = await getSibling(path, box);
  let index = siblings.findIndex((sibling) => sibling.path === path);
  if (
    (delta < 0 && index == 0) ||
    (delta > 0 && index == siblings.length - 1)
  ) {
    showMessage(`跳转${delta < 0 ? "最后" : "第"}一篇文档`);
  }

  // let postAction = speedControl();

  let newIndex = (index + delta + siblings.length) % siblings.length;
  // openTab({
  //   app: plugin.app,
  //   doc: {
  //     id: siblings[newIndex].id,
  //   },
  // });
  openMobileFileById(plugin.app, siblings[newIndex].id);
  // postAction();
};
async function getParentDocument(path: string) {
  let pathArr = path.split("/").filter((item) => item != "");
  pathArr.pop();
  if (pathArr.length == 0) {
    return null;
  } else {
    let id = pathArr[pathArr.length - 1];
    return getBlockByID(id);
  }
}
export const goToParent = async () => {
  let docId = getMobileCurrentDocId();
  if (!docId) return;
  let doc = await getBlockByID(docId);
  let parent = await getParentDocument(doc.path);
  if (!parent) {
    showMessage("无父文档");
    return;
  }

  // let postAction = speedControl();

  openMobileFileById(plugin.app, parent.id);

  // openTab({
  //   app: plugin.app,
  //   doc: {
  //     id: parent.id,
  //   },
  // });
  // postAction();
};

export const goToChild = async () => {
  let docId = getMobileCurrentDocId();
  if (!docId) return;

  let doc = await getBlockByID(docId);
  let children = await listChildDocs(doc);
  if (children.length === 0) {
    showMessage("无子文裆");
    return;
  }

  // let postAction = speedControl();
  openMobileFileById(plugin.app, children[0].id);
  // openTab({
  //   app: plugin.app,
  //   doc: {
  //     id: children[0].id,
  //   },
  // });
  // postAction();
};


