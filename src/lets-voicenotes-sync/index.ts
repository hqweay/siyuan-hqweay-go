import { setBlockAttrs, sql } from "@/api";
import AddIconThenClick from "@/myscripts/addIconThenClick";
import { settings } from "@/settings";
import { formatUtil } from "@/lets-typography-go/utils";
import * as jinja from "jinja-js";
import { fetchSyncPost, showMessage } from "siyuan";
import { convertHtmlToMarkdown, formatDate, getFilenameFromUrl } from "./utils";
import VoiceNotesApi from "./voicenotes-api";
import { cleanSpacesBetweenChineseCharacters } from "@/myscripts/utils";
import { SubPlugin } from "@/types/plugin";

function getContentFromTranscriptToNextHeading(element) {
  let result = "";
  const children = element.children;
  let foundTranscript = false;
  console.log(element);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    // 检查是否是标题元素
    if (
      child.dataset.type === "NodeHeading" &&
      child.classList.contains("h2")
    ) {
      //零字符处理
      if (
        child.textContent.replace(/[\s\u00A0\u200B]+/g, "") === "Transcript"
      ) {
        foundTranscript = true;
        continue; // 跳过Transcript标题本身
      }

      // 如果已经找到Transcript且遇到下一个标题，则停止
      if (foundTranscript) {
        break;
      }
    }

    // 只有在找到Transcript后才开始收集内容
    if (foundTranscript) {
      result += child.textContent + "\n";
    }
  }
  return result.trim();
}

export default class VoiceNotesPlugin implements SubPlugin {
  onload(): void {
    if (this.vnApi) return;
    this.vnApi = new VoiceNotesApi({
      token: settings.getBySpace("voiceNotes", "token"),
    });
  }

  onunload(): void {}
  addMenuItem(menu) {
    menu.addItem({
      label: "同步 VoiceNotes",
      iconHTML: `<div id="${this.id}" class="toolbar__item b3-tooltips b3-tooltips__se" aria-label="${this.label}" >${this.icon}</div>`,
      click: async () => {
        this.exec();
      },
    });
  }

  id = "hqweay-voicenotes";
  label = "同步 VoiceNotes";
  icon = `<svg t="1737813478703" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4248" width="128" height="128"><path d="M487.648 240a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v546.784a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V240z m155.84 89.04a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04z m155.824 144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v123.824a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16v-123.84z m-467.488-144.704a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v346.432a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V329.04zM176 473.76a16 16 0 0 1 16-16h16a16 16 0 0 1 16 16v112.688a16 16 0 0 1-16 16h-16a16 16 0 0 1-16-16V473.76z" fill="#000000" p-id="4249"></path></svg>`;

  syncedNoteCount = 0;

  existingSyncedNotes = [];

  vnApi;

  init() {}

  public async editortitleiconEvent({ detail }: any) {
    detail.menu.addItem({
      iconHTML: "🧹",
      label: "将数据同步到voicenotesai",
      click: async () => {
        const docId = detail.protyle.block.id;

        const items = await sql(`SELECT * FROM blocks WHERE id = '${docId}'`);
        const tags = items[0].tag
          ? items[0].tag
              .split(" ")
              .map((tag) => tag.trim().replace(/^#|#$/g, ""))
          : [];

        const recordingid =
          detail.protyle.wysiwyg.element.getAttribute("custom-recordingid");

        let text;
        //修改同步过来的数据
        if (recordingid) {
          console.log(`已有录音ID: ${recordingid}，尝试修改文本`);
          text = getContentFromTranscriptToNextHeading(
            detail.protyle.wysiwyg.element
          );
        }
        //修改同步过去的数据
        if (!text) {
          //取的页面元素，如果文档太长，可能取不全
          text = detail.protyle.wysiwyg.element.innerText.trim();
        }

        if (!text || text.length <= 0) {
          showMessage(`无法获取文本内容，请检查`);
          return;
        }

        text = text.replace(/[\u00A0\u200B]+/g, "").replace(/\n{3,}/g, "\n\n");
        //思源主动push到voicenotes的数据都不允许被更新回来覆盖【以思源数据为主】
        await this.addOrUpdate(recordingid, detail.protyle.block.id, text, [
          ...tags,
          "siyuan",
        ]);
      },
    });
  }

  public async blockIconEvent({ detail }: any) {
    detail.menu.addItem({
      iconHTML: "",
      label: "将数据同步到voicenotesai",
      click: async () => {
        detail.blockElements.forEach(async (item: HTMLElement) => {
          await this.addOrUpdate(
            item.getAttribute("custom-recordingid"),
            item.dataset.nodeId,
            item.innerText.trim(),
            []
          );
        });
      },
    });
  }

  private async addOrUpdate(recordingid, nodeId, text, tags = []) {
    if (recordingid) {
      showMessage(`该笔记已同步，录音ID: ${recordingid}，尝试修改文本`);

      if (tags.length <= 0) {
        const noteDetail = await this.vnApi.load(recordingid);
        if (!noteDetail) {
          showMessage(`无法获取该笔记，ID: ${recordingid}`);
          return;
        }
        tags = noteDetail.tags.map((tag) => tag.name);
      }
      const response = await this.vnApi.updateVoiceNote(recordingid, {
        transcript: text,
        tags: tags,
      });
      await setBlockAttrs(nodeId, {
        [`custom-updatedat`]: formatDate(
          response.updated_at,
          settings.getBySpace("voiceNotes", "dateFormat")
        ),
      });
      showMessage(`该笔记已修改`);
      return;
    } else {
      showMessage(`正在创建笔记...`);
      const response = await this.vnApi.createVoiceNote(text);
      if (response && response.recording.id) {
        showMessage(`已创建笔记，ID: ${response.recording.id}`);
        await this.vnApi.tagVoiceNote(response.recording.id, ["siyuan"]);
        showMessage(`为笔记打标签: siyuan`);
        await setBlockAttrs(nodeId, {
          [`custom-recordingid`]: response.recording.id,
          [`custom-createdat`]: formatDate(
            response.recording.created_at,
            settings.getBySpace("voiceNotes", "dateFormat")
          ),
        });
      } else {
        showMessage(`创建笔记失败`);
      }
    }
  }

  async exec(fullSync = false) {
    this.syncedNoteCount = 0;
    showMessage(`开始同步`);
    await this.sync(fullSync);
    showMessage(`同步完成，此次同步 ${this.syncedNoteCount} 条笔记`);
  }

  async getExistingSyncedNotes() {
    const existingRecordings = await sql(
      `SELECT * FROM blocks WHERE ial like '%custom-recordingid%'`
    );

    return existingRecordings.map((item) => {
      const recordingid = item.ial.match(/custom-recordingid="([^"]+)"/);
      const updateAt = item.ial.match(/custom-updatedat="([^"]+)"/);
      const creationscount = item.ial.match(/custom-creationscount="([^"]+)"/);
      return {
        recordingid: recordingid && recordingid[1],
        updateAt: updateAt && updateAt[1],
        id: item.id,
        path: item.path,
        creationscount: creationscount && creationscount[1],
      };
    });
  }

  async sync(fullSync = false) {
    try {
      console.log(`Sync running full? ${fullSync}`);

      this.existingSyncedNotes = await this.getExistingSyncedNotes();

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
          ? settings.getBySpace("voiceNotes", "latestDataCountOfPage")
          : settings.getBySpace("voiceNotes", "manualSyncPageCount");

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

      //按时间顺序
      recordings.data.sort(
        (a, b) =>
          new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );

      const syncDirectory = settings.getBySpace(
        "voiceNotes",
        "syncDirectory"
      );
      if (recordings) {
        for (const recording of recordings.data) {
          const dateStr = formatDate(recording.created_at, "YYYY-MM-DD");
          const [year, month, day] = dateStr.split("-");
          const voiceNotesDir = `${syncDirectory}/${year}/${month}/${day}`;
          await this.processNote(recording, voiceNotesDir, unsyncedCount);

          if (recording.subnotes && recording.subnotes.length > 0) {
            for (const subnote of recording.subnotes) {
              subnote.title = `${recording.title}/${subnote.title}`;
              await this.processNote(
                subnote,
                `${voiceNotesDir}`,
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
      //   "voiceNotes",
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

  isNoteNeedUpdate(existingNote, newNote) {
    // 检查更新时间
    const existingUpdateTime = new Date(existingNote.updateAt).getTime();
    const newUpdateTime = new Date(newNote.updated_at).getTime();

    // 检查是否需要更新：时间更新 或 数量不同
    const needUpdateByTime = newUpdateTime > existingUpdateTime;
    // 存量数据也处理下
    const needUpdateByCount =
      existingNote.creationscount != newNote.creations.length;

    if (needUpdateByTime) {
      console.log(`需要更新：发现更新时间较新`);
      return true;
    }

    if (needUpdateByCount) {
      console.log(`需要更新：creations 数量不同`);
      return true;
    }

    console.log(`无需更新：时间和数量都未发生变化`);
    return false;
  }

  async processNote(recording, voiceNotesDir, unsyncedCount) {
    try {
      if (!recording.title) {
        console.log(`无法获取语音记录，ID: ${recording.id}`);
        return;
      }

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
      const noteExists = this.existingSyncedNotes.find(
        (note) => note.recordingid === recording.recording_id
      );

      console.log(`${recording.recording_id}, exists: ${!!noteExists}`);

      // 检查是否包含排除的标签
      if (
        recording.tags &&
        recording.tags.some((tag) =>
          settings.getBySpace("voiceNotes", "excludeTags")
            ? settings
                .getBySpace("voiceNotes", "excludeTags")
                .split(",")
                .includes(tag.name)
            : false
        )
      ) {
        unsyncedCount.count++;
        return;
      }

      if (noteExists) {
        if (!this.isNoteNeedUpdate(noteExists, recording)) {
          return;
        }

        // 若笔记存在，且判断需要更新，首先删除文档；先不考虑deleteBlock的情况
        await fetch("/api/filetree/removeDoc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notebook: settings.getBySpace("voiceNotes", "notebook"),
            path: noteExists.path,
          }),
        });
        this.existingSyncedNotes = await this.getExistingSyncedNotes();
      }

      //
      // const title = recording.title + recording.created_at;
      console.log(recording);
      let title = recording.title;
      if (settings.getBySpace("voiceNotes", "formatContent")) {
        title = formatUtil.formatContent(title);
        // 删除多余的空格
        title = formatUtil.deleteSpaces(title);
        // 插入必要的空格
        title = formatUtil.insertSpace(title);
      }
      const recordingPath = `${voiceNotesDir}/${title}`;

      showMessage(`正在获取 ${recording.title}`);
      // await new Promise((resolve) => setTimeout(resolve, 500));

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
        "team-summary",
      ];

      const creations = {};
      for (const type of creationTypes) {
        const creation = recording.creations.filter((c) => c.type === type);
        if (creation.length > 0) {
          creations[type.replace("-", "_")] = creation;
        }
      }

      const { transcript } = recording;
      const {
        summary,
        points,
        tidy,
        todo,
        tweet,
        blog,
        email,
        custom,
        team_summary,
      } = creations;

      // console.log(team_summary.markdown_content);

      // 处理附件
      let attachments = "";
      if (recording.attachments && recording.attachments.length > 0) {
        attachments = (
          await Promise.all(
            recording.attachments.map(async (data) => {
              if (data.type === 1) {
                return `- ${data.description}`;
              } else if (data.type === 3) {
                return `### Added note\n${data.description}`;
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

      const formattedPoints =
        points && points.length > 0
          ? points.map((point) => `- ${point.content.data}`).join("\n")
          : null;

      const formattedTodos =
        todo && todo.length > 0
          ? todo
              .map((todoItem, index) => {
                return (
                  `### Todo ${index + 1}\n` +
                  todoItem.content.data
                    .map(
                      (data) => `- [ ] ${data}`
                      // (data) =>
                      // `- [ ] ${data}${
                      //   this.settings.todoTag ? " #" + this.settings.todoTag : ""
                      // }`
                    )
                    .join("\n")
                );
              })
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
          settings.getBySpace("voiceNotes", "dateFormat")
        ),
        // duration: formatDuration(recording.duration),
        // created_at: formatDate(
        //   recording.created_at,
        //   settings.getBySpace("voiceNotes", "dateFormat")
        // ),
        // updated_at: formatDate(
        //   recording.updated_at,
        //   settings.getBySpace("voiceNotes", "dateFormat")
        // ),
        transcript: cleanSpacesBetweenChineseCharacters(transcript),
        // audio_filename: audioFilenameMD,
        summary: this.getMarkdownContent(summary, "Summary"),
        tidy: this.getMarkdownContent(tidy, "Tidy Transcript"),
        points: formattedPoints,
        todo: formattedTodos,
        tweet: this.getMarkdownContent(tweet, "Tweet"),
        blog: this.getMarkdownContent(blog, "Blog"),
        email: this.getMarkdownContent(email, "Email"),
        teamSummary: this.getMarkdownContent(team_summary, "Team Summary"),
        custom: this.getMarkdownContent(custom, "Others"),
        // tags: formattedTags,
        // related_notes:
        //   recording.related_notes && recording.related_notes.length > 0
        //     ? (
        //         await Promise.all(
        //           recording.related_notes.map(async (relatedNote) =>
        //             this.searchRelatedNotes(relatedNote)
        //           )
        //         )
        //       ).join("\n") || null
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
      let note = jinja.render(
        settings.getBySpace("voiceNotes", "noteTemplate"),
        context
      );

      if (settings.getBySpace("voiceNotes", "newLineNewBlock")) {
        note = convertHtmlToMarkdown(note).replace(/\n+\s+/g, "\n\n");
      } else {
        note = convertHtmlToMarkdown(note).replace(/\n{3,}/g, "\n\n");
      }

      if (settings.getBySpace("voiceNotes", "formatContent")) {
        // console.log("0" + note);
        note = formatUtil.formatContent(note);
        // console.log("1" + note);
        // note = formatUtil.deleteSpaces(note);
        // console.log("2" + note);
        note = formatUtil.insertSpace(note);

        //多个空格保留一个
        // note = note.replace(/\s+/g, " ");
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
      //       settings.getBySpace("voiceNotes", "frontmatterTemplate"),
      //     context
      //   )
      //   .replace(/\n{3,}/g, "\n\n");

      // const metadata = `---\n${renderedFrontmatter}\n---\n`;
      // note = metadata + note;
      // 然后创建文档
      const response = await fetch("/api/filetree/createDocWithMd", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notebook: settings.getBySpace("voiceNotes", "notebook"),
          path: recordingPath,
          markdown: note,
        }),
      });

      const responseData = await response.json();
      if (responseData.code === 0) {
        if (!this.existingSyncedNotes.includes(recording.recording_id)) {
          this.syncedNoteCount++;
          // this.syncedRecordingIds.push(recording.recording_id);
          // settings.setBySpace(
          //   "voiceNotes",
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
        console.log("creations.length:" + recording.creations.length);
        await fetch("/api/attr/setBlockAttrs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: responseData.data,
            attrs: {
              tags: tagsStr,
              "custom-duration": `${recording.duration}`,
              "custom-createdat": formatDate(
                recording.created_at,
                settings.getBySpace("voiceNotes", "dateFormat")
              ),
              "custom-updatedat": formatDate(
                recording.updated_at,
                settings.getBySpace("voiceNotes", "dateFormat")
              ),
              "custom-recordingid": recording.recording_id,
              //通过 creations length 判断是否需要更新
              "custom-creationscount": `${recording.creations.length}`,
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

  getMarkdownContent(custom, h3Title) {
    if (!custom) return null;
    if (Array.isArray(custom) && custom.length > 0) {
      return custom
        .map(
          (item, index) =>
            `### ${item.title ? item.title : `${h3Title} ${index + 1}`}\n${
              item.markdown_content
            }`
        )
        .join("\n");
    } else if (!Array.isArray(custom)) {
      return `### ${custom.title}\n${custom.markdown_content}`;
    } else {
      return null; // 如果是空数组，返回null
    }
  }

  async searchRelatedNotes(relatedNote) {
    let res = await sql(
      `SELECT * FROM blocks WHERE ial like '%custom-recordingid="${relatedNote.id}"%'`
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
