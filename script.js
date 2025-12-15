/**************************************
 * STOCK PORTFOLIO APP
 **************************************/

const STOCKS = [
  "AAPL","MSFT","GOOGL","AMZN",
  "PYPL","TSLA","JPM","NVDA","NFLX","DIS"
];

const STATS_API =
  "https://stock-market-api-k9vl.onrender.com/api/stocksstatsdata";
const STOCK_DATA_API =
  "https://stock-market-api-k9vl.onrender.com/api/stocksdata";
const PROFILE_API =
  "https://stock-market-api-k9vl.onrender.com/api/profiledata";

/* ---------- GLOBAL STATE ---------- */
let selectedStock = "AAPL";
let currentRange = "1mo";
let chart;
let stockStatsMap = {};
let profileDataMap = {};

/* ---------- DOM ---------- */
const listSection = document.getElementById("list-section");
const ctx = document.getElementById("stockChart").getContext("2d");

const highPriceEl = document.getElementById("highprice");
const lowPriceEl = document.getElementById("lowprice");
const currentPriceEl = document.getElementById("currentprice");
const detailsSection = document.getElementById("details-section");

/* ---------- LOAD STOCK LIST ---------- */
async function loadStockList() {
  try {
    const res = await fetch(STATS_API);
    const data = await res.json();

    stockStatsMap = data.stocksStatsData[0];
    renderStockList(stockStatsMap);
  } catch (err) {
    console.error("Stats API error:", err);
  }
}

async function loadProfileData() {
  try {
    const res = await fetch(PROFILE_API);
    const data = await res.json();
    profileDataMap = data.stocksProfileData[0];
  } catch (err) {
    console.error("Profile API error:", err);
  }
}

function renderStockDetails(symbol) {
  if (!profileDataMap || !profileDataMap[symbol]) {
    detailsSection.innerHTML = "<p>Loading stock details...</p>";
    return;
  }

  const profile = profileDataMap[symbol];

  detailsSection.innerHTML = `
    <h6 class = "text-center">${symbol} Company Summary</h6>
    <p>${profile.summary}</p>
  `;
}



/* ---------- RENDER STOCK LIST ---------- */
function renderStockList(statsData) {
  listSection.innerHTML = "";

  STOCKS.forEach(symbol => {
    const stockInfo = statsData[symbol];
    if (!stockInfo) return;

    const profitClass =
      stockInfo.profit > 0 ? "text-success" : "text-danger";

    const row = document.createElement("div");
    row.className =
      "stock-item d-flex justify-content-between align-items-center mb-2 p-2 rounded";

    row.innerHTML = `
      <div>
        <strong>${symbol}</strong><br/>
        <small>Book Value: $${stockInfo.bookValue}</small>
      </div>
      <div class="${profitClass}">
        ${stockInfo.profit}%
      </div>
    `;

    row.addEventListener("click", () => {
      selectedStock = symbol;
      highlightSelectedStock(symbol);
      loadChart(selectedStock, currentRange);
      renderStockDetails(symbol);
    });

    listSection.appendChild(row);
  });

  highlightSelectedStock(selectedStock);
}

/* ---------- HIGHLIGHT ---------- */
function highlightSelectedStock(symbol) {
  document.querySelectorAll(".stock-item").forEach(item => {
    item.classList.remove("selected");
  });

  const selectedRow = [...document.querySelectorAll(".stock-item")]
    .find(row => row.textContent.includes(symbol));

  if (selectedRow) {
    selectedRow.classList.add("selected");
  }
}

/* ---------- LOAD CHART ---------- */
async function loadChart(stock, range) {
  const res = await fetch(STOCK_DATA_API);
  const data = await res.json();

  const stockData = data.stocksData[0][stock][range];
  const prices = stockData.value;

  const labels = stockData.timeStamp.map(ts =>
    new Date(ts * 1000).toLocaleDateString()
  );

  updatePriceInfo(prices);
  drawChart(labels, prices);
}

/* ---------- DRAW CHART ---------- */
function drawChart(labels, prices) {
  if (chart) chart.destroy();

  const profit = stockStatsMap[selectedStock]?.profit ?? 0;
  const isProfit = profit >= 0;

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: selectedStock,
        data: prices,
        borderWidth: 2,
        tension: 0.4,
        borderColor: isProfit ? "#28a745" : "#dc3545",
        backgroundColor: isProfit
          ? "rgba(40,167,69,0.3)"
          : "rgba(220,53,69,0.3)",
        fill: true,
        pointRadius: 0,
        cubicInterpolationMode: "monotone"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });
}

/* ---------- PRICE INFO ---------- */
function updatePriceInfo(prices) {
  highPriceEl.textContent = `$${Math.max(...prices).toFixed(2)}`;
  lowPriceEl.textContent = `$${Math.min(...prices).toFixed(2)}`;
  currentPriceEl.textContent = `$${prices[prices.length - 1].toFixed(2)}`;
}

/* ---------- RANGE BUTTONS ---------- */
document.querySelectorAll(".range-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    currentRange = btn.dataset.range;
    loadChart(selectedStock, currentRange);
  });
});

/* ---------- INIT ---------- */
loadStockList();
(async function initApp() {
  await loadProfileData();
  renderStockDetails(selectedStock);
})();
loadChart(selectedStock, currentRange);
