import { request } from "@/api";
import { datePickerDialog } from "@/myscripts/dialog";
import {
  addProtyleSlash,
  getRenderedDailyNotePath,
  isdailyNoteExists,
} from "@/myscripts/syUtils";
import { settings } from "@/settings";
export const loadSlashOfCreateDailyNote = () => {
  addProtyleSlash({
    filter: ["cdn"],
    html: "创建日记引用",
    id: "create-daily-note-ref",
    callback: async (event, node) => {
      datePickerDialog({
        title: "选择日记",
        confirm: async (choosedDate) => {
          const config = settings.get("createDailyNoteConfig");
          const choosedDatePure = choosedDate.replace(/-/g, "");

          let dailyNoteId = await isdailyNoteExists(
            choosedDatePure,
            config.noteBookID
          );
          if (dailyNoteId) {
            event.insert(`((${dailyNoteId} "${choosedDate}"))`, false, false);
          } else {
            // const [year, month, day] = choosedDate.split("-");

            const dailyNotePath = await getRenderedDailyNotePath(
              config.noteBookID,
              choosedDate
            );
            dailyNoteId = await request("/api/filetree/createDocWithMd", {
              notebook: config.noteBookID,
              path: `${dailyNotePath}`,
              // path: `/daily note/${year}/${month}/${choosedDate}`,
              //todo 通过日记模板
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
