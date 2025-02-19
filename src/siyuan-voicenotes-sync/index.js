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
import { fetchSyncPost, showMessage } from "siyuan";
import { formatUtil } from "@/siyuan-typography-go/utils";
import { sql } from "@/api";

export default class VoiceNotesPlugin extends AddIconThenClick {
  id = "hqweay-voicenotes";
  label = "同步 VoiceNotes";
  icon = `<svg t="1737813478703" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4248" width="128" height="128"><path d="M487.648 240a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v546.784a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V240z m155.84 89.04a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04z m155.824 144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v123.824a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16v-123.84z m-467.488-144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04zM176 473.76a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v112.688a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V473.76z" fill="#000000" p-id="4249"></path></svg>`;

  syncedNoteCount = 0;

  syncedRecordingIds = [];

  // 打开随机文档，编辑sql选定范围
  async exec(fullSync = false) {
    this.syncedNoteCount = 0;
    showMessage(`开始同步`);
    await this.sync(fullSync);
    showMessage(`同步完成，此次同步 ${this.syncedNoteCount} 条笔记`);
  }

  async sync(fullSync = false) {
    try {
      console.log(`Sync running full? ${fullSync}`);

      let res = await sql(
        `SELECT * FROM blocks WHERE ial like '%custom-recordingId%'`
      );

      this.syncedRecordingIds = res.map((item) => {
        let ial = item.ial.match(/custom-recordingId="([^"]+)"/);
        return ial && ial[1];
      });

      // console.log(this.syncedRecordingIds);

      // this.syncedRecordingIds = await this.getSyncedRecordingIds();
      // this.syncedRecordingIds = settings.getBySpace(
      //   "voiceNotesConfig",
      //   "syncedRecordingIds"
      // )
      //   ? settings
      //       .getBySpace("voiceNotesConfig", "syncedRecordingIds")
      //       .split(",")
      //   : [];

      this.vnApi = new VoiceNotesApi({});
      this.vnApi.token = settings.getBySpace("voiceNotesConfig", "token");

      const recordings = await this.vnApi.getRecordings();
      // This only happens if we aren't actually logged in, fail immediately.
      if (recordings === null) {
        return;
      }
      const unsyncedCount = { count: 0 };

      if (recordings.links.next) {
        let nextPage = recordings.links.next;
        let pageCounter = 1; // 已经获取了一页数据，所以从1开始计数
        let syncPageCount = fullSync
          ? settings.getBySpace("voiceNotesConfig", "latestDataCountOfPage")
          : settings.getBySpace("voiceNotesConfig", "manualSyncPageCount");

        while (
          nextPage &&
          (syncPageCount < 0 || pageCounter < syncPageCount) // 调整条件以包括当前页
        ) {
          showMessage(`正在进行同步 ${nextPage}`);
          const moreRecordings = await this.vnApi.getRecordingsFromLink(
            nextPage
          );
          recordings.data.push(...moreRecordings.data);
          nextPage = moreRecordings.links.next;
          pageCounter++;
        }
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
              subnote.title = `${recording.title}/${subnote.title}`;
              await this.processNote(
                subnote,
                `${voiceNotesDir}`,
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

      // settings.setBySpace(
      //   "voiceNotesConfig",
      //   "syncedRecordingIds",
      //   this.syncedRecordingIds.join(",")
      // );
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
      let title = recording.title;
      if (settings.getBySpace("voiceNotesConfig", "formatContent")) {
        title = formatUtil.formatContent(title);
        // 删除多余的空格
        title = formatUtil.deleteSpaces(title);
        // 插入必要的空格
        title = formatUtil.insertSpace(title);
      }
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
      // await new Promise((resolve) => setTimeout(resolve, 500));

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

      const creations = {};
      for (const type of creationTypes) {
        const creation = recording.creations.filter((c) => c.type === type);
        if (creation.length > 0) {
          creations[type] = creation;
        }
      }

      console.log(creations);

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

      // const formattedTags =
      //   recording.tags && recording.tags.length > 0
      //     ? recording.tags
      //         .map((tag) => `#${tag.name.replace(/\s+/g, "-")}#`)
      //         .join(" ")
      //     : null;
      // recording.tags && recording.tags.length > 0
      // ? "tags: [" +
      //   recording.tags
      //     .map((tag) => `${tag.name.replace(/\s+/g, "-")}`)
      //     .join(",") +
      //   "]"
      // : null;

      const context = {
        recording_id: recording.recording_id,
        title: title,
        date: formatDate(
          recording.created_at,
          settings.getBySpace("voiceNotesConfig", "dateFormat")
        ),
        // duration: formatDuration(recording.duration),
        // created_at: formatDate(
        //   recording.created_at,
        //   settings.getBySpace("voiceNotesConfig", "dateFormat")
        // ),
        // updated_at: formatDate(
        //   recording.updated_at,
        //   settings.getBySpace("voiceNotesConfig", "dateFormat")
        // ),
        transcript: transcript,
        // audio_filename: audioFilenameMD,
        summary: summary ? summary.markdown_content : null,
        tidy: tidy ? tidy.markdown_content : null,
        points: formattedPoints,
        todo: formattedTodos,
        tweet: tweet ? tweet.markdown_content : null,
        blog: blog ? blog.markdown_content : null,
        email: email ? email.markdown_content : null,
        custom: custom
          ? Array.isArray(custom)
            ? custom
                .map(
                  (item, index) =>
                    `### Others ${index + 1}\n${item.markdown_content}`
                )
                .join("\n")
            : custom.markdown_content
          : null,
        // tags: formattedTags,
        related_notes:
          recording.related_notes && recording.related_notes.length > 0
            ? (
                await Promise.all(
                  recording.related_notes.map(async (relatedNote) =>
                    this.searchRelatedNotes(relatedNote)
                  )
                )
              ).join("\n") || null
            : null,
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
      let note = jinja.render(
        settings.getBySpace("voiceNotesConfig", "noteTemplate"),
        context
      );

      if (settings.getBySpace("voiceNotesConfig", "newLineNewBlock")) {
        note = convertHtmlToMarkdown(note).replace(/\n+/g, "\n\n");
      } else {
        note = convertHtmlToMarkdown(note).replace(/\n{3,}/g, "\n\n");
      }

      if (settings.getBySpace("voiceNotesConfig", "formatContent")) {
        // console.log("0" + note);
        note = formatUtil.formatContent(note);
        // console.log("1" + note);
        // note = formatUtil.deleteSpaces(note);
        // console.log("2" + note);
        note = formatUtil.insertSpace(note);
      }

      // console.log("3" + note);

      //非文本笔记 会很快过期，还是别同步了，用处也不大
      // if (recording.recording_type != "3") {
      //   const signedUrl = await this.vnApi.getSignedUrl(recording.recording_id);
      //   note += `\n<audio controls src="${signedUrl.url}" title="${recording.recording_id}.mp3"></audio>`;
      // }

      // 添加前置元数据
      // let recordingIdTemplate = `recording_id: {{recording_id}}\n`;
      // let renderedFrontmatter = jinja
      //   .render(
      //     recordingIdTemplate +
      //       settings.getBySpace("voiceNotesConfig", "frontmatterTemplate"),
      //     context
      //   )
      //   .replace(/\n{3,}/g, "\n\n");

      // const metadata = `---\n${renderedFrontmatter}\n---\n`;
      // note = metadata + note;
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
          // this.syncedRecordingIds.push(recording.recording_id);
          // settings.setBySpace(
          //   "voiceNotesConfig",
          //   "syncedRecordingIds",
          //   this.syncedRecordingIds.join(",")
          // );
        }

        const tagsStr =
          recording.tags && recording.tags.length > 0
            ? recording.tags
                // .map((tag) => `${tag.name.replace(/\s+/g, "-")}`)
                .map((tag) => `${tag.name}`)
                .join(",")
            : "";
        await fetch("/api/attr/setBlockAttrs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: responseData.data,
            attrs: {
              tags: tagsStr,
              "custom-duration": formatDuration(recording.duration),
              "custom-createdAt": formatDate(
                recording.created_at,
                settings.getBySpace("voiceNotesConfig", "dateFormat")
              ),
              "custom-updatedAt": formatDate(
                recording.updated_at,
                settings.getBySpace("voiceNotesConfig", "dateFormat")
              ),
              "custom-recordingId": recording.recording_id,
            },
          }),
        });

        //如果有附件，下载下来
        if (recording.attachments && recording.attachments.length > 0) {
          await fetchSyncPost("/api/format/netImg2LocalAssets", {
            id: responseData.data,
          });
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

  async searchRelatedNotes(relatedNote) {
    let res = await sql(
      `SELECT * FROM blocks WHERE ial like '%custom-recordingId="${relatedNote.id}"%'`
    );
    if (res.length > 0) {
      return `- ((${res[0].id} "${res[0].content}"))`;
    } else {
      //全量同步时才会有查询不到的情况呢
      return null;
    }
  }

  async checkHPathExistence(path, notebook) {
    try {
      const response = await fetch(`/api/filetree/getIDsByHPath`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path, notebook }),
      });
      const data = await response.json();
      if (data.code === 0) {
        if (data.data.exists) {
          return data.data.id;
        } else {
          return null;
        }
      } else {
        console.error(`检查 HPath 是否存在失败: ${data.msg}`);
        return null;
      }
    } catch (error) {
      console.error(`检查 HPath 是否存在失败: ${error}`);
      return null;
    }
  }
}
