<script lang="ts">
  import html2canvas from "html2canvas-pro";
  function downloadCard() {
    const card = document.querySelector(".card");

    html2canvas(card).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "card.png";
      link.click();
    });
  }

  export let content: string = "";
</script>

<button class="btn" on:click={downloadCard}>下载</button>
<div class="fn__flex-1 fn__flex config__panel">
  <div class="card">
    <!-- <div class="card-header">
      <h2 class="card-title">Card Title</h2>
    </div> -->
    <div class="card-body">
      <p>{content.trim()}</p>
    </div>
  </div>
</div>

<style lang="scss">
  .btn {
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 50px;
  }

  .btn:hover {
    background-color: #0056b3;
  }

  .card {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 16px;
    margin-bottom: 100px;
    white-space: pre-wrap;
    min-width: 300px;
  }



  .card-body {
    margin-bottom: 8px;
  }
</style>
