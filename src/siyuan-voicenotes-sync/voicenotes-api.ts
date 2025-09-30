import { User, VoiceNoteRecordings, VoiceNoteSignedUrl } from "./types";

const VOICENOTES_API_URL = "https://api.voicenotes.com/api";

export default class VoiceNotesApi {
  token!: string;

  constructor(options: { token?: string }) {
    if (options.token) {
      this.token = options.token;
    }
  }

  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 创建新的语音笔记
   * @param transcript 语音转文本内容
   * @param recordingType 录音类型
   * @param tempAttachmentIds 临时附件ID数组
   * @param deviceInfo 设备信息对象
   */
  async createVoiceNote(
    transcript: string = "",
    recordingType: number = 3,
    tempAttachmentIds: string[] = [],
    deviceInfo: object = {
      platform: "macOS",
      manufacturer:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      modelName: "nuxt-app",
      deviceType: "nuxt-app",
      osVersion: "nuxt-app",
      appVersion: "nuxt-app",
    }
  ): Promise<any> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/new`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: {
          transcript,
          recording_type: recordingType,
          temp_attachment_ids: tempAttachmentIds,
          device_info: JSON.stringify(deviceInfo),
          appVersion: deviceInfo["appVersion"] || "nuxt-app",
        },
      });
      return data.json;
    }
    return null;
  }

  /**
   * 为语音笔记打标签
   * @param recordingId 录音ID
   * @param tags 标签数组
   */
  async tagVoiceNote(
    recordingId: string,
    tags: string[] = ["siyuan"]
  ): Promise<any> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/${recordingId}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: { tags },
      });
      return data.json;
    }
    return null;
  }

  async updateVoiceNote(recordingId: string, detail: {}): Promise<any> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/${recordingId}`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        data: { ...detail },
      });
      return data.json;
    }
    return null;
  }

  async load(recordingId: string): Promise<any> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/${recordingId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return data.json;
    }
    return null;
  }

  async login(options: {
    username?: string;
    password?: string;
  }): Promise<string> {
    if (options.username && options.password) {
      const loginUrl = `${VOICENOTES_API_URL}/auth/login`;
      console.log(`loginUrl: ${loginUrl}`);

      const response = await this.request({
        url: loginUrl,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          email: options.username,
          password: options.password,
        }),
      });

      if (response.status === 200) {
        this.token = response.json.authorisation.token;
        return this.token;
      }
      return null;
    }
    return null;
  }

  async getSignedUrl(recordingId: number): Promise<VoiceNoteSignedUrl> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/${recordingId}/signed-url`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return data.json as VoiceNoteSignedUrl;
    }
    return null;
  }

  async downloadFile(fs: DataAdapter, url: string, outputLocationPath: string) {
    const response = await this.request({
      url,
    });
    const buffer = Buffer.from(response.arrayBuffer);

    await fs.writeBinary(outputLocationPath, buffer);
  }

  async deleteRecording(recordingId: number): Promise<boolean> {
    if (this.token) {
      const data = await this.request({
        url: `${VOICENOTES_API_URL}/recordings/${recordingId}`,
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        method: "DELETE",
      });

      return data.status === 200;
    }

    return false;
  }

  async getRecordingsFromLink(link: string): Promise<VoiceNoteRecordings> {
    console.log(link);
    if (this.token) {
      const data = await this.request({
        url: link.replace("http:", "https:"),
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });
      return data.json as VoiceNoteRecordings;
    }
    return null;
  }

  async getRecordings(): Promise<VoiceNoteRecordings> {
    if (this.token) {
      try {
        const data = await this.request({
          url: `${VOICENOTES_API_URL}/recordings`,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        return data.json as VoiceNoteRecordings;
      } catch (error) {
        if (error.status === 401) {
          this.token = undefined;
          throw error; // rethrow so we can catch in caller
        }
      }
    }
    return null;
  }

  async getUserInfo(): Promise<User> {
    if (this.token) {
      try {
        const data = await this.request({
          url: `${VOICENOTES_API_URL}/auth/me`,
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        return data.json;
      } catch (error) {
        console.error(error);
      }
    }
    return null;
  }

  // 请求函数
  async request({ url, data = null, method = "GET", headers = {} }) {
    console.log("发送请求:", url);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        ...(data && { body: JSON.stringify(data) }),
      });

      if (!response.ok) {
        throw response;
      }

      return {
        json: await response.json(),
        response,
      };
    } catch (error) {
      console.error("请求失败:", error);
      throw error;
    }
  }
}
