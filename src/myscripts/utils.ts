import { Dialog, showMessage } from "siyuan";

export function cleanSpacesBetweenChineseCharacters(text) {
  return (
    text
      // 只合并连续的空格和制表符，不影响换行
      // 第一行：移除中文字符之间的空格
      .replace(/(?<=[\u4e00-\u9fa5])[ \t]+(?=[\u4e00-\u9fa5])/g, "")

      // 第二行：将多个连续空格合并为单个空格
      .replace(/ +/g, " ")
  );
}
export function generateSQLKey(sql) {
  return sql.toUpperCase().replace(/[^A-Z0-9_]/g, ""); // 只保留字母数字下划线
}

export const selectIconDialog = () => {
  const symbols = document.querySelectorAll("symbol");
  const html = `
    <div class="icons" style="margin: 10px;">
        ${Array.from(symbols)
          .map((symbol) => {
            return `<svg style="width: 20px; height: 20px; padding: 5px; cursor: pointer;"><use xlink:href="#${symbol.id}"></use></svg>`;
          })
          .join("\n")}
    </div>
    `;
  const dialog = new Dialog({
    title: "选择图标",
    content: html,
    width: "500px",
    height: "400px",
  });
  dialog.element.querySelector(".icons").addEventListener("click", (e) => {
    const target = e.target as SVGElement;
    let icon = "";
    if (target.tagName === "svg") {
      icon = target
        .querySelector("use")
        .getAttribute("xlink:href")
        .replace("#", "");
    } else if (target.tagName === "use") {
      icon = target.getAttribute("xlink:href").replace("#", "");
    } else {
      return;
    }
    navigator.clipboard.writeText(icon).then(() => {
      showMessage(`复制到剪贴板: #${icon}`, 2000);
    });
  });
};

/**
 * 执行思源笔记Transaction操作的通用函数
 * @param {Array} operationsForAPI - 要执行的操作数组
 * @returns {Promise<Object>} API响应结果
 */
export async function executeTransaction(operationsForAPI) {
  if (!operationsForAPI || operationsForAPI.length === 0) {
    throw new Error("operationsForAPI不能为空");
  }

  const data = {
    session: window.siyuan?.ws?.app?.appId,
    app: window.siyuan?.ws?.app?.appId,
    reqId: Date.now(),
    transactions: [{ doOperations: operationsForAPI }],
  };

  try {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.code !== 0) {
      throw new Error(`Transaction失败: ${result.msg}`);
    }

    return result;
  } catch (error) {
    console.error("Transaction执行失败", {
      error: error.message,
      operationsForAPI: operationsForAPI,
    });
    throw error;
  }
}
