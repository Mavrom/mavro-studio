// Type declarations for the preload API
declare global {
  interface ElectronAPI {
    minimize: () => void
    maximize: () => void
    close: () => void
    isMaximized: () => Promise<boolean>
    getSetting: (key: string) => Promise<unknown>
    setSetting: (key: string, value: unknown) => Promise<boolean>
    getAllSettings: () => Promise<Record<string, unknown>>
    getTheme: () => Promise<string>
    setTheme: (theme: string) => Promise<boolean>
    getSystemInfo: () => Promise<SystemInfo>
    getDiskUsage: () => Promise<DiskUsage | null>
    openDirectory: () => Promise<string | null>
    openFile: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
    checkForUpdates: () => Promise<unknown>
    downloadUpdate: () => Promise<void>
    installUpdate: () => Promise<void>
    onUpdateAvailable: (callback: (info: unknown) => void) => void
    onDownloadProgress: (callback: (progress: unknown) => void) => void
    onUpdateDownloaded: (callback: () => void) => void
    onUpdateError: (callback: (error: string) => void) => void
    pathInfo: (path: string) => Promise<PathInfo>
    readDir: (path: string) => Promise<DirEntry[] | null>
    openPath: (path: string) => Promise<string>
    openExternal: (url: string) => Promise<void>
    clearLogs: () => Promise<boolean>
    getLogsPath: () => Promise<string>
    getData: (key: string) => Promise<unknown>
    setData: (key: string, value: unknown) => Promise<boolean>
    googleLogin: (url: string) => Promise<boolean>
    onAuthCode: (callback: (code: string) => void) => void
    setUserSession: (userId: string | null) => Promise<boolean>
  }

  interface DiskUsage {
    total: number
    free: number
    used: number
    percent: number
  }

  interface PathInfo {
    exists: boolean
    name: string
    path: string
    isDirectory: boolean
    size: number
    createdAt: string | null
    modifiedAt: string | null
  }

  interface DirEntry {
    name: string
    path: string
    isDirectory: boolean
    size: number
    modifiedAt: string | null
  }

  interface SystemInfo {
    platform: string
    arch: string
    nodeVersion: string
    electronVersion: string
    chromeVersion: string
    v8Version: string
    osVersion: string
    osType: string
    hostname: string
    totalMemory: number
    freeMemory: number
    cpuModel: string
    cpuCores: number
    uptime: number
    homeDir: string
    tempDir: string
    appVersion: string
    appPath: string
    userDataPath: string
    logsPath: string
  }

  interface Window {
    api: ElectronAPI
  }
}

export {}
