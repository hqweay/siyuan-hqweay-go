<script lang="ts">
  import { settings } from "@/settings";
  import { showMessage } from "siyuan";
  import { onDestroy } from "svelte";
  import SettingPanel from "./libs/setting-panel.svelte";
  // let groups: string[] = ["Default", "自动获取链接标题"];
  import { plugin } from "@/utils";
  import { selectIconDialog } from "./myscripts/utils";
  import VoiceNotesPlugin from "./siyuan-voicenotes-sync";
  import { PluginRegistry } from "./plugin-registry";

  const initData = () => {
    const pluginRegistry = PluginRegistry.getInstance();
    const pluginConfigs = pluginRegistry.getPluginConfigs();

    // Generate dynamic settings from plugins
    const dynamicSettings: any = {
      开关: [],
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
    };

    //console.log("pluginConfigs");
    //console.log(pluginConfigs);

    // Add plugin flags
    for (const pluginMeta of pluginConfigs) {
      dynamicSettings.开关.push({
        type: "checkbox",
        title: pluginMeta.displayName || pluginMeta.name,
        description: pluginMeta.description || "",
        key: pluginMeta.name,
        value: settings.getBySpace(pluginMeta.name, "enabled") || false,
        hasSetting: pluginMeta.settings ? true : false,
      });

      //console.log(pluginMeta.name);
      //console.log("pluginMeta.settings");
      //console.log(pluginMeta.settings);
      pluginMeta.settings = pluginMeta.settings?.map((item) => {
        return {
          ...item, // 保留其他属性
          // 如果 item.value 是一个对象，则需要深拷贝
          value: settings.getBySpace(pluginMeta.name, item.key) || item.value,
        };
      });
      //console.log(pluginMeta.settings);
      // Add plugin settings
      if (pluginMeta.settings) {
        dynamicSettings[pluginMeta.displayName] = pluginMeta.settings;
        // for (const [groupName, settings] of Object.entries(
        //   pluginMeta.settings
        // )) {
        //   if (!dynamicSettings[groupName]) {
        //     dynamicSettings[groupName] = [];
        //   }
        //  .push(...settings);
        // }
      }
    }

    //console.log("dynamicSettings");
    //console.log(dynamicSettings);
    return dynamicSettings;
    return {
      开关: [
        {
          type: "checkbox",
          title: "代码片段合集",
          description:
            "一些收集的代码片段；见 https://github.com/hqweay/siyuan-hqweay-go/issues/4。目标是支持托管与本地管理。目前只支持启用在 issue 里评论的代码片段。",
          key: "codeSnippets",
          value: settings.getFlag("codeSnippets"),
          hasSetting: true,
        },

        {
          type: "checkbox",
          title: "日记相关工具",
          description: `slash 新增「cdn/创建日记引用」提供日历选择器快捷创建指定日期的日记并插入块引；快捷小窗录入日记（默认快捷键F10）`,
          key: "createDailyNote",
          value: settings.getFlag("createDailyNote"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "仪表盘",
          description: `提供一个展示文档信息的面板，为 Journal 设计`,
          key: "diaryTools",
          value: settings.getFlag("diaryTools"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "侧边栏展示文档或块",
          description: `docky`,
          key: "docky",
          value: settings.getFlag("docky"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "快捷添加属性",
          description: `快捷添加属性；默认支持转换列表为表格等视图`,
          key: "quickAttr",
          value: settings.getFlag("quickAttr"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "VoiceNotes 同步",
          description: "同步 VoiceNotes 的笔记：https://voicenotes.com",
          key: "voiceNotes",
          value: settings.getFlag("voiceNotes"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "标题下展示文档自定义属性的值",
          description: "标题下展示文档自定义属性的值",
          key: "showCustomPropertiesUnderTitle",
          value: settings.getFlag("showCustomPropertiesUnderTitle"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "调整标题",
          description: "块菜单/文档菜单打开事件增加标题层级转换",
          key: "adjustTitleLevel",
          value: settings.getFlag("adjustTitleLevel"),
          hasSetting: false,
        },
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
          title: "粘贴时对数据预处理",
          description: "获取链接标题；矩形标注粘贴优化；",
          key: "doOnPaste",
          value: settings.getFlag("doOnPaste"),
          hasSetting: true,
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
          description:
            "块菜单事件提供将选中内容进行分享（现在支持生成卡片分享、发送到配置链接）",
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
          title: "阅读帮助",
          description: "toolbar 新增 标注并复制块引",
          key: "readHelper",
          value: settings.getFlag("readHelper"),
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
        {
          type: "checkbox",
          title: "移动端助手",
          description:
            "在移动端页面底部添加导航栏，支持前进、后退、随机跳转等功能",
          key: "mobileHelper",
          value: settings.getFlag("mobileHelper"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "OCR 图片识别",
          description: "批量 OCR 识别图片中的文字",
          key: "ocr",
          value: settings.getFlag("ocr"),
          hasSetting: true,
        },
        {
          type: "checkbox",
          title: "其它",
          description:
            "一些自用项目，没有或者比较难拆分为配置，感兴趣的可以自己扒源码用……",
          key: "other",
          value: settings.getFlag("other"),
          hasSetting: true,
        },
      ],
      代码片段合集: plugin.codeSnippets.map((ele) => {
        return {
          type: "checkbox",
          title: `${ele.title} - ${ele.author && ele.link ? `@<a href= '${ele.link}'>${ele.author}</a>` : ""}`,
          description: `${ele.description}`,
          key: `${ele.id}`,
          value: settings.getBySpace("codeSnippets", `${ele.id}`),
          hasSetting: true,
        };
      }),


      仪表盘: [
        {
          type: "textinput",
          title: "添加到 Dock",
          description:
            "LeftTop | LeftBottom | RightTop | RightBottom | BottomLeft | BottomRight",
          key: "addToDock",
          value: settings.getBySpace("diaryTools", "addToDock"),
          placeholder: "为空不添加",
        },
        {
          type: "textarea",
          title: "仪表盘配置",
          description: "参考默认配置……",
          key: "configs",
          value: settings.getBySpace("diaryTools", "configs"),
          placeholder: "参考默认配置……",
        },
      ],
      日记相关工具: [
        {
          type: "textinput",
          title: "创建日记的笔记本id",
          description: "",
          key: "noteBookID",
          value: settings.getBySpace("createDailyNote", "noteBookID"),
          placeholder: "20240330144726-gs2xey6",
        },
        {
          type: "checkbox",
          title:
            "slash 新增「cdn/创建日记引用」提供日历选择器快捷创建指定日期的日记并插入块引",
          description: "",
          key: "slashDiaryNote",
          value: settings.getBySpace("createDailyNote", "slashDiaryNote"),
        },
        {
          type: "checkbox",
          title: "快捷小窗录入日记（默认快捷键F10）",
          description: "",
          key: "quickInput",
          value: settings.getBySpace("createDailyNote", "quickInput"),
        },
        {
          type: "checkbox",
          title: "顶栏按钮快捷操作",
          description: "",
          key: "topBar",
          value: settings.getBySpace("createDailyNote", "topBar"),
        },
        {
          type: "textinput",
          title: "顶栏-获取天气并插入当前文档属性",
          description: "https://www.sojson.com/blog/305.html",
          placeholder: "配置城市代码，如：101270101",
          key: "getWeatherSetAttrs",
          value: settings.getBySpace(
            "createDailyNoteConfig",
            "getWeatherSetAttrs"
          ),
        },
      ],

      随机题头图: [
        {
          type: "checkbox",
          title: "本地图片进入缓存？",
          description:
            "如果打开，会减少从文件夹遍历获取图片，但新添加到文件夹的图片不会及时生效。",
          key: "isCached",
          value: settings.getBySpace("randomHeaderImage", "isCached"),
        },
        {
          type: "checkbox",
          title: "必应",
          description:
            "使用 https://bing.img.run/api.html 的 API 获取历史随机壁纸",
          key: "bing",
          value: settings.getBySpace("randomHeaderImage", "bing"),
        },
        {
          type: "checkbox",
          title: "岁月小筑",
          description:
            "使用 https://img.xjh.me/random_img.php 的 API 获取随机图片",
          key: "xjh",
          value: settings.getBySpace("randomHeaderImage", "xjh"),
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
          value: settings.getBySpace("randomHeaderImage", "folderPaths"),
          placeholder: `/Users/hqweay/SiYuan/data/assets/images
https://shibe.online/api/shibes?count=1`,
        },
      ],
      随机浏览: [
        {
          type: "textarea",
          title: "随机浏览的范围，通过 SQL 限定",
          description: "",
          key: "rangeSQL",
          value: settings.getBySpace("randomNote", "rangeSQL"),
          placeholder: "SELECT id FROM blocks WHERE type = 'd'",
        },
        {
          type: "number",
          title: "缓存数量",
          description: "",
          key: "limitNum",
          value: settings.getBySpace("randomNote", "limitNum"),
          placeholder: "默认一次查询 30 条缓存",
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
          value: settings.getBySpace("convert", "styleNesting"),
        },
      ],
      碎碎念: [
        {
          type: "checkbox",
          title: "该文档下的元素也展示创建时间？",
          description:
            "例如：A 同时为标注和粗体，当使用转换标注为文本时，将清除标注样式，保留粗体样式",
          key: "activeDoc",
          value: settings.getBySpace("memo", "activeDoc"),
        },
        {
          type: "textarea",
          title: "配置块/文档 ID",
          description: `多个 ID 换行分隔<br/>如下配置 memo 的 ID 后，hello 的右上角将展示（由块 ID 截取生成的）创建时间【若展示有误烦请反馈】<br/>
              - [[memo]]<br/>
              - - hello`,
          key: "id",
          placeholder: `20240406015842-137jie3`,
          value: settings.getBySpace("memo", "id"),
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
          value: settings.getBySpace("dockLeft", "ids"),
        },
      ],
      阅读帮助: [
        {
          type: "checkbox",
          title: "toolbar 新增标注并复制块引",
          description: "toolbar 新增标注并复制块引",
          key: "markAndCopyRef",
          value: settings.getBySpace("readHelper", "markAndCopyRef"),
        },
        {
          type: "checkbox",
          title: "toolbar 新增标注并复制 Text* 格式块引",
          description: "toolbar 新增标注并复制块引",
          key: "markAndCopyTextRef",
          value: settings.getBySpace("readHelper", "markAndCopyTextRef"),
        },
        {
          type: "checkbox",
          title: "toolbar 新增标注并复制 * 格式块引",
          description: "toolbar 新增标注并复制块引",
          key: "markAndCopyTextRefNoHighlight",
          value: settings.getBySpace(
            "readHelperConfig",
            "markAndCopyTextRefNoHighlight"
          ),
        },
      ],
      提取元素至新文档: [
        // {
        //   type: "textinput",
        //   title: "提取标注到新文档：",
        //   description: "",
        //   key: "noteBookID",
        //   value: settings.getBySpace("read", "noteBookID"),
        //   placeholder: "",
        // },
        // {
        //   type: "checkbox",
        //   title: "保留上下文？",
        //   description: "`今天==天气==很好？`：若取消勾选，则只提取「天气」。",
        //   key: "keepContext",
        //   value: settings.getBySpace("read", "keepContext"),
        // },
        {
          type: "textinput",
          title: "新文档保存路径",
          description:
            "文档菜单打开事件新增提取当前文档行内元素至新文档。<br/>若为空，则新文档建立于当前文档下；若配置，则新文档建立在配置路径下。",
          key: "extractPath",
          value: settings.getBySpace("read", "extractPath"),
          placeholder: "/我的笔记本/",
        },
        {
          type: "checkbox",
          title: "添加一个 * 引用",
          description: "新文档内的行内元素会在末尾添加一个 * 引用指向原块",
          key: "addRef",
          value: settings.getBySpace("read", "addRef"),
        },
        {
          type: "checkbox",
          title: "提取元素为大纲块",
          description: "开启则新文档内的行内元素提取为大纲块，否则为文档块",
          key: "addOutline",
          value: settings.getBySpace("read", "addOutline"),
        },
      ],

      中文排版: [
        {
          type: "checkbox",
          title: "文档格式化时插入空格？",
          description:
            "点击右上角机器人对文档格式化时调用思源的「排版优化」来自动插入空格",
          key: "autoSpace",
          value: settings.getBySpace("typography", "autoSpace"),
        },
        {
          type: "checkbox",
          title: "文档格式化时网络资源文件转换本地？",
          description:
            "点击右上角机器人对文档格式化时调用思源的「网络资源文件转换本地」",
          key: "netImg2LocalAssets",
          value: settings.getBySpace("typography", "netImg2LocalAssets"),
        },
        {
          type: "checkbox",
          title: "关闭提示？",
          description:
            "点击右上角机器人对文档格式化时会有损坏数据的风险，如果你确认风险可以打开开关，关闭每次操作前的提示。",
          key: "closeTip",
          value: settings.getBySpace("typography", "closeTip"),
        },
        {
          type: "number",
          title: "图片居中？",
          description:
            "为 10-100 的值则居中并按百分比数值缩放；其它值则不居中。",
          key: "imageCenter",
          value: settings.getBySpace("typography", "imageCenter"),
        },
      ],

      "VoiceNotes 同步": [
        {
          type: "textinput",
          title: "Token",
          description: "token",
          key: "token",
          value: settings.getBySpace("voiceNotes", "token"),
          placeholder: "12345|abcdefgh",
        },
        {
          type: "textinput",
          title: "思源笔记笔记本id",
          description: "思源笔记笔记本id",
          key: "notebook",
          value: settings.getBySpace("voiceNotes", "notebook"),
          placeholder: "20240330144726-gs2xey6",
        },
        {
          type: "textinput",
          title: "同步的目录",
          description: "同步的目录",
          key: "syncDirectory",
          value: settings.getBySpace("voiceNotes", "syncDirectory"),
          placeholder: "voicenotes",
        },
        {
          type: "textinput",
          title: "手动同步时获取最新多少页数据（1页10条）",
          description:
            "小于 0 时同步全量，大于 0 时会同步配置的前多少页【建议合理配置】",
          key: "manualSyncPageCount",
          value: settings.getBySpace("voiceNotes", "manualSyncPageCount"),
          placeholder: "2",
        },
        {
          type: "textinput",
          title: "全量同步最新多少页数据（1页10条）",
          description: "小于 0 时同步全量，大于 0 时会同步配置的前多少页",
          key: "latestDataCountOfPage",
          value: settings.getBySpace(
            "voiceNotesConfig",
            "latestDataCountOfPage"
          ),
          placeholder: "-1",
        },
        {
          type: "button",
          title: "全量同步一次",
          description: "点击会尝试全量同步一次笔记",
          key: "fullSyncVoiceNotes",
          value: "确认",
        },
        {
          type: "checkbox",
          title: "同步时使用中英文排版优化格式化",
          description: "同步时使用中英文排版优化格式化",
          key: "formatContent",
          value: settings.getBySpace("voiceNotes", "formatContent"),
        },
        {
          type: "checkbox",
          title: "换行是否新建块",
          description: "否则当作行内换行处理",
          key: "newLineNewBlock",
          value: settings.getBySpace("voiceNotes", "newLineNewBlock"),
        },
        // {
        //   type: "textinput",
        //   title: "时间格式",
        //   description: "时间格式",
        //   key: "dateFormat",
        //   placeholder: "YYYY-MM-DD HH:mm:ss",
        // },
        {
          type: "textarea",
          title: "排除标签",
          description: "同步时排除该标签下的笔记",
          key: "excludeTags",
          value: settings.getBySpace("voiceNotes", "excludeTags"),
          placeholder: "done,no",
        },
        // {
        //   type: "textarea",
        //   title: "frontmatterTemplate",
        //   description: "",
        //   key: "frontmatterTemplate",
        //   value: settings.getBySpace("voiceNotes", "frontmatterTemplate"),
        //   placeholder: "",
        // },
        {
          type: "textarea",
          title: "noteTemplate",
          description: "",
          key: "noteTemplate",
          value: settings.getBySpace("voiceNotes", "noteTemplate"),
          placeholder: "",
        },
        // {
        //   type: "textarea",
        //   title: "同步过的笔记id，一般别修改",
        //   description: "",
        //   key: "syncedRecordingIds",
        //   value: settings.getBySpace("voiceNotes", "syncedRecordingIds"),
        //   placeholder: "",
        // },
      ],
      "OCR 图片识别": [
        {
          type: "select",
          title: "方案",
          description: "方案",
          key: "ocrMethod",
          value: settings.getBySpace("ocr", "ocrMethod"),
          options: {
            macOSVision: "使用 MacOS Vision OCR",
            umi: "使用 umi OCR",
            tesseract: "使用 tesseract OCR",
          },
        },
        {
          type: "textarea",
          title: "umi-ocr 服务地址",
          description: "umi-ocr 服务地址",
          key: "umiOCRServer",
          value: settings.getBySpace("ocr", "umiOCRServer"),
          placeholder: "",
        },
        {
          type: "checkbox",
          title: "自动移除换行",
          description: "通过每行结尾是否存在标点自动判断移除换行",
          key: "autoRemoveLineBreaks",
          value: settings.getBySpace("ocr", "autoRemoveLineBreaks"),
        },
        {
          type: "checkbox",
          title: "移除换行符",
          description: "OCR 识别后是否移除文本中的换行符",
          key: "removeLineBreaks",
          value: settings.getBySpace("ocr", "removeLineBreaks"),
        },
        {
          type: "checkbox",
          title: "移除中文内的空格",
          description: "移除中文内的空格",
          key: "removeBlankInChinese",
          value: settings.getBySpace("ocr", "removeBlankInChinese"),
        },
        {
          type: "checkbox",
          title: "调用 pangu 格式化",
          description: "调用 pangu 格式化",
          key: "formatWithPangu",
          value: settings.getBySpace("ocr", "formatWithPangu"),
        },
      ],
      标题下展示文档自定义属性的值: [
        
      ],

      其它: [
        {
          type: "detail",
          title: "一些 slash",
          description: "格式化当前块；快捷创建某天日记并插入块引",
        },
      ],
    };
  };

  let SettingItems = initData();

  $: groups = [
    "开关",
    "设置",
    // "移动端助手",
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
    } else if ("VoiceNotes 同步" === detail.group) {
      if ("fullSyncVoiceNotes" === detail.key) {
        await new VoiceNotesPlugin().exec(true);
      }
    } else if ("侧边栏展示文档或块" === detail.group) {
      if ("selectIcon" === detail.key) {
        selectIconDialog();
      }
    }
  };

  const onChanged = ({ detail }: CustomEvent<ChangeEvent>) => {
    if (detail.group === "开关") {
      // Update plugin's enabled status in its config
      //console.log(detail);
      settings.setBySpace(detail.key, "enabled", detail.value);

      //console.log(detail);
      //console.log();
      if (!detail.value) {
        PluginRegistry.getInstance().unloadPlugin(detail.key);
      } else {
        PluginRegistry.getInstance().beginPlugin(detail.key);
      }
    } else if (detail.group === "代码片段合集") {
      settings.setBySpace("codeSnippetsConfig", detail.key, detail.value);
      if (detail.value) {
        plugin.insertCss.insertSingleCSSByID(detail.key);
      } else {
        plugin.insertCss.onunloadCSSByID(detail.key);
      }
    } else {
      //console.log(detail);
      //console.log(SettingItems);
      const opItem = SettingItems["开关"].filter((ele) => {
        return ele.title === detail.group;
      });
      //console.log(opItem);
      settings.setBySpace(opItem[0].key, detail.key, detail.value);
    }

    for (let index = 0; index < SettingItems[focusGroup].length; index++) {
      if (SettingItems[focusGroup][index].key === detail.key) {
        SettingItems[focusGroup][index].value = detail.value;
        break;
      }
    }
    settings.save();
  };

  onDestroy(async () => {
    await settings.save();
    //console.log("onDestroy");
  });

  const lreload = () => {
    location.reload();
  };
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
          //console.log("focusGroup", focusGroup);
          //console.log("SettingItems", SettingItems);
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
      <div class="fn__flex b3-label">
        <div>💡 部分功能设置后需重启插件生效.</div>
        <div>
          <button
            class="b3-button b3-button--outline fn__flex-center fn__size200"
            style="margin-left: 20%;"
            on:click={lreload}>现在重载</button
          >
        </div>
      </div>
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
