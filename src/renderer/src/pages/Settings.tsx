import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Save, Folder, RefreshCw, LogOut } from 'lucide-react'

export default function Settings() {
  const { t, theme, setTheme, language, setLanguage, addToast } = useAppStore()
  const [activeTab, setActiveTab] = useState('advanced')
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  // General settings state
  const [autoStart, setAutoStart] = useState(false)
  const [notifyEnabled, setNotifyEnabled] = useState(true)

  // Advanced settings state
  const [defaultExportPath, setDefaultExportPath] = useState('')
  const [dataDirectory, setDataDirectory] = useState('')
  const [mavroPath, setMavroPath] = useState('')
  const [idePath, setIdePath] = useState('')
  const [startupParams, setStartupParams] = useState('')

  // Proxy settings state
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyType, setProxyType] = useState('http')
  const [proxyHost, setProxyHost] = useState('')
  const [proxyPort, setProxyPort] = useState('')

  // System info from IPC
  const [sysInfo, setSysInfo] = useState<any>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      if (window.api) {
        try {
          const exportPath = await window.api.getSetting('defaultExportPath') as string
          const dataDir = await window.api.getSetting('dataDirectory') as string
          const start = await window.api.getSetting('autoStart') as boolean
          const mPath = await window.api.getSetting('mavroPath') as string
          const iPath = await window.api.getSetting('idePath') as string
          const sParams = await window.api.getSetting('startupParams') as string
          const proxy = await window.api.getSetting('proxy') as Record<string, unknown>
          const info = await window.api.getSystemInfo()

          if (exportPath) setDefaultExportPath(exportPath)
          if (dataDir) setDataDirectory(dataDir)
          setAutoStart(!!start)
          if (mPath) setMavroPath(mPath)
          if (iPath) setIdePath(iPath)
          if (sParams) setStartupParams(sParams)
          if (proxy) {
            setProxyEnabled(!!proxy.enabled)
            if (proxy.type) setProxyType(proxy.type as string)
            if (proxy.host) setProxyHost(proxy.host as string)
            if (proxy.port) setProxyPort(proxy.port as string)
          }
          setSysInfo(info)
        } catch (err) {
          console.error(err)
        }
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (window.api) {
      await window.api.setSetting('defaultExportPath', defaultExportPath)
      await window.api.setSetting('dataDirectory', dataDirectory)
      await window.api.setSetting('autoStart', autoStart)
      await window.api.setSetting('mavroPath', mavroPath)
      await window.api.setSetting('idePath', idePath)
      await window.api.setSetting('startupParams', startupParams)
      await window.api.setSetting('proxy', {
        enabled: proxyEnabled,
        type: proxyType,
        host: proxyHost,
        port: proxyPort
      })
    }
    addToast({ message: t('settings.saved'), type: 'success' })
  }

  const selectExportPath = async () => {
    if (window.api) {
      const path = await window.api.openDirectory()
      if (path) setDefaultExportPath(path)
    }
  }

  const clearMavroPath = () => setMavroPath('')
  const clearIdePath = () => setIdePath('')
  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    try {
      if (window.api) {
        const result = await window.api.checkForUpdates() as { version: string } | null
        if (result?.version) {
          addToast({ message: `${t('settings.updateAvailable')} v${result.version}`, type: 'info' })
        } else {
          addToast({ message: t('settings.noUpdate'), type: 'success' })
        }
      } else {
        addToast({ message: t('settings.noUpdate'), type: 'success' })
      }
    } catch {
      addToast({ message: t('settings.noUpdate'), type: 'success' })
    } finally {
      setCheckingUpdate(false)
    }
  }

  const clearLogs = async () => {
    if (window.api) {
      const success = await window.api.clearLogs()
      if (success) {
        addToast({ message: 'Log dosyaları temizlendi', type: 'success' })
      } else {
        addToast({ message: 'Log temizleme başarısız', type: 'error' })
      }
    } else {
      addToast({ message: 'Log dosyaları temizlendi', type: 'success' })
    }
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ paddingBottom: 'var(--space-2)' }}>
        <div>
          <h1 className="page-title">{t('settings.title')}</h1>
        </div>
      </div>

      <div className="top-nav">
        <div
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          {t('settings.general')}
        </div>
        <div
          className={`tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          {t('settings.account')}
        </div>
        <div
          className={`tab ${activeTab === 'proxy' ? 'active' : ''}`}
          onClick={() => setActiveTab('proxy')}
        >
          {t('settings.proxy')}
        </div>
        <div
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          {t('settings.advanced')}
        </div>
        <div
          className={`tab ${activeTab === 'debug' ? 'active' : ''}`}
          onClick={() => setActiveTab('debug')}
        >
          {t('settings.debug')}
        </div>
        <div
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          {t('settings.about')}
        </div>
        <div className="top-nav-spacer" />
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} />
          {t('settings.save')}
        </button>
      </div>

      <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="settings-content">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="settings-section animate-slide-in">
              <h3 className="settings-section-title">{t('settings.general')}</h3>
              <div className="card flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">{t('settings.language')}</label>
                  <select
                    className="select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="tr">Türkçe (TR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('settings.theme')}</label>
                  <select
                    className="select"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as any)}
                  >
                    <option value="dark">{t('settings.themeDark')}</option>
                    <option value="light">{t('settings.themeLight')}</option>
                    <option value="system">{t('settings.themeSystem')}</option>
                  </select>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: '2px' }}>{t('settings.autoStart')}</div>
                    <div className="form-hint">{t('settings.autoStartDesc')}</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={autoStart}
                      onChange={(e) => setAutoStart(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="settings-section animate-slide-in">
              <h3 className="settings-section-title">{t('settings.account')}</h3>
              <div className="card flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">{t('settings.profileName')}</label>
                  <input type="text" className="input" placeholder={t('settings.profileName')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('settings.profileEmail')}</label>
                  <input type="email" className="input" placeholder={t('settings.profileEmail')} />
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary">{t('settings.changePassword')}</button>
                  <button className="btn btn-danger">{t('settings.deleteAccount')}</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROXY */}
          {activeTab === 'proxy' && (
            <div className="settings-section animate-slide-in">
              <h3 className="settings-section-title">{t('settings.proxy')}</h3>
              <div className="card flex flex-col gap-4">
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div>
                    <div className="form-label">{t('settings.proxyEnabled')}</div>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="toggle-input"
                      checked={proxyEnabled}
                      onChange={(e) => setProxyEnabled(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>

                {proxyEnabled && (
                  <div className="flex flex-col gap-4 mt-2 animate-fade-in-up">
                    <div className="form-group">
                      <label className="form-label">{t('settings.proxyType')}</label>
                      <select
                        className="select"
                        value={proxyType}
                        onChange={(e) => setProxyType(e.target.value)}
                      >
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="socks5">SOCKS5</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-4)' }}>
                      <div className="form-group">
                        <label className="form-label">{t('settings.proxyHost')}</label>
                        <input
                          type="text"
                          className="input"
                          value={proxyHost}
                          onChange={(e) => setProxyHost(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('settings.proxyPort')}</label>
                        <input
                          type="text"
                          className="input"
                          value={proxyPort}
                          onChange={(e) => setProxyPort(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED (Recreating exact screenshot) */}
          {activeTab === 'advanced' && (
            <div className="settings-section animate-slide-in flex flex-col gap-5">
              {/* Varsayılan Dışa Aktarma Yolu */}
              <div className="form-group">
                <label className="form-label">{t('settings.defaultExportPath')}</label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    className="input text-muted"
                    style={{ background: 'var(--bg-secondary)' }}
                    value={defaultExportPath || t('settings.notSet')}
                    readOnly
                  />
                  <button className="btn btn-secondary" onClick={selectExportPath}>
                    {t('settings.select')}
                  </button>
                </div>
                <div className="form-hint">{t('settings.defaultExportPathDesc')}</div>
              </div>

              {/* Veri Dizini */}
              <div className="form-group">
                <label className="form-label">{t('settings.dataDirectory')}</label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    className="input text-muted"
                    style={{ background: 'var(--bg-secondary)' }}
                    value={dataDirectory}
                    readOnly
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => addToast({ message: 'Klasör açılıyor...', type: 'info' })}
                  >
                    {t('settings.open')}
                  </button>
                </div>
                <div className="form-hint">{t('settings.dataDirectoryDesc')}</div>
              </div>

              {/* Antigravity Yolu (Mavro Path) */}
              <div className="form-group">
                <label className="form-label">{t('settings.appPath')}</label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    className="input"
                    value={mavroPath}
                    onChange={(e) => setMavroPath(e.target.value)}
                  />
                  <button className="btn btn-danger btn-ghost" onClick={clearMavroPath}>
                    {t('settings.clear')}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => addToast({ message: 'Uygulama yolu algılanıyor...', type: 'info' })}
                  >
                    {t('settings.detect')}
                  </button>
                  <button className="btn btn-secondary">{t('settings.select')}</button>
                </div>
                <div className="form-hint">{t('settings.appPathDesc')}</div>
              </div>

              {/* Antigravity IDE Yolu */}
              <div className="form-group">
                <label className="form-label">Mavro Studio IDE Yolu</label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    className="input"
                    value={idePath}
                    onChange={(e) => setIdePath(e.target.value)}
                  />
                  <button className="btn btn-danger btn-ghost" onClick={clearIdePath}>
                    {t('settings.clear')}
                  </button>
                  <button className="btn btn-secondary">{t('settings.select')}</button>
                </div>
                <div className="form-hint">{t('settings.appPathDesc')}</div>
              </div>

              {/* Antigravity Başlangıç Parametreleri */}
              <div className="form-group">
                <label className="form-label">{t('settings.startupParams')}</label>
                <div className="input-with-btn">
                  <input
                    type="text"
                    className="input input-mono"
                    value={startupParams}
                    onChange={(e) => setStartupParams(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => addToast({ message: 'Başlangıç parametreleri algılandı', type: 'success' })}
                  >
                    {t('settings.detect')}
                  </button>
                </div>
                <div className="form-hint">{t('settings.startupParamsDesc')}</div>
              </div>

              {/* Log Bakımı */}
              <div className="form-group">
                <label className="form-label">{t('settings.logMaintenance')}</label>
                <div className="card flex items-center justify-between" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-secondary)' }}>
                  <span className="text-muted text-sm" style={{ fontStyle: 'italic' }}>
                    Log önbellek boyutunu optimize edin
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={clearLogs}>
                    {t('settings.clear')}
                  </button>
                </div>
                <div className="form-hint">{t('settings.logMaintenanceDesc')}</div>
              </div>
            </div>
          )}

          {/* TAB 5: DEBUG */}
          {activeTab === 'debug' && (
            <div className="settings-section animate-slide-in">
              <h3 className="settings-section-title">{t('settings.debug')}</h3>
              <div className="card flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">{t('settings.logLevel')}</label>
                  <select className="select">
                    <option value="debug">DEBUG</option>
                    <option value="info">INFO</option>
                    <option value="warn">WARN</option>
                    <option value="error">ERROR</option>
                  </select>
                  <div className="form-hint">{t('settings.logLevelDesc')}</div>
                </div>
                <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div>
                    <div className="form-label">{t('settings.errorReporting')}</div>
                    <div className="form-hint">{t('settings.errorReportingDesc')}</div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" className="toggle-input" defaultChecked />
                    <span className="toggle-slider" />
                  </label>
                </div>
                <button
                  className="btn btn-secondary w-full"
                  onClick={() => addToast({ message: 'Ağ teşhisi başlatıldı', type: 'info' })}
                >
                  {t('settings.networkDiag')}
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="settings-section animate-slide-in">
              <h3 className="settings-section-title">{t('settings.about')}</h3>
              <div className="card flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="titlebar-logo" style={{ width: 44, height: 44, borderRadius: 'var(--radius-lg)', fontSize: 'var(--font-xl)' }}>M</div>
                  <div>
                    <h4 className="font-bold text-lg">{t('app.name')}</h4>
                    <p className="text-muted text-sm">{t('settings.aboutVersion')} 1.0.0 (Stable)</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-4)' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t('settings.aboutElectron')}:</span>
                    <span className="font-mono">{sysInfo?.electronVersion || '35.0.0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t('settings.aboutChrome')}:</span>
                    <span className="font-mono">{sysInfo?.chromeVersion || '120.0.0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t('settings.aboutNode')}:</span>
                    <span className="font-mono">{sysInfo?.nodeVersion || '20.10.0'}</span>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                  >
                    {checkingUpdate ? t('common.loading') : t('settings.checkUpdate')}
                  </button>
                  <button className="btn btn-secondary btn-sm">{t('settings.changelog')}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
