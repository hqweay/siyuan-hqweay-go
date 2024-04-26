import { DEFAULT_SETTINGS } from "./linkSettings";

export class CheckIf {
  public static isUrl(text: string): boolean {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.regex);
    return urlRegex.test(text);
  }

  public static isImage(text: string): boolean {
    let imageRegex = new RegExp(DEFAULT_SETTINGS.imageRegex);
    return imageRegex.test(text);
  }

  public static isLinkedUrl(text: string): boolean {
    let urlRegex = new RegExp(DEFAULT_SETTINGS.linkRegex);
    return urlRegex.test(text);
  }
}
