// thanks for https://github.com/suka233/siyuan-knote
import {
  createDailynote,
  isMobile,
  updateStyleDom,
} from "@frostime/siyuan-plugin-kits";
import ProtyleComponent from "./quickNote.svelte";
import { getDiaryNoteBookId } from "../util";
import { plugin } from "@/utils";
import { showMessage } from "siyuan";

let quickInputWin: any = null;
let __winCount = 0;

// 主窗口为创建日记的唯一权威：每次窗口显示只创建一次，结果写入 quick-input-target-block 供子窗口渲染
let resolveSeq = 0;
async function resolveDiaryInMain() {
  const seq = ++resolveSeq;
  const noteBookID = await getDiaryNoteBookId();
  if (!noteBookID) {
    showMessage(
      plugin.i18n["lets-how-to-write-diary.noDiaryNoteBook"] ||
        "未检测到日记笔记本，请在思源笔记中打开并选择日记笔记本"
    );
    return;
  }
  const blockId = await createDailynote(noteBookID);
  if (blockId && seq === resolveSeq) {
    localStorage.setItem("quick-input-target-block", blockId);
    diag("main resolveDiary -> target block", blockId);
  }
}

let __diag = 0;
const __win = window.location.search.includes("quick-input=true") ? "CHILD" : "MAIN";
function diag(...args: any[]) {
  console.log(`[quickNote-diag#${++__diag} ${__win}]`, ...args);
}

export async function quickNoteOnload() {
  diag("quickNoteOnload", window.location.href, window.location.search);
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

  // 添加全局快捷键命令（子窗口不注册，避免 F10 在子窗口触发窗口管理逻辑）
  if (!window.location.search.includes("quick-input=true")) {
    plugin.addCommand({
      langKey: "openQuickInput",
      hotkey: "F10", // 默认使用F10快捷键
      globalCallback: () => {
        toggleQuickInputWindow();
      },
    });
  }
}

// 初始化快速输入窗口
function initQuickInputWindow() {
  // onload 可能因 onDataChanged 重入，避免创建重复窗口导致双监听
  if (quickInputWin && !quickInputWin.isDestroyed()) {
    diag("initQuickInputWindow SKIP (window alive)");
    return;
  }
  diag("initQuickInputWindow create, winCount=", ++__winCount);

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
    diag("window show event -> set visible true");
    localStorage.setItem("quick-input-visible", "true");
    // 主窗口作为唯一创建权威：每次显示只创建一次日记并通知子窗口渲染
    resolveDiaryInMain();
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
    diag("window hide event -> set visible false");
    localStorage.setItem("quick-input-visible", "false");
  });

  // 窗口关闭时清理引用
  quickInputWin.on("closed", () => {
    quickInputWin = null;
    localStorage.setItem("quick-input-visible", "false");
  });

  // 加载窗口内容
  quickInputWin.loadURL(
    `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?quick-input=true`,
  );

  // 监听存储事件以控制窗口
  addEventListener("storage", (e) => {
    diag("storage event(main listener)", e.key, e.oldValue, "->", e.newValue);
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
  // onload 可能因 onDataChanged 重入，幂等防止重复监听与重复兜底
  if (document.getElementById("protyle-editor-container")) {
    diag("initQuickInputUI SKIP (container exists)");
    return;
  }
  diag("initQuickInputUI init");

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
  // 修复打开文档时，面包屑栏隐藏的问题
  updateStyleDom(
    "fix-breadcrumb-style",
    `#protyle-editor-container .protyle-breadcrumb__bar--hide {
              opacity: unset !important;
          }
              .block__icon{
              display: none !important;
              }
              #protyle-editor-container .fn__loading.wysiwygLoading{
          display: none !important;
        }
      `,
  );

  let currentBlockId = "";
  let editorComponent: any = null;

  const renderBlock = (blockId: string) => {
    if (blockId === currentBlockId) {
      return;
    }
    diag("render block", blockId, "current=", currentBlockId);
    // 销毁旧编辑器并重建绑定新块
    editorComponent?.$destroy();
    editorComponent = new ProtyleComponent({
      target: editorContainer,
      props: {
        blockId: blockId,
      },
    });
    currentBlockId = blockId;
  };

  // 子窗口不再创建日记，仅渲染主窗口写入的目标块
  addEventListener("storage", (e) => {
    diag("storage event", e.key, e.oldValue, "->", e.newValue);
    if (e.key === "quick-input-target-block" && e.newValue) {
      renderBlock(e.newValue);
    }
  });

  // 启动兜底：若子窗口初始化较慢错过了写入事件，渲染当前目标
  const target = localStorage.getItem("quick-input-target-block");
  if (target) {
    diag("boot fallback render target", target);
    renderBlock(target);
  }

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
  diag("showQuickInputWindow called, valid=", isWindowValid());
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
  diag("hideQuickInputWindow called, valid=", isWindowValid());
  if (isWindowValid()) {
    quickInputWin.hide();
  }
}

// 切换快速输入窗口状态
function toggleQuickInputWindow() {
  const isVisible = localStorage.getItem("quick-input-visible") === "true";
  diag("toggleQuickInputWindow called, isVisible=", isVisible);

  if (isVisible) {
    hideQuickInputWindow();
  } else {
    showQuickInputWindow();
  }
}
