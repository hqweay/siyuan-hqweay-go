<script>
  import { sql } from "@/api";
  import { onMount, createEventDispatcher, tick } from "svelte";
  export let sqlQuery = null;
  export let daysRange = 99999; // show more by default for weekly columns
  export let selectedDay = null; // YYYYMMDD to highlight

  const dispatch = createEventDispatcher();

  let countsMap = new Map(); // day (YYYYMMDD) -> count
  let maxCount = 0;
  let weeks = []; // array of weeks, each week is array of 7 {date, dayKey, count} or null
  let calendarRef;

  function formatDayKey(date) {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}${m}${d}`;
  }

  function colorForCount(count) {
    if (!count) return "rgba(255,255,255,0.06)";
    const ratio = maxCount ? count / maxCount : 0;
    const hue = 120; // green
    const lightness = 92 - Math.round(ratio * 60); // lighter -> darker
    return `hsl(${hue} 85% ${lightness}%)`;
  }

  async function loadData() {
    if (!sqlQuery) return;
    try {
      const rows = await sql(`select * from (${sqlQuery}) order by day desc`);
      countsMap = new Map();
      rows.forEach((r) => {
        const day = r.day || r.date || r.DAY || r.day_key;
        const cnt = Number(r.cnt || r.count || r.CNT || r.COUNT || 0);
        if (day) countsMap.set(day.toString(), cnt);
      });

      // build date range
      const today = new Date();
      // const start = new Date(today);
      // start.setDate(today.getDate() - (daysRange - 1));

      // // align to the previous Sunday to make full weeks
      // const firstWeekStart = new Date(start);
      // firstWeekStart.setDate(start.getDate() - firstWeekStart.getDay());
      const start = new Date(
        parseInt(rows[rows.length - 1].day.substring(0, 4)), // 年
        parseInt(rows[rows.length - 1].day.substring(4, 6)) - 1, // 月（注意月份从0开始）
        parseInt(rows[rows.length - 1].day.substring(6, 8)) // 日
      );
      const firstWeekStart = new Date(start);
      const end = new Date(today);

      weeks = [];
      let weekStart = new Date(firstWeekStart);
      while (weekStart <= end) {
        const week = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const key = formatDayKey(d);
          if (d < start || d > end) {
            week.push(null);
          } else {
            const count = countsMap.get(key) || 0;
            week.push({ date: d, dayKey: key, count });
          }
        }
        weeks.push(week);
        weekStart.setDate(weekStart.getDate() + 7);
      }

      // compute max
      maxCount = 0;
      weeks.forEach((w) =>
        w.forEach((c) => {
          if (c) maxCount = Math.max(maxCount, c.count);
        })
      );

      // ensure DOM updated before scrolling to the end
      await tick();
      try {
        if (calendarRef) {
          // use scrollTo for smoother browser support
          if (calendarRef.scrollTo) {
            calendarRef.scrollTo({ left: calendarRef.scrollWidth });
          } else {
            calendarRef.scrollLeft = calendarRef.scrollWidth;
          }
        }
      } catch (e) {
        // fallback: small timeout
        setTimeout(() => {
          if (calendarRef) calendarRef.scrollLeft = calendarRef.scrollWidth;
        }, 0);
      }
    } catch (err) {
      console.error("Heatmap load error", err);
    }
  }

  $: if (sqlQuery) loadData();

  onMount(() => {
    if (sqlQuery) loadData();
  });

  function onDayClick(day) {
    if (!day) return;
    dispatch("dayclick", { dayKey: day.dayKey, date: day.date });
  }
</script>

<div class="heatmap">
  <div class="calendar-weeks" role="list" bind:this={calendarRef}>
    {#each weeks as week}
      <div class="week" role="listitem">
        {#each week as day}
          {#if day}
            <button
              class="heat-cell {selectedDay === day.dayKey ? 'selected' : ''}"
              title={`${day.date.toLocaleDateString()} 创建了 ${day.count} 条数据`}
              style={`background: ${colorForCount(day.count)}`}
              on:click={() => onDayClick(day)}
              aria-pressed={selectedDay === day.dayKey}
            >
              <span class="visually-hidden">{day.dayKey}</span>
            </button>
          {:else}
            <div class="heat-cell empty" aria-hidden="true"></div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>

  <div class="heatmap-legend">
    <span>少</span>
    <div class="legend-box" style="background: hsl(120 85% 85%)"></div>
    <div class="legend-box" style="background: hsl(120 85% 70%)"></div>
    <div class="legend-box" style="background: hsl(120 85% 55%)"></div>
    <div class="legend-box" style="background: hsl(120 85% 40%)"></div>
    <span>多</span>
  </div>
</div>

<style>
  .heatmap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 6px 0;
    padding-top: 10px;
  }

  .calendar-weeks {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    overflow-x: auto;

    padding: 10px 10px; /* 添加上下内边距，给内容留出空间 */
    margin: 10px 10px; /* 或者使用外边距 */
  }

  .week {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .heat-cell {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.12);
    padding: 0;
    margin: 0;
    transition:
      transform 120ms ease,
      box-shadow 120ms ease,
      opacity 120ms ease;
    box-shadow: none;
    cursor: pointer;
  }

  .heat-cell:hover {
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
    filter: brightness(1.03);
  }

  .heat-cell.empty {
    background: transparent;
    border: none;
    cursor: default;
  }

  .heat-cell.selected {
    outline: 2px solid #ffd700;
    transform: scale(1.1);
  }

  .heatmap-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
  }

  .legend-box {
    width: 20px;
    height: 14px;
    border-radius: 4px;
  }

  .visually-hidden {
    position: absolute;
    left: -9999px;
  }
</style>
