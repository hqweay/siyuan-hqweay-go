import AddIconThenClick from "@/myscripts/addIconThenClick";
import InsertCSS from "@/myscripts/insertCSS";
import { settings } from "@/settings";
import { plugin } from "@/utils";
import { showMessage } from "siyuan";

export default class Read extends AddIconThenClick {
  regexOfHighLight = /==([^=]+)==/;

  private async extractHighLight({ detail, keepContext, extractPath, addRef }) {
    const docID = document
      .querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      )
      ?.getAttribute("data-node-id");

    const extractHighLightSQL = `SELECT * FROM blocks WHERE path LIKE '%/${docID}.sy' 
				AND markdown LIKE '%==%==%' AND  (type = 'p' AND parent_id not in 
				(SELECT id FROM blocks WHERE path LIKE '%/${docID}.sy' AND type = 'i' ) )  
				OR (type = 'i' AND id in (SELECT parent_id FROM blocks WHERE path LIKE '%/${docID}.sy' 
				AND type ='p' AND markdown LIKE '%==%==%' )) ORDER BY created`;

    let res = await this.request("/api/query/sql", {
      stmt: extractHighLightSQL,
    });

    const basicInfoResponse = await this.request("/api/query/sql", {
      stmt: `select * from blocks where id = '${detail.data.id}'`,
    });
    const basicInfo = basicInfoResponse.data[0];

    let result = ``;
    if (res) {
      res.data.forEach((element) => {
        console.log(element);

        if (keepContext) {
          result += `* ${element.markdown}\n`;
        } else {
          const match = element.markdown.match(this.regexOfHighLight);
          if (match) {
            result += `* ${match[1]}${addRef ? `((${element.id} "*"))` : ""}\n`;
          }
        }
      });
      result = result.trim();
      if (!result) {
        showMessage(`当前文档无标注喔`);
        return;
      }

      await this.request("/api/filetree/createDocWithMd", {
        notebook: detail.protyle.notebookId,
        path: extractPath
          ? `${extractPath}/${basicInfo.content}`
          : `${basicInfo.hpath}/${basicInfo.content}`,
        markdown: result,
      });
    }
  }
  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "提取标注（无上下文）至子文档",
      click: async () => {
        const extractPath = settings.getBySpace("readConfig", "extractPath");
				const addRef = settings.getBySpace("readConfig", "addRef");
        this.extractHighLight({
          detail,
          keepContext: false,
          extractPath,
          addRef,
        });
      },
    });
    // const keepContext = settings.getBySpace("readConfig", "keepContext");
    // if (keepContext) {
    detail.menu.addItem({
      iconHTML: "",
      label: "提取标注（含上下文）至子文档",
      click: async () => {
        const extractPath = settings.getBySpace("readConfig", "extractPath");
        const addRef = settings.getBySpace("readConfig", "addRef");
        this.extractHighLight({
          detail,
          keepContext: true,
          extractPath,
          addRef : false,
        });
      },
    });
    // }
  }
}
