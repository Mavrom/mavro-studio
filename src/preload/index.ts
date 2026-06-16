import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Settings
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Theme
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme: string) => ipcRenderer.invoke('theme:set', theme),

  // System
  getSystemInfo: () => ipcRenderer.invoke('system:info'),

  // Dialogs
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openFile: (filters?: { name: string; extensions: string[] }[]) =>
    ipcRenderer.invoke('dialog:openFile', filters),

  // Updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on('updater:update-available', (_event, info) => callback(info))
  },
  onDownloadProgress: (callback: (progress: unknown) => void) => {
    ipcRenderer.on('updater:download-progress', (_event, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('updater:update-downloaded', () => callback())
  },

  // Shell
  openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  // Logs
  clearLogs: () => ipcRenderer.invoke('logs:clear'),
  getLogsPath: () => ipcRenderer.invoke('logs:getPath'),

  // App data (projects, notes, contacts)
  getData: (key: string) => ipcRenderer.invoke('appdata:get', key),
  setData: (key: string, value: unknown) => ipcRenderer.invoke('appdata:set', key, value)
}

// Expose API to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
