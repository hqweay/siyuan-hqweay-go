import VoiceNotesApi from "./voicenotes-api";
import {
  getFilenameFromUrl,
  isToday,
  formatDuration,
  formatDate,
  formatTags,
  convertHtmlToMarkdown,
} from "./utils";
import { settings } from "@/settings";
import * as jinja from "jinja-js";
import AddIconThenClick from "@/myscripts/addIconThenClick";
import { showMessage } from "siyuan";

export default class VoiceNotesPlugin extends AddIconThenClick {
  id = "hqweay-voicenotes";
  label = "同步 VoiceNotes";
  icon = `<svg t="1737813478703" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4248" width="128" height="128"><path d="M487.648 240a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v546.784a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V240z m155.84 89.04a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04z m155.824 144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v123.824a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16v-123.84z m-467.488-144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04zM176 473.76a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v112.688a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V473.76z" fill="#000000" p-id="4249"></path></svg>`;

  syncedNoteCount = 0;

  // 打开随机文档，编辑sql选定范围
  async exec(fullSync = false) {
    console.log(settings.getBySpace("voiceNotesConfig", "excludeTags"));
    showMessage(`开始同步`);
    await this.sync(fullSync);
    showMessage(`同步完成，此次同步 ${this.syncedNoteCount} 条笔记`);
  }

  async sync(fullSync = false) {
    try {
      console.log(`Sync running full? ${fullSync}`);

      // this.syncedRecordingIds = await this.getSyncedRecordingIds();
      this.syncedRecordingIds = settings.getBySpace(
        "voiceNotesConfig",
        "syncedRecordingIds"
      )
        ? settings
            .getBySpace("voiceNotesConfig", "syncedRecordingIds")
            .split(",")
        : [];

      this.vnApi = new VoiceNotesApi({});
      this.vnApi.token = settings.getBySpace("voiceNotesConfig", "token");

      const recordings = await this.vnApi.getRecordings();
      // This only happens if we aren't actually logged in, fail immediately.
      if (recordings === null) {
        return;
      }
      const unsyncedCount = { count: 0 };

      if (fullSync && recordings.links.next) {
        let nextPage = recordings.links.next;

        do {
          showMessage(`正在进行全量同步 ${nextPage}`);
          const moreRecordings = await this.vnApi.getRecordingsFromLink(
            nextPage
          );
          recordings.data.push(...moreRecordings.data);
          nextPage = moreRecordings.links.next;
        } while (nextPage);
        //默认获取最近20条
      } else if (recordings.links.next) {
        let nextPage = recordings.links.next;
        const moreRecordings = await this.vnApi.getRecordingsFromLink(nextPage);
        recordings.data.push(...moreRecordings.data);
      }

      const syncDirectory = settings.getBySpace(
        "voiceNotesConfig",
        "syncDirectory"
      );
      if (recordings) {
        for (const recording of recordings.data) {
          const dateStr = formatDate(recording.created_at, "YYYY-MM-DD");
          const [year, month, day] = dateStr.split("-");
          const voiceNotesDir = `${syncDirectory}/${year}/${month}/${day}`;
          await this.processNote(recording, voiceNotesDir, "", unsyncedCount);

          if (recording.subnotes && recording.subnotes.length > 0) {
            for (const subnote of recording.subnotes) {
              await this.processNote(
                subnote,
                `${voiceNotesDir}/${recording.title}`,
                subnote.title,
                unsyncedCount
              );
            }
          }
        }
      }

      showMessage(
        `同步完成。由于排除标签，${unsyncedCount.count}条记录未被同步。`
      );

      settings.setBySpace(
        "voiceNotesConfig",
        "syncedRecordingIds",
        this.syncedRecordingIds.join(",")
      );
    } catch (error) {
      console.error(error);
      if (error.hasOwnProperty("status") !== "undefined") {
        console.log(`Login token was invalid, please try logging in again.`);
      } else {
        console.log(`Error occurred syncing some notes to this vault.`);
      }
    }
  }

  async processNote(
    recording,
    voiceNotesDir,

    parentTitle = "",
    unsyncedCount
  ) {
    try {
      if (!recording.title) {
        console.log(`无法获取语音记录，ID: ${recording.id}`);
        return;
      }

      //
      // const title = recording.title + recording.created_at;
      const title = recording.title;
      const recordingPath = `${voiceNotesDir}/${title}`;

      // // 处理子笔记
      // if (recording.subnotes && recording.subnotes.length > 0) {
      //   for (const subnote of recording.subnotes) {
      //     await this.processNote(
      //       subnote,
      //       `${voiceNotesDir}/${title}`,
      //       true,
      //       title,
      //       unsyncedCount
      //     );
      //   }
      // }

      // Check if the note already exists
      const noteExists = this.syncedRecordingIds.includes(
        recording.recording_id
      );

      // 如果笔记不存在，或者它是一个子笔记，它将被处理如下
      if (noteExists) {
        console.log(`${recording.recording_id} 已同步`);
        return;
      }

      showMessage(`正在获取 ${recording.title}`);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 检查是否包含排除的标签
      if (
        recording.tags &&
        recording.tags.some((tag) =>
          settings.getBySpace("voiceNotesConfig", "excludeTags")
            ? settings
                .getBySpace("voiceNotesConfig", "excludeTags")
                .split(",")
                .includes(tag.name)
            : false
        )
      ) {
        unsyncedCount.count++;
        return;
      }

      // 准备笔记内容
      const creationTypes = [
        "summary",
        "points",
        "tidy",
        "todo",
        "tweet",
        "blog",
        "email",
        "custom",
      ];

      const creations = Object.fromEntries(
        creationTypes.map((type) => [
          type,
          recording.creations.find((creation) => creation.type === type),
        ])
      );

      const { transcript } = recording;
      const { summary, points, tidy, todo, tweet, blog, email, custom } =
        creations;

      // 处理附件
      let attachments = "";
      if (recording.attachments && recording.attachments.length > 0) {
        attachments = (
          await Promise.all(
            recording.attachments.map(async (data) => {
              if (data.type === 1) {
                return `- ${data.description}`;
              } else if (data.type === 2) {
                const filename = getFilenameFromUrl(data.url);
                // TODO: 下载附件到思源
                const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                return isImage
                  ? `- ![${filename}](${data.url})`
                  : `- [${filename}](${data.url})`;
              }
            })
          )
        ).join("\n");
      }

      // 准备模板上下文
      const formattedPoints = points
        ? points.content.data.map((data) => `- ${data}`).join("\n")
        : null;

      const formattedTodos = todo
        ? todo.content.data
            .map(
              (data) => `- [ ] ${data}`
              // (data) =>
              // `- [ ] ${data}${
              //   this.settings.todoTag ? " #" + this.settings.todoTag : ""
              // }`
            )
            .join("\n")
        : null;

      const formattedTags =
        recording.tags && recording.tags.length > 0
          ? "tags: [" +
            recording.tags
              .map((tag) => `${tag.name.replace(/\s+/g, "-")}`)
              .join(",") +
            "]"
          : null;

      const context = {
        recording_id: recording.recording_id,
        title: title,
        date: formatDate(
          recording.created_at,
          settings.getBySpace("voiceNotesConfig", "dateFormat")
        ),
        duration: formatDuration(recording.duration),
        created_at: formatDate(
          recording.created_at,
          settings.getBySpace("voiceNotesConfig", "dateFormat")
        ),
        updated_at: formatDate(
          recording.updated_at,
          settings.getBySpace("voiceNotesConfig", "dateFormat")
        ),
        transcript: transcript,
        // audio_filename: audioFilenameMD,
        summary: summary ? summary.markdown_content : null,
        tidy: tidy ? tidy.markdown_content : null,
        points: formattedPoints,
        todo: formattedTodos,
        tweet: tweet ? tweet.markdown_content : null,
        blog: blog ? blog.markdown_content : null,
        email: email ? email.markdown_content : null,
        custom: custom ? custom.markdown_content : null,
        tags: formattedTags,
        // related_notes:
        //   recording.related_notes && recording.related_notes.length > 0
        //     ? recording.related_notes
        //         .map(
        //           (relatedNote: { title: string, created_at: string }) =>
        //             `- [[${this.sanitizedTitle(
        //               relatedNote.title,
        //               relatedNote.created_at
        //             )}]]`
        //         )
        //         .join("\n")
        //     : null,
        subnotes:
          recording.subnotes && recording.subnotes.length > 0
            ? recording.subnotes
                .map((subnote) => `- [[${subnote.title}]]`)
                .join("\n")
            : null,
        attachments: attachments,
        // parent_note: isSubnote ? `[[${parentTitle}]]` : null,
      };

      // 渲染模板
      let note = jinja
        .render(
          settings.getBySpace("voiceNotesConfig", "noteTemplate"),
          context
        )
        .replace(/\n{3,}/g, "\n\n");
      note = convertHtmlToMarkdown(note);

      //非文本笔记
      if (recording.recording_type != "3") {
        const signedUrl = await this.vnApi.getSignedUrl(recording.recording_id);
        note += `\n<audio controls src="${signedUrl.url}" title="${recording.recording_id}.mp3"></audio>`;
      }

      // 添加前置元数据
      let recordingIdTemplate = `recording_id: {{recording_id}}\n`;
      let renderedFrontmatter = jinja
        .render(
          recordingIdTemplate +
            settings.getBySpace("voiceNotesConfig", "frontmatterTemplate"),
          context
        )
        .replace(/\n{3,}/g, "\n\n");

      const metadata = `---\n${renderedFrontmatter}\n---\n`;
      note = metadata + note;
      // 创建文档
      const response = await fetch("/api/filetree/createDocWithMd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notebook: settings.getBySpace("voiceNotesConfig", "notebook"),
          path: recordingPath,
          markdown: note,
        }),
      });

      const responseData = await response.json();
      if (responseData.code === 0) {
        if (!this.syncedRecordingIds.includes(recording.recording_id)) {
          this.syncedNoteCount++;
          this.syncedRecordingIds.push(recording.recording_id);
          settings.setBySpace(
            "voiceNotesConfig",
            "syncedRecordingIds",
            this.syncedRecordingIds.join(",")
          );
        }

        // if (this.settings.deleteSynced && this.settings.reallyDeleteSynced) {
        //   await this.vnApi.deleteRecording(recording.recording_id);
        // }
      } else {
        console.error("创建文档失败:", response);
      }
    } catch (error) {
      console.error(error);
      if (error.hasOwnProperty("status") !== "undefined") {
        console.error(error.status);
        if (error.hasOwnProperty("text") !== "undefined") {
          console.error(error.text);
        }
        if (error.hasOwnProperty("json") !== "undefined") {
          console.error(error.json);
        }
        if (error.hasOwnProperty("headers") !== "undefined") {
          console.error(error.headers);
        }

        //this.settings.token = undefined;
        console.log(`登录令牌无效，请重新登录`);
      } else {
        showMessage(`同步笔记时发生错误`);
      }
    }
  }
}
