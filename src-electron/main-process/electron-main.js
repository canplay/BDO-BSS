import { app, BrowserWindow, ipcMain, session } from 'electron'
import fileStream from "fs";

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = require('path').join(__dirname, 'statics').replace(/\\/g, '\\\\')
}

if (process.env.PROD) {
  global.__statics = require("path")
    .join(__dirname, "statics")
    .replace(/\\/g, "\\\\");
}

app.commandLine.appendSwitch("--disable-http-cache");

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

let mainWindow, lang

function createWindow () {
  const packageJson = GetJson("package.json");

  const json = GetJson("lang.json");
  for (let index = 0; index < json.lang.length; index++) {
    if (json.lang[index].default) lang = json.lang[index];
  }

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    title: packageJson.productName,
    minWidth: 1366,
    minHeight: 768,
    width: 1366,
    height: 768,
    frame: false,
    show: false,
    center: true,
    icon: __statics + "/icon.png",
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webviewTag: true
    }
  })

  mainWindow.loadURL(process.env.APP_URL + "?appurl=index")

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.center();
    mainWindow.focus();
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on("newWindow", (event, arg1, arg2) => {
  const packageJson = GetJson("package.json");

  let window = new BrowserWindow({
    title: packageJson.productName,
    minWidth: 1280,
    minHeight: 720,
    width: 1280,
    height: 720,
    frame: false,
    show: false,
    center: true,
    icon: __statics + "/icon.png",
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webviewTag: true
    }
  });

  window.loadURL(process.env.APP_URL + "?appurl=" + arg1 + "&type=" + arg2);

  window.on("closed", () => {
    window = null;
  });

  window.once("ready-to-show", () => {
    window.show();
    window.center();
    window.focus();
  });
});

ipcMain.on("notify", (event, title, content) => {
  trayIcon.displayBalloon({
    title: title,
    icon: __statics + "/icon.png",
    content: content
  });
});

ipcMain.on("cookies", (event, url) => {
  session.defaultSession.cookies.get({ url: url }).then(cookies => {
    mainWindow.webContents.send("cookies", cookies);
  });
});

function GetJson(file) {
  file = app.getAppPath() + "\\" + file;
  return JSON.parse(fileStream.readFileSync(file).toString());
}

async function addDir(path) {
  if (fileStream.existsSync(path)) return;
  await fileStream.mkdirSync(path);
}

async function delDir(path) {
  if (!fileStream.existsSync(path)) return;

  await FileListLoop(path, (file) => {
    if (!fileStream.statSync(file).isDirectory()) fileStream.unlinkSync(file);
    else fileStream.rmdirSync(file);
  });
}

async function dirSize(path) {
  if (!fileStream.existsSync(path)) return;

  let size = 0;

  await FileListLoop(path, (file) => {
    if (!fileStream.statSync(file).isDirectory())
      size += fileStream.statSync(file).size;
    else return (size / 1024 / 1024).toFixed(2);
  });
}

async function FileListLoop(path, callback) {
  if (!fileStream.existsSync(path)) return;

  let files = await fileStream.readdirSync(path);

  files.forEach((file, index) => {
    let curPath = path + "/" + file;

    if (fileStream.statSync(curPath).isDirectory()) {
      FileListLoop(curPath, callback);
    } else {
      callback(curPath);
    }
  });

  callback(path);
}
