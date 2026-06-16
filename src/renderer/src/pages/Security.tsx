import { useState } from 'react'
import { useAppStore } from '../store'
import { Shield, Key, Eye, EyeOff, ShieldAlert, CheckCircle, Smartphone, Lock } from 'lucide-react'

interface Credential {
  id: string
  service: string
  username: string
  pass: string
}

export default function Security() {
  const { t, addToast } = useAppStore()
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({})
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [autoLockEnabled, setAutoLockEnabled] = useState(true)
  const [encryptEnabled, setEncryptEnabled] = useState(true)
  const [credentials, setCredentials] = useState<Credential[]>([
    { id: '1', service: 'GitHub', username: 'mavro-dev', pass: 'ghp_71289AHSJas9120' },
    { id: '2', service: 'AWS Console', username: 'admin@mavro.io', pass: 'SuperSecretAWS2026!' }
  ])

  const togglePassVisibility = (id: string) => {
    setShowPassMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleMfaToggle = () => {
    const nextState = !mfaEnabled
    setMfaEnabled(nextState)
    addToast({
      message: nextState ? 'MFA başarıyla etkinleştirildi' : 'MFA devre dışı bırakıldı',
      type: nextState ? 'success' : 'warning'
    })
  }

  const handleAutoLockToggle = () => {
    const nextState = !autoLockEnabled
    setAutoLockEnabled(nextState)
    addToast({
      message: nextState ? 'Otomatik kilit etkinleştirildi' : 'Otomatik kilit devre dışı',
      type: nextState ? 'success' : 'warning'
    })
  }

  const handleEncryptToggle = () => {
    const nextState = !encryptEnabled
    setEncryptEnabled(nextState)
    addToast({
      message: nextState ? 'Şifreleme etkinleştirildi' : 'Şifreleme devre dışı',
      type: nextState ? 'success' : 'warning'
    })
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('security.title')}</h1>
          <p className="page-subtitle">{t('security.subtitle')}</p>
        </div>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Overview cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Security Score */}
          <div className="card card-glow flex items-center gap-4 animate-fade-in-up stagger-1">
            <div className="stat-icon green" style={{ width: 64, height: 64 }}>
              <Shield size={32} />
            </div>
            <div>
              <h3 className="card-title">{t('security.securityScore')}</h3>
              <div style={{ fontSize: 'var(--font-2xl)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-success)', marginTop: 'var(--space-1)' }}>
                98 / 100
              </div>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle size={13} style={{ color: 'var(--accent-success)' }} />
                <p className="text-sm text-muted">Tüm kritik güvenlik korumaları devrede.</p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="card animate-fade-in-up stagger-2">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Lock size={16} style={{ color: 'var(--accent-primary)' }} />
                {t('security.twoFactor')}
              </h3>
            </div>

            <div className="setting-row">
              <div className="setting-row-info">
                <div className="flex items-center gap-2">
                  <Smartphone size={15} style={{ color: 'var(--accent-cyan)' }} />
                  <span className="setting-row-label">{t('security.twoFactor')}</span>
                </div>
                <span className="text-sm text-muted">{t('security.twoFactorDesc')}</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={mfaEnabled}
                  onChange={handleMfaToggle}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-row-info">
                <div className="flex items-center gap-2">
                  <Lock size={15} style={{ color: 'var(--accent-purple)' }} />
                  <span className="setting-row-label">Auto-Lock</span>
                </div>
                <span className="text-sm text-muted">Hareketsizlik sonrası kilitle</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={autoLockEnabled}
                  onChange={handleAutoLockToggle}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-row-info">
                <div className="flex items-center gap-2">
                  <Shield size={15} style={{ color: 'var(--accent-success)' }} />
                  <span className="setting-row-label">Vault Encryption</span>
                </div>
                <span className="text-sm text-muted">AES-256 şifreleme ile depolama</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  className="toggle-input"
                  checked={encryptEnabled}
                  onChange={handleEncryptToggle}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Password Manager Vault */}
        <div className="card flex flex-col gap-4 animate-fade-in-up stagger-3">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <Key size={18} style={{ color: 'var(--accent-primary)' }} />
              {t('security.passwords')}
            </h3>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Servis / Platform</th>
                  <th>Kullanıcı Adı</th>
                  <th>Geliştirici Şifresi / Token</th>
                  <th style={{ width: '80px' }}></th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr key={cred.id}>
                    <td className="font-bold">{cred.service}</td>
                    <td className="font-mono">{cred.username}</td>
                    <td className="font-mono">
                      {showPassMap[cred.id] ? cred.pass : '••••••••••••••••'}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => togglePassVisibility(cred.id)}
                      >
                        {showPassMap[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Logs */}
        <div className="card flex flex-col gap-4 animate-fade-in-up stagger-4">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <ShieldAlert size={18} style={{ color: 'var(--accent-warning)' }} />
              {t('security.logs')}
            </h3>
          </div>

          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot" style={{ background: 'var(--accent-success)' }} />
              <div>
                <div className="activity-text">Masaüstü uygulaması yetkilendirildi (Win64)</div>
                <div className="activity-time font-mono">16.06.2026 03:20</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-dot" style={{ background: 'var(--accent-primary)' }} />
              <div>
                <div className="activity-text">Şifre deposu anahtarı başarıyla doğrulandı</div>
                <div className="activity-time font-mono">16.06.2026 03:00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
