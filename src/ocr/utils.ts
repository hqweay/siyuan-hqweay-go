/**
 * 调用 macOS Vision OCR
 * @param imagePath 本地图片绝对路径
 * @returns Promise<string> OCR识别结果
 */
/**
 * 调用 macOS Vision OCR
 * @param imagePath 本地图片绝对路径
 * @param autoRemoveLineBreaks
 * @param removeLineBreaks 是否移除OCR后的换行（默认为false保留换行）
 * @returns Promise<string> OCR识别结果
 */
export function macOCRByAppleScript(imagePath: string): Promise<string> {
  const path = require("path");
  return new Promise((resolve, reject) => {
    // AppleScript 文件路径
    const scriptPath = path.join(
      `${window.siyuan.config.system.workspaceDir}/data/plugins/siyuan-hqweay-go`,
      "visionOCR.scpt"
    );

    // 调用 osascript 执行 AppleScript
    const cmd = `osascript "${scriptPath}" "${imagePath}"`;
    const { exec } = require("child_process");
    exec(
      cmd,
      { encoding: "buffer" },
      (err: any, stdout: Buffer, stderr: Buffer) => {
        if (err) {
          reject(err);
        } else {
          let text = stdout.toString("utf8").trim();
          console.log(text); // 打印真实文本
          resolve(text);
        }
      }
    );
  });
}

export function macOCRBySwift(imagePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = `${window.siyuan.config.system.workspaceDir}/data/plugins/siyuan-hqweay-go/swiftOCR/release/swiftOCR "${imagePath}"`;
    const { exec } = require("child_process");
    exec(cmd, { encoding: "buffer" }, (err, stdout) => {
      if (err) reject(err);
      else {
        console.log(stdout.toString("utf8").trim());
        console.log(stdout);
        resolve(stdout.toString("utf8").trim());
      }
    });
  });
}

// 使用示例
async function testOCR() {
  const imgPath = "/Users/yourname/Desktop/test.png"; // 替换为图片路径
  try {
    const text = await macOCRBySwift(imgPath);
    console.log("OCR结果：", text);
  } catch (e) {
    console.error("OCR失败：", e);
  }
}
