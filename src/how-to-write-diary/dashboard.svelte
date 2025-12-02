<script lang="ts">
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import StatCard from "./StatCard.svelte";
  import Heatmap from "./Heatmap.svelte";
  import EntryList from "./EntryList.svelte";
  import { isMobile, plugin } from "@/utils";
  import { openMobileFileById } from "siyuan";

  // const lute = window.Lute.New();

  // 配置多个不同的 SQL 来源
  const sqlConfigs = {
    doc: {
      //配置名
      name: "➿ Voicenotes",
      //主页总数 label
      indexLabel: "总语音日记",
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
          label: `select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1`,
          onClick: () => {
            loadCards("random").then((res) => {
              customCards = customCards.map((card) => {
                const matchedRes = res.find((item) => item.id === card.id);
                return matchedRes ? matchedRes : card;
              });
            });
          },
        },
        {
          type: "text",
          label: `select blocks.* from blocks where type = 'p' order BY RANDOM() LIMIT 1`,
          onClick: (card) => {
            if (isMobile) {
              openMobileFileById(plugin.app, card.labelBlocks[0]?.id);
            } else {
              window.open(`siyuan://blocks/${card.labelBlocks[0]?.id}`);
            }
          },
        },

        {
          type: "icon-stat",
          label: "距离 2026 年还有",
          number: () => {
            const targetDate = new Date("2026-01-01").getTime();
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
    ssn: {
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
    all: {
      name: "🌐 全部",
      indexLabel: "总文档",
      showEntries: true,
      showMedia: false,
      showMainStatics: true,
      showOnThisDay: true,
      showHeatmap: true,
      mainSQL: `select blocks.* from blocks where type = 'd'`,
    },
    random: {
      name: "🎲 随机！",
      indexLabel: "随机文档",
      showEntries: true,
      showMedia: false,
      showMainStatics: true,
      showOnThisDay: true,
      showHeatmap: true,
      mainSQL: `select blocks.* from blocks where type = 'd' ORDER BY RANDOM() LIMIT ${Math.floor(Math.random() * 51) + 50}`,
    },
  };

  // 生成 imgSQL 的默认函数
  const generateImgSQL = (mainSQL) =>
    `select mainSQL.* , assets.PATH as asset_path from (${mainSQL.replace("d", "p")}) as mainSQL left join assets on mainSQL.id= assets.block_id where (assets.PATH LIKE '%.png' OR assets.PATH LIKE '%.jpg' OR assets.PATH LIKE '%.jpeg' OR assets.PATH LIKE '%.gif' OR assets.PATH LIKE '%.bmp' OR assets.PATH LIKE '%.webp')`;

  let selectedConfig = "doc"; // 默认选中文档配置
  $: currentConfig = sqlConfigs[selectedConfig];
  $: mainSQL = currentConfig.mainSQL;
  $: mainCountSQL = `select count(mainSQL.id) as count from (${mainSQL}) as mainSQL`;
  $: imgSQL = currentConfig.imgSQL || generateImgSQL(mainSQL); // 自定义优先，否则生成
  $: imgCountSQL = `select count(imgSQL.id) as count from (${imgSQL}) as imgSQL`;
  // 基于 mainSQL 聚合每天创建数，用于热力图
  $: heatmapSQL = `SELECT substr(created,1,8) as day, count(*) as cnt FROM (${mainSQL}) as t GROUP BY day ORDER BY day`;
  $: selectedConfig && loadData(); // 当配置改变时重新加载数据
  $: layout = "masonry";
  // 日记数据存储
  let diaryAllEntriesCount = 0;
  let diaryHasImageEntriesCount = 0;
  // 那年今日相关
  let thisDayInHistoryCount = 0;

  // 可扩展的"特殊日历筛选"类型
  const SpecialDayType = {
    None: "none",
    ThisDayInHistory: "thisDayInHistory",
    ThisMonthInHistory: "thisMonthInHistory",
    ThisWeekInHistory: "thisWeekInHistory",
  };
  let specialDayType = SpecialDayType.None;

  // 统计各特殊日期类型的数量
  let thisMonthInHistoryCount = 0;
  let thisWeekInHistoryCount = 0;

  // 从日期字符串（YYYYMMDD）解析为 Date 对象
  function parseYYYYMMDD(dateStr) {
    if (!dateStr || dateStr.length !== 8) return new Date();
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

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
  let imageGalleryRef;
  let selectedDays = []; // Array of YYYYMMDD strings for multi-day filtering

  $: showMedia =
    currentConfig?.showMedia == undefined ? true : currentConfig.showMedia; // default show both
  $: showEntries =
    currentConfig?.showEntries == undefined ? true : currentConfig.showEntries; // default show both

  $: idListBaseSQL = `select mainSQL.id, mainSQL.created from (${mainSQL}) as mainSQL`;
  $: idListSQL = `${idListBaseSQL} order by created desc`;

  // 支持特殊日历筛选（那年今日、那月今日、那周今日）和普通多日筛选
  $: filteredIdListSQL =
    specialDayType !== SpecialDayType.None
      ? getSpecialDaySQL(specialDayType, idListSQL)
      : selectedDays.length > 0
        ? `select * from (${idListSQL}) as sub where substr(created,1,8) in (${selectedDays.map((day) => `'${day}'`).join(", ")})`
        : idListSQL;

  $: filteredImgSQL =
    specialDayType !== SpecialDayType.None
      ? getSpecialDaySQL(specialDayType, imgSQL)
      : selectedDays.length > 0
        ? `select * from (${imgSQL}) as sub where substr(created,1,8) in (${selectedDays.map((day) => `'${day}'`).join(", ")})`
        : imgSQL;

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

  async function loadData() {
    // 根据当前选中的配置获取数据
    try {
      const countAll = await sql(mainCountSQL);
      diaryAllEntriesCount = countAll[0]?.count || 0;

      const countImg = await sql(imgCountSQL);
      diaryHasImageEntriesCount = countImg[0]?.count || 0;

      // 更新那年/那月/那周的统计数据
      updateSpecialDaysCounts();
    } catch (error) {
      console.error("Error loading diary entries:", error);
    }
  }

  // 根据当前的 selectedDays 重新计算特殊日期的统计
  async function updateSpecialDaysCounts() {
    try {
      // 统计"那年今日"、"那月今日"、"那周今日"数量
      const thisDayIdListSQL = getSpecialDaySQL(
        SpecialDayType.ThisDayInHistory,
        idListSQL
      );
      const thisMonthIdListSQL = getSpecialDaySQL(
        SpecialDayType.ThisMonthInHistory,
        idListSQL
      );
      const thisWeekIdListSQL = getSpecialDaySQL(
        SpecialDayType.ThisWeekInHistory,
        idListSQL
      );

      const thisDayCountSQL = `select count(*) as count from (${thisDayIdListSQL})`;
      const thisMonthCountSQL = `select count(*) as count from (${thisMonthIdListSQL})`;
      const thisWeekCountSQL = `select count(*) as count from (${thisWeekIdListSQL})`;

      const [thisDayCountRes, thisMonthCountRes, thisWeekCountRes] =
        await Promise.all([
          sql(thisDayCountSQL),
          sql(thisMonthCountSQL),
          sql(thisWeekCountSQL),
        ]);
      thisDayInHistoryCount = thisDayCountRes[0]?.count || 0;
      thisMonthInHistoryCount = thisMonthCountRes[0]?.count || 0;
      thisWeekInHistoryCount = thisWeekCountRes[0]?.count || 0;
    } catch (error) {
      console.error("Error updating special days counts:", error);
    }
  }

  function handleEntryCardClick() {
    showEntries = !showEntries;
    // 取消特殊筛选
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  function handleImageCardClick() {
    showMedia = !showMedia;
    // 取消特殊筛选
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

  $: customCards = [];
  $: if (currentConfig) {
    console.log("currentConfig", currentConfig);
    loadCards().then((res) => {
      customCards = res;
    });
  }
  onMount(async () => {
    await loadData();
  });
</script>

<div class="dashboard-container">
  <!-- 配置切换标签栏 -->
  <div class="config-tabs">
    {#each Object.entries(sqlConfigs) as [key, config]}
      <StatCard
        type="text"
        asButton={true}
        active={selectedConfig === key}
        size="medium"
        label={config.name}
        activeBackground="rgba(16, 185, 129, 0.12)"
        clickable={true}
        onClick={() => {
          selectedConfig = key;
        }}
      />
    {/each}
  </div>

  <!-- 顶部统计卡片 -->
  <div class="stats-section">
    {#if currentConfig.showMainStatics}
      <StatCard
        type="icon-stat"
        label={currentConfig.indexLabel}
        number={diaryAllEntriesCount ? diaryAllEntriesCount : 0}
        active={showEntries}
        clickable={true}
        onClick={handleEntryCardClick}
      />
      <StatCard
        type="icon-stat"
        label="总图片数"
        number={diaryHasImageEntriesCount || 0}
        active={showMedia}
        clickable={true}
        onClick={handleImageCardClick}
      />
    {/if}
    {#if currentConfig.showOnThisDay}
      <StatCard
        type="icon-stat"
        label="那年今日"
        number={thisDayInHistoryCount}
        active={specialDayType === SpecialDayType.ThisDayInHistory}
        clickable={true}
        onClick={handleThisDayInHistoryCardClick}
      />
      <StatCard
        type="icon-stat"
        label="那月今日"
        number={thisMonthInHistoryCount}
        active={specialDayType === SpecialDayType.ThisMonthInHistory}
        clickable={true}
        onClick={handleThisMonthInHistoryCardClick}
      />
      <StatCard
        type="icon-stat"
        label="那周今日"
        number={thisWeekInHistoryCount}
        active={specialDayType === SpecialDayType.ThisWeekInHistory}
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
          onClick={card.onClick ? () => card.onClick(card) : undefined}
        />
      {/each}
    </div>
  {/if}

  <div class="main-row">
    {#if currentConfig.showHeatmap}
      <Heatmap
        sqlQuery={heatmapSQL}
        daysRange={9999}
        {selectedDays}
        on:dayclick={handleDayClick}
      />

      {#if selectedDays.length > 0 || specialDayType !== SpecialDayType.None}
        <div class="day-filter">
          {#if specialDayType === SpecialDayType.ThisDayInHistory}
            <span>已筛选：那年今日</span>
          {:else if specialDayType === SpecialDayType.ThisMonthInHistory}
            <span>已筛选：那月今日</span>
          {:else if specialDayType === SpecialDayType.ThisWeekInHistory}
            <span>已筛选：那周今日</span>
          {/if}
          {#if selectedDays.length > 0}
            <span>已筛选：{selectedDays.join(", ")}</span>
          {/if}
          <button
            class="clear-filter"
            on:click={() => {
              specialDayType = SpecialDayType.None;
              selectedDays = [];
            }}
          >
            清除
          </button>
        </div>
      {/if}
    {/if}
    <div class="media-and-entries">
      {#if showEntries}
        <div class="entries-column">
          <EntryList idSQL={filteredIdListSQL} pageSize={10} />
        </div>
      {/if}

      {#if showMedia}
        <div class="media-column">
          <ImageGallery
            bind:this={imageGalleryRef}
            imgSQL={filteredImgSQL}
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

    /* media and entries side-by-side */
    .media-and-entries {
      display: flex;
      gap: 18px;
      align-items: flex-start;
      margin-top: 18px;
    }
    .media-column {
      flex: 1 1 50%;
      min-width: 320px;
    }
    .entries-column {
      flex: 1 1 50%;
      min-width: 300px;
      /* max-width: 480px; */
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
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
  }

  /* 响应式设计 */
  @media (max-width: 1024px) {
    .dashboard-container {
      padding: 10px;
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
