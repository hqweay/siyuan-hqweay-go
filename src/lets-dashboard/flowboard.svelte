<script>
  import EntryList from "./EntryList.svelte";
  import ImageGallery from "./ImageGallery.svelte";
  import { settings } from "@/settings";

  import pluginMetadata from "./plugin";

  let inputSQL = "";
  let inputExecuteSQL = "";
  let loading = false;
  let error = "";
  let isEntryList = false; // 判断是否显示 EntryList
  let refreshKey = 0;

  async function executeSQL() {
    if (!inputSQL.trim()) {
      error = "请输入 SQL 语句";
      return;
    }

    refreshKey += 1;
    loading = true;
    error = "";

    try {
      // 判断数据类型
      if (inputSQL.includes("asset_path")) {
        isEntryList = false;
      } else {
        isEntryList = true;
      }
      inputExecuteSQL = inputSQL;
    } catch (e) {
      error = "SQL 执行错误: " + e.message;
    } finally {
      loading = false;
    }
  }

  // 示例 SQL 分类
  const exampleSQLCategories = settings.getBySpace(
    pluginMetadata.name,
    "flowMode"
  )
    ? eval(`${settings.getBySpace(pluginMetadata.name, "flowMode")}`)
    : [
        {
          name: "文档查询",
          examples: [
            {
              name: "随机所有文档",
              sql: "SELECT * FROM blocks WHERE type = 'd' ORDER BY RANDOM()",
            },
            {
              name: "随机内容搜索",
              sql: "SELECT * FROM blocks WHERE content LIKE '%关键词%' ORDER BY RANDOM()",
            },
            {
              name: "路径筛选",
              sql: "SELECT * FROM blocks WHERE path LIKE '%2024%' ORDER BY created DESC LIMIT 15",
            },
          ],
        },
        {
          name: "图片查询",
          examples: [
            {
              name: "JPG图片",
              sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id WHERE assets.path LIKE '%.jpg' LIMIT 20",
            },
            {
              name: "PNG图片",
              sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id WHERE assets.path LIKE '%.png' LIMIT 20",
            },
            {
              name: "按时间排序",
              sql: "SELECT blocks.*, assets.path as asset_path from blocks left join assets on blocks.id = assets.block_id ORDER BY created DESC LIMIT 30",
            },
          ],
        },
        {
          name: "时间范围",
          examples: [
            {
              name: "日期区间",
              sql: "SELECT * FROM blocks WHERE type = 'd' AND created >= '20241201000000' AND created <= '20241231235959'",
            },
            {
              name: "按月查询",
              sql: "SELECT * FROM blocks WHERE substr(created, 1, 6) = '202412' ORDER BY created DESC",
            },
            {
              name: "近30天",
              sql: "SELECT * FROM blocks WHERE created >= date('now', '-30 days') ORDER BY created DESC LIMIT 20",
            },
          ],
        },
      ];

  // 将所有示例 SQL 平铺用于向后兼容
  $: exampleSQLs = exampleSQLCategories.flatMap(
    (category) => category.examples
  );

  let showExamplesDropdown = false;

  function setExampleSQL(example) {
    // 支持字符串和对象两种格式
    const sql = typeof example === "string" ? example : example.sql;
    inputSQL = sql;
    showExamplesDropdown = false; // 选择后关闭下拉菜单
  }

  // 获取显示文本（名称或SQL）
  function getDisplayText(example) {
    if (typeof example === "string") {
      return example.length > 30 ? example.substring(0, 30) + "..." : example;
    } else {
      return (
        example.name ||
        (example.sql.length > 30
          ? example.sql.substring(0, 30) + "..."
          : example.sql)
      );
    }
  }

  // 获取完整文本用于title
  function getFullText(example) {
    return typeof example === "string" ? example : example.sql;
  }

  function toggleExamplesDropdown() {
    showExamplesDropdown = !showExamplesDropdown;
  }
</script>

<div class="flowboard-container">
  <!-- SQL 输入区域 -->
  <div class="sql-input-section">
    <h3>自定义 SQL 查询</h3>
    <div class="input-group">
      <textarea
        bind:value={inputSQL}
        placeholder="请输入 SQL 语句..."
        rows="2"
        class="sql-input"
      ></textarea>
      <button on:click={executeSQL} disabled={loading} class="execute-btn">
        {loading ? "执行中..." : "执行查询"}
      </button>
    </div>

    <!-- 示例 SQL -->
    <div class="examples-dropdown-container">
      {#if exampleSQLs.length <= 4}
        <span class="examples-label">示例 SQL:</span>

        <!-- 少量示例时直接显示 -->
        {#each exampleSQLs as example}
          <button
            class="example-btn"
            on:click={() => setExampleSQL(example)}
            disabled={loading}
            title={getFullText(example)}
          >
            {getDisplayText(example)}
          </button>
        {/each}
      {:else}
        <!-- 大量示例时显示下拉菜单 -->
        <div class="dropdown-wrapper">
          <button
            class="dropdown-toggle"
            on:click={toggleExamplesDropdown}
            disabled={loading}
          >
            示例 SQL ({exampleSQLs.length})
            <span class="arrow" class:rotated={showExamplesDropdown}>▼</span>
          </button>

          {#if showExamplesDropdown}
            <div class="dropdown-menu">
              {#each exampleSQLCategories as category}
                <div class="category-group">
                  <div class="category-title">{category.name}</div>
                  {#each category.examples as example}
                    <button
                      class="dropdown-item"
                      on:click={() => setExampleSQL(example)}
                      disabled={loading}
                      title={getFullText(example)}
                    >
                      {getDisplayText(example)}
                    </button>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- 错误提示 -->
    {#if error}
      <div class="error-message">
        {error}
      </div>
    {/if}
  </div>

  <!-- 结果展示区域 -->
  {#if inputExecuteSQL}
    {#key refreshKey}
      <div class="results-section">
        {#if isEntryList}
          <div class="entries-column">
            <EntryList
              idSQL={inputExecuteSQL}
              title="自定义查询结果"
              pageSize={10}
              fromFlow={false}
            />
          </div>
        {:else}
          <div class="media-column">
            <ImageGallery
              imgSQL={inputExecuteSQL}
              title="自定义查询结果"
              pageSize={30}
              fromFlow={false}
            />
          </div>
        {/if}
      </div>
    {/key}
  {:else if !loading && !error}
    <div class="empty-state">
      <p>请输入 SQL 语句并点击执行按钮</p>
    </div>
  {/if}
</div>

<style>
  .flowboard-container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .sql-input-section {
    margin-bottom: 30px;
  }

  .sql-input-section h3 {
    color: #ffd700;
    margin-bottom: 15px;
    font-size: 1.2rem;
  }

  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
  }

  .sql-input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    color: #333;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 14px;
    resize: vertical;
    min-height: 100px;
  }

  .sql-input::placeholder {
    color: #666;
  }

  .execute-btn {
    padding: 12px 24px;
    background: rgba(16, 185, 129, 0.12);
    color: #333;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .execute-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    transform: translateY(-1px);
  }

  .execute-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .examples-dropdown-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .examples-label {
    color: #666;
    font-size: 14px;
    margin-right: 8px;
    white-space: nowrap;
  }

  .example-btn {
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.6);
    color: #333;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .example-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
  }

  .example-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-toggle {
    padding: 8px 16px;
    background: rgba(16, 185, 129, 0.12);
    color: #333;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dropdown-toggle:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
  }

  .dropdown-toggle:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .arrow {
    transition: transform 0.2s ease;
    font-size: 10px;
  }

  .arrow.rotated {
    transform: rotate(180deg);
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-width: 400px;
    max-height: 300px;
    overflow-y: auto;
    padding: 8px 0;
  }

  .category-group {
    margin-bottom: 8px;
  }

  .category-group:last-child {
    margin-bottom: 0;
  }

  .category-title {
    padding: 6px 16px 4px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    border-bottom: 1px solid #eee;
    margin-bottom: 4px;
  }

  .dropdown-item {
    width: 100%;
    padding: 8px 16px;
    background: none;
    color: #333;
    border: none;
    cursor: pointer;
    font-size: 12px;
    text-align: left;
    transition: background 0.2s ease;
    white-space: normal;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .dropdown-item:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.1);
  }

  .dropdown-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 12px;
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid rgba(220, 53, 69, 0.3);
    border-radius: 8px;
    color: #721c24;
    margin-top: 10px;
  }

  .results-section {
    margin-top: 30px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid #ddd;
    border-radius: 8px;
  }

  .results-count {
    color: #ffd700;
    font-weight: 600;
  }

  .results-type {
    color: #333;
    font-size: 14px;
    padding: 4px 8px;
    background: rgba(16, 185, 129, 0.2);
    border-radius: 4px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #666;
  }

  .empty-state p {
    font-size: 16px;
  }

  .entries-column,
  .media-column {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 15px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
</style>
