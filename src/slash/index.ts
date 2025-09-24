import { formateElement } from "@/siyuan-typography-go";
import { request } from "@/api";
import { datePickerDialog } from "@/myscripts/dialog";
import { addProtyleSlash, isdailyNoteExists } from "@/myscripts/syUtils";
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
  addProtyleSlash({
    filter: ["cdn"],
    html: "创建日记引用",
    id: "create-daily-note-ref",
    callback: async (event, node) => {
      datePickerDialog({
        title: "选择日记",
        confirm: async (choosedDate) => {
          const choosedDatePure = choosedDate.replace(/-/g, "");

          let dailyNoteId = await isdailyNoteExists(choosedDatePure);
          if (dailyNoteId) {
            event.insert(`((${dailyNoteId} "${choosedDate}"))`, false, false);
          } else {
            const [year, month, day] = choosedDate.split("-");

            // 想通过日记模板获取，好像不大好实现。就写死自己用吧……
            // const dailyNotePath = await getRenderedDailyNotePath(
            //   "20240330144726-gs2xey6"
            // );
            dailyNoteId = await request("/api/filetree/createDocWithMd", {
              notebook: "20240330144726-gs2xey6",
              // path: `${dailyNotePath}`,
              path: `/daily note/${year}/${month}/${choosedDate}`,
              markdown: "",
            }).then(function (data) {
              return data;
            });
            await request("/api/attr/setBlockAttrs", {
              id: dailyNoteId,
              attrs: {
                [`custom-dailynote-${choosedDatePure}`]: choosedDatePure,
              },
            }).then(function (data) {
              return data;
            });
            event.insert(`((${dailyNoteId} "${choosedDate}"))`, false, false);
          }
        },
      });
    },
  });
};
