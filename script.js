
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "gholake-cigarette-v1";

function getToday() {
    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function loadData() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (
            saved &&
            saved.day === getToday() &&
            Array.isArray(saved.history)
        ) {
            return saved;
        }
    } catch (error) {
        console.error("خطا در خواندن اطلاعات:", error);
    }

    return {
        day: getToday(),
        packPrice: 60000,
        packCount: 20,
        dailyLimit: 20,
        history: []
    };
}

let data = loadData();

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStickPrice() {
    return data.packPrice / Math.max(1, data.packCount);
}

function getEarnedMoney() {
    const now = new Date();

    const minutes =
        now.getHours() * 60 +
        now.getMinutes() +
        now.getSeconds() / 60;

    const dailyBudget = getStickPrice() * data.dailyLimit;

    return dailyBudget * minutes / 1440;
}

function getSpentMoney() {
    return data.history.reduce((total, item) => {
        return total + item.cost;
    }, 0);
}

function formatMoney(value) {
    return Math.round(value).toLocaleString("fa-IR");
}

function render() {
    const earned = getEarnedMoney();
    const spent = getSpentMoney();
    const balance = earned - spent;

    $("balance").textContent =
        formatMoney(balance) + " تومان";

    $("balance").style.color =
        balance < 0 ? "#ff7777" : "#70dba8";

    $("earned").textContent = formatMoney(earned);
    $("spent").textContent = formatMoney(spent);
    $("stickPrice").textContent = formatMoney(getStickPrice());

    const historyElement = $("history");

    historyElement.innerHTML = "";

    if (data.history.length === 0) {
        const li = document.createElement("li");
        li.textContent = "هنوز چیزی ثبت نشده.";
        historyElement.appendChild(li);
    } else {
        [...data.history].reverse().forEach((item) => {
            const li = document.createElement("li");

            const time = new Date(item.time).toLocaleTimeString(
                "fa-IR",
                { hour: "2-digit", minute: "2-digit" }
            );

            li.textContent =
                `${time} — ${item.label} — ` +
                `${formatMoney(item.cost)} تومان`;

            historyElement.appendChild(li);
        });
    }
}

$("saveSettings").addEventListener("click", () => {
    const price = Number($("packPrice").value);
    const count = Number($("packCount").value);
    const daily = Number($("dailyLimit").value);

    if (
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(count) ||
        count < 1 ||
        !Number.isInteger(daily) ||
        daily < 0
    ) {
        alert("لطفاً مقادیر معتبر وارد کن.");
        return;
    }

    data.packPrice = price;
    data.packCount = count;
    data.dailyLimit = daily;

    saveData();
    render();
});

$("smokeButton").addEventListener("click", () => {
    data.history.push({
        label: "کشیدن یک نخ",
        cost: getStickPrice(),
        time: Date.now()
    });

    saveData();
    render();
});

$("undoButton").addEventListener("click", () => {
    if (data.history.length === 0) {
        return;
    }

    data.history.pop();

    saveData();
    render();
});

$("packPrice").value = data.packPrice;
$("packCount").value = data.packCount;
$("dailyLimit").value = data.dailyLimit;

render();

setInterval(render, 1000);
