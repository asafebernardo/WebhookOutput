const { app, BrowserWindow } = require("electron");
const express = require("express");
const bodyParser = require("body-parser");
const ngrok = require("ngrok");

let mainWindow;
let publicUrl = null;
let server = null;

// -------------------- Criar janela --------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// -------------------- NGROK --------------------
async function startNgrok() {
  try {
    publicUrl = await ngrok.connect({
      addr: 3005,
      region: "sa",
    });

    console.log("NGROK URL:", publicUrl);

    if (mainWindow) {
      mainWindow.webContents.send("ngrok-url", publicUrl);
    }
  } catch (err) {
    console.error("Erro ao iniciar NGROK:", err);
  }
}

// -------------------- SERVIDOR EXPRESS --------------------
const api = express();
api.use(bodyParser.json());

api.post("/webhook", (req, res) => {
  console.log("Webhook recebido:", req.body);

  if (mainWindow) {
    mainWindow.webContents.send("webhook-received", req.body);
  }

  res.status(200).send("OK");
});

server = api.listen(3005, () => {
  console.log("Servidor ouvindo em http://localhost:3005/webhook");
});

// -------------------- APP READY --------------------
app.whenReady().then(async () => {
  createWindow();
  await startNgrok();
});

// -------------------- FECHAR TUDO CORRETAMENTE --------------------
app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    if (publicUrl) await ngrok.disconnect(publicUrl);
    await ngrok.kill();

    if (server) server.close();

    app.quit();
  }
});
