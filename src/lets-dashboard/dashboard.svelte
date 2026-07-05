<script lang="ts">
import { getLogger } from "@/libs/logger";
const log = getLogger("lets-dashboard");
  import { sql } from "@/api";
  import { settings } from "@/settings";
  import { isMobile, plugin } from "@/utils";
  import { openMobileFileById } from "siyuan";
  import { onMount } from "svelte";
  import EntryList from "./EntryList.svelte";
  import Heatmap from "./Heatmap.svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import StatCard from "./StatCard.svelte";
  import { parseYYYYMMDD } from "@/myscripts/utils";
  import { openBlockByID } from "@/myscripts/syUtils";

  const sqlConfigs =
    settings.getBySpace("dashBoard", "configs") === "hqweay"
      ? [
          {
            //配置名
            name: "➿ Voicenotes",
            //主页总数 label
            indexLabel: "总语音日记",
            //进入时是否加载列表
            showEntries: true,
            //进入时是否加载图片
            showMedia: false,
            //控制是否展示 主统计信息
            showMainStatics: true,
            //控制是否展示 那年、那月、那周今日
            showOnThisDay: true,
            //控制是否展示 热力图
            showHeatmap: true,
            //控制是否展示 自定义卡片
            showcustomCards: [
              {
                id: "random",
                type: "text",
                fullWidth: true,
                label: `select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1`,
                onClick: () => {
                  loadCards("random").then((res) => {
                    customCards = customCards.map((card) => {
                      const matchedRes = res.find(
                        (item) => item.id === card.id
                      );
                      return matchedRes ? matchedRes : card;
                    });
                    updateCustomCards(customCards);
                  });
                },
              },
              {
                type: "text",
                label: `select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1`,
                onClick: (card) => {
                  window.diaryTools.openBlockByID(card.labelBlocks[0]?.id);
                },
              },

              {
                type: "icon-stat",
                label: "距离 2026 年还有",
                number: () => {
                  const targetDate = new Date(2026, 0, 1).getTime(); // 月份是 0-based
                  const currentDate = new Date().getTime();
                  const timeDiff = targetDate - currentDate;
                  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                  return daysDiff;
                },
                text: "天",
              },
            ],

            //主SQL
            mainSQL: `select blocks.* from blocks where blocks.type = 'd' and blocks.path LIKE '%20250126213235-a3tnoqb%'`,
            //可选：图片SQL。若为 null，则通过 mainSQL 关联查询
            imgSQL: null,
          },
          {
            name: "📝 碎碎念引用",
            indexID: "",
            indexLabel: "碎碎念引用块",
            showEntries: true,
            showMedia: false,
            showMainStatics: true,
            showOnThisDay: true,
            showHeatmap: true,
            mainSQL: `-- 查询引用块、其直接父块（容器块）以及所有相关子块
  SELECT blocks.* FROM blocks
  WHERE
      -- 情况4：引用块的直接父块（容器块）
      id IN (
          SELECT DISTINCT parent_id
          FROM blocks
          WHERE id IN (
              SELECT DISTINCT block_id
              FROM refs
              WHERE def_block_root_id = '20250126213235-a3tnoqb'
          )
          AND parent_id IS NOT NULL
      )
  ORDER BY
      created desc
  LIMIT 512`,
            imgSQL: `
  -- 查询引用块、其直接父块（容器块）以及所有相关子块
  SELECT * FROM blocks
  WHERE
      -- 情况4：引用块的直接父块（容器块）
      id IN (
          SELECT DISTINCT parent_id
          FROM blocks
          WHERE id IN (
              SELECT DISTINCT block_id
              FROM refs
              WHERE def_block_root_id = '20250126213235-a3tnoqb'
          )
          AND parent_id IS NOT NULL
      )
      and markdown like '%![%'
  ORDER BY
      created desc
  `,
          },
          {
            name: "Daily Notes",
            indexLabel: "Daily Notes",
            showEntries: true,
            showMedia: false,
            showMainStatics: false,
            showOnThisDay: false,
            showHeatmap: false,
            mainSQL: `select blocks.* from blocks join attributes
on blocks.id = attributes.block_id
where attributes.name like 'custom-dailynote%'
order by attributes.value desc`,
          },
          {
            name: "🌐 全部",
            indexLabel: "总文档",
            showEntries: true,
            showMedia: false,
            showMainStatics: true,
            showOnThisDay: true,
            showHeatmap: true,
            mainSQL: `select blocks.* from blocks where type = 'd'`,
          },
          {
            name: "🎲 随机！",
            indexLabel: "随机文档",
            showEntries: true,
            showMedia: false,
            showMainStatics: true,
            showOnThisDay: true,
            showHeatmap: true,
            mainSQL: `select blocks.* from blocks where type = 'd' ORDER BY RANDOM() LIMIT ${Math.floor(Math.random() * 51) + 50}`,
          },
        ]
      : settings.getBySpace("dashBoard", "configs")
        ? eval(`(${settings.getBySpace("dashBoard", "configs")})`)
        : [
            {
              //配置名
              name: "所有文档！",
              //主页总数 label
              indexLabel: "文档数量",
              //进入时是否加载列表
              showEntries: true,
              //进入时是否加载图片
              showMedia: true,
              //控制是否展示 主统计信息
              showMainStatics: true,
              //控制是否展示 那年、那月、那周今日
              showOnThisDay: true,
              //控制是否展示 热力图
              showHeatmap: true,
              //控制是否展示 自定义卡片
              showcustomCards: [
                {
                  id: "random",
                  type: "text",
                  label:
                    "select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1",
                  onClick: () => {
                    loadCards("random").then((res) => {
                      customCards = customCards.map((card) => {
                        const matchedRes = res.find(
                          (item) => item.id === card.id
                        );
                        return matchedRes ? matchedRes : card;
                      });
                      window.diaryTools.updateCustomCards(customCards);
                    });
                  },
                },
                {
                  type: "text",
                  label:
                    "select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1",
                  onClick: (card) => {
                    //@ts-ignore
                    window.diaryTools.openBlockByID(card.labelBlocks[0]?.id);
                  },
                },
                {
                  type: "icon-stat",
                  label: "距离 2026 年还有",
                  number: () => {
                    const targetDate = new Date("2026-01-01").getTime();
                    const currentDate = new Date().getTime();
                    const timeDiff = targetDate - currentDate;
                    const daysDiff = Math.ceil(
                      timeDiff / (1000 * 60 * 60 * 24)
                    );
                    return daysDiff;
                  },
                  text: "天",
                },
              ],
              //主SQL
              mainSQL: "select blocks.* from blocks where type = 'd'",
              //可选：图片SQL。若为 null，则通过 mainSQL 关联查询
              imgSQL: null,
            },
            {
              name: "🎲 随机！",
              indexLabel: "随机文档",
              showEntries: true,
              showMedia: false,
              showMainStatics: true,
              showOnThisDay: true,
              showHeatmap: true,
              mainSQL:
                "select blocks.* from blocks where type = 'd' ORDER BY RANDOM() LIMIT " +
                (Math.floor(Math.random() * 51) + 50),
            },
            {
              name: "Daily Notes",
              indexLabel: "Daily Notes",
              showEntries: true,
              showMedia: false,
              showMainStatics: false,
              showOnThisDay: false,
              showHeatmap: false,
              mainSQL:
                "select blocks.* from blocks join attributes on blocks.id = attributes.block_id where attributes.name like 'custom-dailynote%' order by attributes.value desc",
            },
          ];

  export let selectedConfig: number | string = 0;
  export let type: string = ""; //clear
  let internalSelectedConfig = 0;

  $: if (type) {
    if (type === "clear") {
      showConfigTabs = false;
      showEntries = false;
      showMedia = false;
      showMainStatics = false;
      showOnThisDay = false;
      showHeatmap = false;
    }
  }
  $: internalSelectedConfig = (() => {
    if (typeof selectedConfig === "number") {
      if (
        Array.isArray(sqlConfigs) &&
        selectedConfig >= 0 &&
        selectedConfig < sqlConfigs.length
      ) {
        return selectedConfig;
      } else {
        log.warn(
          `Invalid numeric index ${selectedConfig}, using default 0`
        );
        return 0;
      }
    } else if (typeof selectedConfig === "string") {
      if (Array.isArray(sqlConfigs) && sqlConfigs.length > 0) {
        const foundIndex = sqlConfigs.findIndex(
          (config) => config.name === selectedConfig
        );
        if (foundIndex !== -1) {
          return foundIndex;
        } else {
          log.warn(
            `Config with name "${selectedConfig}" not found, using default 0`
          );
          return 0;
        }
      } else {
        return 0;
      }
    } else {
      return 0; // 默认选中文档配置
    }
  })();

  $: currentConfig = (() => {
    try {
      if (
        internalSelectedConfig == null ||
        !Array.isArray(sqlConfigs) ||
        internalSelectedConfig < 0 ||
        internalSelectedConfig >= sqlConfigs.length
      ) {
        return null;
      }
      return sqlConfigs[internalSelectedConfig];
    } catch (error) {
      log.error("Error setting currentConfig:", error);
      return null;
    }
  })();

  $: mainSQL = currentConfig?.mainSQL;
  // 核心数据存储
  const MAX_BLOCKS = 2000;
  let mainBlocks = [];
  let blockIdsStr = "";
  $: imgSQL = (currentConfig?.imgSQL) || generateFastImgSQL(blockIdsStr);
  // 仅支持通过链接打开传入
  let showConfigTabs = true;
  $: showMedia =
    currentConfig?.showMedia == undefined ? true : currentConfig.showMedia; // default show both
  $: showEntries =
    currentConfig?.showEntries == undefined ? true : currentConfig.showEntries; // default show both
  $: showMainStatics =
    currentConfig?.showMainStatics == undefined
      ? true
      : currentConfig.showMainStatics;
  $: showOnThisDay =
    currentConfig?.showOnThisDay == undefined
      ? true
      : currentConfig.showOnThisDay;
  $: showHeatmap =
    currentConfig?.showHeatmap == undefined ? true : currentConfig.showHeatmap;

  // 支持特殊日历筛选（那年今日、那月今日、那周今日）和普通多日筛选
  $: filteredBlocks = (() => {
    let filtered = mainBlocks;
    if (specialDayType !== SpecialDayType.None) {
      let keys = [];
      if (specialDayType === SpecialDayType.ThisDayInHistory) {
        keys = getThisDayInHistoryKeys();
      } else if (specialDayType === SpecialDayType.ThisMonthInHistory) {
        keys = getThisMonthInHistoryKeys();
      } else if (specialDayType === SpecialDayType.ThisWeekInHistory) {
        keys = getThisWeekInHistoryKeys();
      }
      filtered = filtered.filter(b => keys.some(k => b.created && b.created.toString().startsWith(k)));
    } else if (selectedDays.length > 0) {
      filtered = filtered.filter(b => selectedDays.some(d => b.created && b.created.toString().startsWith(d)));
    }
    return filtered;
  })();

  $: filteredBlockIdsStr = filteredBlocks.map((b) => `'${b.id}'`).join(",");
  $: filteredImgSQL = (currentConfig?.imgSQL) ? (specialDayType !== SpecialDayType.None
      ? getSpecialDaySQL(specialDayType, currentConfig.imgSQL)
      : selectedDays.length > 0
        ? `select * from (${currentConfig.imgSQL}) as sub where substr(created,1,8) in (${selectedDays.map((day) => `'${day}'`).join(", ")})`
        : currentConfig.imgSQL) : generateFastImgSQL(filteredBlockIdsStr);
  $: customCards = [];
  $: if (currentConfig) {
    loadData();
    loadCards().then((res) => {
      customCards = res;
    });
    //重新加载后清理
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  let layout = "masonry";
  // 日记数据存储
  let diaryAllEntriesCount = 0;
  let diaryHasImageEntriesCount = 0;
  // 统计各特殊日期类型的数量
  let thisDayInHistoryCount = 0;
  let thisMonthInHistoryCount = 0;
  let thisWeekInHistoryCount = 0;
  let selectedDays = []; // Array of YYYYMMDD strings for multi-day filtering

  // 可扩展的"特殊日历筛选"类型
  const SpecialDayType = {
    None: "none",
    ThisDayInHistory: "thisDayInHistory",
    ThisMonthInHistory: "thisMonthInHistory",
    ThisWeekInHistory: "thisWeekInHistory",
  };
  let specialDayType = SpecialDayType.None;

  // 获取所有"那年今日"日期字符串（YYYYMMDD）
  // 例：今天是20251130，则返回20241130、20231130、20221130......
  // 或基于 selectedDays，计算所有选中日期对应的那年今日
  function getThisDayInHistoryKeys(baseDate = null) {
    const keys = new Set();
    const dates = baseDate
      ? [baseDate]
      : selectedDays.length > 0
        ? selectedDays
        : [new Date()];

    dates.forEach((dateInput) => {
      const now =
        typeof dateInput === "string"
          ? parseYYYYMMDD(dateInput)
          : dateInput instanceof Date
            ? dateInput
            : new Date(dateInput);
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const thisYear = now.getFullYear();
      // 假设数据最早从 2000 年开始
      for (let y = thisYear; y >= 2000; y--) {
        keys.add(`${y}${month}${day}`);
      }
    });
    return Array.from(keys);
  }

  // 获取所有"那月今日"日期字符串（YYYYMMDD）
  // 例：今天是20251130（十一月30日），则返回20251030、20250930、20250830......（所有历史同月的第30天）
  // 或基于 selectedDays，计算所有选中日期对应的那月今日
  function getThisMonthInHistoryKeys(baseDate = null) {
    const keys = new Set();
    const dates = baseDate
      ? [baseDate]
      : selectedDays.length > 0
        ? selectedDays
        : [new Date()];

    dates.forEach((dateInput) => {
      const now =
        typeof dateInput === "string"
          ? parseYYYYMMDD(dateInput)
          : dateInput instanceof Date
            ? dateInput
            : new Date(dateInput);
      const day = String(now.getDate()).padStart(2, "0");

      // 向前回溯12个月（1年），每个月找同一天
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        // 检查该月该天是否存在（2月29日在非闰年不存在）
        const testDate = new Date(y, date.getMonth(), parseInt(day));
        if (testDate.getMonth() === date.getMonth()) {
          keys.add(`${y}${m}${day}`);
        }
      }
    });
    return Array.from(keys);
  }

  // 获取所有"那周今日"日期字符串（YYYYMMDD）
  // 例：今天是周一（20251201）的话，则返回20251124、20251117、20251110......（所有历史上的周一）
  // 或基于 selectedDays，计算所有选中日期对应的那周今日
  function getThisWeekInHistoryKeys(baseDate = null) {
    const keys = new Set();
    const dates = baseDate
      ? [baseDate]
      : selectedDays.length > 0
        ? selectedDays
        : [new Date()];

    dates.forEach((dateInput) => {
      const now =
        typeof dateInput === "string"
          ? parseYYYYMMDD(dateInput)
          : dateInput instanceof Date
            ? dateInput
            : new Date(dateInput);

      // 向前回溯52周（1年），每周找同一天
      for (let i = 0; i < 52; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        keys.add(`${y}${m}${d}`);
      }
    });
    return Array.from(keys);
  }
  // 生成 imgSQL 的默认函数 (向后兼容 fromFlow 等模式)
  const generateImgSQL = (mainSQL) =>
    `select mainSQL.* , assets.PATH as asset_path from (${mainSQL.replace(`'d'`, `'p'`)}) as mainSQL left join assets on mainSQL.id= assets.block_id where (assets.PATH LIKE '%.png' OR assets.PATH LIKE '%.jpg' OR assets.PATH LIKE '%.jpeg' OR assets.PATH LIKE '%.gif' OR assets.PATH LIKE '%.bmp' OR assets.PATH LIKE '%.webp')`;

  // 基于已知 ID 列表生成极速图片查询
  const generateFastImgSQL = (idsStr) => {
    if (!idsStr) return `select * from assets where 1=0`;
    return `SELECT DISTINCT assets.*, blocks.content, blocks.created, blocks.updated, assets.PATH as asset_path FROM assets JOIN blocks ON assets.block_id = blocks.id WHERE (blocks.root_id IN (${idsStr}) OR blocks.id IN (${idsStr})) AND (assets.PATH LIKE '%.png' OR assets.PATH LIKE '%.jpg' OR assets.PATH LIKE '%.jpeg' OR assets.PATH LIKE '%.gif' OR assets.PATH LIKE '%.bmp' OR assets.PATH LIKE '%.webp')`;
  };

  // 计算特殊日期SQL片段
  function getSpecialDaySQL(type, baseSQL) {
    if (type === SpecialDayType.ThisDayInHistory) {
      const keys = getThisDayInHistoryKeys();
      return `select * from (${baseSQL}) as sub where substr(created,1,8) in (${keys.map((d) => `'${d}'`).join(", ")})`;
    }
    if (type === SpecialDayType.ThisMonthInHistory) {
      const keys = getThisMonthInHistoryKeys();
      return `select * from (${baseSQL}) as sub where substr(created,1,8) in (${keys.map((d) => `'${d}'`).join(", ")})`;
    }
    if (type === SpecialDayType.ThisWeekInHistory) {
      const keys = getThisWeekInHistoryKeys();
      return `select * from (${baseSQL}) as sub where substr(created,1,8) in (${keys.map((d) => `'${d}'`).join(", ")})`;
    }
    return baseSQL;
  }

  function handleDayClick(e) {
    const dayKey = e.detail?.dayKey;
    if (!dayKey) return;
    // toggle: add to array if not present, remove if present
    if (selectedDays.includes(dayKey)) {
      selectedDays = selectedDays.filter((d) => d !== dayKey);
    } else {
      selectedDays = [...selectedDays, dayKey];
    }
    // 重新计算那年/那月/那周的统计
    updateSpecialDaysCounts();
  }

  // 图片展示已移入独立组件 ImageGallery

  let isDataReady = false;

  // 修改 loadData 函数，添加调试信息
  async function loadData() {
    isDataReady = false;
    try {
      if (!mainSQL) return;
      let blocks = await sql(mainSQL);
      if (blocks.length > MAX_BLOCKS) {
        blocks = blocks.slice(0, MAX_BLOCKS);
        log.warn(`[lets-dashboard] 结果已被截断为前 ${MAX_BLOCKS} 条以保护性能`);
      }
      mainBlocks = blocks;
      blockIdsStr = mainBlocks.map((b) => `'${b.id}'`).join(",");

      // 统计所有文档的真实总数（去掉可能导致慢查询的 ORDER BY 以提升 count 速度）
      const cleanMainSQL = mainSQL.replace(/order\s+by.+$/i, "");
      const countAll = await sql(`select count(*) as count from (${cleanMainSQL})`);
      diaryAllEntriesCount = countAll[0]?.count || mainBlocks.length;
      
      // 极速统计当前文档列表相关的图片总数
      const fastImgSQL = generateFastImgSQL(blockIdsStr);
      if (fastImgSQL.includes("1=0")) {
        diaryHasImageEntriesCount = 0;
      } else {
        const countImg = await sql(`select count(*) as count from (${fastImgSQL}) as imgSQL`);
        diaryHasImageEntriesCount = countImg[0]?.count || 0;
      }
      
      await updateSpecialDaysCounts();
    } catch (error) {
      log.error("Error loading diary entries:", error);
    } finally {
      isDataReady = true;
    }
  }

  // 根据当前的 mainBlocks 重新计算特殊日期的统计
  async function updateSpecialDaysCounts() {
    try {
      const thisDayKeys = getThisDayInHistoryKeys();
      const thisMonthKeys = getThisMonthInHistoryKeys();
      const thisWeekKeys = getThisWeekInHistoryKeys();

      thisDayInHistoryCount = mainBlocks.filter(b => thisDayKeys.some(k => b.created && b.created.toString().startsWith(k))).length;
      thisMonthInHistoryCount = mainBlocks.filter(b => thisMonthKeys.some(k => b.created && b.created.toString().startsWith(k))).length;
      thisWeekInHistoryCount = mainBlocks.filter(b => thisWeekKeys.some(k => b.created && b.created.toString().startsWith(k))).length;
    } catch (error) {
      log.error("Error updating special days counts:", error);
    }
  }

  function handleEntryCardClick() {
    showEntries = !showEntries;
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  function handleImageCardClick() {
    showMedia = !showMedia;
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  function handleThisDayInHistoryCardClick() {
    // 点击“那年今日”卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;
    if (specialDayType === SpecialDayType.ThisDayInHistory) {
      specialDayType = SpecialDayType.None;
    } else {
      specialDayType = SpecialDayType.ThisDayInHistory;
    }

    selectedDays = [];
    updateSpecialDaysCounts();
  }

  function handleThisMonthInHistoryCardClick() {
    // 点击"那月今日"卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;

    if (specialDayType === SpecialDayType.ThisMonthInHistory) {
      specialDayType = SpecialDayType.None;
    } else {
      specialDayType = SpecialDayType.ThisMonthInHistory;
    }
    selectedDays = [];
    updateSpecialDaysCounts();
  }

  function handleThisWeekInHistoryCardClick() {
    // 点击"那周今日"卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;

    if (specialDayType === SpecialDayType.ThisWeekInHistory) {
      specialDayType = SpecialDayType.None;
    } else {
      specialDayType = SpecialDayType.ThisWeekInHistory;
    }
    selectedDays = [];
    updateSpecialDaysCounts();
  }

  // ------------------- 解析单个属性 -------------------
  async function resolveProp(key, value, card): Promise<any> {
    // ✅ 或者明確列出不需要處理的屬性
    const skipProps = ["onClick", "onHover", "onFocus", "onBlur"];
    if (skipProps.includes(key)) {
      return value;
    }

    // 1️⃣ 函数 → 调用
    if (typeof value === "function") return value();

    // 2️⃣ SELECT 语句（忽略大小写、前后空格） → 执行 SQL
    if (typeof value === "string" && /^\s*select\s+/i.test(value)) {
      const result = await sql(value);
      return result;
    }

    // 3️⃣ 其它 → 原样返回
    return value;
  }

  // ------------------- 解析整张卡片 -------------------
  async function resolveCard(card: Record<string, any>) {
    const resolved: Record<string, any> = {};

    // 遍历卡片的所有键（type、label、number、percentage、hover、footer…）
    for (const [key, value] of Object.entries(card)) {
      if (typeof value === "string" && /^\s*select\s+/i.test(value)) {
        const result = await resolveProp(key, value, card);
        resolved[key] = result[0]?.content;
        resolved[`${key}Blocks`] = result;
      } else {
        resolved[key] = await resolveProp(key, value, card);
      }
    }

    return resolved;
  }

  // ------------------- 返回 Promise -------------------
  async function loadCards(id: string = undefined) {
    if (!currentConfig?.showcustomCards) return [];

    const cardsToLoad = id
      ? currentConfig.showcustomCards.filter((card) => card.id === id)
      : currentConfig.showcustomCards;

    const promises = cardsToLoad.map(
      (card) => resolveCard({ ...card }) // 传递新对象避免引用相同
    );

    return Promise.all(promises);
  }

  const updateCustomCards = (customCardsTemp) => {
    customCards = customCardsTemp;
  };
  onMount(async () => {
    (window as any).diaryTools = {
      openMobileFileById,
      openBlockByID,
      isMobile,
      plugin,
      updateCustomCards,
    };
  });
</script>

<div class="dashboard-container">
  <!-- 配置切换标签栏 -->
  {#if showConfigTabs}
    <div class="config-tabs">
      {#each sqlConfigs as config, index}
        <StatCard
          type="text"
          asButton={true}
          active={internalSelectedConfig === index}
          size="medium"
          label={config.name}
          activeBackground="rgba(16, 185, 129, 0.12)"
          clickable={true}
          onClick={() => {
            selectedConfig = index;
          }}
        />
      {/each}
    </div>
  {/if}

  <!-- 顶部统计卡片 -->
  <div class="stats-section">
    {#if showMainStatics}
      <StatCard
        type="icon-stat"
        label={currentConfig.indexLabel}
        number={diaryAllEntriesCount ? diaryAllEntriesCount : 0}
        clickable={true}
        backgroundColor={showEntries
          ? "rgba(59, 130, 246, 0.12)"
          : "transparent"}
        onClick={handleEntryCardClick}
      />
      <StatCard
        type="icon-stat"
        label={plugin.i18n["lets-dashboard.totalImages"]}
        number={diaryHasImageEntriesCount || 0}
        backgroundColor={showMedia ? "rgba(59, 130, 246, 0.12)" : "transparent"}
        clickable={true}
        onClick={handleImageCardClick}
      />
    {/if}
    {#if showOnThisDay}
      <StatCard
        type="icon-stat"
        label={plugin.i18n["lets-dashboard.thisDayInHistory"]}
        number={thisDayInHistoryCount}
        backgroundColor={specialDayType === SpecialDayType.ThisDayInHistory
          ? "rgba(59, 130, 246, 0.12)"
          : "transparent"}
        clickable={true}
        onClick={handleThisDayInHistoryCardClick}
      />
      <StatCard
        type="icon-stat"
        label={plugin.i18n["lets-dashboard.thisMonthInHistory"]}
        number={thisMonthInHistoryCount}
        backgroundColor={specialDayType === SpecialDayType.ThisMonthInHistory
          ? "rgba(59, 130, 246, 0.12)"
          : "transparent"}
        clickable={true}
        onClick={handleThisMonthInHistoryCardClick}
      />
      <StatCard
        type="icon-stat"
        label={plugin.i18n["lets-dashboard.thisWeekInHistory"]}
        number={thisWeekInHistoryCount}
        backgroundColor={specialDayType === SpecialDayType.ThisWeekInHistory
          ? "rgba(59, 130, 246, 0.12)"
          : "transparent"}
        clickable={true}
        onClick={handleThisWeekInHistoryCardClick}
      />
    {/if}
  </div>
  {#if customCards && customCards.length > 0}
    <div class="custom-cards">
      {#each customCards as card}
        <StatCard
          type={card.type}
          percentage={card.percentage}
          number={card.number}
          label={card.label}
          text={card.text}
          unit={card.unit}
          hover={card.hover}
          footer={card.footer}
          asButton={true}
          active={card.active}
          maxWidth={card.maxWidth ? card.maxWidth : "20%"}
          fullWidth={card.fullWidth}
          onClick={card.onClick ? () => card.onClick(card) : undefined}
        />
      {/each}
    </div>
  {/if}

  <div class="main-row">
    {#if showHeatmap}
      <Heatmap
        blocks={mainBlocks}
        daysRange={9999}
        {selectedDays}
        on:dayclick={handleDayClick}
      />

      {#if selectedDays.length > 0 || specialDayType !== SpecialDayType.None}
        <div class="day-filter">
          {#if specialDayType === SpecialDayType.ThisDayInHistory}
            <span>{plugin.i18n["lets-dashboard.filteredThisDayInHistory"]}</span>
          {:else if specialDayType === SpecialDayType.ThisMonthInHistory}
            <span>{plugin.i18n["lets-dashboard.filteredThisMonthInHistory"]}</span>
          {:else if specialDayType === SpecialDayType.ThisWeekInHistory}
            <span>{plugin.i18n["lets-dashboard.filteredThisWeekInHistory"]}</span>
          {/if}
          {#if selectedDays.length > 0}
            <span>{plugin.i18n["lets-dashboard.filteredDays"]}{selectedDays.join(", ")}</span>
          {/if}
          <button
            class="clear-filter"
            on:click={() => {
              specialDayType = SpecialDayType.None;
              selectedDays = [];
            }}
          >
            {plugin.i18n["lets-dashboard.clearFilter"]}
          </button>
        </div>
      {/if}
    {/if}
    <div class="media-and-entries">
      {#if showEntries}
        <div class="entries-column">
          <EntryList
            blocks={filteredBlocks}
            dataReady={isDataReady}
            title={currentConfig.name}
            pageSize={10}
          />
        </div>
      {/if}

      {#if showMedia}
        <div class="media-column">
          <ImageGallery
            imgSQL={filteredImgSQL}
            title={currentConfig.name}
            {layout}
            pageSize={30}
            {selectedDays}
          />
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  :global(.tab-btn) {
    padding: 10px 20px;
    border: 2px solid rgb(210 210 210 / 30%);
    /* background: rgba(255, 255, 255, 0.05); */
    /* color: white; */
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  :global(.tab-btn:hover) {
    /* background: rgba(255, 255, 255, 0.15); */
    // border-color: rgba(255, 255, 255, 0.5);
    border-color: transparent;
  }

  :global(.tab-btn.active) {
    background: rgba(16, 185, 129, 0.12);
    color: #333;
    // border-color: #ffd700;
    // box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }

  .dashboard-container {
    padding: 20px;
    min-height: 100vh;

    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;

    /* 配置切换标签栏 */
    .config-tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    /* 统计卡片 */
    .stats-section,
    .custom-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
      .stat-card {
        min-width: 150px;
        min-height: 150px;
        max-width: 300px;
        max-height: 300px;
      }
    }

    .day-filter {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: #f8f9fa;
      color: #495057;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin: 16px 0;
      font-family: system-ui, sans-serif;
    }

    .clear-filter {
      background: #6c757d;
      color: white;
      border: none;
      padding: 6px 16px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .clear-filter:hover {
      background: #5a6268;
    }

    container-type: inline-size;
    container-name: media-entry;

    @container media-entry (min-width: 767px) {
      .media-and-entries {
        display: flex;
        gap: 18px;
        align-items: flex-start;
        margin-top: 18px;
        .media-column {
          flex: 1 1 50%;
          min-width: 320px;
        }
        .entries-column {
          flex: 1 1 50%;
          min-width: 300px;
        }
      }
    }
    @container media-entry (max-width: 767px) {
      width: 100vw;
      .media-and-entries {
        flex-direction: column;
        gap: 12px;
      }
      .media-and-entries {
        display: flex;
        flex-direction: column;
      }
      .media-column,
      .entries-column {
        flex: 1 1 100%;
        max-width: none;
        min-width: auto;
      }
    }
  }
</style>
