import { settings } from "@/settings";
import { showMessage } from "siyuan";
const fs = require("fs");
const path = require("path");

export default class RandomImage {
  changeImageBindThis = this.changeImage.bind(this);
  onunload() {
    document.removeEventListener("contextmenu", this.changeImageBindThis);
  }

  onload() {
    document.addEventListener("contextmenu", this.changeImageBindThis);
  }

  async changeImage(event, ele) {
    console.log("try to change Image");
    let targetEle = event.target;
    if (ele) {
      targetEle = ele;
    }
    if (targetEle.tagName == "svg" || targetEle.tagName == "use") {
      this.changeImage(event, targetEle.parentElement);
      return;
    }

    if (
      targetEle.classList.value !== "protyle-icon b3-tooltips b3-tooltips__sw"
    ) {
      return;
    }

    let randomLink = await this.getRandomFileFromFolder();
    targetEle.parentElement.parentElement
      .querySelector("img")
      .setAttribute("style", "");
    targetEle.parentElement.parentElement
      .querySelector("img")
      .setAttribute("src", randomLink);
    fetch("/api/attr/setBlockAttrs", {
      method: "post",
      body: JSON.stringify({
        id: targetEle.parentElement.parentElement.parentElement.getAttribute(
          "data-node-id"
        ),
        attrs: { "title-img": `background-image:url(${randomLink})` },
      }),
    });
  }

  getRandomFileFromFolder() {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp"]; // 图片文件的扩展名

    const imageFolders = settings
      .getBySpace("randomHeaderImageConfig", "folderPaths")
      .split("\n");

    console.log(imageFolders);

    if (imageFolders.length <= 0) {
      showMessage("请检查随机图片文件夹的路径配置～");
      return;
    }
    const folderIndex = Math.floor(Math.random() * imageFolders.length);
    const folderPath = imageFolders[folderIndex].trim();

    if (!fs.existsSync(folderPath)) {
      showMessage("请检查随机图片文件夹的路径配置～");
      return;
    }

    const files = fs.readdirSync(folderPath);

    const fileNames = files.filter((file) => {
      const extension = file.slice(file.lastIndexOf(".")).toLowerCase();

      return imageExtensions.includes(extension);
    });

    const randomIndex = Math.floor(Math.random() * fileNames.length);
    const randomFile = fileNames[randomIndex];

    const items = folderPath.split("data");
    return path.join(items[items.length - 1], randomFile);
  }
}
