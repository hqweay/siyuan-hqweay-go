<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  // epubjs（安装：npm i epubjs）
  import ePub from 'epubjs';

  // Props
  export let src = null; // 可为URL或ArrayBuffer或File
  export let initialCfi = null; // 可选：开始位置的CFI
  export let storedKey = 'epub-last-location'; // localStorage 键
  export let width = '100%';
  export let height = '100%';

  const dispatch = createEventDispatcher();

  let containerEl;
  let toc = [];
  let title = '';
  let progress = 0; // 0-100
  let book = null;
  let rendition = null;
  let currentCfi = null;
  let isReady = false;
  let fontSize = 100; // 百分比
  let theme = 'light';

  // 处理打开文件 input
  let fileInput;

  function openFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      await openBook(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  }

  async function openBook(source) {
    // 销毁上一本
    if (rendition) {
      try { rendition.destroy(); } catch (e) {}
      rendition = null;
    }
    if (book) {
      try { book.destroy(); } catch (e) {}
      book = null;
    }

    book = ePub(source);

    // 如果没有container，等挂载
    rendition = book.renderTo(containerEl, {
      width,
      height,
      spread: 'auto'
    });

    // 主题样式
    rendition.themes.register('light', {
      'body': { 'background': '#ffffff', 'color': '#111' },
    });
    rendition.themes.register('dark', {
      'body': { 'background': '#0b0b0b', 'color': '#eee' },
    });

    rendition.themes.select(theme);
    rendition.themes.fontSize(`${fontSize}%`);

    book.loaded.navigation.then(nav => {
      toc = nav.toc || [];
    }).catch(() => {
      toc = [];
    });

    // 章节标题
    book.loaded.metadata.then(meta => {
      title = meta.title || '';
    }).catch(() => {});

    // 定位：优先 initialCfi -> localStorage -> 默认
    let saved = null;
    try { saved = localStorage.getItem(storedKey); } catch(e){}
    const start = initialCfi || saved || undefined;

    // 显示并绑定事件
    rendition.display(start).then(() => {
      isReady = true;
    });

    rendition.on('relocated', (location) => {
      currentCfi = location.start.cfi;
      // 计算进度
      const at = location.start.percentage || 0;
      progress = Math.round(at * 100);
      // 存储位置
      try { localStorage.setItem(storedKey, currentCfi); } catch(e){}
      // 触发事件
      dispatch('relocated', { cfi: currentCfi, progress });
    });

    rendition.on('rendered', (section) => {
      // 渲染后可以调整一些样式或注入脚本
      dispatch('rendered', { section });
    });

    rendition.on('started', () => {
      dispatch('started');
    });

    // 处理键盘翻页
    window.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(e) {
    if (!isReady) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      next();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prev();
      e.preventDefault();
    }
  }

  function next() {
    if (!rendition) return;
    rendition.next();
  }
  function prev() {
    if (!rendition) return;
    rendition.prev();
  }

  function goToToc(item) {
    if (!item || !item.href) return;
    rendition.display(item.href);
  }

  function setFontSize(percent) {
    fontSize = percent;
    if (rendition) rendition.themes.fontSize(`${fontSize}%`);
  }

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    if (rendition) rendition.themes.select(theme);
  }

  // 外部控件：跳转到CFI
  export function display(cfiOrHref) {
    if (!rendition) return;
    rendition.display(cfiOrHref);
  }

  // 导出当前位置
  export function getCurrentCfi() {
    return currentCfi;
  }

  onMount(() => {
    if (src) {
      // 如果是File 或 ArrayBuffer，直接传给openBook，否则当作URL
      if (src instanceof File) {
        openFile(src);
      } else if (src instanceof ArrayBuffer) {
        openBook(src);
      } else {
        // 可能是URL
        openBook(src);
      }
    }

    return () => {
      // 清理
      if (rendition) try { rendition.destroy(); } catch (e) {}
      if (book) try { book.destroy(); } catch (e) {}
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  onDestroy(() => {
    try { window.removeEventListener('keydown', handleKeydown); } catch(e){}
  });
</script>

<style>
  .reader-root {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  .toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #e6e6e6;
  }
  .viewer-wrapper {
    flex: 1 1 auto;
    display: flex;
    overflow: hidden;
  }
  .viewer {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
  }
  .toc {
    width: 240px;
    overflow: auto;
    border-left: 1px solid #eee;
    padding: 8px;
  }
  .progress-bar {
    width: 140px;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #3b82f6;
    width: 0%;
  }
  .small {
    font-size: 12px;
    color: #666;
  }
</style>

<div class="reader-root">
  <div class="toolbar">
    <button on:click={prev} disabled={!isReady}>上一页</button>
    <button on:click={next} disabled={!isReady}>下一页</button>

    <label class="small">字号</label>
    <input type="range" min="60" max="200" bind:value={fontSize} on:input={(e)=>setFontSize(e.target.value)} />
    <span class="small">{fontSize}%</span>

    <button on:click={toggleTheme}>切换主题（{theme}）</button>

    <div style="flex:1"></div>

    <div class="small">{title}</div>

    <div style="display:flex;align-items:center;gap:8px;margin-left:12px;">
      <div class="progress-bar" title="进度">
        <div class="progress-fill" style="width:{progress}%"></div>
      </div>
      <div class="small">{progress}%</div>
    </div>

    <input bind:this={fileInput} type="file" accept=".epub" style="display:none" on:change={(e)=>openFile(e.target.files[0])} />
    <button on:click={()=>fileInput.click()}>打开本地 EPUB</button>
  </div>

  <div class="viewer-wrapper">
    <div class="viewer" bind:this={containerEl}></div>
    <div class="toc">
      <div class="small">目录</div>
      {#if toc.length === 0}
        <div class="small">(无目录或加载中)</div>
      {/if}
      <ul>
        {#each toc as item}
          <li style="margin:4px 0">
            <a href="#" on:click|preventDefault={() => goToToc(item)}>{item.label}</a>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>
