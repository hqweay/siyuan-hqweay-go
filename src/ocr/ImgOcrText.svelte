<script lang="ts">
  import { onMount } from 'svelte';

  export let data: any[] = [];
  export let imgEl: HTMLImageElement;

  let showText = false;
  let copied = false;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  };

  onMount(() => {
    // 确保图片加载完成后再显示OCR文本
    if (imgEl.complete) {
      showText = true;
    } else {
      imgEl.addEventListener('load', () => {
        showText = true;
      });
    }
  });
</script>

<div class="ocr-container">
  {#if showText && data && data.length > 0}
    <div class="ocr-text-layer">
      {#each data as item}
        <div
          class="ocr-word"
          style="left: {item.location.left}px; top: {item.location.top}px; width: {item.location.width}px; height: {item.location.height}px"
          on:click={() => copyText(item.words)}
        >
          <span class="ocr-word-text">{item.words}</span>
          {#if copied}
            <div class="ocr-copied-tip">已复制</div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .ocr-container {
    position: relative;
    display: inline-block;
  }

  .ocr-text-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .ocr-word {
    position: absolute;
    pointer-events: auto;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .ocr-word:hover {
    background-color: rgba(255, 255, 0, 0.3);
  }

  .ocr-word-text {
    font-size: 12px;
    color: transparent;
    user-select: none;
  }

  .ocr-word:hover .ocr-word-text {
    color: #000;
    background-color: rgba(255, 255, 255, 0.8);
    padding: 2px;
    border-radius: 3px;
  }

  .ocr-copied-tip {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
  }
</style>