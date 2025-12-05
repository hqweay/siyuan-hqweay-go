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
        <StatCard type="text" label="纯文字卡片" hover="这是一个纯文字卡片" />
        <StatCard type="number" number={42} hover="显示数字 42" />
        <StatCard
          type="text+number"
          number={128}
          label="总数"
          hover="总共 128 项"
        />
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
          hover="已完成 75% 的任务"
        />
        <StatCard
          type="percentage"
          label="完成率"
          percentage={68}
          hover="整体完成率 68%"
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
          hover="比上月增长 25%"
        />
        <StatCard
          type="trend"
          label="错误率"
          number={3.2}
          trend="down"
          hover="比上月降低 1.5%"
        />
        <StatCard
          type="trend"
          label="用户数"
          number={8420}
          trend="stable"
          hover="用户数保持稳定"
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
          hover="今天产生了 25 个新想法"
        />
        <StatCard
          type="icon"
          icon="⭐"
          number={8}
          label="收藏"
          hover="收藏了 8 篇文章"
        />
        <StatCard
          type="icon"
          icon="🔥"
          number={156}
          label="连续天数"
          hover="连续写作 156 天"
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
          hover="当前有 15 个用户在线"
        />
        <StatCard
          type="status"
          number={3}
          label="待处理"
          status="warning"
          hover="有 3 个任务待处理"
        />
        <StatCard
          type="status"
          number={1}
          label="错误任务"
          status="error"
          hover="检测到 1 个错误任务"
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
          hover="今天已经写了 2 小时 34 分钟"
        />
        <StatCard
          type="time"
          label="平均响应时间"
          time="156ms"
          hover="系统平均响应时间 156 毫秒"
        />
      </div>
    </div>

    <!-- 徽章类型 -->
    <div class="example-section">
      <h3>徽章类型</h3>
      <div class="cards-row">
        <StatCard type="badge" number={42} label="新消息" status="normal" />
        <StatCard type="badge" number={8} label="系统通知" status="warning" />
      </div>
    </div>

    <!-- 多数字对比类型 -->
    <div class="example-section">
      <h3>多数字对比类型</h3>
      <div class="cards-row">
        <StatCard
          type="multi-number"
          label="今日对比"
          subNumbers={{ left: 25, right: 18 }}
        />
        <StatCard
          type="multi-number"
          label="性能对比"
          subNumbers={{ left: 95, right: 87 }}
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
