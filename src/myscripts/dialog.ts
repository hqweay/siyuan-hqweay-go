//日期选择器
export const datePickerDialog = (args: {
  title: string;
  defaultDate?: Date | string;
  confirm?: (date: string) => void;
  cancel?: (date: string) => void;
  destroyCallback?: (date: string) => void;
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  showTime?: boolean;
  minDate?: Date | string;
  maxDate?: Date | string;
}) => {
  // 处理默认日期
  const initialDate = args.defaultDate
    ? new Date(args.defaultDate)
    : new Date();

  // 处理最小/最大日期限制
  const minDate = args.minDate ? new Date(args.minDate) : null;
  const maxDate = args.maxDate ? new Date(args.maxDate) : null;

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 格式化时间为 HH:MM
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // 生成月份日历
  const generateCalendar = (
    year: number,
    month: number,
    selectedDateStr: string
  ) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    let calendar = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      let week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          week.push("<td></td>");
        } else if (day > daysInMonth) {
          week.push("<td></td>");
        } else {
          const currentDate = new Date(year, month, day);
          const currentDateStr = formatDate(currentDate);
          const isDisabled =
            (minDate && currentDate < minDate) ||
            (maxDate && currentDate > maxDate);
          const isSelected = currentDateStr === selectedDateStr;

          week.push(
            `<td class="${isDisabled ? "disabled" : ""}">` +
              `<button class="day-btn ${isSelected ? "selected" : ""} ${
                isDisabled ? "disabled" : ""
              }" ` +
              `data-date="${currentDateStr}" ` +
              `${isDisabled ? "disabled" : ""}>${day}</button></td>`
          );
          day++;
        }
      }
      calendar.push(`<tr>${week.join("")}</tr>`);
    }

    return calendar.join("");
  };

  // 创建对话框
  const dialog = new Dialog({
    title: args.title,
    content: `
      <div class="date-picker-container">
        <div class="date-picker-header">
          <button class="prev-year">&lt;&lt;</button>
          <button class="prev-month">&lt;</button>
          <span class="current-month">${initialDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}</span>
          <button class="next-month">&gt;</button>
          <button class="next-year">&gt;&gt;</button>
        </div>
        <table class="date-picker-calendar">
          <thead>
            <tr>
              <th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th>
            </tr>
          </thead>
          <tbody>
            ${generateCalendar(
              initialDate.getFullYear(),
              initialDate.getMonth(),
              formatDate(initialDate)
            )}
          </tbody>
        </table>
        ${
          args.showTime
            ? `
        <div class="time-picker">
          <input type="time" class="time-input" value="${formatTime(
            initialDate
          )}">
        </div>
        `
            : ""
        }
        <div class="selected-date">
          已选择: <span class="date-display">${formatDate(initialDate)}${
      args.showTime ? " " + formatTime(initialDate) : ""
    }</span>
        </div>
        <div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel">${
            window.siyuan.languages.cancel
          }</button>
          <div class="fn__space"></div>
          <button class="b3-button b3-button--text">${
            window.siyuan.languages.confirm
          }</button>
        </div>
      </div>
    `,
    width: args.width || "350px", // 默认宽度从400px调整为350px
    height: args.height || "auto", // 默认高度调整为auto
    destroyCallback: args.destroyCallback
      ? () => {
          args.destroyCallback(selectedDate);
        }
      : undefined,
  });

  // 当前显示的年份和月份
  let currentYear = initialDate.getFullYear();
  let currentMonth = initialDate.getMonth();
  let selectedDate = formatDate(initialDate);
  let selectedTime = args.showTime ? formatTime(initialDate) : "";

  // 更新日历显示
  const updateCalendar = () => {
    const calendarBody = dialog.element.querySelector(
      ".date-picker-calendar tbody"
    );
    if (calendarBody) {
      calendarBody.innerHTML = generateCalendar(
        currentYear,
        currentMonth,
        selectedDate
      );
      attachDayClickHandlers();
    }

    const monthDisplay = dialog.element.querySelector(".current-month");
    if (monthDisplay) {
      monthDisplay.textContent = new Date(
        currentYear,
        currentMonth,
        1
      ).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    }
  };

  // 附加日期点击事件
  const attachDayClickHandlers = () => {
    const dayButtons = dialog.element.querySelectorAll(
      ".day-btn:not(.disabled)"
    );
    dayButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // 移除之前选中的样式
        dialog.element.querySelectorAll(".day-btn.selected").forEach((el) => {
          el.classList.remove("selected");
        });
        // 添加新的选中样式
        btn.classList.add("selected");

        selectedDate = btn.getAttribute("data-date") || selectedDate;
        updateSelectedDateDisplay();
      });
    });
  };

  // 更新已选择日期显示
  const updateSelectedDateDisplay = () => {
    const dateDisplay = dialog.element.querySelector(".date-display");
    if (dateDisplay) {
      dateDisplay.textContent =
        selectedDate +
        (args.showTime && selectedTime ? " " + selectedTime : "");
    }
  };

  // 附加时间选择事件
  if (args.showTime) {
    const timeInput = dialog.element.querySelector(
      ".time-input"
    ) as HTMLInputElement;
    if (timeInput) {
      timeInput.addEventListener("change", () => {
        selectedTime = timeInput.value;
        updateSelectedDateDisplay();
      });
    }
  }

  // 导航按钮事件
  dialog.element.querySelector(".prev-year")?.addEventListener("click", () => {
    currentYear--;
    updateCalendar();
  });

  dialog.element.querySelector(".prev-month")?.addEventListener("click", () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    updateCalendar();
  });

  dialog.element.querySelector(".next-month")?.addEventListener("click", () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    updateCalendar();
  });

  dialog.element.querySelector(".next-year")?.addEventListener("click", () => {
    currentYear++;
    updateCalendar();
  });

  // 初始附加点击事件
  attachDayClickHandlers();

  // 按钮事件
  const btnsElement = dialog.element.querySelectorAll(".b3-button");
  btnsElement[0].addEventListener("click", () => {
    if (args.cancel) {
      args.cancel(
        selectedDate + (args.showTime && selectedTime ? " " + selectedTime : "")
      );
    }
    dialog.destroy();
  });

  btnsElement[1].addEventListener("click", () => {
    if (args.confirm) {
      args.confirm(
        selectedDate + (args.showTime && selectedTime ? " " + selectedTime : "")
      );
    }
    dialog.destroy();
  });

  // 容器样式
  const container: HTMLElement = dialog.element.querySelector(
    ".b3-dialog__container"
  )!;
  if (container) {
    Object.assign(container.style, {
      maxWidth: args.maxWidth || "400px", // 默认最大宽度调整为400px
      maxHeight: args.maxHeight,
    });
  }

  // 添加CSS样式
  const style = document.createElement("style");
  style.textContent = `
    .date-picker-container {
      padding: 12px 16px;
    }
    .date-picker-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      gap: 8px;
    }
    .date-picker-header button {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .date-picker-header button:hover {
      background: var(--b3-theme-primary-lightest);
    }
    .current-month {
      font-weight: bold;
      min-width: 120px;
      text-align: center;
      font-size: 14px;
    }
    .date-picker-calendar {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 13px;
    }
    .date-picker-calendar th {
      padding: 6px;
      text-align: center;
      font-weight: normal;
      color: var(--b3-theme-on-surface-light);
    }
    .date-picker-calendar td {
      padding: 0;
      text-align: center;
      height: 32px;
    }
    .day-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      cursor: pointer;
      border-radius: 50%;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }
    .day-btn:hover:not(.disabled) {
      background: var(--b3-theme-primary-light);
    }
    .day-btn.selected {
      background: var(--b3-theme-primary);
      color: white;
    }
    .day-btn.disabled {
      color: var(--b3-theme-on-surface-light);
      cursor: not-allowed;
      opacity: 0.5;
    }
    .selected-date {
      margin: 8px 0;
      text-align: center;
      font-size: 13px;
    }
    .time-picker {
      display: flex;
      justify-content: center;
      margin: 8px 0;
    }
    .time-picker input {
      font-size: 13px;
      padding: 4px;
      border-radius: 4px;
      border: 1px solid var(--b3-border-color);
    }
    .b3-dialog__action {
      margin-top: 12px;
    }
  `;
  dialog.element.appendChild(style);

  return {
    dialog,
    close: dialog.destroy.bind(dialog),
    container,
    getSelectedDate: () =>
      selectedDate + (args.showTime && selectedTime ? " " + selectedTime : ""),
  };
};
