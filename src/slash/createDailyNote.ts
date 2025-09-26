import { datePickerDialog } from "@/myscripts/dialog";
import { addProtyleSlash } from "@/myscripts/syUtils";
import { settings } from "@/settings";
import { createDailynote } from "@frostime/siyuan-plugin-kits";
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
          const dailyNoteId = await createDailynote(
            config.noteBookID,
            new Date(choosedDate)
          );
          event.insert(`((${dailyNoteId} "${choosedDate}"))`, false, false);
        },
      });
    },
  });
};
