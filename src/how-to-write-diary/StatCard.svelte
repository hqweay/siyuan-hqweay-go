<script>
  export let number = 0;
  export let label = "";
  export let className = "";
</script>

<div class={`stat-card ${className}`} role="group" aria-label={label}>
  <div class="stat-number">{number}</div>
  <div class="stat-label">{label}</div>
</div>

<style>
  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-5px);
  }
  .stat-number {
    font-size: 2rem;
    font-weight: bold;
    color: #ffd700;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-top: 5px;
  }
</style>
