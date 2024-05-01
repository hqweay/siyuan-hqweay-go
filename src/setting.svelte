<script lang="ts">
  import { settings } from "@/settings";
  import { showMessage } from "siyuan";
  import { onDestroy } from "svelte";
  import SettingPanel from "./libs/setting-panel.svelte";
  // let groups: string[] = ["Default", "自动获取链接标题"];

  const initData = () => {
    return {
      开关: [
        {
          type: "checkbox",
          title: "随机浏览",
          description:
            "在界面右上角生成一个随机图标，点击可跳转指定 id 条目；由于跳转通过 SQL 配置，你也可以配置固定跳转到某个块或文档。",
          key: "randomNote",
          value: settings.getFlag("randomNote"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "随机题头图",
          description: "支持配置本地文件夹/自定义 URL",
          key: "randomHeaderImage",
          value: settings.getFlag("randomHeaderImage"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "自动获取链接标题",
          description: "粘贴链接时自动获取标题并以 markdown 形式的链接粘贴",
          key: "title",
          value: settings.getFlag("title"),
        },
        {
          type: "checkbox",
          title: "中文排版",
          description:
            "右上角增加机器人图标/块菜单打开事件增加格式化文档的功能；注意有损坏数据风险。",
          key: "typography",
          value: settings.getFlag("typography"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "行内元素转换",
          description: "块菜单/文档菜单打开事件增加行内元素转换的功能",
          key: "convert",
          value: settings.getFlag("convert"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "发送到",
          description: "块菜单事件提供将选中内容发送到配置链接的功能",
          key: "sendTo",
          value: settings.getFlag("sendTo"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "碎碎念",
          description: "配置 ID，该 ID 引用下的子节点将在右上角展示创建时间",
          key: "memo",
          value: settings.getFlag("memo"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "左上边栏扩充",
          description: "在左上边栏新增图标固定打开链接或文档（块）",
          key: "dockLeft",
          value: settings.getFlag("dockLeft"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "提取元素至新文档",
          description: "文档菜单打开事件新增提取当前文档行内元素至新文档。",
          key: "read",
          value: settings.getFlag("read"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "快捷添加书签",
          description: "块菜单新增添加到书签",
          key: "bookmark",
          value: settings.getFlag("bookmark"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "边栏自动打开、关闭",
          description: "配置打开文档时边栏自动展开/隐藏",
          key: "dockShowAndHide",
          value: settings.getFlag("dockShowAndHide"),
          hasSetting: true,
        },
      ],
      发送到: [
        {
          type: "checkbox",
          title: "写入剪贴板？",
          description: "",
          key: "isToClipboard",
          value: settings.getBySpace("sendToConfig", "isToClipboard"),
        },
        {
          type: "textinput",
          title: "多行内容分隔符",
          description: "",
          key: "separator",
          value: settings.getBySpace("sendToConfig", "separator"),
          placeholder: "====",
        },
        {
          type: "textarea",
          title: "自定义链接",
          description: "",
          key: "inputArea",
          value: settings.getBySpace("sendToConfig", "inputArea"),
          placeholder:
            "以 名称====链接 配置；换行分隔。${content} 将会替换为选中的内容",
        },
      ],
      随机题头图: [
        {
          type: "checkbox",
          title: "本地图片进入缓存？",
          description:
            "如果打开，会减少从文件夹遍历获取图片，但新添加到文件夹的图片不会及时生效。",
          key: "isCached",
          value: settings.getBySpace("randomHeaderImageConfig", "isCached"),
        },
        {
          type: "textarea",
          title: "本地文件夹/自定义 URL",
          description: `0️⃣可配置本地文件夹或能返回图片地址的 URL（返回值包含图片地址即可）<br/>
            1️⃣可配置多个路径，以换行分隔；<br/>
            2️⃣本地文件夹路径需配置为绝对路径；<br/>
            3️⃣本地文件夹需在 Siyuan 工作目录（Siyuan/data/**/）下，比如 Siyuan/data/assets/images；<br/>
            4️⃣本地文件夹可使用软链接引用 Siyuan 工作目录外的文件夹。<br/>
            5️⃣使用：1）配置；2️）在文档点击「随机题头图」；3️）右键点击「随机」。（详情见 https://ld246.com/article/1694612740828 03 开始用吧）`,
          key: "folderPaths",
          value: settings.getBySpace("randomHeaderImageConfig", "folderPaths"),
          placeholder: `/Users/hqweay/SiYuan/data/assets/images
https://img.xjh.me/random_img.php
https://shibe.online/api/shibes?count=1`,
        },
      ],
      随机浏览: [
        {
          type: "textarea",
          title: "随机浏览的范围，通过 SQL 限定",
          description: "",
          key: "rangeSQL",
          value: settings.getBySpace("randomNoteConfig", "rangeSQL"),
          placeholder: "SELECT root_id FROM blocks ORDER BY random() LIMIT 1",
        },
      ],
      设置: [
        {
          type: "button",
          title: "合并数据",
          description: "若某些功能无法正常使用，尝试使用此选项。",
          key: "mergeData",
          value: "确认",
        },
        {
          type: "button",
          title: "恢复/清理数据",
          description: "若合并数据后仍有问题，尝试使用此选项。",
          key: "resetData",
          value: "确认",
        },
      ],
      行内元素转换: [
        {
          type: "checkbox",
          title: "样式嵌套仍转换？",
          description:
            "例如：A 同时为标注和粗体，当使用转换标注为文本时，将清除标注样式，保留粗体样式",
          key: "styleNesting",
          value: settings.getBySpace("convertConfig", "styleNesting"),
        },
      ],
      碎碎念: [
        {
          type: "textarea",
          title: "配置块/文档 ID",
          description: `多个 ID 换行分隔<br/>如下配置 memo 的 ID 后，hello 的右上角将展示（由块 ID 截取生成的）创建时间【若展示有误烦请反馈】<br/>
              - [[memo]]<br/>
              - - hello`,
          key: "id",
          placeholder: `20240406015842-137jie3`,
          value: settings.getBySpace("memoConfig", "id"),
        },
      ],
      左上边栏扩充: [
        {
          type: "textarea",
          title: "在左上边栏新增图标固定打开链接或文档（块）",
          description: `换行配置多条；<br/>格式：图标====链接/文档或块id<br/>`,
          key: "ids",
          placeholder: `🥹====20240330144736-irg5pfz
😉====20240416195915-sod1ftd
🌁====siyuan://plugins/sy-docs-flow/open-rule?ruleType=SQL&ruleInput=select+B.*+from+blocks+as+B+join+attributes+as+A%0Aon+B.id+%3D+A.block_id%0Awhere+A.name+like+%27custom-dailynote%25%27%0Aorder+by+A.value+desc%3B&ruleTitle=%F0%9F%98%80%F0%9F%98%80+Daily+Notes&ruleConfig=%7B%22scroll%22%3Afalse%2C%22breadcrumb%22%3Afalse%2C%22protyleTitle%22%3Atrue%2C%22readonly%22%3Afalse%2C%22dynamicLoading%22%3A%7B%22enabled%22%3Atrue%2C%22capacity%22%3A15%2C%22shift%22%3A10%7D%7D`,
          value: settings.getBySpace("dockLeftConfig", "ids"),
        },
      ],
      提取元素至新文档: [
        // {
        //   type: "textinput",
        //   title: "提取标注到新文档：",
        //   description: "",
        //   key: "noteBookID",
        //   value: settings.getBySpace("readConfig", "noteBookID"),
        //   placeholder: "",
        // },
        // {
        //   type: "checkbox",
        //   title: "保留上下文？",
        //   description: "`今天==天气==很好？`：若取消勾选，则只提取「天气」。",
        //   key: "keepContext",
        //   value: settings.getBySpace("readConfig", "keepContext"),
        // },
        {
          type: "textinput",
          title: "新文档保存路径",
          description:
            "文档菜单打开事件新增提取当前文档行内元素至新文档。<br/>若为空，则新文档建立于当前文档下；若配置，则新文档建立在配置路径下。",
          key: "extractPath",
          value: settings.getBySpace("readConfig", "extractPath"),
          placeholder: "/我的笔记本/",
        },
        {
          type: "checkbox",
          title: "添加一个 * 引用",
          description: "新文档内的行内元素会在末尾添加一个 * 引用指向原块",
          key: "addRef",
          value: settings.getBySpace("readConfig", "addRef"),
        },
      ],
      快捷添加书签: [
        {
          type: "textarea",
          title: "书签",
          description: "快捷添加的书签名<br/>多个书签以换行分隔",
          key: "items",
          value: settings.getBySpace("bookmarkConfig", "items"),
          placeholder: "读到这里啦",
        },
      ],
      中文排版: [
        {
          type: "checkbox",
          title: "文档格式化时插入空格？",
          description:
            "点击右上角机器人对文档格式化时调用思源的排版优化来自动插入空格",
          key: "autoSpace",
          value: settings.getBySpace("typographyConfig", "autoSpace"),
        },
        {
          type: "checkbox",
          title: "关闭提示？",
          description:
            "点击右上角机器人对文档格式化时会有损坏数据的风险，如果你确认风险可以打开开关，关闭每次操作前的提示。",
          key: "closeTip",
          value: settings.getBySpace("typographyConfig", "closeTip"),
        },
      ],
      "边栏自动打开、关闭": [
        {
          type: "textinput",
          title: "左边栏打开默认宽度",
          description: "配置自动打开边栏时左边栏的默认宽度",
          key: "leftWidth",
          value: settings.getBySpace("dockShowAndHideConfig", "leftWidth"),
          placeholder: "200px",
        },
        {
          type: "textinput",
          title: "右边栏打开默认宽度",
          description: "配置自动打开边栏时右边栏的默认宽度",
          key: "rightWidth",
          value: settings.getBySpace("dockShowAndHideConfig", "rightWidth"),
          placeholder: "200px",
        },
        {
          type: "checkbox",
          title: "同时打开/关闭停靠栏",
          description: "打开/关闭边栏时同时操作停靠栏",
          key: "hideDock",
          value: settings.getBySpace("dockShowAndHideConfig", "hideDock"),
        },
         {
          type: "checkbox",
          title: "分屏时不触发",
          description: "分屏时不触发",
          key: "returnIfSplit",
          value: settings.getBySpace("dockShowAndHideConfig", "returnIfSplit"),
        },
        {
          type: "textarea",
          title: "配置",
          description:
            "格式：文档id====【show/hide】====【left[width]/right[width]】====备注（可选）<br/>多个文档以换行分隔",
          key: "items",
          value: settings.getBySpace("dockShowAndHideConfig", "items"),
          placeholder: `20240330144736-irg5pfz====show====left[200px],right[200px]====首页\n20240416195915-sod1ftd====hide====right====GTD\n20240501000821-w4e1kth====show====right[400px]`,
        },
      ],
    };
  };

  let SettingItems = initData();

  $: groups = [
    "开关",
    "设置",
    ...SettingItems["开关"]
      .filter((item) => item.value === true && item.hasSetting)
      .map((item) => item.title),
  ];

  let focusGroup = "开关";

  /********** Events **********/
  interface ChangeEvent {
    group: string;
    key: string;
    value: any;
  }

  const onClick = async ({ detail }: CustomEvent<ChangeEvent>) => {
    if ("设置" === detail.group) {
      if ("resetData" === detail.key) {
        await settings.resetData();
        SettingItems = initData();
        showMessage("配置恢复为默认值");
      } else if ("mergeData" === detail.key) {
        await settings.mergeData();
        SettingItems = initData();
        showMessage("合并配置为最新配置");
      }
    }
  };

  const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
    if (detail.group === "开关") {
      settings.setFlag(detail.key, detail.value);
    } else {
      const opItem = SettingItems["开关"].filter((ele) => {
        return ele.title === detail.group;
      });
      // console.log(opItem);
      settings.setBySpace(opItem[0].key + "Config", detail.key, detail.value);
    }

    for (let index = 0; index < SettingItems[focusGroup].length; index++) {
      if (SettingItems[focusGroup][index].key === detail.key) {
        SettingItems[focusGroup][index].value = detail.value;
        break;
      }
    }
    settings.save();
    // console.log(detail);
  };

  onDestroy(async () => {
    await settings.save();
    console.log("onDestroy");
  });
</script>

<div class="fn__flex-1 fn__flex config__panel">
  <ul class="b3-tab-bar b3-list b3-list--background">
    {#each groups as group}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <li
        data-name="editor"
        class:b3-list-item--focus={group === focusGroup}
        class="b3-list-item"
        on:click={() => {
          focusGroup = group;
          settings.save();
        }}
        on:keydown={() => {}}
      >
        <span class="b3-list-item__text">{group}</span>
      </li>
    {/each}
  </ul>
  <div class="config__tab-wrap">
    <SettingPanel
      group={focusGroup}
      settingItems={SettingItems[focusGroup]}
      on:changed={onChanged}
      on:click={onClick}
    >
      <div class="fn__flex b3-label">💡 部分功能设置后需重启插件生效.</div>
    </SettingPanel>
  </div>
</div>

<style lang="scss">
  .config__panel {
    height: 100%;
  }
  .config__panel > ul > li {
    padding-left: 1rem;
  }
</style>
