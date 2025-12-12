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

  async function executeSQL() {
    if (!inputSQL.trim()) {
      error = "请输入 SQL 语句";
      return;
    }

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

  // 示例 SQL
  const exampleSQLs = settings.getBySpace(pluginMetadata.name, "flowMode")
    ? settings.getBySpace(pluginMetadata.name, "flowMode").split("\n")
    : [
        "SELECT * FROM blocks WHERE type = 'd' ORDER BY RANDOM() LIMIT 20",
        "SELECT assets.path as asset_path FROM assets ORDER BY RANDOM() LIMIT 20",
      ];

  function setExampleSQL(sql) {
    inputSQL = sql;
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
    <div class="examples">
      <span class="examples-label">示例 SQL:</span>
      {#each exampleSQLs as example}
        <button
          class="example-btn"
          on:click={() => setExampleSQL(example)}
          disabled={loading}
        >
          {example}
        </button>
      {/each}
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

  .examples {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .examples-label {
    color: #666;
    font-size: 14px;
    margin-right: 8px;
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
  }

  .example-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.8);
    transform: translateY(-1px);
  }

  .example-btn:disabled {
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
