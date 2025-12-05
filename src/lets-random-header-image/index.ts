import { settings } from "@/settings";
import { showMessage } from "siyuan";
import { SubPlugin } from "@/types/plugin";

const fs = require("fs");
const path = require("path");

class RandomHeaderImagePlugin implements SubPlugin {
  private _isEnabled = false;

  changeImageBindThis = this.changeImage.bind(this);
  customEvent;
  cachedImages = {};

  constructor() {
    // Bind methods
  }

  async onload() {
    this._isEnabled = true;
    document.addEventListener("contextmenu", this.changeImageBindThis);
  }

  async onunload() {
    this._isEnabled = false;
    document.removeEventListener("contextmenu", this.changeImageBindThis);
  }

  async onLayoutReady() {
    // Already handled in onload
  }

  setEvent(event) {
    this.customEvent = event;
  }

  async changeImage(event, ele?) {
    let targetEle = event.target;
    if (ele) {
      targetEle = ele;
    }
    if (targetEle.tagName == "svg" || targetEle.tagName == "use") {
      this.changeImage(event, targetEle.parentElement);
      return;
    }

    if (targetEle.classList.value !== "protyle-icon ariaLabel") {
      return;
    }

    let randomLink = await this.getRandomFileFromFolder();
    if (!randomLink) {
      return;
    }

    const protyle = this.customEvent.detail.protyle;
    const background = this.customEvent.detail.protyle.background;

    fetch("/api/attr/setBlockAttrs", {
      method: "post",
      body: JSON.stringify({
        id: targetEle.parentElement.parentElement.parentElement.getAttribute(
          "data-node-id"
        ),
        attrs: { "title-img": `background-image:url(\"${randomLink}\");` },
      }),
    });

    // 更新封面
    background.ial["title-img"] = `background-image:url("${randomLink}")`;
    background.render(background.ial, protyle.block.rootID);
  }

  async getRandomFileFromFolder() {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]; // 图片文件的扩展名

    let imageFolders = [];

    settings.getBySpace("randomHeaderImageConfig", "bing") &&
      imageFolders.push("https://bing.img.run/rand.php");

    settings.getBySpace("randomHeaderImageConfig", "xjh") &&
      imageFolders.push("https://img.xjh.me/random_img.php");

    const folderPaths = settings
      .getBySpace("randomHeaderImageConfig", "folderPaths")
      .replace(/^\s+|\s+$/g, "");

    if (folderPaths !== "") {
      imageFolders.push(folderPaths.split("\n"));
    }

    if (imageFolders.length <= 0) {
      showMessage("请检查随机图片文件夹的路径配置～");
      return;
    }
    const folderIndex =
      imageFolders.length === 1
        ? 0
        : Math.floor(Math.random() * imageFolders.length);
    const folderPath = imageFolders[folderIndex].trim();

    if (folderPath.startsWith("http")) {
      // const regex = /(http[s]?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|bmp))\b/g;
      const regex =
        /((?:http[s]?:\/\/|\/\/)[^\s]+\.(?:jpg|jpeg|png|gif|bmp))\b/g;

      const result = await this.request(folderPath);

      const matches = (result as string).match(regex);

      if (matches) {
        //todo 如果 matches 有多个，考虑再随机一下
        return matches[0];
      } else {
        return result;
      }
    }

    if (!fs.existsSync(folderPath)) {
      showMessage("请检查随机图片的配置～");
      return;
    }

    if (
      settings.getBySpace("randomHeaderImageConfig", "isCached") &&
      this.cachedImages[folderPath]
    ) {
      const randomIndex = Math.floor(
        Math.random() * this.cachedImages[folderPath].length
      );
      const randomFile = this.cachedImages[folderPath][randomIndex];
      const items = folderPath.split("data");
      return path.join(items[items.length - 1], randomFile);
    }

    const files = fs.readdirSync(folderPath);
    const fileNames = files.filter((file) => {
      const extension = file.slice(file.lastIndexOf(".")).toLowerCase();
      return imageExtensions.includes(extension);
    });

    if (settings.getBySpace("randomHeaderImageConfig", "isCached")) {
      this.cachedImages[folderPath] = fileNames;
    }

    const randomIndex = Math.floor(Math.random() * fileNames.length);
    const randomFile = fileNames[randomIndex];

    const items = folderPath.split("data");
    return path.join(items[items.length - 1], randomFile);
  }

  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  // 请求函数
  request(url, method = "GET") {
    return new Promise((resolve, reject) => {
      if (method.toUpperCase() == "GET") {
        fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
          .then(
            (response) => {
              if (this.isJSON(response)) {
                resolve(response.json());
              } else {
                if (response.url.startsWith("https://img.xjh.me")) {
                  resolve(response.text());
                } else if (response.url.startsWith("https://cn.bing.com")) {
                  resolve(response.url);
                } else {
                  resolve(response.text());
                }
              }
            },
            (error) => {
              reject(error);
            }
          )
          .catch((err) => {
            console.error("请求失败:", err);
          });
      }
    });
  }
}

export default RandomHeaderImagePlugin;