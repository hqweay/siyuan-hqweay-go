<script lang="ts">
  import { settings } from "@/settings";
  import { showMessage } from "siyuan";
  import { onDestroy } from "svelte";
  import SettingPanel from "./libs/setting-panel.svelte";
  // let groups: string[] = ["Default", "自动获取标题链接"];

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
          title: "随机头图",
          description:
            "给头图增加随机本地某文件夹下图片的功能：1️⃣配置文件夹；2️⃣在文档点击「随机题头图」；3️⃣右键点击「随机」",
          key: "randomHeaderImage",
          value: settings.getFlag("randomHeaderImage"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "自动获取标题链接",
          description: "粘贴网站时自动获取标题并以 markdown 形式的链接粘贴",
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
          description: "在左上边栏新增图标固定打开某文档",
          key: "dockLeft",
          value: settings.getFlag("dockLeft"),
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
      随机头图: [
        {
          type: "textarea",
          title: "图片文件夹路径",
          description:
            `1️⃣可配置多个路径，以换行分隔；<br/>
            2️⃣路径需配置为绝对路径；<br/>
            3️⃣路径需在 Siyuan 工作目录（Siyuan/data/**/）下，比如 Siyuan/data/assets/images；<br/>
            4️⃣路径可使用软链接引用 Siyuan 工作目录外的文件夹。<br/>
            5️⃣使用方式见 https://ld246.com/article/1694612740828 03 开始用吧`,
          key: "folderPaths",
          value: settings.getBySpace("randomHeaderImageConfig", "folderPaths"),
          placeholder: "/Users/hqweay/SiYuan/data/assets/images",
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
          title: "恢复/清理数据",
          description: "若某些功能无法正常使用，尝试使用此选项。",
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
          title: "在左上边栏新增图标固定打开某文档",
          description: `换行配置多条；<br/>格式：图标====文档id`,
          key: "ids",
          placeholder: `🥹====20240330144736-irg5pfz
😁====20240416195915-sod1ftd`,
          value: settings.getBySpace("dockLeftConfig", "ids"),
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
    if ("设置" === detail.group && "resetData" === detail.key) {
      await settings.resetData();
      SettingItems = initData();
      showMessage("配置恢复为默认值");
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
