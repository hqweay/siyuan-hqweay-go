// import { settings } from "@/settings";
// import { openMobileFileById, showMessage } from "siyuan";
// import { plugin } from "@/utils";
// export default class MobileHelper {
//   constructor() {
//     this.navBar = null;
//     this.isMobile = false;

//     // 使用思源的后退栈，自己维护前进栈
//     this.forwardStack = [];
//     this.isNavigating = false;
//   }

//   onload() {
//     this.isMobile = this.detectMobile();
//     if (this.isMobile && settings.getFlag("mobileHelper")) {
//       this.createBottomNavigation();
//     }

//     // 监听配置变化
//     this.configChangeHandler = () => {
//       this.recreate();
//     };

//     // 监听窗口大小变化，重新检测移动端
//     this.resizeHandler = () => {
//       const wasMobile = this.isMobile;
//       this.isMobile = this.detectMobile();

//       // 如果移动端状态发生变化，重新创建或移除导航栏
//       if (wasMobile !== this.isMobile) {
//         this.recreate();
//       }
//     };

//     window.addEventListener("resize", this.resizeHandler);
//   }

//   onunload() {
//     if (this.navBar) {
//       this.navBar.remove();
//       this.navBar = null;
//     }

//     // 清理事件监听器
//     if (this.resizeHandler) {
//       window.removeEventListener("resize", this.resizeHandler);
//     }
//   }

//   detectMobile() {
//     // 检测是否为移动端
//     return (
//       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         navigator.userAgent
//       ) ||
//       window.innerWidth <= 768 ||
//       document.documentElement.clientWidth <= 768
//     );
//   }

//   createBottomNavigation() {
//     if (this.navBar) {
//       this.navBar.remove();
//     }

//     const config = settings.get("mobileHelperConfig");
//     if (!config.enableBottomNav) return;

//     // 创建导航栏容器
//     this.navBar = document.createElement("div");
//     this.navBar.id = "siyuan-mobile-nav-bar";
//     this.navBar.style.cssText = `
//       position: fixed;
//       bottom: 0;
//       left: 0;
//       right: 0;
//       width: 100%;
//       height: ${config.navBarHeight};
//       background-color: ${config.backgroundColor};
//       border-top: 1px solid #e0e0e0;
//       display: flex;
//       justify-content: space-around;
//       align-items: center;
//     /**  z-index: 9999; */
//       box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
//       padding: 8px 0;
//       box-sizing: border-box;
//     `;

//     // 添加按钮
//     if (config.showBackButton) {
//       this.addNavButton(
//         "后退",
//         "←",
//         this.goBack.bind(this),
//         config,
//         "nav-back-button"
//       );
//     }

//     if (config.showForwardButton) {
//       this.addNavButton(
//         "前进",
//         "→",
//         this.goForward.bind(this),
//         config,
//         "nav-forward-button"
//       );
//     }

//     // if (config.showContextButton) {
//     //   this.addNavButton("上下文", "🔍", this.goContext.bind(this), config);
//     // }

//     if (config.showRandomButton) {
//       this.addNavButton("随机", "🎲", this.goRandom.bind(this), config);
//     }

//     if (config.showCustomLinksButton) {
//       this.addCustomLinksButton(config);
//     }

//     // 添加到页面
//     document.body.appendChild(this.navBar);

//     // 调整页面底部边距，避免内容被导航栏遮挡
//     this.adjustBodyPadding();

//     // 初始化按钮状态
//     // this.updateButtonStatus();
//   }

//   // 更新按钮状态（启用/禁用）
//   // updateButtonStatus() {
//   //   const backButton = this.navBar?.querySelector(".nav-back-button");
//   //   const forwardButton = this.navBar?.querySelector(".nav-forward-button");

//   //   console.log(backButton);

//   //   if (backButton) {
//   //     backButton.disabled = window.siyuan.backStack.length === 0;
//   //     backButton.style.opacity =
//   //       window.siyuan.backStack.length === 0 ? "0.5" : "1";
//   //   }

//   //   if (forwardButton) {
//   //     forwardButton.disabled = this.forwardStack.length === 0;
//   //     forwardButton.style.opacity =
//   //       this.forwardStack.length === 0 ? "0.5" : "1";
//   //   }
//   // }

//   addNavButton(text, icon, onClick, config, className = "") {
//     const button = document.createElement("button");
//     button.innerHTML = `
//       <div style="font-size: 20px; margin-bottom: 2px;">${icon}</div>
//       <div style="font-size: 12px; color: ${config.buttonColor};">${text}</div>
//     `;
//     button.style.cssText = `
//       background: none;
//       border: none;
//       color: ${config.buttonColor};
//       cursor: pointer;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: 8px 16px;
//       border-radius: 8px;
//       transition: background-color 0.2s, opacity 0.2s;
//       min-width: 60px;
//     `;

//     if (className) {
//       button.classList.add(className);
//     }

//     button.addEventListener("click", onClick);
//     button.addEventListener("mouseenter", () => {
//       if (!button.disabled) {
//         button.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
//       }
//     });
//     button.addEventListener("mouseleave", () => {
//       button.style.backgroundColor = "transparent";
//     });

//     this.navBar.appendChild(button);
//     return button;
//   }

//   addCustomLinksButton(config) {
//     // 创建按钮容器
//     const buttonContainer = document.createElement("div");
//     buttonContainer.style.cssText = `
//       position: relative;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//     `;

//     // 创建主按钮
//     const button = document.createElement("button");
//     button.innerHTML = `
//       <div style="font-size: 20px; margin-bottom: 2px;">🔗</div>
//       <div style="font-size: 12px; color: ${config.buttonColor};">更多</div>
//     `;
//     button.style.cssText = `
//       background: none;
//       border: none;
//       color: ${config.buttonColor};
//       cursor: pointer;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       padding: 8px 16px;
//       border-radius: 8px;
//       transition: background-color 0.2s, opacity 0.2s;
//       min-width: 60px;
//     `;

//     // 创建下拉菜单
//     const dropdown = document.createElement("div");
//     dropdown.style.cssText = `
//       position: absolute;
//       top: -10px;
//       left: 50%;
//       transform: translateX(-50%) translateY(-100%);
//       background-color: ${config.backgroundColor || "#ffffff"};
//       border-radius: 8px;
//       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
//       padding: 8px 0;
//       min-width: 150px;
//       display: none;
//       z-index: 1000;
//       max-height: 300px;
//       overflow-y: auto;
//     `;

//     // 解析并添加自定义链接
//     const customLinks = config.customLinks || "";
//     const links = customLinks.split("\n").filter((line) => line.trim());

//     links.forEach(async (link) => {
//       const parts = link.split("====");
//       if (parts.length >= 2) {
//         const name = parts[0].trim();
//         const url = parts[1].trim();

//         const linkItem = document.createElement("a");
//         linkItem.textContent = name;
//         linkItem.style.cssText = `
//           display: block;
//           padding: 8px 16px;
//           color: ${config.buttonColor || "#333333"};
//           text-decoration: none;
//           font-size: 14px;
//           text-align: center;
//         `;

//         if (!url.toLowerCase().startsWith("select ")) {
//           linkItem.href = `${url}`;
//         } else {
//           const exeSQL = `select id from (${url}) ORDER BY RANDOM() limit 1`;
//           linkItem.addEventListener("click", async (e) => {
//             e.stopPropagation();
//             try {
//               // 使用思源笔记的API执行SQL查询
//               const response = await fetch("/api/query/sql", {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                   stmt: exeSQL,
//                 }),
//               });

//               if (response.ok) {
//                 const data = await response.json();
//                 if (data.data && data.data.length > 0) {
//                   const randomDocId = data.data[0].id;
//                   this.openDocById(randomDocId);
//                 } else {
//                   console.error("随机查询未返回结果");
//                   showMessage(
//                     "随机查询未返回结果，请检查SQL语句",
//                     3000,
//                     "error"
//                   );
//                 }
//               }
//             } catch (error) {
//               console.error("随机查询执行失败:", error);
//               showMessage("随机查询执行失败: " + error.message, 3000, "error");
//             }
//             // dropdown.style.display = "none";
//           });
//         }
//         // linkItem.addEventListener("click", (e) => {
//         //   e.stopPropagation();
//         //   // window.open(url, "_blank");
//         //   window.openFile(url);
//         //   dropdown.style.display = "none";
//         // });

//         linkItem.addEventListener("mouseenter", () => {
//           linkItem.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
//         });

//         linkItem.addEventListener("mouseleave", () => {
//           linkItem.style.backgroundColor = "transparent";
//         });

//         dropdown.appendChild(linkItem);
//       }
//     });

//     // 如果没有链接，添加提示
//     if (links.length === 0) {
//       const noLinks = document.createElement("div");
//       noLinks.textContent = "未配置链接";
//       noLinks.style.cssText = `
//         padding: 8px 16px;
//         color: #999;
//         font-size: 14px;
//         text-align: center;
//       `;
//       dropdown.appendChild(noLinks);
//     }

//     // 点击按钮显示/隐藏下拉菜单
//     button.addEventListener("click", (e) => {
//       e.stopPropagation();
//       const isVisible = dropdown.style.display === "block";
//       dropdown.style.display = isVisible ? "none" : "block";
//     });

//     // 点击其他地方关闭下拉菜单
//     document.addEventListener("click", () => {
//       dropdown.style.display = "none";
//     });

//     // 鼠标悬停效果
//     button.addEventListener("mouseenter", () => {
//       button.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
//     });

//     button.addEventListener("mouseleave", () => {
//       button.style.backgroundColor = "transparent";
//     });

//     // 组装并添加到导航栏
//     buttonContainer.appendChild(button);
//     buttonContainer.appendChild(dropdown);
//     this.navBar.appendChild(buttonContainer);
//   }

//   goBack() {
//     console.log(window.siyuan.backStack);
//     // 使用思源的后退栈
//     if (
//       window.siyuan &&
//       window.siyuan.backStack &&
//       window.siyuan.backStack.length > 0
//     ) {
//       // 标记为正在导航，避免重复记录历史
//       this.isNavigating = true;

//       // 获取当前文档ID
//       const currentId = this.getCurrentDocId();

//       console.log("currentId");
//       // console.log(window.location);
//       console.log(currentId);
//       // 如果有当前文档ID，将其添加到前进栈
//       if (currentId) {
//         this.forwardStack.push({ id: currentId });
//       }

//       // 从思源的后退栈中取出上一个文档
//       const prevDoc = window.siyuan.backStack.pop();

//       // 导航到上一个文档
//       // @ts-ignore
//       if (prevDoc && prevDoc.id) {
//         // @ts-ignore
//         this.openDocById(prevDoc.id);
//       } else {
//         showMessage("已经到头啦");
//       }
//       // 刷新按钮状态
//       // this.updateButtonStatus();
//     }
//   }

//   goForward() {
//     console.log(this.forwardStack);
//     // 使用自己维护的前进栈
//     if (this.forwardStack.length > 0) {
//       // 标记为正在导航，避免重复记录历史
//       this.isNavigating = true;

//       // 获取当前文档ID
//       const currentId = this.getCurrentDocId();

//       // 如果有当前文档ID，将其添加到思源的后退栈
//       if (currentId && window.siyuan && window.siyuan.backStack) {
//         window.siyuan.backStack.push({ id: currentId });
//       }

//       // 从前进栈中取出下一个文档
//       const nextDoc = this.forwardStack.pop();

//       // 导航到下一个文档
//       if (nextDoc && nextDoc.id) {
//         this.openDocById(nextDoc.id);
//       } else {
//         showMessage("已经到头啦");
//       }
//       // 刷新按钮状态
//       // this.updateButtonStatus();
//     }
//   }

//   // 获取当前文档ID
//   getCurrentDocId() {
//     const editor = document.querySelector("#editor");
//     if (!editor) {
//       return;
//     }
//     const eleTitle = editor.querySelector(".protyle-content .protyle-title");
//     let docId = eleTitle?.getAttribute("data-node-id");
//     return docId;
//   }

//   // 打开指定ID的文档
//   openDocById(id) {
//     openMobileFileById(plugin.app, id);
//   }

//   async goRandom() {
//     try {
//       // 获取配置的SQL查询语句
//       const config = settings.get("mobileHelperConfig");
//       const randomSql =
//         config.randomSql || "SELECT id FROM blocks WHERE type = 'd'";

//       const exeSQL = `select id from (${randomSql}) ORDER BY RANDOM() limit 1`;
//       // 使用思源笔记的API执行SQL查询
//       const response = await fetch("/api/query/sql", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           stmt: exeSQL,
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.data && data.data.length > 0) {
//           const randomDocId = data.data[0].id;
//           // 跳转到随机文档
//           this.openDocById(randomDocId);
//         } else {
//           console.error("随机查询未返回结果");
//           showMessage("随机查询未返回结果，请检查SQL语句", 3000, "error");
//         }
//       }
//     } catch (error) {
//       console.error("随机查询执行失败:", error);
//       showMessage("随机查询执行失败: " + error.message, 3000, "error");
//     }
//   }

//   adjustBodyPadding() {
//     const config = settings.get("mobileHelperConfig");
//     const navHeight = parseInt(config.navBarHeight);
//     document.body.style.paddingBottom = `${navHeight + 10}px`;
//   }

//   // 重新创建导航栏（用于配置更新）
//   recreate() {
//     this.onunload();
//     if (this.isMobile && settings.getFlag("mobileHelper")) {
//       this.createBottomNavigation();
//     }
//   }
// }
