<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import StatCard from "./StatCard.svelte";
  import Heatmap from "./Heatmap.svelte";
  import EntryList from "./EntryList.svelte";

  // const lute = window.Lute.New();

  // 配置多个不同的 SQL 来源
  const sqlConfigs = {
    doc: {
      name: "➿ Voicenotes",
      indexID: "20250126213235-a3tnoqb", //定义点击打开的块
      indexLabel: "总语音日记",
      mainSQL: `select blocks.* from blocks where blocks.type = 'd' and blocks.path LIKE '%20250126213235-a3tnoqb%'`,
      imgSQL: null, //  可选：自定义 imgSQL，若为 null，则使用 getImgSQL 生成
    },
    ssn: {
      name: "📝 碎碎念引用",
      indexID: "",
      indexLabel: "碎碎念引用块",
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
      mainSQL: `select blocks.* from blocks where type = 'd'`,
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
      for (let y = thisYear - 1; y >= 2000; y--) {
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
  let isMobile = false;
  let showMedia = true; // default show both
  let showEntries = true; // default show both

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
    // click entries card: show only entries
    showEntries = true;
    showMedia = false;
    // 取消特殊筛选
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  function handleImageCardClick() {
    // click image card: show only media
    showMedia = true;
    showEntries = false;
    // 取消特殊筛选
    specialDayType = SpecialDayType.None;
    selectedDays = [];
  }

  function handleThisDayInHistoryCardClick() {
    // 点击“那年今日”卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;
    specialDayType = SpecialDayType.ThisDayInHistory;
    selectedDays = [];
    updateSpecialDaysCounts();
  }

  function handleThisMonthInHistoryCardClick() {
    // 点击"那月今日"卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;
    specialDayType = SpecialDayType.ThisMonthInHistory;
    selectedDays = [];
    updateSpecialDaysCounts();
  }

  function handleThisWeekInHistoryCardClick() {
    // 点击"那周今日"卡片，激活特殊筛选
    showEntries = true;
    showMedia = true;
    specialDayType = SpecialDayType.ThisWeekInHistory;
    selectedDays = [];
    updateSpecialDaysCounts();
  }

  function handleMediaToggleOnMobile() {
    // on mobile, allow toggling between sections
    if (showEntries && !showMedia) {
      showMedia = true;
      showEntries = false;
    } else {
      showEntries = true;
      showMedia = false;
    }
  }

  onMount(() => {
    loadData();
    // detect mobile
    const handleResize = () => {
      isMobile = window.innerWidth < 1024;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
</script>

<div class="dashboard-container">
  <!-- 配置切换标签栏 -->
  <div class="config-tabs">
    {#each Object.entries(sqlConfigs) as [key, config]}
      <button
        class={`tab-btn ${selectedConfig === key ? "active" : ""}`}
        on:click={() => (selectedConfig = key)}
      >
        {config.name}
      </button>
    {/each}
  </div>

  <!-- 顶部统计卡片 -->
  <div class="stats-section">
    <StatCard
      number={diaryAllEntriesCount ? diaryAllEntriesCount : 0}
      label={currentConfig.indexLabel}
      clickable={currentConfig.indexID ? true : false}
      on:click={async () => {
        // if (isMobile) {
        handleEntryCardClick();
        // } else {
        //   window.open(`siyuan://blocks/${currentConfig.indexID}`);
        // }
      }}
    />
    <StatCard
      number={diaryHasImageEntriesCount || 0}
      label="总图片数"
      clickable={true}
      on:click={() => {
        // if (isMobile) {
        handleImageCardClick();
        // }
      }}
    />

    <StatCard
      number={thisDayInHistoryCount}
      label="那年今日"
      clickable={true}
      on:click={handleThisDayInHistoryCardClick}
      className={specialDayType === SpecialDayType.ThisDayInHistory
        ? "active"
        : ""}
    />
    <StatCard
      number={thisMonthInHistoryCount}
      label="那月今日"
      clickable={true}
      on:click={handleThisMonthInHistoryCardClick}
      className={specialDayType === SpecialDayType.ThisMonthInHistory
        ? "active"
        : ""}
    />
    <StatCard
      number={thisWeekInHistoryCount}
      label="那周今日"
      clickable={true}
      on:click={handleThisWeekInHistoryCardClick}
      className={specialDayType === SpecialDayType.ThisWeekInHistory
        ? "active"
        : ""}
    />
  </div>
  <!-- 图片集组件 -->
  <div class="main-row">
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
          <!-- {:else if selectedDays.length > 0}
          <span>已筛选：{selectedDays.join(", ")}</span>
        {/if} -->
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

    <div class="media-and-entries" class:mobile={isMobile}>
      {#if showEntries}
        <div class="entries-column" class:mobile={isMobile}>
          <!-- <div class="column-header">
            <h3>日记流</h3>
            {#if isMobile}
              <button class="toggle-btn" on:click={handleMediaToggleOnMobile}
                >→ 图片</button
              >
            {/if}
          </div> -->
          <EntryList idSQL={filteredIdListSQL} pageSize={10} />
        </div>
      {/if}

      {#if showMedia}
        <div class="media-column" class:mobile={isMobile}>
          <!-- <div class="column-header"> -->
          <!-- <h3>图片集</h3> -->
          <!-- {#if isMobile}
              <button class="toggle-btn" on:click={handleMediaToggleOnMobile}
                >→ 日记</button
              >
            {/if} -->
          <!-- </div> -->
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

<style>
  .dashboard-container {
    padding: 20px;
    /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
    min-height: 100vh;
    /* color: white; */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
      sans-serif;
  }

  /* 配置切换标签栏 */
  .config-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }

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
    border-color: rgba(255, 255, 255, 0.5);
  }

  :global(.tab-btn.active) {
    background: #ffd700;
    color: #333;
    border-color: #ffd700;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  }

  /* 统计卡片 */
  .stats-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  /* 主要内容区域 */
  .main-content {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 30px;
    margin-bottom: 30px;
  }

  @media (max-width: 768px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  /* 日历部分 */
  .calendar-section {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .calendar-header h2 {
    margin: 0;
    font-size: 1.5rem;
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

  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .column-header h3 {
    margin: 0;
    color: #ffd700;
    font-size: 1.1rem;
  }

  .toggle-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s ease;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 1023px) {
    .media-and-entries {
      flex-direction: column;
      gap: 12px;
    }

    .media-and-entries.mobile {
      display: flex;
      flex-direction: column;
    }

    .media-column.mobile,
    .entries-column.mobile {
      flex: 1 1 100%;
      max-width: none;
      min-width: auto;
    }

    .stats-section {
      grid-template-columns: 1fr 1fr;
    }
  }

  .nav-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    transition: background 0.3s ease;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
  }

  .weekday {
    text-align: center;
    font-weight: bold;
    padding: 10px;
    color: #ffd700;
  }

  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 40px;
  }

  .calendar-day:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .calendar-day.today {
    background: #ffd700;
    color: #333;
    font-weight: bold;
  }

  .calendar-day.other-month {
    opacity: 0.3;
  }

  .calendar-day.selected {
    background: rgba(255, 215, 0, 0.3);
    border: 2px solid #ffd700;
  }

  .day-number {
    font-size: 0.9rem;
  }

  .diary-indicator {
    position: absolute;
    bottom: 2px;
    width: 6px;
    height: 6px;
    background: #4caf50;
    border-radius: 50%;
  }

  /* 右侧面板 */
  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .chart-section,
  .mood-section {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .chart-section h3,
  .mood-section h3 {
    margin: 0 0 15px 0;
    color: #ffd700;
    font-size: 1.1rem;
  }

  /* 柱状图 */
  .bar-chart {
    display: flex;
    justify-content: space-around;
    align-items: end;
    height: 120px;
    gap: 8px;
  }

  .bar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  .bar {
    width: 20px;
    background: linear-gradient(180deg, #ffd700, #ffa500);
    border-radius: 4px 4px 0 0;
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .bar:hover {
    background: linear-gradient(180deg, #ffa500, #ff8c00);
  }

  .bar-label {
    font-size: 0.7rem;
    margin-top: 5px;
    text-align: center;
  }

  /* 心情统计 */
  .mood-chart {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mood-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mood-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .mood-label {
    flex: 1;
    font-size: 0.9rem;
  }

  .mood-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
  }

  /* 图片区域 */
  .images-section {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .images-section h3 {
    margin: 0 0 20px 0;
    color: #ffd700;
    font-size: 1.3rem;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }

  .image-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.3s ease;
  }

  .image-item:hover {
    transform: scale(1.05);
  }

  .image-item img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    display: block;
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    color: white;
    padding: 8px;
    font-size: 0.8rem;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  .image-item:hover .image-overlay {
    transform: translateY(0);
  }

  .images-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0 4px 0;
  }

  .loading-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    opacity: 0.9;
    padding: 6px 12px;
  }

  .sentinel {
    width: 100%;
    height: 8px;
  }

  /* 模态框 */
  .selected-date-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 0;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .modal-header h3 {
    margin: 0;
    color: #ffd700;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .modal-body {
    padding: 20px;
  }

  .entries-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }

  .entry-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 15px;
    border-radius: 8px;
    border-left: 4px solid #ffd700;
  }

  .entry-item h4 {
    margin: 0 0 8px 0;
    color: #ffd700;
  }

  .entry-item p {
    margin: 0;
    opacity: 0.9;
    line-height: 1.4;
  }

  .mood-indicator[data-mood="happy"] {
    width: 12px;
    height: 12px;
    background: #ffd700;
    border-radius: 50%;
    margin-top: 8px;
  }

  .mood-indicator[data-mood="neutral"] {
    width: 12px;
    height: 12px;
    background: #87ceeb;
    border-radius: 50%;
    margin-top: 8px;
  }

  .mood-indicator[data-mood="sad"] {
    width: 12px;
    height: 12px;
    background: #dda0dd;
    border-radius: 50%;
    margin-top: 8px;
  }

  .no-entries {
    text-align: center;
    opacity: 0.7;
    font-style: italic;
    margin-bottom: 20px;
  }

  .add-entry-btn {
    width: 100%;
    padding: 12px;
    background: rgba(255, 215, 0, 0.3);
    border: 2px solid #ffd700;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .add-entry-btn:hover {
    background: #ffd700;
    color: #333;
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

  /* 响应式设计 */
  @media (max-width: 768px) {
    .dashboard-container {
      padding: 10px;
    }

    .stats-section {
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .stat-card {
      padding: 15px;
    }

    .stat-number {
      font-size: 1.5rem;
    }

    .image-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .image-item img {
      height: 100px;
    }
  }
</style>
