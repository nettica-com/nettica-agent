# Nettica Agent — Claude Code Context

## Project Overview

Electron desktop app (system tray agent) built with Vue 2 + Vuetify 2 + Vuex + webpack.
**Pending migration**: Vue 2 → Vue 3, Vuetify 2 → Vuetify 3, Vuex → Pinia, webpack → electron-vite.

The Vue 2 build is crusty — deprecation warnings are expected. Don't try to get a clean reference
build from the old codebase. Instead treat the configs below as the source of truth for what
the new build must produce.

---

## Artifact Matrix (must be preserved through migration)

| Platform | Format | Architectures |
|----------|--------|---------------|
| Linux    | `.deb` | x64, arm64, armv7l |
| Linux    | `.rpm` | x64, arm64 |
| Windows  | NSIS installer (`.exe`) | x64 |
| macOS    | `.pkg` | (built separately) |

Build commands (from `build.sh`):
```sh
npm run electron:build                                  # x64 deb + rpm + win
npm run electron:build -- --linux rpm --arm64 --dir    # arm64 rpm
npm run electron:build -- --linux deb --arm64 --dir    # arm64 deb
npm run electron:build -- --linux deb --armv7l --dir   # armv7l deb (Pi)
```

---

## Windows Code Signing

- Signing is done via a custom `sign.js` (not electron-builder's built-in signing)
- Tool: `signtool.exe` at `C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe`
- Certificate: subject name `"Nettica Corporation"`, thumbprint `CBB53B9D617593941E91E50AD9E51A9FD3700838`
- Timestamp server: `http://ts.ssl.com` (RFC 3161)
- Config in `electron-builder.json`: `"sign": "sign.js"`
- **Windows build must be done on a Windows machine** — `sign.js` calls `signtool.exe`
- `sign.js` handles both string and object `executablePath` (Electron passes an object)

---

## Key Dependencies to Replace During Migration

| Old | New |
|-----|-----|
| `vue@^2.6.14` | `vue@^3.x` |
| `vuetify@^2.6.0` | `vuetify@^3.x` |
| `vuex@^3.6.2` + `vuex-electron` | `pinia` |
| `vue-router@^3.5.1` | `vue-router@^4.x` |
| `vue-cli-service` | `electron-vite` |
| `vue-cli-plugin-electron-builder@^2.1.1` | `electron-vite` or `vite-plugin-electron` |
| `vue-cli-plugin-vuetify~2.5.8` | `vite-plugin-vuetify` |
| `vue-template-compiler` | (removed — not needed in Vue 3) |
| `vuetify-loader@^1` | `vuetify-loader@^2` or `vite-plugin-vuetify` |
| `webpack` / `webpack-cli` etc. | (removed — handled by vite) |

Other notable deps to evaluate:
- `vuex-electron` — handles Vuex state persistence across main/renderer; replace with Pinia + `pinia-plugin-persistedstate` or `electron-store`
- `@electron/remote` — check usage; modern Electron prefers `contextBridge` / `ipcRenderer`
- `vue-d3-network` — Vue 2 only; check for Vue 3 fork or replace (nettica-admin used a direct D3 component)
- `vue-apexcharts` — has a Vue 3 version (`vue3-apexcharts`)
- `electron@^27` — check if upgrade needed alongside vite tooling

---

## Vue 2 → Vue 3 Migration Lessons (from nettica-admin port)

### Vuetify 2 → 3 class changes
- `hidden-xs-only` → `d-none d-sm-flex`
- `hidden-sm-and-up` → `d-flex d-sm-none`
- Nav drawer: add `temporary` prop to prevent auto-opening at lg breakpoint
- Theme: `theme.global.name.value = 'dark'` → `theme.change('dark')`
- Breakpoints: use `useDisplay()` composable instead of `$vuetify.breakpoint`

### Pinia replacing Vuex
- Delete `src/store/` directory, create `src/stores/*.js` individual store files
- Use `storeToRefs(store)` to destructure reactive refs
- `vuex-electron` state sync across processes needs a Pinia equivalent

### HTML spec issues
- `<tr>` must be child of `<tbody>`, not direct child of `<table>`

### Sparse array bug (easy to miss, causes blank list items)
```javascript
// WRONG — shared counter skips indices
let child = 0
items[i].children[child++] = { ... }  // child keeps incrementing across parents!

// RIGHT
items[i].children.push({ ... })
```

### Responsive toggle layout
Replace `<table><tr><td><v-switch></td></tr></table>` with:
```html
<div style="display:flex; flex-wrap:wrap; gap:0 16px;">
  <div style="display:flex; flex-direction:column; flex:1 1 180px; min-width:0;">
    <v-switch ... />
  </div>
  <div style="display:flex; flex-direction:column; flex:1 1 180px; min-width:0;">
    <v-switch ... />
  </div>
</div>
```

### Router
- Route `"/"` with no component: use `component: { render: () => null }`
- `router.beforeEach` guard: check `meta.requiresAuth`, store `intendedRoute`

---

## Windows Installer Bundled Components (`extra/`)

The NSIS installer (`build/installer.nsh`) bundles and installs two additional components:

### WireGuard
- `extra/wireguard-amd64-0.6.1.msi` — installed silently via `MsiExec.exe /i ... DO_NOT_LAUNCH=1 /qn`
- `extra/wireguard-amd64-0.5.3.msi` — old version, kept only to detect and uninstall it if present
- **Already signed by the WireGuard team** — no action needed

### nettica-client
- `extra/nettica-client.exe` — the WireGuard tunnel manager service
- **Must be signed with the Nettica certificate** (same `sign.js` / signtool process as the main installer)
- Installed as a Windows service: `nettica-client.exe install` then `nettica-client.exe start`
- Uninstall: `nettica-client.exe stop` then `nettica-client.exe remove`
- On install, creates `%APPDATA%\Nettica\` and `%APPDATA%\Nettica\WireGuard\` directories

### Upgrade logic
If old WireGuard v1.0.20210914 is detected, the installer:
1. Stops and removes nettica-client service
2. Uninstalls old WireGuard MSI
3. Sets reboot flag
4. Proceeds with fresh install

**This part of the process is unlikely to change during the Vue 2 → 3 migration** — it lives entirely in `build/installer.nsh` and `electron-builder.json` (`nsis.include`), independent of the Vue/Electron tooling.

---

## Windows arm64 — Future Goal

Currently only `x64` is shipped for Windows. arm64 Windows (Surface Pro X, Snapdragon laptops) is a growing target.

### Good news: Electron supports cross-compiling Windows arm64 from Linux
- Electron ships pre-built arm64 binaries for Windows
- `electron-builder` can target `--win --arm64` from a Linux build machine — no Windows arm64 hardware needed
- The main Electron app itself should cross-compile cleanly

### nettica-client.exe (Go)
- Go cross-compilation to `windows/arm64` is fully supported:
  ```sh
  GOOS=windows GOARCH=arm64 go build -o nettica-client-arm64.exe .
  ```
- No special toolchain needed beyond standard Go

### WireGuard for Windows arm64
- WireGuard does ship arm64 MSIs — check https://download.wireguard.com/windows-client/ for `wireguard-arm64-x.x.x.msi`
- Would need a separate `extra/` set for arm64: `wireguard-arm64-x.x.x.msi` + `nettica-client-arm64.exe`

### Code signing
- `sign.js` uses `signtool.exe` which requires the Windows machine — arm64 `.exe` files still need to be signed there
- Both `nettica-client-arm64.exe` and the arm64 Electron executable would need signing
- This is the main blocker for fully automated arm64 Windows builds from Linux

### NSIS installer
- NSIS itself is x64 but generates installers that can install arm64 binaries
- Would need a separate installer target in `electron-builder.json` for arm64 Windows, or a fat installer that detects arch at install time

### Summary
Cross-compilation from Linux is feasible for the app and nettica-client. The signing step still requires the Windows machine regardless of architecture. Treat Windows arm64 as a post-migration stretch goal once x64 is stable.

---

## Electron-Specific Migration Concerns

- **main/renderer split**: Vue runs in renderer; verify IPC patterns still work after tooling change
- **contextBridge**: audit use of `@electron/remote` — consider migrating to `contextBridge` + preload
- **electron-vite config**: must explicitly list all Linux cross-compile targets (x64, arm64, armv7l)
- **Code signing**: `sign.js` must be re-wired into the new build config; test on Windows machine
- **`electron-settings`**: persists app settings to disk — verify it still works with new renderer setup
- **`auto-launch`**: OS-level startup registration — test on each platform after migration
