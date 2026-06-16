import { useState } from 'react'
import { useAppStore } from '../store'
import { Shield, Key, Eye, EyeOff, ShieldAlert, CheckCircle, Smartphone } from 'lucide-react'

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
          <div className="card flex items-center gap-4">
            <div className="stat-icon green" style={{ width: 64, height: 64 }}>
              <Shield size={32} />
            </div>
            <div>
              <h3 className="card-title">{t('security.securityScore')}</h3>
              <div className="font-mono text-2xl font-bold mt-1 text-success">98 / 100</div>
              <p className="text-sm text-muted mt-1">Tüm kritik güvenlik korumaları devrede.</p>
            </div>
          </div>

          {/* MFA configuration */}
          <div className="card flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="stat-icon blue">
                <Smartphone size={22} />
              </div>
              <div>
                <h3 className="card-title">{t('security.twoFactor')}</h3>
                <p className="card-description">{t('security.twoFactorDesc')}</p>
              </div>
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
        </div>

        {/* Password Manager Vault */}
        <div className="card flex flex-col gap-4">
          <h3 className="card-title flex items-center gap-2">
            <Key size={18} style={{ color: 'var(--accent-primary)' }} />
            {t('security.passwords')}
          </h3>

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
        <div className="card flex flex-col gap-4">
          <h3 className="card-title flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: 'var(--accent-warning)' }} />
            {t('security.logs')}
          </h3>

          <div className="flex flex-col gap-2">
            <div className="code-block flex justify-between items-center">
              <span>Masaüstü uygulaması yetkilendirildi (Win64)</span>
              <span className="text-sm font-mono text-muted">16.06.2026 03:20</span>
            </div>
            <div className="code-block flex justify-between items-center">
              <span>Şifre deposu anahtarı başarıyla doğrulandı</span>
              <span className="text-sm font-mono text-muted">16.06.2026 03:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
