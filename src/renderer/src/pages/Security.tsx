import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Shield, Key, Eye, EyeOff, ShieldAlert, Smartphone, Plus, Trash2, X } from 'lucide-react'
import { Password as PwIcon, Copy as CopyIcon, Refresh } from '../components/icons/iconly'

interface Credential {
  id: string
  service: string
  username: string
  pass: string
  createdAt: string
}

function generatePassword(len = 16): string {
  const set = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()-_=+'
  const arr = new Uint32Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => set[n % set.length]).join('')
}

function passStrength(pass: string): number {
  let s = 0
  if (pass.length >= 8) s++
  if (pass.length >= 14) s++
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) s++
  if (/[0-9]/.test(pass)) s++
  if (/[^A-Za-z0-9]/.test(pass)) s++
  return s // 0..5
}

export default function Security() {
  const { t, addToast } = useAppStore()
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({})
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loaded, setLoaded] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [fService, setFService] = useState('')
  const [fUser, setFUser] = useState('')
  const [fPass, setFPass] = useState('')

  // Yükle (yerel — hassas veri cihazda kalır)
  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const creds = (await window.api.getData('credentials')) as Credential[] | undefined
        const mfa = (await window.api.getSetting('mfaEnabled')) as boolean | undefined
        if (Array.isArray(creds)) setCredentials(creds)
        if (typeof mfa === 'boolean') setMfaEnabled(mfa)
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded && window.api) window.api.setData('credentials', credentials)
  }, [credentials, loaded])

  const togglePassVisibility = (id: string) =>
    setShowPassMap((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleMfaToggle = () => {
    const next = !mfaEnabled
    setMfaEnabled(next)
    if (window.api) window.api.setSetting('mfaEnabled', next)
    addToast({ message: next ? 'MFA etkinleştirildi' : 'MFA devre dışı bırakıldı', type: next ? 'success' : 'warning' })
  }

  const addCredential = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fService.trim()) { addToast({ message: t('security.serviceRequired'), type: 'error' }); return }
    const cred: Credential = {
      id: crypto.randomUUID(),
      service: fService.trim(),
      username: fUser.trim(),
      pass: fPass,
      createdAt: new Date().toISOString()
    }
    setCredentials(prev => [cred, ...prev])
    setFService(''); setFUser(''); setFPass(''); setShowForm(false)
    addToast({ message: t('security.credAdded'), type: 'success' })
  }

  const deleteCredential = (id: string) => {
    setCredentials(prev => prev.filter(c => c.id !== id))
    addToast({ message: t('security.credDeleted'), type: 'warning' })
  }

  const copyPass = (pass: string) => {
    if (!pass) return
    navigator.clipboard.writeText(pass).then(
      () => addToast({ message: t('tools.copied'), type: 'success' }),
      () => addToast({ message: t('tools.copyFailed'), type: 'error' })
    )
  }

  // Gerçek verilerden güvenlik puanı
  const score = (() => {
    let s = 40
    if (mfaEnabled) s += 25
    if (credentials.length > 0) {
      const avg = credentials.reduce((a, c) => a + passStrength(c.pass), 0) / credentials.length
      s += Math.round((avg / 5) * 35)
    } else {
      s += 20
    }
    return Math.min(100, s)
  })()
  const scoreColor = score >= 80 ? 'var(--accent-success)' : score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('security.title')}</h1>
          <p className="page-subtitle">{t('security.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={16} /> {t('security.addCredential')}
        </button>
      </div>

      <div className="page-content flex flex-col gap-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          {/* Security Score */}
          <div className="card flex items-center gap-4">
            <div className="stat-icon" style={{ width: 64, height: 64, background: `${scoreColor}22`, color: scoreColor }}>
              <Shield size={32} />
            </div>
            <div>
              <h3 className="card-title">{t('security.securityScore')}</h3>
              <div className="font-mono text-2xl font-bold mt-1" style={{ color: scoreColor }}>{score} / 100</div>
              <p className="text-sm text-muted mt-1">
                {mfaEnabled ? t('security.mfaOnHint') : t('security.mfaOffHint')}
              </p>
            </div>
          </div>

          {/* MFA configuration */}
          <div className="card flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="stat-icon blue"><Smartphone size={22} /></div>
              <div>
                <h3 className="card-title">{t('security.twoFactor')}</h3>
                <p className="card-description">{t('security.twoFactorDesc')}</p>
              </div>
            </div>
            <label className="toggle">
              <input type="checkbox" className="toggle-input" checked={mfaEnabled} onChange={handleMfaToggle} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <form className="card flex flex-col gap-4 animate-fade-in-up" onSubmit={addCredential}>
            <div className="flex justify-between items-center">
              <h3 className="card-title">{t('security.addCredential')}</h3>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">{t('security.service')} *</label>
                <input type="text" className="input" value={fService} onChange={e => setFService(e.target.value)} placeholder="GitHub, Google..." autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">{t('security.username')}</label>
                <input type="text" className="input" value={fUser} onChange={e => setFUser(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t('security.password')}</label>
                <div className="input-with-btn">
                  <input type="text" className="input input-mono" value={fPass} onChange={e => setFPass(e.target.value)} />
                  <button type="button" className="btn btn-secondary" onClick={() => setFPass(generatePassword())} title={t('security.generate')}>
                    <Refresh size={14} /> {t('security.generate')}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('common.save')}</button>
            </div>
          </form>
        )}

        {/* Password Manager Vault */}
        <div className="card flex flex-col gap-4">
          <h3 className="card-title flex items-center gap-2">
            <Key size={18} style={{ color: 'var(--accent-primary)' }} />
            {t('security.passwords')}
            <span className="notes-count">{credentials.length}</span>
          </h3>

          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <PwIcon size={36} />
              <p className="card-description" style={{ marginTop: 8 }}>{t('security.noCredentials')}</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>{t('security.service')}</th>
                    <th>{t('security.username')}</th>
                    <th>{t('security.password')}</th>
                    <th style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred) => (
                    <tr key={cred.id}>
                      <td className="font-bold">{cred.service}</td>
                      <td className="font-mono">{cred.username || '-'}</td>
                      <td className="font-mono">{showPassMap[cred.id] ? cred.pass : '••••••••••••'}</td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => togglePassVisibility(cred.id)} title={t('security.reveal')}>
                            {showPassMap[cred.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => copyPass(cred.pass)} title={t('security.copyPassword')}>
                            <CopyIcon size={14} />
                          </button>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteCredential(cred.id)} title={t('common.delete')} style={{ color: 'var(--accent-danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Logs */}
        <div className="card flex flex-col gap-4">
          <h3 className="card-title flex items-center gap-2">
            <ShieldAlert size={18} style={{ color: 'var(--accent-warning)' }} />
            {t('security.logs')}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('security.localOnly')}</p>
        </div>
      </div>
    </div>
  )
}
