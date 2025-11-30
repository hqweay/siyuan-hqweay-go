<script>
  import { sql } from "@/api";
  import { onMount } from "svelte";

  export let imgSQL;
  export let pageSize = 30;

  let images = [];
  let displayedImages = [];
  let page = 1;
  let loading = false;
  let hasMore = true;
  let sentinel;

  const formatTimestamp = (timestamp) => {
    const str = timestamp?.toString() || "";
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    const hour = str.substring(8, 10);
    const minute = str.substring(10, 12);
    const second = str.substring(12, 14);

    return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
  };

  function updateDisplayedImages() {
    const count = page * pageSize;
    displayedImages = images.slice(0, count);
    hasMore = displayedImages.length < images.length;
  }

  function loadMoreImages() {
    if (loading || !hasMore) return;
    loading = true;
    page += 1;
    updateDisplayedImages();
    loading = false;
  }

  onMount(async () => {
    if (!imgSQL) return;
    // 从 SQL 拉取包含图片的行（假设 SQL 已 join assets 并返回 asset_path）
    const rows = await sql(imgSQL);
    // 每行应包含 asset_path、id、created、updated
    images = rows.map((r) => ({
      url: r.asset_path || r.PATH || r.path,
      id: r.id,
      created: r.created,
      updated: r.updated,
    }));

    updateDisplayedImages();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore) {
            loadMoreImages();
          }
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  });
</script>

<div class="images-section">
  <h3>图片集</h3>
  <div class="image-grid">
    {#each displayedImages as img}
      <div class="image-item" title={formatTimestamp(img.created)}>
        <a href={"siyuan://blocks/" + img.id}>
          <img src={img.url} alt="日记图片" loading="lazy" />
        </a>
        <div class="image-overlay">
          <span class="image-date">{formatTimestamp(img.updated)}</span>
        </div>
      </div>
    {/each}
  </div>

  <div class="images-loading">
    {#if loading}
      <div class="loading-text">加载中...</div>
    {:else if !hasMore}
      <div class="loading-text">没有更多图片</div>
    {/if}
    <div bind:this={sentinel} class="sentinel" aria-hidden="true"></div>
  </div>
</div>

<style>
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
</style>
