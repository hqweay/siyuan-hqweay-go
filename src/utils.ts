import { Client } from "@siyuan-community/siyuan-sdk";
import { getFrontend } from "siyuan";
import PluginGo from ".";

/**
 * 延迟函数
 * @param time 时间
 * @returns 返回后需await
 */
export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

//插件全局对象
export let plugin: PluginGo;
export function setPlugin(_plugin: any) {
  plugin = _plugin;
}

/**
 * 替换字符串中的导致异常的字符字符
 * @param unsafe 待处理字符串
 * @returns 处理后的字符串
 */
export function escapeHtml(unsafe: any) {
  return unsafe
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("'", "&apos;");
}

//运行环境检测
const frontEnd = getFrontend();
export const isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

/* 初始化客户端 (默认使用 Axios 发起 XHR 请求) */
export const client = new Client();

export const deepMerge = (target, source) => {
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        if (!target[key]) {
          target[key] = {};
        }
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
};


export function request(url, method = "GET") {
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
              resolve(response.text());
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

export function getFileContent(path) {
  return fetch("/api/file/getFile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
    }),
  })
    .then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error("Failed to get file content");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

