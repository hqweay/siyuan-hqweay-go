<script lang="ts">
  import SettingItem from "@/libs/setting-item.svelte";
  import SettingPanel from "@/libs/setting-panel.svelte";
  import { settings } from "@/settings";
  import html2canvas from "html2canvas-pro";
  import { afterUpdate, createEventDispatcher, onMount } from "svelte";
  function downloadCard() {
    const card = document.querySelector(".hqweay-go-card");

    html2canvas(card, { useCORS: true, backgroundColor: null }).then(
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
    const month = now.getMonth() + 1; // 获取当前年份
    const day = now.getDate(); // 获取当前日期（几号）
    const hour = now.getHours(); // 获取当前小时数
    const minute = now.getMinutes(); // 获取当前分钟数
    const second = now.getSeconds(); // 获取当前分钟数

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
  });

  $: cardHtmls = originDetail.blockElements
    .map((ele) => {
      let copyEle = ele.cloneNode(true);

      copyEle = clearElement(copyEle);

      //https://stackoverflow.com/questions/23034283/is-it-possible-to-use-htmls-queryselector-to-select-by-xlink-attribute-in-an
      copyEle.querySelectorAll('[*|href="#iconDot"]').forEach((element) => {
        element.innerHTML = iconDot;
      });
      if (SettingItems[0].value) {
        copyEle
          .querySelectorAll('div[class="protyle-action"]')
          .forEach((removeEle) => {
            removeEle.remove();
          });
      }
      // copyEle.classList.add("card-inner-style");

      return copyEle.outerHTML;
    })
    .join("</br>");

  let SettingItems = [
    {
      type: "checkbox",
      title: "隐藏到大纲元素前面的小点",
      description: "",
      key: "hideLi",
      value: settings.getBySpace("cardConfig", "hideLi"),
    },
    {
      type: "textinput",
      title: "添加一个作者名",
      description: "",
      key: "author",
      value: settings.getBySpace("cardConfig", "author"),
    },
    {
      type: "select",
      title: "添加一个时间",
      description: "",
      key: "addTime",
      value: settings.getBySpace("cardConfig", "addTime"),
      options: {
        byCreated: "当前时间",
        none: "无",
      },
    },
    {
      type: "textinput",
      title: "卡片颜色",
      description: "",
      key: "cardBackgroundColor",
      value: settings.getBySpace("cardConfig", "cardBackgroundColor"),
    },
    {
      type: "textinput",
      title: "内容块颜色",
      description: "",
      key: "innerBackgroundColor",
      value: settings.getBySpace("cardConfig", "innerBackgroundColor"),
    },
    {
      type: "textinput",
      title: "字体颜色",
      description: "",
      key: "fontColor",
      value: settings.getBySpace("cardConfig", "fontColor"),
    },
  ];
  const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
    settings.setBySpace("cardConfig", detail.key, detail.value);

    for (let index = 0; index < SettingItems.length; index++) {
      if (SettingItems[index].key === detail.key) {
        SettingItems[index].value = detail.value;
        break;
      }
    }
    settings.save();
    console.log(detail);
    console.log(SettingItems);
  };

  let fotterTime = "";

  function initStyle() {
    document.querySelector(".hqweay-go-card") &&
      (document.querySelector(".hqweay-go-card").style.backgroundColor =
        SettingItems[3].value);
    document.querySelector(".hqweay-go-card-body .protyle-wysiwyg") &&
      (() => {
        document.querySelector(
          ".hqweay-go-card-body .protyle-wysiwyg"
        ).style.backgroundColor = SettingItems[4].value;

        document.querySelector(".hqweay-go-card").style.color =
          SettingItems[5].value;
      })();
  }
  $: {
    if (SettingItems[2].value === "byCreated") {
      const now = new Date();

      const year = now.getFullYear(); // 获取当前年份
      const month = now.getMonth() + 1; // 获取当前年份
      const day = now.getDate(); // 获取当前日期（几号）
      const hour = now.getHours(); // 获取当前小时数
      const minute = now.getMinutes(); // 获取当前分钟数
      fotterTime = `${year}/${month}/${day}/ ${hour}:${minute}`;
    }

    initStyle();
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
  <div class="setting">
    <SettingPanel
      group="设置"
      settingItems={SettingItems}
      on:changed={onChanged}
    ></SettingPanel>
  </div>
{/if}
<div class="fn__flex-1 fn__flex config__panel">
  <div class="hqweay-go-card">
    <!-- <div class="card-header">
      <h2 class="card-title">Card Title</h2>
    </div> -->
    <div class="header">
      {#if SettingItems[2].value !== "none"}
        <div class="addTime">
          {fotterTime}
        </div>
      {/if}
    </div>

    <div class="hqweay-go-card-body">
      <!-- <p>{content.trim()}</p> -->
      <div class="protyle-wysiwyg">
        {@html cardHtmls}
      </div>

      <!-- <div bind:this={originDetail.blockElements}></div> -->
    </div>
    <div class="footer">
      {#if settings.getBySpace("cardConfig", "author")}
        <div class="author">
          @{settings.getBySpace("cardConfig", "author")}
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
