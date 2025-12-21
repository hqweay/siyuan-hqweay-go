<script lang="ts">
  import { getBlockAttrs, setBlockAttrs, sql } from "@/api";
  import EntryList from "@/lets-dashboard/EntryList.svelte";
  import ImageGallery from "@/lets-dashboard/ImageGallery.svelte";
  import { createEventDispatcher, onMount } from "svelte";

  export let presetSql: string = ""; // 接收预填充的SQL
  export let rootId: string = ""; // 接收文档ID用于保存
  export let saveSqlName: string = ""; // 接收文档名称用于保存

  const dispatch = createEventDispatcher();

  let inputSQL = "";
  let inputExecuteSQL = "";
  let loading = false;
  let error = "";
  let isEntryList = false;
  let refreshKey = 0;
  // let saveSqlName = ""; // SQL名称变量

  // 控制SQL输入区域的展开/折叠
  let isSqlInputExpanded = false;

  // 示例SQL分类
  const exampleSQLCategories = [
    {
      name: "文档查询",
      examples: [
        {
          name: "随机所有文档",
          sql: "SELECT * FROM blocks WHERE type = 'd' ORDER BY RANDOM() LIMIT 20",
        },
        {
          name: "随机内容搜索",
          sql: "SELECT * FROM blocks WHERE content LIKE '%关键词%' ORDER BY RANDOM() LIMIT 20",
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
      name: "反链相关",
      examples: [
        {
          name: "查询引用块",
          sql: "SELECT * FROM blocks WHERE id IN (SELECT block_id FROM attributes WHERE name = 'data-link-subtype' AND value = 'backlink') LIMIT 20",
        },
        {
          name: "查询超链接",
          sql: "SELECT * FROM blocks WHERE content LIKE '%](%' LIMIT 20",
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

  // 将所有示例SQL平铺用于向后兼容
  $: exampleSQLs = exampleSQLCategories.flatMap(
    (category) => category.examples
  );

  let showExamplesDropdown = false;

  // 保存相关状态
  let showSaveForm = false;
  let isSaving = false;

  // 删除相关状态
  let showDeleteForm = false;
  let isDeleting = false;

  // 初始化时处理预设的SQL
  onMount(() => {
    if (presetSql) {
      inputSQL = presetSql;
      isSqlInputExpanded = false; // 有预设SQL时展开
      // 可以选择自动执行，或者让用户手动执行
      executeSQL(); // 取消自动执行，让用户手动确认
    } else {
      isSqlInputExpanded = true; // 无预设SQL时默认折叠
    }
  });

  async function executeSQL() {
    if (!inputSQL.trim()) {
      error = "请输入 SQL 语句";
      return;
    }

    refreshKey += 1;
    loading = true;
    error = "";

    try {
      // 简单测试SQL是否有效
      await testSQL(inputSQL);

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

  async function testSQL(sqlStr: string): Promise<void> {
    try {
      // 尝试执行一个简单的查询来验证SQL语法
      await sql(`SELECT 1`);
    } catch (e) {
      throw new Error("SQL语法错误");
    }
  }

  function setExampleSQL(example) {
    const sql = typeof example === "string" ? example : example.sql;
    inputSQL = sql;
    showExamplesDropdown = false;
  }

  // 获取显示文本
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

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "Enter") {
      executeSQL();
    }
  }

  // 保存SQL到文档属性
  async function saveSqlToDocument(name: string, sql: string) {
    if (!rootId) {
      alert("无法保存：缺少文档ID");
      return;
    }

    try {
      isSaving = true;

      // 获取现有的保存的SQL列表
      const result = await getBlockAttrs(rootId);
      let savedSqlList = [];

      if (result && result["custom-tab-panel-sqls"]) {
        const sqlAttr = result["custom-tab-panel-sqls"];
        if (sqlAttr) {
          try {
            savedSqlList = JSON.parse(sqlAttr);
          } catch (e) {
            console.error("解析保存的SQL数据失败:", e);
            savedSqlList = [];
          }
        }
      }

      // 检查SQL名称是否已存在
      const existingIndex = savedSqlList.findIndex(
        (item) => item.name === name
      );
      let isUpdate = false;

      if (existingIndex !== -1) {
        // 更新已存在的SQL
        savedSqlList[existingIndex] = { name, sql };
        isUpdate = true;
      } else {
        // 添加新的SQL
        const newSqlItem = { name, sql };
        savedSqlList = [...savedSqlList, newSqlItem];
      }

      // 保存到文档属性
      const sqlData = JSON.stringify(savedSqlList);
      await setBlockAttrs(rootId, {
        "custom-tab-panel-sqls": sqlData,
      });

      // 通知父组件更新
      dispatch("sqlUpdated", { savedSqlList });

      // 重置表单
      // saveSqlName = "";
      showSaveForm = false;

      // 显示成功消息
      if (isUpdate) {
        alert(`SQL "${name}" 更新成功！`);
      } else {
        alert(`SQL "${name}" 保存成功！`);
      }
    } catch (error) {
      console.error("保存SQL失败:", error);
      alert("保存失败，请重试");
    } finally {
      isSaving = false;
    }
  }

  // 处理保存表单提交
  function handleSaveSqlSubmit() {
    if (!saveSqlName.trim() || !inputSQL.trim()) {
      alert("请输入SQL名称和内容");
      return;
    }
    saveSqlToDocument(saveSqlName.trim(), inputSQL.trim());
  }

  // 删除SQL配置
  async function deleteSqlFromDocument(name: string) {
    if (!rootId) {
      alert("无法删除：缺少文档ID");
      return;
    }

    try {
      isDeleting = true;

      // 获取现有的保存的SQL列表
      const result = await getBlockAttrs(rootId);
      let savedSqlList = [];

      if (result && result["custom-tab-panel-sqls"]) {
        const sqlAttr = result["custom-tab-panel-sqls"];
        if (sqlAttr) {
          try {
            savedSqlList = JSON.parse(sqlAttr);
          } catch (e) {
            console.error("解析保存的SQL数据失败:", e);
            savedSqlList = [];
          }
        }
      }

      // 查找并删除指定的SQL
      const targetIndex = savedSqlList.findIndex((item) => item.name === name);

      if (targetIndex === -1) {
        alert(`未找到名为 "${name}" 的SQL配置`);
        return;
      }

      // 确认删除
      if (!confirm(`确定要删除SQL配置 "${name}" 吗？此操作不可撤销。`)) {
        return;
      }

      // 从列表中移除
      savedSqlList.splice(targetIndex, 1);

      // 保存到文档属性
      const sqlData = JSON.stringify(savedSqlList);
      await setBlockAttrs(rootId, {
        "custom-tab-panel-sqls": sqlData,
      });

      // 通知父组件更新
      dispatch("sqlUpdated", { savedSqlList });

      // 重置表单
      showDeleteForm = false;

      // 显示成功消息
      alert(`SQL "${name}" 删除成功！`);
    } catch (error) {
      console.error("删除SQL失败:", error);
      alert("删除失败，请重试");
    } finally {
      isDeleting = false;
    }
  }

  // 切换保存表单显示
  function toggleSaveForm() {
    if (!inputSQL.trim()) {
      alert("请先输入SQL语句");
      return;
    }
    showSaveForm = !showSaveForm;
  }

  // 切换SQL输入区域展开/折叠
  function toggleSqlInputSection() {
    isSqlInputExpanded = !isSqlInputExpanded;
  }

  // function toggleDelete() {
  //   confirmDialog({
  //     title: "确认删除SQL配置",
  //     content: `确定要删除SQL配置 "${saveSqlName}" 吗？此操作不可撤销。`,
  //     confirmText: "删除",
  //     onConfirm: () => {
  //       deleteSqlFromDocument(saveSqlName);
  //     },
  //   });
  // }
</script>

<div class="custom-sql-container">
  <!-- SQL 输入区域标题栏 -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="sql-section-header" on:click={toggleSqlInputSection}>
    <h3>自定义 SQL 查询</h3>
    <div class="section-controls">
      <div class="help-text">Ctrl+Enter 执行查询</div>
      <button class="expand-toggle" class:expanded={isSqlInputExpanded}>
        <span class="arrow" class:rotated={isSqlInputExpanded}>▼</span>
        {isSqlInputExpanded ? '折叠' : '展开'}
      </button>
    </div>
  </div>
  
  <!-- SQL 输入区域 -->
  <div class="sql-input-section" class:collapsed={!isSqlInputExpanded}>
    <!-- <div class="section-header">
      <h3>自定义 SQL 查询</h3>
      <div class="help-text">Ctrl+Enter 执行查询</div>
    </div> -->
    <div class="input-group">
      <textarea
        bind:value={inputSQL}
        placeholder="请输入 SQL 语句..."
        rows="2"
        class="sql-input"
        on:keydown={handleKeyDown}
      ></textarea>
      <div class="button-group">
        <button
          on:click={toggleSaveForm}
          disabled={loading || !inputSQL.trim()}
          class="save-btn"
        >
          保存SQL
        </button>
        <button
          on:click={async () => {
            deleteSqlFromDocument(saveSqlName);
          }}
          disabled={loading}
          class="delete-btn"
        >
          删除SQL
        </button>
        <button on:click={executeSQL} disabled={loading} class="execute-btn">
          {loading ? "执行中..." : "执行查询"}
        </button>
      </div>
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

    <!-- 保存SQL表单 -->
    {#if showSaveForm}
      <div class="save-sql-form">
        <div class="form-group">
          <label>SQL名称:</label>
          <input
            type="text"
            bind:value={saveSqlName}
            placeholder="请输入SQL名称"
            class="save-sql-input"
          />
        </div>
        <div class="form-actions">
          <button
            class="cancel-btn"
            on:click={() => {
              showSaveForm = false;
            }}
          >
            取消
          </button>
          <button
            class="confirm-save-btn"
            on:click={handleSaveSqlSubmit}
            disabled={isSaving || !saveSqlName.trim()}
          >
            {isSaving ? "保存中..." : "确认保存"}
          </button>
        </div>
      </div>
    {/if}

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
      <div class="empty-icon">📊</div>
      <p>请输入 SQL 语句并点击执行按钮</p>
      <p class="hint">可以使用上方的示例SQL作为起点</p>
    </div>
  {/if}
</div>

<style lang="scss">
  .custom-sql-container {
    padding: 20px;
    height: 100%;
    overflow-y: auto;
  }

  .entries-column {
    background: unset !important;
  }

  .sql-input-section {
    margin-bottom: 20px;
  }

  .sql-input-section.collapsed {
    display: none;
  }

  .sql-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 12px 16px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-outline-variant);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sql-section-header:hover {
    // background: var(--b3-theme-surface-variant);
    transform: translateY(-1px);
  }

  .sql-section-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--b3-theme-on-background);
  }

  .section-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .expand-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--b3-theme-secondary);
    color: var(--b3-theme-on-secondary);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  .expand-toggle:hover {
    // background: var(--b3-theme-secondary-hover);
  }

  .expand-toggle .arrow {
    transition: transform 0.2s ease;
    font-size: 10px;
  }

  .expand-toggle .arrow.rotated {
    transform: rotate(180deg);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--b3-theme-on-background);
  }

  .help-text {
    font-size: 0.8rem;
    color: var(--b3-theme-on-surface);
    opacity: 0.7;
  }

  .input-group {
    display: flex;
    gap: 12px;
    margin-bottom: 15px;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 120px;
  }

  .sql-input {
    flex: 1;
    padding: 12px;
    // border: 1px solid var(--b3-theme-surface-variant);
    border-radius: 8px;
    // background: var(--b3-theme-background);
    // color: var(--b3-theme-on-background);
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 14px;
    resize: vertical;
    // min-height: 80px;
  }

  .sql-input::placeholder {
    color: var(--b3-theme-on-surface);
    opacity: 0.6;
  }

  .sql-input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
    box-shadow: 0 0 0 2px rgba(var(--b3-theme-primary-rgb), 0.2);
  }

  .execute-btn,
  .save-btn,
  .delete-btn {
    padding: 12px 16px;
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 14px;
  }

  .save-btn {
    background: var(--b3-theme-secondary);
    color: var(--b3-theme-on-secondary);
  }

  .delete-btn {
    background: var(--b3-theme-error);
    color: var(--b3-theme-on-error);
  }

  .execute-btn:hover:not(:disabled) {
    // background: var(--b3-theme-primary-hover);
    transform: translateY(-1px);
  }

  .save-btn:hover:not(:disabled) {
    // background: var(--b3-theme-secondary-hover);
    transform: translateY(-1px);
  }

  .delete-btn:hover:not(:disabled) {
    // background: var(--b3-theme-error-hover);
    transform: translateY(-1px);
  }

  .execute-btn:disabled,
  .save-btn:disabled,
  .delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .examples-dropdown-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .examples-label {
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    margin-right: 8px;
    white-space: nowrap;
  }

  .example-btn {
    padding: 6px 12px;
    background: var(--b3-theme-surface-variant);
    color: var(--b3-theme-on-surface);
    border: 1px solid var(--b3-theme-outline);
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
    // background: var(--b3-theme-surface);
    transform: translateY(-1px);
  }

  .example-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-toggle {
    padding: 8px 16px;
    background: var(--b3-theme-secondary);
    color: var(--b3-theme-on-secondary);
    border: 1px solid var(--b3-theme-outline);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .dropdown-toggle:hover:not(:disabled) {
    // background: var(--b3-theme-secondary-hover);
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
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-outline);
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
    color: var(--b3-theme-on-surface);
    border-bottom: 1px solid var(--b3-theme-outline-variant);
    margin-bottom: 4px;
  }

  .dropdown-item {
    width: 100%;
    padding: 8px 16px;
    background: none;
    color: var(--b3-theme-on-surface);
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
    // background: var(--b3-theme-surface-variant);
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
    margin-top: 20px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--b3-theme-on-surface);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 16px;
    margin: 8px 0;
  }

  .hint {
    font-size: 14px;
    opacity: 0.7;
  }

  .entries-column,
  .media-column {
    background: var(--b3-theme-surface);
    border-radius: 8px;
    padding: 15px;
    border: 1px solid var(--b3-theme-outline-variant);
  }

  /* 保存表单样式 */
  .save-sql-form {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-outline-variant);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .delete-sql-form {
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-outline-variant);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    display: block;
    margin-bottom: 6px;
    color: var(--b3-theme-on-surface);
    font-weight: 500;
    font-size: 14px;
  }

  .save-sql-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-outline);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    font-size: 14px;
    box-sizing: border-box;
  }

  .delete-sql-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-error);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    font-size: 14px;
    box-sizing: border-box;
  }

  .save-sql-input:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .delete-sql-input:focus {
    outline: none;
    border-color: var(--b3-theme-error);
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .cancel-btn,
  .confirm-save-btn,
  .confirm-delete-btn {
    padding: 6px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .cancel-btn {
    background: var(--b3-theme-surface-variant);
    color: var(--b3-theme-on-surface);
  }

  .cancel-btn:hover {
    // background: var(--b3-theme-surface-variant-hover);
  }

  .confirm-save-btn {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }

  .confirm-save-btn:hover:not(:disabled) {
    // background: var(--b3-theme-primary-hover);
  }

  .confirm-delete-btn {
    background: var(--b3-theme-error);
    color: var(--b3-theme-on-error);
  }

  .confirm-delete-btn:hover:not(:disabled) {
    // background: var(--b3-theme-error-hover);
  }

  .confirm-save-btn:disabled,
  .confirm-delete-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
