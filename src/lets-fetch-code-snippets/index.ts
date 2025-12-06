import { settings } from "@/settings";

import { getFileContent, plugin } from "@/utils";
import { fetchSyncPost } from "siyuan";
import { snippets } from "./snippets";
import { SubPlugin } from "@/types/plugin";
import { PluginRegistry } from "@/plugin-registry";
import pluginMetadata from "./plugin";
export default class FetchCodeSnippets implements SubPlugin {
  codeSnippets = [];
  onunload() {
    // 获取所有的 style 元素
    const styles = document.querySelectorAll("style");
    // 遍历所有 style 元素
    styles.forEach((style) => {
      // 检查 id 是否以 'snippetCSS-hqweay-' 开头
      if (style.id && style.id.startsWith("snippetCSS-hqweay-")) {
        // 如果是，则从 DOM 中移除该元素
        style.remove();
      }
    });
  }

  async onload() {
    //这里注入CSS和JS - 需要保留代码片段功能

		console.log("FetchCodeSnippets onload");
    await this.getCodeSnippets();
    PluginRegistry.getInstance().getPluginConfig(pluginMetadata.name).settings =
      this.codeSnippets.map((ele) => {
        return {
          type: "checkbox",
          title: `${ele.title} - ${
            ele.author && ele.link
              ? `@<a href= '${ele.link}'>${ele.author}</a>`
              : ""
          }`,
          description: `${ele.description}`,
          key: `${ele.id}`,
          value: settings.getBySpace(pluginMetadata.name, `${ele.id}`),
          hasSetting: true,
        };
      });
  }

  //App 准备好时加载
  async onLayoutReady() {
		console.log("FetchCodeSnippets onLayoutReady");
    // TODO: Handle code snippets injection

    this.codeSnippets.forEach((ele) => {
      settings.getBySpace(pluginMetadata.name, `${ele.id}`) &&
        this.insertSingleCSSByID(`${ele.id}`);
    });
  }

  async getCodeSnippets() {
    // if (this.codeSnippets.length !== 0) {
    //   return this.codeSnippets;
    // }
    return fetch(
      "https://api.github.com/repos/hqweay/siyuan-hqweay-go/issues/4/comments?per_page=100&page=0",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (response.ok) {
          if (response.ok) {
            return response.json().then((snippets) => {
              // let resultObj = JSON.parse(snippets);
              this.codeSnippets = snippets.map((ele) => {
                const body = ele.body;
                if (body.startsWith("```")) {
                  let metaInfos = body.split(/\r?\n/)[0].split("#");
                  return {
                    id: ele.node_id,
                    type: metaInfos[1] ? metaInfos[1] : "未知",
                    category: metaInfos[2] ? metaInfos[2] : "未知",
                    title: metaInfos[3] ? metaInfos[3] : "未知",
                    author: metaInfos[4] ? metaInfos[4] : "未知",
                    description: metaInfos[5] ? metaInfos[5] : "未知",
                    link: metaInfos[6] ? metaInfos[6] : "未知",
                    code: body.split(/\r?\n/).slice(1, -1).join("\r\n"),
                  };
                }
              });
              return this.codeSnippets;
            });
          } else {
            throw new Error("Failed to get file content");
          }
        } else {
          throw new Error("Failed to get file content");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
  // async insertSingleCSSByKey(key) {
  //   let configs = key.split("-");
  //   let cssConfig = snippets.find((ele) => {
  //     return ele.author === configs[0] && ele.title === configs[1];
  //   });

  //   let styleElement = document.createElement("style");
  //   styleElement.id = `snippetCSS-hqweay-${cssConfig.author}-${cssConfig.title}`;
  //   let cssSnippetContent = await getFileContent(
  //     `/data/plugins/siyuan-code-snippets/${cssConfig.path}`
  //   );
  //   if (cssSnippetContent) {
  //     styleElement.textContent += cssSnippetContent;
  //     document.head.appendChild(styleElement);
  //   }
  // }
  async insertSingleCSSByID(id) {
    let cssConfig = this.codeSnippets.find((ele) => {
      return ele.id === id;
    });

    console.log(cssConfig);

    let styleElement = document.createElement("style");
    styleElement.id = `snippetCSS-hqweay-${cssConfig.id}`;

    styleElement.textContent += cssConfig.code;
    document.head.appendChild(styleElement);
  }

  async onunloadCSSByID(id) {
    console.log("onunload");
    console.log(id);
    const styleElement = document.getElementById(`snippetCSS-hqweay-${id}`);

    if (styleElement) {
      styleElement.remove();
    } else {
    }
  }

  async onunloadCSSByKey(key) {
    let configs = key.split("-");
    let cssConfig = snippets.find((ele) => {
      return ele.author === configs[0] && ele.title === configs[1];
    });

    const styleElement = document.getElementById(
      `snippetCSS-hqweay-${cssConfig.author}-${cssConfig.title}`
    );

    if (styleElement) {
      styleElement.remove();
    } else {
    }
  }

  async insertSingleCSS(cssConfig) {
    let styleElement = document.createElement("style");
    styleElement.id = `snippetCSS-hqweay-${cssConfig.author}-${cssConfig.title}`;
    let cssSnippetContent = await getFileContent(
      `/data/plugins/siyuan-code-snippets/${cssConfig.path}`
    );
    if (cssSnippetContent) {
      styleElement.textContent += cssSnippetContent;
      document.head.appendChild(styleElement);
    }
  }

  async insertCSS() {
    let cssSnippets = await fetchSyncPost("/api/file/readDir", {
      path: "/data/plugins/siyuan-code-snippets/cssSnippets/",
    });

    cssSnippets.data.forEach(async (cssSnippet) => {
      if (cssSnippet.name.endsWith(".css")) {
        let styleElement = document.createElement("style");
        styleElement.id = `snippetCSS-hqweay-${cssSnippet.name}`;
        let cssSnippetContent = await getFileContent(
          `/data/plugins/siyuan-code-snippets/cssSnippets/${cssSnippet.name}`
        );
        styleElement.textContent += cssSnippetContent;
        document.head.appendChild(styleElement);
      }
    });
  }
}
