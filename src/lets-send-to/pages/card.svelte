<script lang="ts">
  import SettingPanel from "@/libs/setting-panel.svelte";
  import { settings } from "@/settings";
  import html2canvas from "html2canvas-pro";
  import { showMessage } from "siyuan";
  import { onMount } from "svelte";
  function downloadCard() {
    const card = document.querySelector(".hqweay-go-card");

    html2canvas(card, { useCORS: true, scale: 2, backgroundColor: null }).then(
      (canvas) => {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${generateTimestampWithRandom()}-card.png`;
        link.click();
      }
    );
  }

  function generateTimestampWithRandom() {
    const now = new Date(); // 获取当前时间戳
    const random = Math.floor(Math.random() * 10000); // 生成 0 到 9999 之间的随机数

    const year = now.getFullYear(); // 获取当前年份
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 获取当前年份
    const day = String(now.getDate()).padStart(2, "0"); // 获取当前日期（几号）
    const hour = String(now.getHours()).padStart(2, "0"); // 获取当前小时数
    const minute = String(now.getMinutes()).padStart(2, "0"); // 获取当前分钟数
    const second = String(now.getSeconds()).padStart(2, "0"); // 获取当前分钟数

    // 使用字符串拼接生成最终的时间戳加随机数字符串
    const timestampWithRandom = `${year}${month}${day}${hour}${minute}${second}${random.toString().padStart(4, "0")}`;

    return timestampWithRandom;
  }

  function copy() {
    const card = document.querySelector(".hqweay-go-card");

    html2canvas(card, { useCORS: true, backgroundColor: null }).then(
      function (canvas) {
        canvas.toBlob(function (blob) {
          const clipboardItem = new ClipboardItem({ "image/png": blob });
          navigator.clipboard
            .write([clipboardItem])
            .then(function () {
              console.log("图像已成功复制到剪贴板！");
            })
            .catch(function (error) {
              console.error("复制到剪贴板时发生错误:", error);
            });
        }, "image/png");
      }
    );
  }

  // export let content: string = "";
  export let originDetail: any;
  // export let originBlockElements: any;

  // const dispatch = createEventDispatcher();

  let showSetting: boolean = false;

  const iconDot = `<symbol id="iconDot" viewBox="0 0 20 20">
    <path d="M5.501 9.999c0 2.485 2.016 4.499 4.501 4.499s4.497-2.016 4.497-4.499c0-2.485-2.012-4.497-4.497-4.497s-4.501 2.012-4.501 4.497z"></path>
  </symbol>`;

  function toggleSetting() {
    showSetting = !showSetting;
  }

  // const copyBlockElements = ;

  function clearElement(element) {
    // element.classList.add("card-inner-background");
    if (element.classList.contains("protyle-wysiwyg--select")) {
      element.classList.remove("protyle-wysiwyg--select");
    } else {
      const children = element.children;
      for (let i = children.length - 1; i >= 0; i--) {
        clearElement(children[i]);
      }
    }
    return element;
  }

  onMount(() => {
    initStyle();

    document
      .querySelector(".hqweay-go-card")
      .addEventListener("click", handleClickOfFoldBindThis);
  });

  const handleClickOfFoldBindThis = handleClickOfFold.bind(this);

  function handleClickOfFold(event, ele) {
    let targetEle = event.target;
    if (ele) {
      targetEle = ele;
    }
    if (targetEle.tagName == "svg" || targetEle.tagName == "use") {
      handleClickOfFold(event, targetEle.parentElement);
      return;
    }
    if (!targetEle.classList.contains("protyle-action")) {
      return;
    }

    const foldValue = targetEle.parentElement.getAttribute("fold");

    if (foldValue === "1") {
      targetEle.parentElement.removeAttribute("fold");
    } else {
      targetEle.parentElement.setAttribute("fold", "1");
    }
  }

  $: cardHtmls = originDetail.blockElements
    .map((ele) => {
      let copyEle = ele.cloneNode(true);

      copyEle = clearElement(copyEle);

      //https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
      copyEle.querySelectorAll('[*|href="#iconDot"]').forEach((element) => {
        element.innerHTML = iconDot;
      });

      if (settingConfig.hideLi.value) {
        copyEle
          .querySelectorAll('div[class="protyle-action"]')
          .forEach((removeEle) => {
            removeEle.parentElement.removeAttribute("class");
            removeEle.remove();
          });
      }

      // copyEle.classList.add("card-inner-style");

      return copyEle.outerHTML;
    })
    // .join("</br>");
    .join("");

  let settingConfig = {
    template: {
      type: "select",
      title: "切换模板",
      description: "",
      key: "template",
      value: settings.getBySpace("card", "template"),
      ignore: true,
      options: Object.entries(
        settings.getBySpace("card", "templates")
      ).reduce((acc, [key, value]) => {
        // console.log(acc);
        acc[key] = key;
        return acc;
      }, {}),
    },
    hideLi: {
      type: "checkbox",
      title: "隐藏大纲元素前面的小点",
      description: "",
      key: "hideLi",
      value: settings.getBySpace("card", "hideLi"),
    },
    pLineHeight: {
      type: "number",
      title: "调整段落间距",
      description: "大于等于 0 则清除段落默认间距并以新的数字调整间距",
      key: "pLineHeight",
      value: settings.getBySpace("card", "pLineHeight"),
    },
    addDOCTitle: {
      type: "select",
      title: "添加文档标题",
      description: "",
      key: "addDOCTitle",
      value: settings.getBySpace("card", "addDOCTitle"),
      options: {
        none: "无",
        center: "居中",
        left: "居左",
      },
    },
    author: {
      type: "textinput",
      title: "添加一个作者名",
      description: "",
      key: "author",
      value: settings.getBySpace("card", "author"),
    },
    addTime: {
      type: "select",
      title: "添加一个时间",
      description: "",
      key: "addTime",
      value: settings.getBySpace("card", "addTime"),
      options: {
        byCreated: "当前时间",
        none: "无",
      },
    },
    cardBackgroundColor: {
      type: "textinput",
      title: "卡片颜色",
      description: "",
      key: "cardBackgroundColor",
      value: settings.getBySpace("card", "cardBackgroundColor"),
    },
    innerBackgroundColor: {
      type: "textinput",
      title: "内容块颜色",
      description: "",
      key: "innerBackgroundColor",
      value: settings.getBySpace("card", "innerBackgroundColor"),
    },
    fontColor: {
      type: "textinput",
      title: "内容字体颜色",
      description: "",
      key: "fontColor",
      value: settings.getBySpace("card", "fontColor"),
    },
    hfColor: {
      type: "textinput",
      title: "头尾字体颜色",
      description: "",
      key: "hfColor",
      value: settings.getBySpace("card", "hfColor"),
    },

    saveTemplate: {
      type: "button",
      title: "保存为模板",
      description: "",
      key: "saveTemplate",
      value: "确认",
      ignore: true,
    },
    templateName: {
      type: "textinput",
      title: "模板名",
      description: "",
      key: "templateName",
      placeholder: "输入保存的模板名",
      value: "",
      ignore: true,
    },

    deleteTemplate: {
      type: "button",
      title: "删除当前模板",
      description: "",
      key: "deleteTemplate",
      value: "确认",
      ignore: true,
    },
  };

  $: {
    SettingItems = Object.values(settingConfig);
    console.log("settingConfig");
    console.log(settingConfig);
    if (settingConfig.addTime.value === "byCreated") {
      const now = new Date();

      const year = now.getFullYear(); // 获取当前年份
      const month = String(now.getMonth() + 1).padStart(2, "0"); // 获取当前年份
      const day = String(now.getDate()).padStart(2, "0"); // 获取当前日期（几号）
      const hour = String(now.getHours()).padStart(2, "0"); // 获取当前小时数
      const minute = String(now.getMinutes()).padStart(2, "0"); // 获取当前分钟数
      fotterTime = `${year}/${month}/${day}/ ${hour}:${minute}`;
    }

    initStyle();
  }
  let SettingItems = [];
  const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
    // console.log(settings.getBySpace("card", "templates"));
    if (detail.key === "template") {
      settingConfig.templateName.value = detail.value;

      for (let key in settingConfig) {
        if (
          settings.getBySpace("card", "templates")[detail.value] &&
          settings.getBySpace("card", "templates")[detail.value][
            settingConfig[key].key
          ] !== undefined
        ) {
          settingConfig[key].value = settings.getBySpace(
            "cardConfig",
            "templates"
          )[detail.value][settingConfig[key].key];

          settings.setBySpace(
            "cardConfig",
            settingConfig[key].key,
            settingConfig[key].value
          );
        }
      }

      //@todo
      // SettingItems.forEach((oldEle) => {
      //   if (
      //     settings.getBySpace("card", "templates")[detail.value] &&
      //     settings.getBySpace("card", "templates")[detail.value][
      //       oldEle.key
      //     ] !== undefined
      //   ) {
      //     oldEle.value = settings.getBySpace("card", "templates")[
      //       detail.value
      //     ][oldEle.key];
      //   }
      // });
    }

    settingConfig[detail.key].value = detail.value;

    // for (let index = 0; index < SettingItems.length; index++) {
    //   if (SettingItems[index].key === detail.key) {
    //     SettingItems[index].value = detail.value;
    //     break;
    //   }
    // }

    if (detail.key === "templateName") {
    } else {
      console.log("save");
      settings.setBySpace("cardConfig", detail.key, detail.value);

      settings.save();
    }
  };

  const onClick = async ({ detail }: CustomEvent<ChangeEvent>) => {
    if ("saveTemplate" === detail.key) {
      if (!settingConfig.templateName.value) {
        showMessage("请输入模板名");
        return;
      }
      const templateKey = settingConfig.templateName.value;

      settingConfig.template.value = templateKey;

      settings.getBySpace("card", "templates")[`${templateKey}`] =
        SettingItems.filter((ele) => {
          return !ele.ignore;
        }).reduce((acc, obj) => {
          acc[`${obj.key}`] = obj.value;
          return acc;
        }, {});

      settings.save();

      settingConfig.template.options = Object.entries(
        settings.getBySpace("card", "templates")
      ).reduce((acc, [key, value]) => {
        acc[key] = key;
        return acc;
      }, {});
    } else if ("deleteTemplate" === detail.key) {
      if (!settingConfig.template.value) {
        showMessage("尚未选择模板");
        return;
      }

      delete settings.getBySpace("card", "templates")[
        settingConfig.template.value
      ];
      settings.save();
      settingConfig.template.options = Object.entries(
        settings.getBySpace("card", "templates")
      ).reduce((acc, [key, value]) => {
        acc[key] = key;
        return acc;
      }, {});
    }
  };

  let fotterTime = "";

  function initStyle() {
    console.log("initStyle");
    document.querySelector(".hqweay-go-card") &&
      (document.querySelector(".hqweay-go-card").style.backgroundColor =
        settingConfig.cardBackgroundColor.value);

    document.querySelector(".hqweay-go-card-body .protyle-wysiwyg") &&
      (() => {
        document.querySelector(
          ".hqweay-go-card-body .protyle-wysiwyg"
        ).style.backgroundColor = settingConfig.innerBackgroundColor.value;

        document.querySelector(".hqweay-go-card").style.color =
          settingConfig.fontColor.value;
      })();

    document.querySelector(".hqweay-go-card .header div, .footer div") &&
      document
        .querySelectorAll(".hqweay-go-card .header div, .footer div")
        .forEach((ele) => {
          ele.style.color = settingConfig.hfColor.value;
        });

    document.querySelector(
      ".p-hide-blank-hine-size .protyle-wysiwyg > div:not(.list) div[spellcheck]"
    ) &&
      document
        .querySelectorAll(
          ".p-hide-blank-hine-size .protyle-wysiwyg > div:not(.list) div[spellcheck]"
        )
        .forEach((ele) => {
          ele.style.minHeight = settingConfig.pLineHeight.value + "px";
        });
  }
</script>

<div class="menu">
  <div class="left">
    <button class="btn" on:click={downloadCard}>下载</button>
    <button class="btn" on:click={copy}>复制到剪切板</button>
  </div>
  <button class="btn" on:click={toggleSetting}>设置</button>
</div>

{#if showSetting}
  <div class="setting" style="height: 200px; overflow-y: scroll;">
    <SettingPanel
      group="设置"
      settingItems={SettingItems}
      on:changed={onChanged}
      on:click={onClick}
    ></SettingPanel>
  </div>
{/if}
<div class="fn__flex-1 fn__flex config__panel">
  <div class="hqweay-go-card">
    <!-- <div class="card-header">
      <h2 class="card-title">Card Title</h2>
    </div> -->
    <div class="header">
      {#if settingConfig.addTime.value !== "none"}
        <div contenteditable="true" class="addTime">
          {fotterTime}
        </div>
      {/if}
    </div>

    <div
      class="hqweay-go-card-body"
      class:p-hide-blank-hine={settingConfig.pLineHeight.value &&
        settingConfig.pLineHeight.value >= 0}
      class:p-hide-blank-hine-size={settingConfig.pLineHeight.value &&
        settingConfig.pLineHeight.value >= 0}
    >
      <!-- <p>{content.trim()}</p> -->
      <div class="protyle-wysiwyg">
        {#if settingConfig.addDOCTitle.value !== "none"}
          <div
            contenteditable="true"
            class="title h2"
            class:title-center={settingConfig.addDOCTitle.value === "center"}
            style="margin-bottom: 10px;"
          >
            {document
              .querySelector(
                ".layout__wnd--active .protyle.fn__flex-1:not(.fn__none) .protyle-title"
              )
              .textContent.trim()}
          </div>
        {/if}
        {@html cardHtmls}
      </div>

      <!-- <div bind:this={originDetail.blockElements}></div> -->
    </div>
    <div class="footer">
      {#if settings.getBySpace("card", "author")}
        <div contenteditable="true" class="author">
          @{settings.getBySpace("card", "author")}
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  :global(.setting .config__tab-container .b3-label:not(.b3-label--inner)) {
    box-shadow: unset !important;
  }
  :global(.hqweay-go-card-body .li:before) {
    border-left: unset !important;
  }
  :global(.hqweay-go-card-body .protyle-wysiwyg) {
    border-radius: 8px;
    // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background-color: #72c396;
  }

  :global(.hqweay-go-card-body .protyle-wysiwyg span[data-type~="mark"]) {
    background-color: unset;
    text-decoration: underline;
    // text-decoration-color: #72c396;
    text-decoration-skip-ink: auto;
  }

  :global(.p-hide-blank-hine .protyle-wysiwyg > div:not(.list)) {
    margin: 0px;
    padding: 0px;
    line-height: normal;
  }
  :global(
      .p-hide-blank-hine-size .protyle-wysiwyg > div:not(.list) div[spellcheck]
    ) {
    min-height: 0px;
  }

  :global(.p-hide-blank-hine .protyle-wysiwyg .protyle-action:hover) {
    cursor: pointer;
  }

  .title-center {
    text-align: center;
  }
  // #cardPanel {
  //   max-height: 400px;
  //   overflow-y: scroll;
  // }

  .header {
    display: flex;
    justify-content: flex-start;
    margin-top: 20px;
    margin-left: 20px;
    .addTime {
      font-size: smaller;
      color: brown;
    }
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    margin-right: 20px;
    margin-bottom: 20px;
    .author {
      font-size: smaller;
      color: brown;
    }
  }
  .menu {
    display: flex;
    justify-content: space-between;
    .btn {
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 50px;
    }

    .btn:hover {
      background-color: #0056b3;
    }
  }

  .hqweay-go-card {
    // background-color: #fff;
    background-color: beige;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 2px;
    margin-bottom: 100px;
    white-space: pre-wrap;
    min-width: 300px;
    .hqweay-go-card-body {
      margin-right: 20px;
      margin-left: 20px;

      // margin-bottom: 8px;
      // border-left: unset !important;
    }
    // * {
    // background-color: white !important;
    // }
  }
  // .hqweay-go-card-inner-style {
  //   .li:before {
  //     border-left: unset !important;
  //   }
  // }
  // .hqweay-go-card-inner-background {
  //   background-color: aliceblue !important;
  //   // background-color: beige !important;
  // }
</style>
