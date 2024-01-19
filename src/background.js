"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import authService from "./services/auth-service";
import windowStateKeeper from "electron-window-state";

import fs from "fs";
const path = require("path");
const fileWatcher = require("chokidar");
const env = require("../env");
const os = require("os");
const { Notification } = require("electron");

var icon = path.join(__static, "./nettica.png");

var { appData } = env;
if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let NetticaConfigPath = appData + "\\nettica\\nettica.json";
let NetticaClientPath = appData + "\\nettica\\nettica.conf";

if (os.platform() == "linux") {
  NetticaConfigPath = "/etc/nettica/nettica.json";
  NetticaClientPath = "/etc/nettica/nettica.conf";
}

if (os.platform() == "darwin") {
  NetticaConfigPath = "/usr/local/etc/nettica/nettica.json";
  NetticaClientPath = "/usr/local/etc/nettica/nettica.conf";
}

//Unicast Client receiving notification messages
var PORT = 25264;
var UCAST_ADDR = "127.0.0.1";

var dgram = require("dgram");
var uclient = dgram.createSocket("udp4");

// Listen on port 127.0.0.1:25264 for notifications from the nettica client
// Notifications can be dns, info, error
uclient.on("listening", function () {
  var address = uclient.address();
  console.log(
    "UDP Client listening on " + address.address + ":" + address.port
  );
});

uclient.on("message", function (message) {
  try {
    var msg = JSON.parse(message);

    if (msg.type == "dns") {
      try {
        mainWindow.webContents.send("handle-dns", "" + msg.text);
      } catch (e) {
        console.error("send dns query to renderer:", e.toString());
      }
    }

    if (msg.type == "info") {
      new Notification({
        icon: icon,
        body: msg.text,
      }).show();
    }
  } catch (e) {
    console.error("notification error:", e.toString());
  }
});

uclient.on("error", (err) => {
  console.error(err);
});

uclient.bind(PORT, UCAST_ADDR);

// handle messages from renderer
ipcMain.on("authenticate", (event, arg) => {
  console.log(arg);
  try {
    createAuthWindow(true);
    // authService.loadTokens();
  } catch (err) {
    console.error("Error creating Auth Window : ", err);
  }

  event.returnValue = "something";
});

ipcMain.on("accessToken", (event) => {
  event.returnValue = authService.getAccessToken();
  console.log("accessToken = ", authService.getAccessToken());
});

ipcMain.handle("logout", (event) => {
  console.log("*** logout received ***");
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
  });
  
  win.loadURL(
    device.server +
      "/api/v1.0/auth/logout?redirect_url=com.nettica.agent://callback/agent"
  );
  win.on("ready-to-show", () => {
    console.log("ready-to-show logout window");
    win.close();
    authService.logout();
  });

  console.log(" *** logged out ***");

  event.returnValue = "logged out";
});

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: "com.nettica.agent",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

app.whenReady().then(() => {
  protocol.registerFileProtocol("app", (request, callback) => {
    const url = request.url.substring(6);
    console.log("URL: ", url);
    callback({ path: path.join(`${__dirname}/${url}`) });
  });
  if (process.platform === "win32") {
    app.setAppUserModelId("com.nettica.agent");
  }
});
const isDevelopment = process.env.NODE_ENV !== "production";

let tray;

let mainWindow;

async function createWindow() {
  try {
    getConfig();
    createAppWindow();
  } catch (err) {
    console.error("Error creating App Window : ", err);
  }
}

let config;
function getConfig() {
  try {
    config = JSON.parse(fs.readFileSync(NetticaConfigPath));
  } catch (err) {
    config = {};
  }
}

let device;
function getDevice() {
  try {
    device = JSON.parse(fs.readFileSync(NetticaClientPath));
  } catch (err) {
    device = {};
  }
  return device;
}

let authWindow;

async function createAuthWindow(login) {
  destroyAuthWin();
  getDevice();
  // Create the browser window.
  authWindow = new BrowserWindow({
    width: 600,
    height: 1000,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
    },
  });
  authWindow.setTitle("Authentication");
  authWindow.setIcon(icon);

  if (!login) {
    authWindow.loadURL(
      device.server +
        "/api/v1.0/auth/logout?redirect_uri=com.nettica.agent://callback/agent"
    );
  } else {
    let codeUrl;
    await authService.getAuthenticationURL(device).then((url) => {
      console.log("url = ", url);
      codeUrl = url;
    });
    console.log("codeUrl = ", codeUrl);
    authWindow.loadURL(codeUrl);
  }

  const {
    session: { webRequest },
  } = authWindow.webContents;

  const filter = {
    //    urls: ["com.nettica.agent://callback/agent*", "https://dev.nettica.com/*"],
    urls: ["com.nettica.agent://callback/agent*"],
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    console.log("onBeforeRequest url = ", url);
    if (url.includes("com.nettica.agent://callback/agent/logout")) {
      console.log("*** logout ***");
      return destroyAuthWin();
    }
    await authService.loadNetticaTokens(url);
    return destroyAuthWin();
  });

  authWindow.on("authenticated", () => {
    destroyAuthWin();
  });

  authWindow.on("closed", () => {
    authWindow = null;
  });
}

function destroyAuthWin() {
  if (!authWindow) return;
  authWindow.close();
  authWindow = null;
}

function createAboutWindow() {
  mainWindow.show();
  // send message to renderer
  try {
    mainWindow.webContents.send("handle-about", "about");
  } catch (e) {
    console.error("send about to renderer:", e.toString());
  }
}

function createAppWindow() {
  // Create the browser window.
  const mainWindowStateKeeper = windowStateKeeper("main");
  mainWindowStateKeeper.defaultWidth = 1200;
  mainWindowStateKeeper.defaultHeight = 800;

  mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowStateKeeper.x,
    y: mainWindowStateKeeper.y,
    width: mainWindowStateKeeper.width,
    height: mainWindowStateKeeper.height,
    minWidth: 420,
    minHeight: 180,
    autoHideMenuBar: true,
    frame: true,
    titleBarOverlay: {
      color: "#2f3241",
      symbolColor: "#74b1be",
      // height: 60
    },
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      contextIsolation: false,
      enableRemoteModule: true,
      backgroundColor: "#333",
      icon: icon,
    },
  });

  mainWindowStateKeeper.manage(mainWindow);

  console.log("icon = ", icon);
  mainWindow.setIcon(icon);

  mainWindow.on("ready-to-show", function () {
    mainWindow.setTitle("Nettica Agent");
    mainWindow.show();
    console.log("ready-to-show");
  });

  mainWindow.on("minimize", function (event) {
    if (process.platform != "linux") {
      event.preventDefault();
      try {
        mainWindow.hide();
      } catch (e) {
        console.log("couldn't hide window ", e);
      }
    }
  });

  mainWindow.on("close", function (event) {
    if (process.platform != "linux") {
      event.preventDefault();
      try {
        mainWindow.hide();
      } catch (e) {
        console.log("couldn't hide window ", e);
      }
      return false;
    }
  });

  createProtocol("com.nettica.agent");

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
  } else {
    // Load the index.html when not in development
    mainWindow.loadURL("com.nettica.agent://./index.html");
  }
}

function startWatcher(path) {
  var watcher = fileWatcher.watch(path, {
    persistent: true,
  });

  function onWatcherReady() {
    console.log(
      "From here can you check for real changes, the initial scan has been completed."
    );
  }

  // Declare the listeners of the watcher
  watcher
    .on("add", function (path) {
      // check if the file is nettica.json
      if (path.includes("nettica.json")) {
        getConfig();
        console.log("Add - Config = ", config);
        try {
          mainWindow.webContents.send("handle-config", config.config);
        } catch (e) {
          console.error("send config to renderer:", e.toString());
        }
      }
      console.log("File", path, "has been added");
    })
    .on("addDir", function (path) {
      console.log("Directory", path, "has been added");
    })
    .on("change", function (path) {
      if (path.includes("nettica.json")) {
        getConfig();
        console.log("Change - Config = ", config);
        try {
          mainWindow.webContents.send("handle-config", config.config);
        } catch (e) {
          console.error("send config to renderer:", e.toString());
        }
      }
      console.log("File", path, "has been changed");
    })
    .on("unlink", function (path) {
      // check if the file is nettica.json
      if (path.includes("nettica.json")) {
        var delconfig = [];
        try {
          mainWindow.webContents.send("handle-config", delconfig);
        } catch (e) {
          console.error("send config to renderer:", e.toString());
        }
      }
      console.log("File", path, "has been removed");
    })
    .on("unlinkDir", function (path) {
      console.log("Directory", path, "has been removed");
    })
    .on("error", function (error) {
      console.log("Error happened", error);
    })
    .on("ready", onWatcherReady)
    .on("raw", function (event, path, details) {
      // This event should be triggered everytime something happens.
      console.log("Raw event info:", event, path, details);
    });
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  getConfig();
  getDevice();
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  let i = nativeImage.createFromPath(icon);
  tray = new Tray(i);

  tray.on("click", function () {
    mainWindow.show();
  });

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "About",
      click: function () {
        mainWindow.show();
        createAboutWindow();
      },
    },
    {
      label: "Open",
      click: function () {
        mainWindow.show();
      },
    },
    {
      label: "Exit",
      click: function () {
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip("Nettica Agent");
  tray.setTitle("");

  createWindow();

  startWatcher(NetticaConfigPath);
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

export default {
  getConfig,
  getDevice,
  device,
};
