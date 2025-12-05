1. Progress (进度条)

显示进度百分比，支持动画效果

<StatCard type="progress" label="完成度" percentage={75} />

2. Trend (趋势)

显示数值和趋势方向（上升/下降/持平）

<StatCard type="trend" label="访问量" number={1234} trend="up" trendValue="+12%" />

3. Gauge (仪表盘)

半圆形仪表盘，支持阈值颜色

<StatCard 
  type="gauge" 
  label="CPU使用率" 
  gaugeValue={65} 
  gaugeMax={100}
  gaugeThresholds={[{value: 50, color: 'orange'}, {value: 80, color: 'red'}]}
/>

4. Comparison (对比)

对比当前值和历史值

<StatCard 
  type="comparison" 
  label="销售额" 
  currentValue={5000} 
  comparisonValue={4200}
  comparisonLabel="上月"
/>

5. List (列表)

显示多个键值对

<StatCard 
  type="list" 
  label="统计信息" 
  items={[
    {label: '今日', value: '123'},
    {label: '本周', value: '456'},
    {label: '本月', value: '789'}
  ]}
/>

6. Icon Stat (图标统计)

带大图标的统计卡片

<StatCard
  type="icon-stat"
  icon="📝"
  label="日记数量"
  number={365}
  text="本年度"
/>

7. Full-width (全宽模式)

全宽展示，占据整行
<StatCard
type="progress"
label="项目完成进度"
percentage={85}
fullWidth={true}
/>

新增功能

动画效果 - 数字和进度条支持动画
尺寸选项 - small/medium/large
图标支持 - 可添加 emoji 或图标
趋势显示 - 自动计算变化百分比
可点击 - 支持点击事件
自定义颜色 - 支持自定义主色和背景色
响应式 - 自适应不同尺寸
全宽模式 - 通过 `fullWidth={true}` 使卡片占据整行展示