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
