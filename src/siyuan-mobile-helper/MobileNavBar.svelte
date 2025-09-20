<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { openMobileFileById, showMessage } from "siyuan";
  import { plugin } from "@/utils";
  import { goToSibling } from "@/myscripts/navUtil";

  export let config;

  let isMobile = false;
  let forwardStack = [];
  let navBarHeight = config.navBarHeight || "60px";
  let backgroundColor = config.backgroundColor || "#ffffff";
  let buttonColor = config.buttonColor || "#333333";
  let showBackButton = config.showBackButton !== false;
  let showForwardButton = config.showForwardButton !== false;
  let showContextButton = config.showContextButton !== false;
  let showRandomButton = config.showRandomButton !== false;
  let showCustomLinksButton = config.showCustomLinksButton !== false;
  let enableBottomNav = config.enableBottomNav !== false;
  let customLinks = config.customLinks || "";
  let randomSql = config.randomSql || "SELECT id FROM blocks WHERE type = 'd'";

  let dropdownVisibleLinks = false;
  let dropdownVisibleContext = false;

  function detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      window.innerWidth <= 768 ||
      document.documentElement.clientWidth <= 768
    );
  }

  function openDocById(id) {
    openMobileFileById(plugin.app, id);
  }

  async function execSQLAndOpen(sql) {
    const execSQL = `select id from (${sql}) ORDER BY RANDOM() limit 1`;
    try {
      const response = await fetch("/api/query/sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stmt: execSQL,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const randomDocId = data.data[0].id;
          openDocById(randomDocId);
        } else {
          console.error("随机查询未返回结果");
          showMessage("随机查询未返回结果，请检查SQL语句", 3000, "error");
        }
      }
    } catch (error) {
      console.error("随机查询执行失败:", error);
      showMessage("随机查询执行失败: " + error.message, 3000, "error");
    }
  }
  async function goRandom() {
    execSQLAndOpen(randomSql);
  }

  function goBackNow() {
    if (window.siyuan?.backStack?.length > 0) {
      // 取当前主活动标签Ò

      forwardStack.push({
        id: window.siyuan.mobile.editor.protyle.block.id,
      });

      // const prevDoc = window.siyuan.backStack.pop();
      // //@ts-ignore
      // if (prevDoc?.id) {
      //   //@ts-ignore
      //   openDocById(prevDoc.id);
      //   forwardStack.push(prevDoc);
      // }
      //@ts-ignore
      window.goBack();
    } else {
      showMessage("已经到头啦");
    }
    // console.log(window.siyuan.backStack.map((ele) => ele.id).join(","));
  }

  function goForward() {
    // console.log(forwardStack.map((ele) => ele.id).join(","));
    if (forwardStack.length > 0) {
      // const currentId = getMobileCurrentDocId();

      // if (currentId && window.siyuan?.backStack) {
      //   window.siyuan.backStack.push({ id: currentId });
      // }

      const nextDoc = forwardStack.pop();
      if (nextDoc?.id) {
        openDocById(nextDoc.id);
        // window.siyuan.backStack.pop();
      }
    } else {
      showMessage("已经到头啦");
    }
    // console.log(forwardStack.map((ele) => ele.id).join(","));
  }

  function toggleDropdownLinks() {
    dropdownVisibleLinks = !dropdownVisibleLinks;
  }

  function closeDropdownLinks() {
    dropdownVisibleLinks = false;
  }

  function toggleDropdownContext() {
    dropdownVisibleContext = !dropdownVisibleContext;
  }

  function closeDropdownContext() {
    dropdownVisibleContext = false;
  }

  function handleCustomLinkClick(url) {
    if (url.toLowerCase().startsWith("select ")) {
      execSQLAndOpen(url);
    } else {
      window.open(url, "_blank");
    }
    closeDropdownLinks();
  }

  onMount(() => {
    isMobile = detectMobile();
    document.addEventListener("click", closeDropdownLinks);
    document.addEventListener("click", closeDropdownContext);
    document.body.style.paddingBottom = `${parseInt(navBarHeight) + 10}px`;
  });

  onDestroy(() => {
    document.removeEventListener("click", closeDropdownLinks);
    document.removeEventListener("click", closeDropdownContext);
    document.body.style.paddingBottom = "";
  });
</script>

{#if isMobile && enableBottomNav}
  <div
    class="nav-bar"
    style="--nav-height: {navBarHeight}; --bg-color: {backgroundColor}; --btn-color: {buttonColor}"
  >
    {#if showBackButton}
      <button class="nav-button" on:click={goBackNow}>
        <div class="nav-icon">←</div>
        <div class="nav-text">后退</div>
      </button>
    {/if}

    {#if showForwardButton}
      <button class="nav-button" on:click={goForward}>
        <div class="nav-icon">→</div>
        <div class="nav-text">前进</div>
      </button>
    {/if}

    {#if showContextButton}
      <div class="custom-context-container">
        <button
          class="nav-button"
          on:click|stopPropagation={toggleDropdownContext}
        >
          <div class="nav-icon">↑</div>
          <div class="nav-text">上下文</div>
        </button>
      </div>
      {#if dropdownVisibleContext}
        <div class="dropdown-menu">
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a
            href="javascript:void(0)"
            class="dropdown-item"
            on:click|stopPropagation={async () => await goToSibling(-1)}
            >上一篇文档</a
          >
          <!-- svelte-ignore a11y-invalid-attribute -->
          <a
            href="javascript:void(0)"
            class="dropdown-item"
            on:click|stopPropagation={async () => await goToSibling(1)}
            >下一篇文档</a
          >
        </div>
      {/if}
    {/if}

    {#if showRandomButton}
      <div class="custom-links-container">
        <button class="nav-button" on:click={goRandom}>
          <div class="nav-icon">🎲</div>
          <div class="nav-text">随机</div>
        </button>
      </div>
    {/if}

    {#if showCustomLinksButton}
      <div class="custom-links-container">
        <button
          class="nav-button"
          on:click|stopPropagation={toggleDropdownLinks}
        >
          <div class="nav-icon">🔗</div>
          <div class="nav-text">更多</div>
        </button>

        {#if dropdownVisibleLinks}
          <div class="dropdown-menu">
            {#if customLinks}
              {#each customLinks
                .split("\n")
                .filter((line) => line.trim()) as link}
                {@const parts = link.split("====")}
                {#if parts.length >= 2}
                  {@const name = parts[0].trim()}
                  {@const url = parts[1].trim()}
                  <a
                    href={url.toLowerCase().startsWith("select ")
                      ? "javascript:void(0)"
                      : url}
                    class="dropdown-item"
                    on:click|stopPropagation={() => handleCustomLinkClick(url)}
                  >
                    {name}
                  </a>
                {/if}
              {/each}
            {:else}
              <div class="dropdown-item no-links">未配置链接</div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .nav-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: var(--nav-height);
    background-color: var(--bg-color);
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-around;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    box-sizing: border-box;
    z-index: 9999;
  }

  .nav-button {
    background: none;
    border: none;
    color: var(--btn-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 8px;
    transition:
      background-color 0.2s,
      opacity 0.2s;
    min-width: 60px;
  }

  .nav-button:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .nav-icon {
    font-size: 20px;
    margin-bottom: 2px;
  }

  .nav-text {
    font-size: 12px;
    color: var(--btn-color);
  }

  .custom-links-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .dropdown-menu {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%) translateY(-100%);
    background-color: var(--bg-color);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    min-width: 150px;
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
  }

  .dropdown-item {
    display: block;
    padding: 8px 16px;
    color: var(--btn-color);
    text-decoration: none;
    font-size: 14px;
    text-align: center;
  }

  .dropdown-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .no-links {
    color: #999;
  }
</style>
