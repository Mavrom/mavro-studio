import { app, shell, BrowserWindow, ipcMain, nativeTheme, dialog } from 'electron'
import { join, basename } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import Store from 'electron-store'
import * as os from 'os'

let activeUserId: string | null = null

const settingsStoreCache = new Map<string, Store>()
const dataStoreCache = new Map<string, Store>()

// Global store for things like window bounds and auto updater config
const globalStore = new Store({
  name: 'global_config',
  defaults: {
    windowBounds: { width: 1280, height: 800 },
    autoUpdate: true
  }
})

function getSettingsStore(): Store {
  const key = activeUserId || 'guest'
  if (!settingsStoreCache.has(key)) {
    const name = activeUserId ? `settings_${activeUserId}` : 'guest_settings'
    settingsStoreCache.set(key, new Store<Record<string, unknown>>({
      name,
      defaults: {
        language: 'tr',
        theme: 'dark',
        autoStart: false,
        defaultExportPath: '',
        dataDirectory: join(app.getPath('userData'), 'data'),
        mavroPath: '',
        idePath: '',
        startupParams: '',
        proxy: {
          enabled: false,
          type: 'http',
          host: '',
          port: '',
          username: '',
          password: '',
          bypass: ''
        },
        notifications: {
          enabled: true,
          sound: true
        },
        autoUpdate: true,
        logLevel: 'info',
        windowBounds: { width: 1280, height: 800 }
      }
    }))
  }
  return settingsStoreCache.get(key)!
}

function getDataStore(): Store {
  const key = activeUserId || 'guest'
  if (!dataStoreCache.has(key)) {
    const name = activeUserId ? `appdata_${activeUserId}` : 'guest_appdata'
    dataStoreCache.set(key, new Store<Record<string, unknown>>({
      name,
      defaults: {
        projects: [],
        notes: [],
        contacts: []
      }
    }))
  }
  return dataStoreCache.get(key)!
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = globalStore.get('windowBounds') as { width: number; height: number } || { width: 1280, height: 800 }

  mainWindow = new BrowserWindow({
    width: bounds.width || 1280,
    height: bounds.height || 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0d1117',
    icon: join(__dirname, '../../build/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Save window bounds on resize
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const [width, height] = mainWindow.getSize()
      globalStore.set('windowBounds', { width, height })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ===================== IPC HANDLERS =====================

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized())

// Settings IPC
ipcMain.handle('settings:get', (_event, key: string) => {
  return getSettingsStore().get(key)
})

ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
  getSettingsStore().set(key, value)
  return true
})

ipcMain.handle('settings:getAll', () => {
  return getSettingsStore().store
})

// Theme
ipcMain.handle('theme:get', () => {
  return getSettingsStore().get('theme')
})

ipcMain.handle('theme:set', (_event, theme: string) => {
  getSettingsStore().set('theme', theme)
  if (theme === 'system') {
    nativeTheme.themeSource = 'system'
  } else {
    nativeTheme.themeSource = theme as 'dark' | 'light'
  }
  return true
})

// System info
ipcMain.handle('system:info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.versions.node,
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    v8Version: process.versions.v8,
    osVersion: os.release(),
    osType: os.type(),
    hostname: os.hostname(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpuModel: os.cpus()[0]?.model || 'Unknown',
    cpuCores: os.cpus().length,
    uptime: os.uptime(),
    homeDir: os.homedir(),
    tempDir: os.tmpdir(),
    appVersion: app.getVersion(),
    appPath: app.getAppPath(),
    userDataPath: app.getPath('userData'),
    logsPath: app.getPath('logs')
  }
})

// Disk usage of the volume holding the user's home directory
ipcMain.handle('system:disk', async () => {
  const fs = await import('fs/promises')
  try {
    const stats = await fs.statfs(os.homedir())
    const total = stats.blocks * stats.bsize
    const free = stats.bfree * stats.bsize
    const used = total - free
    const percent = total > 0 ? Math.round((used / total) * 100) : 0
    return { total, free, used, percent }
  } catch (err) {
    console.error('system:disk error', err)
    return null
  }
})

// File/Folder dialogs
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:openFile', async (_event, filters?: Electron.FileFilter[]) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

// Auto updater
ipcMain.handle('updater:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result?.updateInfo) return null
    const currentVersion = app.getVersion()
    const latestVersion = result.updateInfo.version
    if (latestVersion === currentVersion) return null
    return result.updateInfo
  } catch (err) {
    console.error('Auto-updater check error:', err)
    return { error: true, message: String(err) }
  }
})

ipcMain.handle('updater:download', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.handle('updater:install', () => {
  // isSilent=true: setup sihirbazı gösterme, arka planda güncelle
  // isForceRunAfter=true: güncelleme sonrası uygulamayı otomatik başlat
  autoUpdater.quitAndInstall(true, true)
})

// App data (projects, notes, contacts)
ipcMain.handle('appdata:get', (_event, key: string) => {
  return getDataStore().get(key)
})

ipcMain.handle('appdata:set', (_event, key: string, value: unknown) => {
  getDataStore().set(key, value)
  return true
})

// Google OAuth — masaüstü loopback akışı
// Renderer Supabase'den giriş URL'sini üretir, burada loopback sunucusunu açıp
// tarayıcıyı başlatırız; Google geri dönünce 'code'u renderer'a iletiriz.
let authServer: import('http').Server | null = null

ipcMain.handle('auth:google-login', async (_event, url: string) => {
  const http = await import('http')
  if (authServer) {
    authServer.close()
    authServer = null
  }
  authServer = http.createServer((req, res) => {
    try {
      const reqUrl = new URL(req.url || '', 'http://localhost:8788')
      if (reqUrl.pathname !== '/callback') {
        res.writeHead(404)
        res.end()
        return
      }
      const code = reqUrl.searchParams.get('code')
      const errDesc =
        reqUrl.searchParams.get('error_description') || reqUrl.searchParams.get('error')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(
        `<!doctype html><html><head><meta charset="utf-8"><title>Mavro Studio</title></head>` +
          `<body style="font-family:system-ui;background:#0d1117;color:#e8edf5;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">` +
          `<div style="text-align:center"><h2>${code ? 'Giriş başarılı ✓' : 'Giriş başarısız'}</h2>` +
          `<p>${code ? "Bu pencereyi kapatıp Mavro Studio'ya dönebilirsiniz." : (errDesc || 'Bilinmeyen hata')}</p></div>` +
          `</body></html>`
      )
      if (code) {
        mainWindow?.webContents.send('auth:code', code)
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore()
          mainWindow.focus()
        }
      }
      authServer?.close()
      authServer = null
    } catch {
      res.writeHead(500)
      res.end()
    }
  })
  authServer.listen(8788)
  await shell.openExternal(url)
  return true
})

// Set active user session to isolate local config/data
ipcMain.handle('auth:set-session', (_event, userId: string | null) => {
  activeUserId = userId
  return true
})

// File system info (project folders)
ipcMain.handle('fs:pathInfo', async (_event, targetPath: string) => {
  if (!targetPath) return { exists: false, name: '', path: targetPath, isDirectory: false, size: 0, createdAt: null, modifiedAt: null }
  const fs = await import('fs/promises')
  try {
    const stat = await fs.stat(targetPath)
    return {
      exists: true,
      name: basename(targetPath),
      path: targetPath,
      isDirectory: stat.isDirectory(),
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString()
    }
  } catch {
    return { exists: false, name: basename(targetPath || ''), path: targetPath, isDirectory: false, size: 0, createdAt: null, modifiedAt: null }
  }
})

ipcMain.handle('fs:readDir', async (_event, targetPath: string) => {
  if (!targetPath) return null
  const fs = await import('fs/promises')
  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    const items = await Promise.all(
      entries.map(async (e) => {
        const full = join(targetPath, e.name)
        let size = 0
        let modifiedAt: string | null = null
        try {
          const st = await fs.stat(full)
          size = st.size
          modifiedAt = st.mtime.toISOString()
        } catch {
          // ignore unreadable entries
        }
        return { name: e.name, path: full, isDirectory: e.isDirectory(), size, modifiedAt }
      })
    )
    items.sort((a, b) =>
      a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1
    )
    return items
  } catch {
    return null
  }
})

// Shell operations
ipcMain.handle('shell:openPath', async (_event, path: string) => {
  return shell.openPath(path)
})

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  return shell.openExternal(url)
})

// Log management
ipcMain.handle('logs:clear', async () => {
  const logsPath = app.getPath('logs')
  const fs = await import('fs/promises')
  try {
    const files = await fs.readdir(logsPath)
    for (const file of files) {
      await fs.unlink(join(logsPath, file))
    }
    return true
  } catch {
    return false
  }
})

ipcMain.handle('logs:getPath', () => {
  return app.getPath('logs')
})

// ===================== APP LIFECYCLE =====================

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.mavro.studio')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  // Auto-update setup
  if (!is.dev) {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('error', (err) => {
      console.error('AutoUpdater error:', err)
      mainWindow?.webContents.send('updater:error', err?.message || String(err))
    })

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info.version)
      mainWindow?.webContents.send('updater:update-available', info)
    })

    autoUpdater.on('update-not-available', (info) => {
      console.log('No update available. Current version is up to date:', info.version)
    })

    autoUpdater.on('download-progress', (progress) => {
      mainWindow?.webContents.send('updater:download-progress', progress)
    })

    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('updater:update-downloaded')
    })

    // Check for updates after window is ready (with small delay to ensure network is ready)
    if (globalStore.get('autoUpdate')) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Startup update check failed:', err)
        })
      }, 5000)
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
