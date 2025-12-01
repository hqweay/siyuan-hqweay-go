<script>
  import StatCard from "./StatCard.svelte";
</script>

<div class="examples-container">
  <h2>StatCard 组件使用示例</h2>
  
  <div class="examples-grid">
    <!-- 基础类型 -->
    <div class="example-section">
      <h3>基础类型</h3>
      <div class="cards-row">
        <StatCard type="text" label="纯文字卡片" />
        <StatCard type="number" number={42} />
        <StatCard type="text+number" number={128} label="总数" />
      </div>
    </div>

    <!-- 进度类型 -->
    <div class="example-section">
      <h3>进度相关类型</h3>
      <div class="cards-row">
        <StatCard 
          type="progress" 
          label="任务完成度" 
          percentage={75} 
        />
        <StatCard 
          type="percentage" 
          label="完成率" 
          percentage={68} 
        />
      </div>
    </div>

    <!-- 趋势类型 -->
    <div class="example-section">
      <h3>趋势类型</h3>
      <div class="cards-row">
        <StatCard 
          type="trend" 
          label="本月销量" 
          number={1250} 
          trend="up" 
        />
        <StatCard 
          type="trend" 
          label="错误率" 
          number={3.2} 
          trend="down" 
        />
        <StatCard 
          type="trend" 
          label="用户数" 
          number={8420} 
          trend="stable" 
        />
      </div>
    </div>

    <!-- 图标类型 -->
    <div class="example-section">
      <h3>图标类型</h3>
      <div class="cards-row">
        <StatCard 
          type="icon" 
          icon="💡" 
          number={25} 
          label="新想法" 
        />
        <StatCard 
          type="icon" 
          icon="⭐" 
          number={8} 
          label="收藏" 
        />
        <StatCard 
          type="icon" 
          icon="🔥" 
          number={156} 
          label="连续天数" 
        />
      </div>
    </div>

    <!-- 状态类型 -->
    <div class="example-section">
      <h3>状态类型</h3>
      <div class="cards-row">
        <StatCard 
          type="status" 
          number={15} 
          label="在线用户" 
          status="success" 
        />
        <StatCard 
          type="status" 
          number={3} 
          label="待处理" 
          status="warning" 
        />
        <StatCard 
          type="status" 
          number={1} 
          label="错误任务" 
          status="error" 
        />
      </div>
    </div>

    <!-- 时间类型 -->
    <div class="example-section">
      <h3>时间类型</h3>
      <div class="cards-row">
        <StatCard 
          type="time" 
          label="今日写作时间" 
          time="2:34:15" 
        />
        <StatCard 
          type="time" 
          label="平均响应时间" 
          time="156ms" 
        />
      </div>
    </div>

    <!-- 徽章类型 -->
    <div class="example-section">
      <h3>徽章类型</h3>
      <div class="cards-row">
        <StatCard 
          type="badge" 
          number={42} 
          label="新消息" 
          status="normal" 
        />
        <StatCard 
          type="badge" 
          number={8} 
          label="系统通知" 
          status="warning" 
        />
      </div>
    </div>

    <!-- 多数字对比类型 -->
    <div class="example-section">
      <h3>多数字对比类型</h3>
      <div class="cards-row">
        <StatCard 
          type="multi-number" 
          label="今日对比" 
          subNumbers={{left: 25, right: 18}} 
        />
        <StatCard 
          type="multi-number" 
          label="性能对比" 
          subNumbers={{left: 95, right: 87}} 
        />
      </div>
    </div>
  </div>
</div>

<style>
  .examples-container {
    padding: 20px;
    background: #1a1a1a;
    color: white;
    min-height: 100vh;
  }

  .examples-container h2 {
    text-align: center;
    margin-bottom: 40px;
    color: #ffd700;
  }

  .examples-grid {
    max-width: 1200px;
    margin: 0 auto;
  }

  .example-section {
    margin-bottom: 40px;
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 12px;
  }

  .example-section h3 {
    margin-bottom: 20px;
    color: #4badb2;
    border-bottom: 2px solid #4badb2;
    padding-bottom: 8px;
  }

  .cards-row {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
  }

  .cards-row > :global(*) {
    flex: 1;
    min-width: 200px;
  }
</style>