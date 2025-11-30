<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import StatCard from "./StatCard.svelte";
  import Heatmap from "./Heatmap.svelte";
  import { tick } from "svelte";

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
  let imageGalleryRef;
  let selectedDay = null; // YYYYMMDD — when set, filters image gallery

  $: filteredImgSQL = selectedDay
    ? `select * from (${imgSQL}) as sub where substr(created,1,8)='${selectedDay}'`
    : imgSQL;

  function handleDayClick(e) {
    const dayKey = e.detail?.dayKey;
    if (!dayKey) return;
    // toggle: click same day will clear filter
    if (selectedDay === dayKey) selectedDay = null;
    else selectedDay = dayKey;
  }

  // 图片展示已移入独立组件 ImageGallery

  async function loadData() {
    // 根据当前选中的配置获取数据
    try {
      const countAll = await sql(mainCountSQL);
      diaryAllEntriesCount = countAll[0]?.count || 0;

      const countImg = await sql(imgCountSQL);
      diaryHasImageEntriesCount = countImg[0]?.count || 0;
    } catch (error) {
      console.error("Error loading diary entries:", error);
    }
  }

  onMount(() => {
    loadData();
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
        window.open(`siyuan://blocks/${currentConfig.indexID}`);
      }}
    />
    <StatCard number={diaryHasImageEntriesCount || 0} label="图片数" />
  </div>
  <!-- 图片集组件 -->
  <div class="main-row">
    <div class="left-column">
      <Heatmap
        sqlQuery={heatmapSQL}
        daysRange={9999}
        {selectedDay}
        on:dayclick={handleDayClick}
      />

      {#if selectedDay}
        <div class="day-filter">
          <span>已筛选：{selectedDay}</span>
          <button class="clear-filter" on:click={() => (selectedDay = null)}
            >清除</button
          >
        </div>
      {/if}

      <ImageGallery
        bind:this={imageGalleryRef}
        imgSQL={filteredImgSQL}
        {layout}
        pageSize={30}
        dayFilter={selectedDay}
      />
    </div>
  </div>
</div>

<style>
  .dashboard-container {
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: white;
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

  .tab-btn {
    padding: 10px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.5);
  }

  .tab-btn.active {
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
