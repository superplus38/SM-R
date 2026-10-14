
const STORAGE_KEY = "cigarettePiggyBank_v1";

const $ = (id) => document.getElementById(id);

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        return {
          packPrice: Number(parsed.packPrice) || 0,
          packCount: Number(parsed.packCount) || 20,
          dailyLimit: Number(parsed.dailyLimit) || 0,
          startTime: Number(parsed.startTime) || null,
          history: Array.isArray(parsed.history) ? parsed.history : []
        };
      }
    }
  } catch (error) {
    console.error("خطا در خواندن اطلاعات:", error);
  }

  return {
    packPrice: 0,
    packCount: 20,
    dailyLimit: 0,
    startTime: null,
    history: []
  };
}

let data = loadData();

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("خطا در ذخیره اطلاعات:", error);
    showMessage("ذخیره اطلاعات انجام نشد؛ حافظه مرورگر را بررسی کن.", true);
  }
}

function formatMoney(amount) {
  const rounded = Math.round(amount);
  return rounded.toLocaleString("fa-IR") + " تومان";
}

function getStickCost() {
  if (data.packPrice <= 0 || data.packCount <= 0) return 0;
  return data.packPrice / data.packCount;
}

function getDailyBudget() {
  return getStickCost() * data.dailyLimit;
}

function getEarnedMoney() {
  if (!data.startTime || data.dailyLimit <= 0) return 0;

  const elapsedMilliseconds = Math.max(0, Date.now() - data.startTime);
  const elapsedMinutes = elapsedMilliseconds / 60000;

  // بودجه روزانه به‌صورت پیوسته طی ۲۴ ساعت جمع می‌شود.
  return (getDailyBudget() / 1440) * elapsedMinutes;
}

function getSpentMoney() {
  return data.history.reduce((total, item) => {
    return total + (Number(item.cost) || 0);
  }, 0);
}

function getBalance() {
  return getEarnedMoney() - getSpentMoney();
}

function showMessage(message, isError = false) {
  const element = $("message");
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function renderHistory() {
  const list = $("history");
  list.replaceChildren();

  if (data.history.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "هنوز چیزی ثبت نشده.";
    list.appendChild(item);
    return;
  }

  [...data.history].reverse().forEach((entry) => {
    const item = document.createElement("li");
    const date = new Date(entry.time);

    const timeText = date.toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    item.textContent =
      "🚬 یک نخ سیگار — " +
      formatMoney(entry.cost) +
      " — " +
      timeText;

    list.appendChild(item);
  });
}

function render() {
  $("balance").textContent = formatMoney(getBalance());
  $("earned").textContent = formatMoney(getEarnedMoney());
  $("spent").textContent = formatMoney(getSpentMoney());

  const stickCost = getStickCost();
  $("stickCost").textContent =
    stickCost > 0 ? formatMoney(stickCost) : "—";

  if (data.startTime) {
    const elapsed = Math.max(0, Date.now() - data.startTime);
    const totalMinutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    $("elapsed").textContent =
      "از شروع: " +
      hours.toLocaleString("fa-IR") +
      " ساعت و " +
      minutes.toLocaleString("fa-IR") +
      " دقیقه";
  } else {
    $("elapsed").textContent = "تنظیمات را ذخیره کن تا شروع شود";
  }

  renderHistory();
}

function fillSettings() {
  $("packPrice").value = data.packPrice || "";
  $("packCount").value = data.packCount || 20;
  $("dailyLimit").value = data.dailyLimit || "";
}

$("saveSettings").addEventListener("click", () => {
  const packPrice = Number($("packPrice").value);
  const packCount = Number($("packCount").value);
  const dailyLimit = Number($("dailyLimit").value);

  if (
    !Number.isFinite(packPrice) ||
    !Number.isFinite(packCount) ||
    !Number.isFinite(dailyLimit) ||
    packPrice <= 0 ||
    packCount <= 0 ||
    dailyLimit <= 0 ||
    !Number.isInteger(packCount) ||
    !Number.isInteger(dailyLimit)
  ) {
    showMessage(
      "قیمت پاکت باید مثبت باشد و تعداد نخ‌ها باید عدد صحیح و مثبت باشند.",
      true
    );
    return;
  }

  const confirmed = window.confirm(
    "با ذخیره تنظیمات، موجودی و تاریخچه پاک می‌شوند و قلک از همین لحظه از صفر شروع می‌شود. ادامه می‌دهی؟"
  );

  if (!confirmed) return;

  data.packPrice = packPrice;
  data.packCount = packCount;
  data.dailyLimit = dailyLimit;
  data.startTime = Date.now();
  data.history = [];

  saveData();
  render();
  showMessage("تنظیمات ذخیره شد؛ قلک از همین لحظه شروع شد.");
});

$("smokeButton").addEventListener("click", () => {
  if (!data.startTime || data.dailyLimit <= 0) {
    showMessage("اول تنظیمات را وارد کن و ذخیره بزن.", true);
    return;
  }

  data.history.push({
    time: Date.now(),
    cost: getStickCost()
  });

  saveData();
  render();

  if (getBalance() < 0) {
    showMessage("موجودی منفی شد؛ بیشتر از پول جمع‌شده خرج کردی.", true);
  } else {
    showMessage("یک نخ ثبت شد و هزینه‌اش از موجودی کم شد.");
  }
});

$("undoButton").addEventListener("click", () => {
  if (data.history.length === 0) {
    showMessage("چیزی برای برگرداندن وجود ندارد.", true);
    return;
  }

  data.history.pop();
  saveData();
  render();
  showMessage("آخرین ثبت سیگار برگردانده شد.");
});

$("clearHistory").addEventListener("click", () => {
  if (data.history.length === 0) {
    showMessage("تاریخچه از قبل خالی است.");
    return;
  }

  const confirmed = window.confirm(
    "همه ثبت‌های سیگار پاک می‌شوند و هزینه‌های آن‌ها دیگر از موجودی کم نمی‌شود. مطمئنی؟"
  );

  if (!confirmed) return;

  data.history = [];
  saveData();
  render();
  showMessage("تاریخچه پاک شد.");
});

fillSettings();
render();

// موجودی هر ثانیه به‌روز می‌شود.
setInterval(render, 1000);
