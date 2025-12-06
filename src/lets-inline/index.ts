import { createDocWithMd, sql } from "@/api";
import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { SubPlugin } from "@/types/plugin";
import { showMessage } from "siyuan";

export default class Read implements SubPlugin {
  regexOfHighLight = /==([^=]+?)==/g;
  // regexOfMemo = /\^\((.*?)\)\^|\^（(.*?)）\^/g;
  regexOfMemo = /(.*?)<sup>[(（](.*?)[)）]<\/sup>/g;

  onload(): void {}

  onunload(): void {}

  private async getHighLight({ detail, keepContext, extractPath, addRef }) {
    const addOutline = settings.getBySpace("extractInline", "addOutline");

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

    let res = await sql(extractHighLightSQL);

    const basicInfoResponse = await sql(
      `select * from blocks where id = '${detail.data.id}'`
    );

    //@ts-ignore
    const basicInfo = basicInfoResponse[0];

    let result = ``;
    if (res) {
      //@ts-ignore
      res.forEach((element) => {
        // console.log(element);

        if (keepContext) {
          result += `${addOutline ? "- " : ""}${element.markdown}${
            addRef ? ` ((${element.id} "*"))` : ""
          }\n\n`;
        } else {
          // const match = element.markdown.match(this.regexOfHighLight);
          let match;
          while (
            (match = this.regexOfHighLight.exec(element.markdown)) !== null
          ) {
            result += `${addOutline ? "- " : ""}${match[1]}${
              addRef ? ` ((${element.id} "*"))` : ""
            }\n\n`;
          }
        }
      });
      result = result.trim();
      if (!result) {
        showMessage(`当前文档无标注喔`);
        return;
      }

      return {
        basicInfo,
        markdown: result,
      };
    }
  }

  private async getMemo({ detail, keepContext, extractPath, addRef }) {
    const addOutline = settings.getBySpace("extractInline", "addOutline");
    const docID = document
      .querySelector(
        ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-background"
      )
      ?.getAttribute("data-node-id");

    // const sql = `select * from blocks where root_id = '${docID}' and id in (select block_id from spans where type='textmark inline-memo') ORDER BY created`;

    const sqlTemp = `select * from blocks join spans on blocks.id = spans.block_id where blocks.root_id = '${docID}' and spans.type='textmark inline-memo'`;
    let res = await sql(sqlTemp);

    const basicInfoResponse = await sql(
      `select * from blocks where id = '${detail.data.id}'`
    );
    //@ts-ignore
    const basicInfo = basicInfoResponse[0];

    let result = ``;
    if (res) {
      res.forEach(async (element) => {
        // if (keepContext) {
        // result += `${element.markdown}\n\n`;
        let match;
        // let blockItemRes = await this.request("/api/query/sql", {
        //   stmt: `select * from blocks where id = '${element.block_id}'`,
        // });

        while ((match = this.regexOfMemo.exec(element.markdown)) !== null) {
          result += `${addOutline ? "- " : ""}${match[1]}${
            addRef ? ` ((${element.block_id} "*"))` : ""
          }\n${addOutline ? "  - " : "> "}${match[2]}\n\n`;
        }
        // } else {
        //   let match;

        //   while ((match = this.regexOfMemo.exec(element.markdown)) !== null) {
        //     result += `${addOutline ? "- " : ""}${match[1]}${
        //       addRef ? ` ((${element.block_id} "*"))` : ""
        //     }\n${addOutline ? "  - " : "> "}${match[2]}\n\n`;
        //   }
        // }
      });
      result = result.trim();
      if (!result) {
        showMessage(`当前文档无备注喔`);
        return;
      }

      return {
        basicInfo,
        markdown: result,
      };
    }
  }

  private async extractHighLight({ detail, keepContext, extractPath, addRef }) {
    const result = await this.getHighLight({
      detail,
      keepContext,
      extractPath,
      addRef,
    });

    await createDocWithMd(
      detail.protyle.notebookId,
      extractPath
        ? `${extractPath}/${result.basicInfo.content}`
        : `${result.basicInfo.hpath}/${result.basicInfo.content}`,
      result.markdown
    );
  }

  private async extractMemo({ detail, keepContext, extractPath, addRef }) {
    const result = await this.getMemo({
      detail,
      keepContext,
      extractPath,
      addRef,
    });

    await createDocWithMd(
      detail.protyle.notebookId,
      extractPath
        ? `${extractPath}/${result.basicInfo.content}`
        : `${result.basicInfo.hpath}/${result.basicInfo.content}`,
      result.markdown
    );
  }
  public editortitleiconEvent({ detail }) {
    detail.menu.addItem({
      iconHTML: "",
      label: "提取元素至新文档",
      submenu: [
        {
          iconHTML: "",
          label: "提取标注和备注（含上下文）",
          click: async () => {
            const extractPath = settings.getBySpace(
              "extractInline",
              "extractPath"
            );
            const addRef = settings.getBySpace("extractInline", "addRef");
            const memoResult = await this.getMemo({
              detail,
              keepContext: true,
              extractPath,
              addRef,
            });

            const highLightResult = await this.getHighLight({
              detail,
              keepContext: true,
              extractPath,
              addRef,
            });

            await createDocWithMd(
              detail.protyle.notebookId,
              extractPath
                ? `${extractPath}/${memoResult.basicInfo.content}`
                : `${memoResult.basicInfo.hpath}/${memoResult.basicInfo.content}`,
              `${memoResult.markdown}\n\n${highLightResult.markdown}`
            );
          },
        },
        {
          iconHTML: "",
          label: "提取标注和备注（无上下文）",
          click: async () => {
            const extractPath = settings.getBySpace(
              "extractInline",
              "extractPath"
            );
            const addRef = settings.getBySpace("extractInline", "addRef");

            const memoResult = await this.getMemo({
              detail,
              keepContext: false,
              extractPath,
              addRef,
            });

            const highLightResult = await this.getHighLight({
              detail,
              keepContext: false,
              extractPath,
              addRef,
            });

            await createDocWithMd(
              detail.protyle.notebookId,
              extractPath
                ? `${extractPath}/${memoResult.basicInfo.content}`
                : `${memoResult.basicInfo.hpath}/${memoResult.basicInfo.content}`,
              `${memoResult.markdown}\n\n${highLightResult.markdown}`
            );
          },
        },

        {
          iconHTML: "",
          label: "提取标注（无上下文）",
          click: async () => {
            const extractPath = settings.getBySpace(
              "extractInline",
              "extractPath"
            );
            const addRef = settings.getBySpace("extractInline", "addRef");
            this.extractHighLight({
              detail,
              keepContext: false,
              extractPath,
              addRef,
            });
          },
        },
        {
          iconHTML: "",
          label: "提取标注（含上下文）",
          click: async () => {
            const extractPath = settings.getBySpace(
              "extractInline",
              "extractPath"
            );
            // const addRef = settings.getBySpace("extractInline", "addRef");
            this.extractHighLight({
              detail,
              keepContext: true,
              extractPath,
              addRef: false,
            });
          },
        },
        {
          iconHTML: "",
          label: "提取备注",
          click: async () => {
            const extractPath = settings.getBySpace(
              "extractInline",
              "extractPath"
            );
            const addRef = settings.getBySpace("extractInline", "addRef");
            this.extractMemo({
              detail,
              keepContext: false,
              extractPath,
              addRef,
            });
          },
        },
        // {
        //   iconHTML: "",
        //   label: "提取备注（含上下文）",
        //   click: async () => {
        //     const extractPath = settings.getBySpace(
        //       "extractInline",
        //       "extractPath"
        //     );
        //     const addRef = settings.getBySpace("extractInline", "addRef");
        //     this.extractMemo({
        //       detail,
        //       keepContext: true,
        //       extractPath,
        //       addRef: false,
        //     });
        //   },
        // },
      ],
    });
    // const keepContext = settings.getBySpace("extractInline", "keepContext");
    // if (keepContext) {
    // detail.menu.addItem({});
    // }
  }
}
