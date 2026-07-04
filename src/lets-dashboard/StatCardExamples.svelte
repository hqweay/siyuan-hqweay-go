<script>
  import StatCard from "./StatCard.svelte";
  import { plugin } from "@/utils";
</script>

<div class="examples-container">
  <h2>{plugin.i18n["lets-dashboard.examplesTitle"]}</h2>

  <div class="examples-grid">
    <!-- 基础类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesBasicType"]}</h3>
      <div class="cards-row">
        <StatCard type="text" label={plugin.i18n["lets-dashboard.textCard"]} hover={plugin.i18n["lets-dashboard.textCard"]} />
        <StatCard type="number" number={42} hover={plugin.i18n["lets-dashboard.showsNumber"]} />
        <StatCard
          type="text+number"
          number={128}
          label={plugin.i18n["lets-dashboard.totalLabel"]}
          hover={plugin.i18n["lets-dashboard.total128"]}
        />
      </div>
    </div>

    <!-- 进度类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesProgressType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="progress"
          label={plugin.i18n["lets-dashboard.taskCompletion"]}
          percentage={75}
          hover={plugin.i18n["lets-dashboard.completed75"]}
        />
        <StatCard
          type="percentage"
          label={plugin.i18n["lets-dashboard.completionRate"]}
          percentage={68}
          hover={plugin.i18n["lets-dashboard.overall68"]}
        />
      </div>
    </div>

    <!-- 趋势类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesTrendType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="trend"
          label={plugin.i18n["lets-dashboard.monthlySales"]}
          number={1250}
          trend="up"
          hover={plugin.i18n["lets-dashboard.grew25"]}
        />
        <StatCard
          type="trend"
          label={plugin.i18n["lets-dashboard.errorRate"]}
          number={3.2}
          trend="down"
          hover={plugin.i18n["lets-dashboard.decreased15"]}
        />
        <StatCard
          type="trend"
          label={plugin.i18n["lets-dashboard.userCount"]}
          number={8420}
          trend="stable"
          hover={plugin.i18n["lets-dashboard.stableUsers"]}
        />
      </div>
    </div>

    <!-- 图标类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesIconType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="icon"
          icon="💡"
          number={25}
          label={plugin.i18n["lets-dashboard.newIdeas"]}
          hover={plugin.i18n["lets-dashboard.generated25"]}
        />
        <StatCard
          type="icon"
          icon="⭐"
          number={8}
          label={plugin.i18n["lets-dashboard.favorites"]}
          hover={plugin.i18n["lets-dashboard.favorited8"]}
        />
        <StatCard
          type="icon"
          icon="🔥"
          number={156}
          label={plugin.i18n["lets-dashboard.streakDays"]}
          hover={plugin.i18n["lets-dashboard.writing156"]}
        />
      </div>
    </div>

    <!-- 状态类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesStatusType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="status"
          number={15}
          label={plugin.i18n["lets-dashboard.onlineUsers"]}
          status="success"
          hover={plugin.i18n["lets-dashboard.users15Online"]}
        />
        <StatCard
          type="status"
          number={3}
          label={plugin.i18n["lets-dashboard.pending"]}
          status="warning"
          hover={plugin.i18n["lets-dashboard.tasks3Pending"]}
        />
        <StatCard
          type="status"
          number={1}
          label={plugin.i18n["lets-dashboard.errorTasks"]}
          status="error"
          hover={plugin.i18n["lets-dashboard.detected1Error"]}
        />
      </div>
    </div>

    <!-- 时间类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesTimeType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="time"
          label={plugin.i18n["lets-dashboard.todayWritingTime"]}
          time="2:34:15"
          hover={plugin.i18n["lets-dashboard.written2h34m"]}
        />
        <StatCard
          type="time"
          label={plugin.i18n["lets-dashboard.avgResponseTime"]}
          time="156ms"
          hover={plugin.i18n["lets-dashboard.response156ms"]}
        />
      </div>
    </div>

    <!-- 徽章类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesBadgeType"]}</h3>
      <div class="cards-row">
        <StatCard type="badge" number={42} label={plugin.i18n["lets-dashboard.newMessages"]} status="normal" />
        <StatCard type="badge" number={8} label={plugin.i18n["lets-dashboard.systemNotifications"]} status="warning" />
      </div>
    </div>

    <!-- 多数字对比类型 -->
    <div class="example-section">
      <h3>{plugin.i18n["lets-dashboard.examplesMultiNumberType"]}</h3>
      <div class="cards-row">
        <StatCard
          type="multi-number"
          label={plugin.i18n["lets-dashboard.todayComparison"]}
          subNumbers={{ left: 25, right: 18 }}
        />
        <StatCard
          type="multi-number"
          label={plugin.i18n["lets-dashboard.performanceComparison"]}
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
