import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import {
  SlidersHorizontal,
  User,
  Network,
  FolderOpen,
  Bug,
  Info,
  Save,
  RefreshCw,
  Trash2,
  Download
} from 'lucide-react'

type Section = 'general' | 'paths' | 'network' | 'account' | 'debug' | 'about'

const NAV: { id: Section; icon: React.ReactNode; labelKey: string }[] = [
  { id: 'general', icon: <SlidersHorizontal size={17} />, labelKey: 'settings.general' },
  { id: 'paths',   icon: <FolderOpen size={17} />,        labelKey: 'settings.paths' },
  { id: 'network', icon: <Network size={17} />,           labelKey: 'settings.proxy' },
  { id: 'account', icon: <User size={17} />,              labelKey: 'settings.account' },
  { id: 'debug',   icon: <Bug size={17} />,               labelKey: 'settings.debug' },
  { id: 'about',   icon: <Info size={17} />,              labelKey: 'settings.about' },
]

function SCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}`, paddingLeft: 'calc(var(--space-6) - 3px)' }}>
      <div className="settings-card-label" style={{ color }}>{title}</div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { t, theme, setTheme, language, setLanguage, addToast } = useAppStore()
  const [section, setSection] = useState<Section>('general')
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  const [autoStart, setAutoStart] = useState(false)
  const [defaultExportPath, setDefaultExportPath] = useState('')
  const [dataDirectory, setDataDirectory] = useState('')
  const [mavroPath, setMavroPath] = useState('')
  const [idePath, setIdePath] = useState('')
  const [startupParams, setStartupParams] = useState('')
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyType, setProxyType] = useState('http')
  const [proxyHost, setProxyHost] = useState('')
  const [proxyPort, setProxyPort] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [sysInfo, setSysInfo] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    if (!window.api) return
    Promise.all([
      window.api.getSetting('defaultExportPath'),
      window.api.getSetting('dataDirectory'),
      window.api.getSetting('autoStart'),
      window.api.getSetting('mavroPath'),
      window.api.getSetting('idePath'),
      window.api.getSetting('startupParams'),
      window.api.getSetting('proxy'),
      window.api.getSystemInfo(),
      window.api.getSetting('profileName'),
      window.api.getSetting('profileEmail'),
    ]).then(([exportPath, dataDir, start, mPath, iPath, sParams, proxy, info, pName, pEmail]) => {
      if (exportPath) setDefaultExportPath(exportPath as string)
      if (dataDir) setDataDirectory(dataDir as string)
      setAutoStart(!!start)
      if (mPath) setMavroPath(mPath as string)
      if (iPath) setIdePath(iPath as string)
      if (sParams) setStartupParams(sParams as string)
      if (proxy) {
        const p = proxy as Record<string, unknown>
        setProxyEnabled(!!p.enabled)
        if (p.type) setProxyType(p.type as string)
        if (p.host) setProxyHost(p.host as string)
        if (p.port) setProxyPort(p.port as string)
      }
      setSysInfo(info as unknown as Record<string, string>)
      if (pName) setProfileName(pName as string)
      if (pEmail) setProfileEmail(pEmail as string)
    }).catch(console.error)
  }, [])

  const handleSave = async () => {
    if (window.api) {
      await Promise.all([
        window.api.setSetting('defaultExportPath', defaultExportPath),
        window.api.setSetting('dataDirectory', dataDirectory),
        window.api.setSetting('autoStart', autoStart),
        window.api.setSetting('mavroPath', mavroPath),
        window.api.setSetting('idePath', idePath),
        window.api.setSetting('startupParams', startupParams),
        window.api.setSetting('proxy', { enabled: proxyEnabled, type: proxyType, host: proxyHost, port: proxyPort }),
        window.api.setSetting('profileName', profileName),
        window.api.setSetting('profileEmail', profileEmail),
      ])
    }
    addToast({ message: t('settings.saved'), type: 'success' })
  }

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

  const pickDir = async (setter: (v: string) => void) => {
    if (window.api) {
      const path = await window.api.openDirectory()
      if (path) setter(path)
    }
  }

  const clearLogs = async () => {
    if (window.api) {
      const ok = await window.api.clearLogs()
      addToast({ message: ok ? 'Log dosyaları temizlendi' : 'Log temizleme başarısız', type: ok ? 'success' : 'error' })
    }
  }

  const themeOptions = [
    { value: 'dark' as const,   label: t('settings.themeDark') },
    { value: 'light' as const,  label: t('settings.themeLight') },
    { value: 'system' as const, label: t('settings.themeSystem') },
  ]

  const languageOptions = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
  ]

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">{t('settings.title')}</h1>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={15} />
          {t('settings.save')}
        </button>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 'var(--space-5)', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Left nav */}
        <div className="card" style={{ padding: 0 }}>
          <nav className="settings-nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`settings-nav-item${section === item.id ? ' active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                <span className="settings-nav-icon">{item.icon}</span>
                {t(item.labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className="animate-fade-in">

          {/* ── GENERAL ── */}
          {section === 'general' && (
            <>
              <SCard title={t('settings.language')} color="var(--accent-primary)">
                <div className="segmented full">
                  {languageOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`segmented-item${language === opt.value ? ' active accent' : ''}`}
                      onClick={() => setLanguage(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SCard>

              <SCard title={t('settings.theme')} color="var(--accent-purple)">
                <div className="segmented full">
                  {themeOptions.map(opt => (
                    <button
                      key={opt.value}
                      className={`segmented-item${theme === opt.value ? ' active' : ''}`}
                      onClick={() => setTheme(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </SCard>

              <SCard title={t('settings.autoStart')} color="var(--accent-success)">
                <div className="setting-row">
                  <div className="setting-row-info">
                    <span className="setting-row-label">{t('settings.autoStart')}</span>
                    <span className="form-hint">{t('settings.autoStartDesc')}</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" className="toggle-input" checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </SCard>
            </>
          )}

          {/* ── PATHS ── */}
          {section === 'paths' && (
            <>
              <SCard title={t('settings.defaultExportPath')} color="var(--accent-orange)">
                <div className="input-with-btn">
                  <input
                    type="text" className="input" readOnly
                    value={defaultExportPath || t('settings.notSet')}
                    style={{ color: defaultExportPath ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  />
                  <button className="btn btn-secondary" onClick={() => pickDir(setDefaultExportPath)}>
                    {t('settings.select')}
                  </button>
                </div>
                <div className="form-hint">{t('settings.defaultExportPathDesc')}</div>
              </SCard>

              <SCard title={t('settings.dataDirectory')} color="var(--accent-orange)">
                <div className="input-with-btn">
                  <input
                    type="text" className="input" readOnly
                    value={dataDirectory || t('settings.notSet')}
                    style={{ color: dataDirectory ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  />
                  <button className="btn btn-secondary">{t('settings.open')}</button>
                </div>
                <div className="form-hint">{t('settings.dataDirectoryDesc')}</div>
              </SCard>

              <SCard title={t('settings.appPath')} color="var(--accent-cyan)">
                <div className="input-with-btn">
                  <input type="text" className="input" value={mavroPath} onChange={e => setMavroPath(e.target.value)} placeholder="Otomatik algılanacak..." />
                  <button className="btn btn-secondary btn-ghost btn-sm" onClick={() => setMavroPath('')}>{t('settings.clear')}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => pickDir(setMavroPath)}>{t('settings.select')}</button>
                </div>
                <div className="form-hint">{t('settings.appPathDesc')}</div>
              </SCard>

              <SCard title="IDE Yolu" color="var(--accent-cyan)">
                <div className="input-with-btn">
                  <input type="text" className="input" value={idePath} onChange={e => setIdePath(e.target.value)} placeholder="Otomatik algılanacak..." />
                  <button className="btn btn-secondary btn-ghost btn-sm" onClick={() => setIdePath('')}>{t('settings.clear')}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => pickDir(setIdePath)}>{t('settings.select')}</button>
                </div>
                <div className="form-hint">{t('settings.appPathDesc')}</div>
              </SCard>

              <SCard title={t('settings.startupParams')} color="var(--accent-cyan)">
                <input
                  type="text" className="input input-mono"
                  value={startupParams}
                  onChange={e => setStartupParams(e.target.value)}
                  placeholder="--flag=value ..."
                />
                <div className="form-hint">{t('settings.startupParamsDesc')}</div>
              </SCard>
            </>
          )}

          {/* ── NETWORK ── */}
          {section === 'network' && (
            <SCard title={t('settings.proxy')} color="var(--accent-primary)">
              <div className="setting-row">
                <div className="setting-row-info">
                  <span className="setting-row-label">{t('settings.proxyEnabled')}</span>
                </div>
                <label className="toggle">
                  <input type="checkbox" className="toggle-input" checked={proxyEnabled} onChange={e => setProxyEnabled(e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>
              {proxyEnabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }} className="animate-fade-in">
                  <div className="form-group">
                    <label className="form-label">{t('settings.proxyType')}</label>
                    <select className="select" value={proxyType} onChange={e => setProxyType(e.target.value)}>
                      <option value="http">HTTP</option>
                      <option value="https">HTTPS</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-group">
                      <label className="form-label">{t('settings.proxyHost')}</label>
                      <input type="text" className="input" value={proxyHost} onChange={e => setProxyHost(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('settings.proxyPort')}</label>
                      <input type="text" className="input" value={proxyPort} onChange={e => setProxyPort(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </SCard>
          )}

          {/* ── ACCOUNT ── */}
          {section === 'account' && (
            <SCard title={t('settings.account')} color="var(--accent-purple)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">{t('settings.profileName')}</label>
                  <input
                    type="text" className="input"
                    placeholder={t('settings.profileName')}
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('settings.profileEmail')}</label>
                  <input
                    type="email" className="input"
                    placeholder={t('settings.profileEmail')}
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, paddingTop: 'var(--space-2)' }}>
                  <button className="btn btn-secondary">{t('settings.changePassword')}</button>
                  <button className="btn btn-danger">{t('settings.deleteAccount')}</button>
                </div>
              </div>
            </SCard>
          )}

          {/* ── DEBUG ── */}
          {section === 'debug' && (
            <>
              <SCard title={t('settings.debug')} color="var(--accent-warning)">
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">{t('settings.logLevel')}</label>
                  <select className="select">
                    <option value="debug">DEBUG</option>
                    <option value="info">INFO</option>
                    <option value="warn">WARN</option>
                    <option value="error">ERROR</option>
                  </select>
                  <div className="form-hint">{t('settings.logLevelDesc')}</div>
                </div>
                <div className="setting-row">
                  <div className="setting-row-info">
                    <span className="setting-row-label">{t('settings.errorReporting')}</span>
                    <span className="form-hint">{t('settings.errorReportingDesc')}</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" className="toggle-input" defaultChecked />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </SCard>

              <SCard title={t('settings.logMaintenance')} color="var(--accent-danger)">
                <div className="setting-row">
                  <div className="setting-row-info">
                    <span className="setting-row-label">{t('settings.logMaintenance')}</span>
                    <span className="form-hint">{t('settings.logMaintenanceDesc')}</span>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={clearLogs}>
                    <Trash2 size={13} />
                    {t('settings.clear')}
                  </button>
                </div>
              </SCard>

              <SCard title={t('settings.networkDiag')} color="var(--accent-primary)">
                <button className="btn btn-secondary w-full" onClick={() => addToast({ message: 'Ağ teşhisi başlatıldı', type: 'info' })}>
                  {t('settings.networkDiag')}
                </button>
              </SCard>
            </>
          )}

          {/* ── ABOUT ── */}
          {section === 'about' && (
            <SCard title={t('settings.about')} color="var(--accent-primary)">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'var(--accent-primary-glow)',
                    border: '1px solid rgba(79,143,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--font-2xl)', fontWeight: 800,
                    color: 'var(--accent-primary)',
                  }}>M</div>
                  <div>
                    <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{t('app.name')}</div>
                    <div className="text-muted" style={{ fontSize: 'var(--font-sm)', marginTop: 3 }}>
                      {t('settings.aboutVersion')} {sysInfo?.appVersion || '1.0.1'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-primary)' }}>
                  {([
                    [t('settings.aboutElectron'), sysInfo?.electronVersion || '36.0.0'],
                    [t('settings.aboutChrome'),   sysInfo?.chromeVersion   || '120.0.0'],
                    [t('settings.aboutNode'),     sysInfo?.nodeVersion     || '20.10.0'],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                      <span className="text-muted">{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-xs)', color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleCheckUpdate} disabled={checkingUpdate}>
                    {checkingUpdate ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                    {checkingUpdate ? t('common.loading') : t('settings.checkUpdate')}
                  </button>
                  <button className="btn btn-secondary">{t('settings.changelog')}</button>
                </div>
              </div>
            </SCard>
          )}

        </div>
      </div>
    </div>
  )
}
