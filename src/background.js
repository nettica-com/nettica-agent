"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  Tray,
  Menu,
  MenuItem,
  nativeImage,
  ipcMain,
} from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS_DEVTOOLS } from "electron-devtools-installer";
import authService from "./services/auth-service";
import windowStateKeeper from "electron-window-state";
const fs = require("fs");
const path = require("path");
const fileWatcher = require("chokidar");
const os = require("os");
const { Notification } = require("electron");
const { autoUpdater } = require("electron-updater");

var icon = path.join(__static, "./nettica.png");
var tray;

var appData;
if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let NetticaServersPath = appData + "\\nettica\\";

if (os.platform() == "linux") {
  NetticaServersPath = "/etc/nettica/";
}

if (os.platform() == "darwin") {
  NetticaServersPath = "/usr/local/etc/nettica/";
}

var servers = [];

function getServers() {
  // Read all the json files in the directory
  const files = fs.readdirSync(NetticaServersPath);
  files.forEach((file) => {
    console.log("file = ", file);
    if (
      file.endsWith(".json") &&
      file != "nettica.json" &&
      file != "keys.json" &&
      !file.endsWith("-service-host.json")
    ) {
      try {
        console.log("server file = ", NetticaServersPath + file);
        let server = JSON.parse(fs.readFileSync(NetticaServersPath + file));
        servers.push(server);
      } catch (err) {
        console.error("Error reading json file: ", err);
      }
    }
  });

  return servers;
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

let server;
// handle messages from renderer
ipcMain.on("authenticate", (event, arg) => {
  console.log(arg);
  server = arg;
  try {
    createAuthWindow(true);
  } catch (err) {
    console.error("Error creating Auth Window : ", err);
  }

  event.returnValue = authService.getAccessToken();
});

ipcMain.on("accessToken", (event) => {
  event.returnValue = authService.getAccessToken();
  console.log("accessToken = ", authService.getAccessToken());
});

if (os.platform == "win32") {
  ipcMain.on("install-now", () => {
    autoUpdater.quitAndInstall(true, true);
  });

  autoUpdater.on("error", (message) => {
    console.error("There was a problem updating the application");
    console.error(message);
  });
}

ipcMain.handle("logout", (event) => {
  console.log("*** logout received ***");
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
  });

  win.loadURL(
    server +
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

let mainWindow;

async function createWindow() {
  try {
    createAppWindow();
  } catch (err) {
    console.error("Error creating App Window : ", err);
  }
}

let authWindow;

async function createAuthWindow(login) {
  destroyAuthWin();

  // Create the browser window.
  authWindow = new BrowserWindow({
    width: 600,
    height: 1000,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  authWindow.setTitle("Authentication");
  authWindow.setIcon(icon);

  if (!login) {
    authWindow.loadURL(
      server +
        "/api/v1.0/auth/logout?redirect_uri=com.nettica.agent://callback/agent"
    );
  } else {
    let codeUrl;
    await authService.getAuthenticationURL(server).then((rsp) => {
      console.log("rsp.codeUrl = ", rsp.codeUrl);
      codeUrl = rsp.codeUrl;
      if (!codeUrl.includes("client_id")) {
        codeUrl = codeUrl + "&client_id=" + rsp.clientId;
      }
    });
    console.log("codeUrl = ", codeUrl);
    authWindow.loadURL(codeUrl);
  }

  const {
    session: { webRequest },
  } = authWindow.webContents;

  const filter = {
    //    urls: ["com.nettica.agent://callback/agent*", "https://dev.nettica.com/*"],
    urls: ["com.nettica.agent://callback/agent*", server + "/*code=*"],
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
  let accessToken = authService.getAccessToken();
  if (accessToken) {
    mainWindow.webContents.send("authenticated", accessToken);
  }
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
  mainWindowStateKeeper.defaultWidth = 420;
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
    mainWindow.webContents.send("handle-servers", servers);

    mainWindow.show();
    console.log("ready-to-show");
  });

  if (os.platform == "win32") {
    autoUpdater.checkForUpdatesAndNotify();
  }

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
    ignoreInitial: true,
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
      console.log("File", path, "has been added");
      if (path.endsWith(".json")) {
        try {
          let server = JSON.parse(fs.readFileSync(path));
          servers.push(server);
          mainWindow.webContents.send("handle-servers", servers);
          if (tray) tray.setContextMenu(createContextMenu());
        } catch (err) {
          console.error("Error reading json file: ", err);
        }
      }
    })
    .on("addDir", function (path) {
      console.log("Directory", path, "has been added");
    })
    .on("change", function (path) {
      if (path.endsWith(".json")) {
        console.log("File", path, "has been changed");
        try {
          let body = fs.readFileSync(path);
          let s = JSON.parse(body);
          let found = false;
          for (let i = 0; i < servers.length; i++) {
            if (servers[i].device.server == s.device.server) {
              servers[i] = s;
              found = true;
              break;
            }
          }
          if (!found) {
            // Add new server
            servers.push(s);
          }
          mainWindow.webContents.send("handle-servers", servers);
          if (tray) tray.setContextMenu(createContextMenu());
        } catch (err) {
          console.error("Error reading json file: ", err);
        }
      }
    })
    .on("remove", function (path) {
      if (path.endsWith(".json")) {
        let server_name = path.split("/").pop();
        server_name = server_name.split("\\").pop();
        server_name = server_name.replace(".json", "");
        console.log(
          "server_name = ",
          server_name,
          " servers.length = ",
          servers.length
        );
        for (let i = 0; i < servers.length; i++) {
          if (
            servers[i].device.server == "https://" + server_name ||
            servers[i].device.server == "http://" + server_name
          ) {
            console.log("server removed = ", servers[i].device.server);
            servers.splice(i, 1);
            break;
          }
        }
        mainWindow.webContents.send("handle-servers", servers);
        if (tray) tray.setContextMenu(createContextMenu());
        console.log("File", path, "has been removed");
      }
    })
    .on("unlink", function (path) {
      if (path.endsWith(".json")) {
        let server_name = path.split("/").pop();
        server_name = server_name.split("\\").pop();
        server_name = server_name.replace(".json", "");
        console.log(
          "server_name = ",
          server_name,
          " servers.length = ",
          servers.length
        );
        for (let i = 0; i < servers.length; i++) {
          if (
            servers[i].device.server == "https://" + server_name ||
            servers[i].device.server == "http://" + server_name
          ) {
            servers.splice(i, 1);
            break;
          }
        }
        mainWindow.webContents.send("handle-servers", servers);
        if (tray) tray.setContextMenu(createContextMenu());
        console.log("File", path, "has been removed (unlink)");
      }
    })
    .on("unlinkDir", function (path) {
      console.log("Directory", path, "has been removed");
    })
    .on("error", function (error) {
      console.log("Error happened", error);
    })
    .on("ready", onWatcherReady);
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
  getServers();

  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error("Vue Devtools failed to install:", e.toString());
    }
  }

  if (os.platform == "win32") {
    autoUpdater.on("update-available", () => {
      // mainWindow.webContents.send("update-available");
    });

    autoUpdater.on("update-downloaded", () => {
      mainWindow.webContents.send("update-downloaded");
    });
  }

  let i = nativeImage.createFromPath(icon);
  tray = new Tray(i);

  tray.on("click", function () {
    console.log("tray clicked mainWindow = ", mainWindow);
    mainWindow.show();
  });

  let contextMenu = createContextMenu();

  tray.setContextMenu(contextMenu);
  tray.setToolTip("Nettica Agent");
  tray.setTitle("");

  createWindow();

  startWatcher(NetticaServersPath);
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

function createContextMenu() {
  let contextMenu = new Menu();
  if (servers != null && servers.length > 0) {
    for (let i = 0; i < servers.length; i++) {
      if (servers[i].config == null) {
        continue;
      }
      for (let j = 0; j < servers[i].config.length; j++) {
        if (servers[i].config[j].vpns == null) {
          continue;
        }
        for (let k = 0; k < servers[i].config[j].vpns.length; k++) {
          let vpn = servers[i].config[j].vpns[k];
          if (vpn.deviceid == servers[i].device.id) {
            contextMenu.append(
              new MenuItem({
                type: "checkbox",
                checked: vpn.enable,
                label: vpn.netName,
                sublabel: servers[i].config[j].description,
                click: function () {
                  mainWindow.webContents.send("handle-vpn", vpn);
                },
              })
            );
            break;
          }
        }
      }
    }

    if (contextMenu.items != null && contextMenu.items.length > 0) {
      contextMenu.append(new MenuItem({ type: "separator" }));
    }
  }
  contextMenu.append(
    new MenuItem({
      label: "About                                             ",
      click: function () {
        mainWindow.show();
        createAboutWindow();
      },
    })
  );
  contextMenu.append(
    new MenuItem({
      label: "Open",
      click: function () {
        mainWindow.show();
      },
    })
  );
  contextMenu.append(
    new MenuItem({
      label: "Exit",
      click: function () {
        app.exit(0);
      },
    })
  );

  return contextMenu;
}

export default {
  getServers,
};
