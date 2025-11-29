const { ipcRenderer } = require("electron");

const currentBox = document.getElementById("current");
const historyPanel = document.getElementById("history-panel");
const btnHistory = document.getElementById("btn-history");
const ngrokBox = document.getElementById("ngrok-url-box"); // novo elemento no HTML

let history = [];      // histórico completo
let windowEvents = []; // últimos 2 segundos de eventos

// ====== ABRE/FECHA HISTÓRICO ======
btnHistory.addEventListener("click", () => {
  historyPanel.classList.toggle("open");
  if (historyPanel.classList.contains("open")) renderHistory();
});

// ====== RENDER DO HISTÓRICO ======
function renderHistory() {
  historyPanel.innerHTML = "";

  history.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("log-entry");
    div.style.borderLeftColor = item.color;

    div.innerHTML = `
      <div class="log-time">${item.time}</div>
      ${item.json}
    `;
    historyPanel.appendChild(div);
  });
}

// ====== CORES POR TIPO ======
function getColorFromType(type) {
  return {
    success: "#00ff88",
    error: "#ff4444",
    warning: "#ffbb00",
    other: "#66aaff",
  }[type] || "#66aaff";
}

// ====== RECEBE URL DO NGROK (SEM APAGAR OS WEBHOOKS) ======
ipcRenderer.on("ngrok-url", (event, url) => {
  if (ngrokBox) {
    ngrokBox.innerHTML = `
      🔗 URL para webhooks:<br>
      <b>${url}/webhook</b>
      <hr style="margin:10px 0; border-color:#333;">
    `;
  }
});

// ====== RECEBE EVENTOS DO WEBHOOK ======
ipcRenderer.on("webhook-received", (event, data) => {
  const json = JSON.stringify(data, null, 2);
  const now = Date.now();

  const type = data.type || "other";
  const color = getColorFromType(type);

  // Salvar no histórico completo
  history.unshift({
    timestamp: now,
    time: new Date().toLocaleTimeString(),
    json,
    color,
  });

  if (history.length > 200) history.pop();

  // Inserir no buffer de 2 segundos
  windowEvents.push({
    timestamp: now,
    json,
    color,
  });

  // Manter só os últimos 2s
  windowEvents = windowEvents.filter(e => now - e.timestamp <= 2000);

  // Atualizar janela principal
  updateCurrentDisplay();

  if (historyPanel.classList.contains("open")) {
    renderHistory();
  }
});

// ====== MOSTRAR WEBHOOKS RECEBIDOS ======
function updateCurrentDisplay() {
  currentBox.classList.remove("fade-in");
  void currentBox.offsetWidth;
  currentBox.classList.add("fade-in");

  currentBox.innerHTML = "";

  windowEvents.forEach(e => {
    const div = document.createElement("div");
    div.style.border = `2px solid ${e.color}`;
    div.style.padding = "12px";
    div.style.marginBottom = "12px";
    div.style.borderRadius = "10px";
    div.style.background = "#141414";
    div.style.whiteSpace = "pre-wrap";
    div.textContent = e.json;

    currentBox.appendChild(div);
  });
}
