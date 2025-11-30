<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import StatCard from "./StatCard.svelte";

  // const lute = window.Lute.New();

  const mainSQL = `select blocks.* from blocks where blocks.type = 'd' and blocks.path LIKE '%20250126213235-a3tnoqb%'`;
  const mainCountSQL = `select count(mainSQL.id) as count from (${mainSQL}) as mainSQL`;
  const imgSQL = `select mainSQL.* , assets.PATH as asset_path from (${mainSQL.replace("'d'", "'p'")}) as mainSQL left join assets on mainSQL.id= assets.block_id
where (assets.PATH LIKE '%.png'
   OR assets.PATH LIKE '%.jpg'
   OR assets.PATH LIKE '%.jpeg'
   OR assets.PATH LIKE '%.gif'
   OR assets.PATH LIKE '%.bmp'
   OR assets.PATH LIKE '%.webp')`;

  // 日记数据存储
  let diaryAllEntries = [];
  let diaryAllEntriesCount = 0;
  let diaryHasImageEntries = [];

  // 图片展示已移入独立组件 ImageGallery

  onMount(async () => {
    // 获取总数（原有逻辑）
    // diaryAllEntries = await sql(mainSQL);
    // @ts-ignore
    const diaryAllEntriesCountData = await sql(mainCountSQL);
    console.log("diaryAllEntriesCountData", diaryAllEntriesCountData);
    diaryAllEntriesCount = diaryAllEntriesCountData[0].count;

    // 获取包含图片的日记条目（保留计数逻辑，但图片渲染放到组件中）
    // diaryHasImageEntries 可供统计使用
    diaryHasImageEntries = await sql(imgSQL);
  });
</script>

<div class="dashboard-container">
  <!-- 顶部统计卡片 -->
  <div class="stats-section">
    <StatCard
      number={diaryAllEntriesCount
        ? diaryAllEntriesCount
        : diaryAllEntries.length}
      label="总日记数"
    />
    <StatCard number={diaryHasImageEntries.length} label="图片数" />
  </div>
  <!-- 图片集组件 -->
  <ImageGallery {imgSQL} pageSize={30} />
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
