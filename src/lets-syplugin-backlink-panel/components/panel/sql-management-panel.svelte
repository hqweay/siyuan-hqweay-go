<script lang="ts">
  import { setBlockAttrs } from "@/api";
  import { createEventDispatcher, onMount } from "svelte";

  export let rootId: string;
  export let focusBlockId: string;
  export let currentTab: any;
  export let savedSqlList: Array<{ name: string; sql: string }> = [];

  const dispatch = createEventDispatcher();

  // 本地状态
  let isLoading = false;
  let showAddForm = false;
  let newSqlName = "";
  let newSqlContent = "";

  // 保存SQL到文档属性
  async function saveSqlToDocument(name: string, sql: string) {
    try {
      // 添加到列表
      const newSqlItem = { name, sql };
      const updatedList = [...savedSqlList, newSqlItem];

      // 保存到文档属性
      const sqlData = JSON.stringify(updatedList);
      await setBlockAttrs(rootId, {
        "custom-tab-panel-sqls": sqlData,
      });

      // 更新本地状态
      savedSqlList = updatedList;
      dispatch("sqlUpdated", { savedSqlList });

      // 重置表单
      newSqlName = "";
      newSqlContent = "";
      showAddForm = false;
    } catch (error) {
      console.error("保存SQL失败:", error);
      alert("保存失败，请重试");
    }
  }

  // 处理新增SQL表单提交
  function handleAddSqlSubmit() {
    if (!newSqlName.trim() || !newSqlContent.trim()) {
      alert("请输入SQL名称和内容");
      return;
    }
    saveSqlToDocument(newSqlName.trim(), newSqlContent.trim());
  }

  onMount(() => {
    // 组件挂载时不需要加载数据，数据通过props传入
  });
</script>

<div class="sql-management-panel">
  <!-- SQL管理界面 - 只显示新增功能 -->
  <div class="panel-header">
    <h3>SQL查询管理</h3>
    <button class="add-btn" on:click={() => (showAddForm = !showAddForm)}>
      + 新增SQL
    </button>
  </div>

  <!-- 新增SQL表单 -->
  {#if showAddForm}
    <div class="add-sql-form">
      <div class="form-group">
        <label>SQL名称:</label>
        <input
          type="text"
          bind:value={newSqlName}
          placeholder="请输入SQL名称"
          class="sql-input"
        />
      </div>
      <div class="form-group">
        <label>SQL内容:</label>
        <textarea
          bind:value={newSqlContent}
          placeholder="请输入SQL语句"
          class="sql-textarea"
          rows="4"
        ></textarea>
      </div>
      <div class="form-actions">
        <button
          class="cancel-btn"
          on:click={() => {
            showAddForm = false;
            newSqlName = "";
            newSqlContent = "";
          }}
        >
          取消
        </button>
        <button class="save-btn" on:click={handleAddSqlSubmit}> 保存 </button>
      </div>
    </div>
  {/if}

  <!-- 说明信息 -->
  <div class="info-section">
    <p class="info-text">
      💡 保存的SQL将在单独的Tab中显示，点击Tab可以查看和执行SQL
    </p>
  </div>
</div>

<style>
  .sql-management-panel {
    padding: 16px;
    height: 100%;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--b3-theme-outline-variant);
  }

  .panel-header h3 {
    margin: 0;
    color: var(--b3-theme-on-background);
    font-size: 16px;
    font-weight: 600;
  }

  .add-btn {
    padding: 6px 12px;
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  .add-btn:hover {
    background: var(--b3-theme-primary-hover);
  }

  .add-sql-form {
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

  .sql-input,
  .sql-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--b3-theme-outline);
    border-radius: 6px;
    background: var(--b3-theme-background);
    color: var(--b3-theme-on-background);
    font-size: 14px;
    box-sizing: border-box;
  }

  .sql-input:focus,
  .sql-textarea:focus {
    outline: none;
    border-color: var(--b3-theme-primary);
  }

  .sql-textarea {
    resize: vertical;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }

  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .cancel-btn,
  .save-btn {
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
    background: var(--b3-theme-surface-variant-hover);
  }

  .save-btn {
    background: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
  }

  .save-btn:hover {
    background: var(--b3-theme-primary-hover);
  }

  .info-section {
    text-align: center;
    padding: 20px;
    background: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-outline-variant);
    border-radius: 8px;
  }

  .info-text {
    margin: 0;
    color: var(--b3-theme-on-surface);
    font-size: 14px;
    opacity: 0.8;
  }
</style>
