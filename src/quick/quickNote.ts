// thanks for https://github.com/suka233/siyuan-knote
import { showMessage } from "siyuan";
import ProtyleComponent from "./quickNote.svelte";
import { createDailynote, isMobile } from "@frostime/siyuan-plugin-kits";
import { settings } from "@/settings";

let quickInputWin: any = null;

export async function quickNoteOnload(muPlugin) {
  // 如果不是移动端且不是子窗口，创建快速输入窗口
  if (
    !isMobile() &&
    !window.location.href.includes("window.html") &&
    !window.location.search.includes("quick-input=true")
  ) {
    initQuickInputWindow();
  }
  // 如果是快速输入子窗口，创建输入界面
  else if (window.location.search.includes("quick-input=true")) {
    initQuickInputUI();
  }

  // 添加全局快捷键命令
  muPlugin.addCommand({
    langKey: "openQuickInput",
    hotkey: "F10", // 默认使用F10快捷键
    globalCallback: () => {
      toggleQuickInputWindow();
    },
  });
}

// 初始化快速输入窗口
function initQuickInputWindow() {
  // 主窗口创建逻辑
  const { BrowserWindow } = require("@electron/remote");

  quickInputWin = new BrowserWindow({
    width: 400,
    height: 500, // 增加高度以适应编辑器
    minWidth: 300,
    minHeight: 300,
    show: false,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: "quick-input",
    titleBarStyle: "hidden",
    webPreferences: {
      enablePreferredSizeMode: true,
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
      webSecurity: false,
      autoplayPolicy: "user-gesture-required",
    },
  });

  // 存储窗口状态
  localStorage.setItem("quick-input-visible", "false");
  localStorage.setItem("quick-input-pin", "false");

  // 窗口失焦时隐藏
  quickInputWin.on("blur", () => {
    if (localStorage.getItem("quick-input-pin") === "true") return;
    hideQuickInputWindow();
  });

  quickInputWin.on("show", () => {
    localStorage.setItem("quick-input-visible", "true");
    // 窗口显示时聚焦到编辑器
    setTimeout(() => {
      quickInputWin.webContents.executeJavaScript(`
        if (window.focusEditor) {
          window.focusEditor();
        }
      `);
    }, 100);
  });

  quickInputWin.on("hide", () => {
    localStorage.setItem("quick-input-visible", "false");
  });

  // 窗口关闭时清理引用
  quickInputWin.on("closed", () => {
    quickInputWin = null;
    localStorage.setItem("quick-input-visible", "false");
  });

  // 加载窗口内容
  quickInputWin.loadURL(
    `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?quick-input=true`
  );

  // 监听存储事件以控制窗口
  addEventListener("storage", (e) => {
    if (e.key === "quick-input-visible") {
      if (e.newValue === "true") {
        showQuickInputWindow();
      } else {
        hideQuickInputWindow();
      }
    }
  });

  // 主窗口关闭时销毁快速输入窗口
  addEventListener("beforeunload", () => {
    if (quickInputWin) {
      quickInputWin.destroy();
      quickInputWin = null;
    }
  });

  quickInputWin.webContents.on("before-input-event", (event, input) => {
    if (input.type === "keyDown" && input.code === "F12") {
      quickInputWin.webContents.openDevTools();
      event.preventDefault();
    }

    // ESC键关闭窗口
    if (input.type === "keyDown" && input.code === "Escape") {
      if (localStorage.getItem("quick-input-pin") !== "true") {
        hideQuickInputWindow();
        event.preventDefault();
      }
    }
  });
}

// 初始化快速输入UI
async function initQuickInputUI() {
  // 添加样式确保编辑器正常显示
  const style = document.createElement("style");
  style.textContent = `
    body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      background-color: var(--b3-theme-background);
    }
    
    #protyle-editor-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);

  const editorContainer = document.createElement("div");
  editorContainer.id = "protyle-editor-container";
  document.body.appendChild(editorContainer);
  const config = settings.get("createDailyNoteConfig");
  const blockId = await createDailynote(config.noteBookID);

  if (!blockId) {
    console.log("创建日记失败");
    return null;
  }

  // 初始化Protyle编辑器
  new ProtyleComponent({
    target: editorContainer,
    props: {
      blockId: blockId,
    },
  });

  // 暴露方法给全局
  (window as any).focusEditor = () => {
    const editor = document.querySelector(".protyle") as HTMLElement;
    if (editor) {
      editor.focus();
    }
  };

  // 暴露窗口控制方法
  (window as any).windowControls = {
    minimize: () => {
      const { remote } = require("electron");
      remote.getCurrentWindow().minimize();
    },
    maximize: () => {
      const { remote } = require("electron");
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    },
    toggleMaximize: () => {
      const { remote } = require("electron");
      const win = remote.getCurrentWindow();
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    },
    close: () => {
      const { remote } = require("electron");
      remote.getCurrentWindow().close();
    },
  };
}
// 检查窗口是否有效
function isWindowValid() {
  return quickInputWin && !quickInputWin.isDestroyed();
}

// 显示快速输入窗口
function showQuickInputWindow() {
  if (!isWindowValid()) {
    // 如果窗口不存在或已销毁，重新创建
    initQuickInputWindow();
    // 给窗口一点时间初始化
    setTimeout(() => {
      if (quickInputWin) {
        quickInputWin.show();
        quickInputWin.focus();
      }
    }, 100);
    // return;
  } else {
    quickInputWin.show();
    quickInputWin.focus();
  }
}

// 隐藏快速输入窗口
function hideQuickInputWindow() {
  if (isWindowValid()) {
    quickInputWin.hide();
  }
}

// 切换快速输入窗口状态
function toggleQuickInputWindow() {
  const isVisible = localStorage.getItem("quick-input-visible") === "true";

  showMessage("1" + isVisible);

  if (isVisible) {
    hideQuickInputWindow();
  } else {
    showQuickInputWindow();
  }
}
