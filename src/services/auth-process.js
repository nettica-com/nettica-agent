import { BrowserWindow } from "electron";
import authService from "./auth-service";

let win = null;

function createAuthWindow() {
  destroyAuthWin();

  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 1000,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  win.loadURL(authService.getAuthenticationURL());

  const {
    session: { webRequest },
  } = win.webContents;

  const filter = {
    urls: ["file:///callback*"],
  };

  webRequest.onBeforeRequest(filter, async ({ url }) => {
    await authService.loadTokens(url);
    // createAppWindow();
    return destroyAuthWin();
  });

  win.on("authenticated", () => {
    destroyAuthWin();
  });

  win.on("closed", () => {
    win = null;
  });
}

function destroyAuthWin() {
  if (!win) return;
  win.close();
  win = null;
}

export default createAuthWindow;
