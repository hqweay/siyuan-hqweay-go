import { forwardProxy } from "../api";
import getElectronPageTitle from "./electron-scraper";
import { DEFAULT_SETTINGS } from "./linkSettings";
import { fetchGet, IWebSocketData } from "siyuan";
function blank(text: string): boolean {
  return text === undefined || text === null || text === "";
}

function notBlank(text: string): boolean {
  return !blank(text);
}

function getUrlFinalSegment(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/");
    const last = segments.pop() || segments.pop(); // Handle potential trailing slash
    return last;
  } catch (_) {
    return "File";
  }
}

export default class AutoLinkTitleUtil {
  escapeMarkdown(text: string): string {
    var unescaped = text.replace(/\\(\*|_|`|~|\\|\[|\])/g, "$1"); // unescape any "backslashed" character
    var escaped = unescaped.replace(/(\*|_|`|<|>|~|\\|\[|\])/g, "\\$1"); // escape *, _, `, ~, \, [, ], <, and >
    return escaped;
  }

  //todo
  public shortTitle = (title: string): string => {
    // const maximumTitleLength = 10;
    // if (maximumTitleLength === 0) {
    //   return title;
    // }
    // if (title.length < maximumTitleLength + 3) {
    //   return title;
    // }
    // const shortenedTitle = `${title.slice(0, maximumTitleLength)}...`;
    return title;
  };

  public getUrlFromLink(link: string): string {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.linkRegex);
    return urlRegex.exec(link)[2];
  }

  async convertUrlToTitledLink(url: string): Promise<String> {
    const title = await this.fetchUrlTitle(url);
    const escapedTitle = this.escapeMarkdown(title);
    const shortenedTitle = this.shortTitle(escapedTitle);

    return shortenedTitle;
  }

  async fetchUrlTitle(url: string): Promise<string> {
    if (!(url.startsWith("http") || url.startsWith("https"))) {
      url = "https://" + url;
    }
    try {
      let data = await forwardProxy(
        url,
        "GET",
        null,
        [
          {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          },
        ],
        5000,
        "text/html"
      );
      if (!data || data.status !== 200) {
        return "";
      }

      data.headers["Content-Type"].forEach((ele) => {
        if (!ele.includes("text/html")) {
          return getUrlFinalSegment(url);
        }
      });
      let html = data?.body;

      const doc = new DOMParser().parseFromString(html, "text/html");
      const title = doc.querySelectorAll("title")[0];

      if (title == null || blank(title?.innerText)) {
        // If site is javascript based and has a no-title attribute when unloaded, use it.
        var noTitle = title?.getAttr("no-title");
        if (notBlank(noTitle)) {
          return noTitle;
        }

        // Otherwise if the site has no title/requires javascript simply return Title Unknown
        return "";
      }

      return title.innerText.replace(/(\r\n|\n|\r)/gm, "").trim();
    } catch (ex) {
      console.error(ex);
      return "";
    }
  }
}
