import { showMessage } from "siyuan";

type umi_ocr_res = {
  code: number;
  data: {
    box: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ];
    score: number;
    text: string;
    end: string;
  }[];
  score: number;
  time: number;
  timestamp: number;
};

let umiEnabled = {
  time: Date.now(),
};

declare const require: any;
const fs = require("fs");
const path = require("path");

/**
 * 调用 umi-ocr API
 * @param imagePath 本地图片绝对路径
 * @param umiApi umi-ocr API 地址
 * @returns Promise<string> OCR识别结果
 */
export async function umiOCR(
  imagePath: string,
  umiApi: string
): Promise<string> {
  try {
    // 检查 API 是否可用
    await umiOcrEnabled(umiApi);

    // 读取图片文件并转换为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imgBase64 = imageBuffer.toString("base64");

    // 调用 API
    const res: umi_ocr_res = await fetch(umiApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64: imgBase64,
      }),
    }).then((r) => r.json());

    if (res.code === 101) {
      // 未找到文字
      return "";
    } else if (res.code !== 100) {
      showMessage(
        "umi-ocr 失败<br/>" + JSON.stringify(res.data),
        5000,
        "error"
      );
      throw new Error("umi-ocr API error: " + res.code);
    }

    // 刷新启动判断计时
    umiEnabled.time = Date.now();

    // 拼接所有识别的文字
    return res.data.map((item) => item.text).join("\n");
  } catch (error) {
    console.error("umi-ocr error:", error);
    throw error;
  }
}

async function umiOcrEnabled(umiApi: string) {
  if (Date.now() - umiEnabled.time > 3000) {
    await fetch(umiApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64: "",
      }),
    })
      .then((r) => r.json())
      .catch((_e) => {
        showMessage(`umi-ocr 似乎未启动，请启动`, 10000, "error");
        throw new ocr_enabled_Error("umi-ocr 未启动");
      });
    umiEnabled.time = Date.now();
  }
  return Date.now() - umiEnabled.time < 3000;
}

export class ocr_enabled_Error extends Error {}
