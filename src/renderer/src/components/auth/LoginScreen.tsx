import { useState } from 'react'
import { useAppStore } from '../../store'
import { supabase, LOOPBACK_REDIRECT } from '../../lib/supabase'
import { ShieldCheck, Cloud, Loader2 } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

export default function LoginScreen() {
  const { t } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: LOOPBACK_REDIRECT, skipBrowserRedirect: true }
      })
      if (error || !data?.url) {
        setError(error?.message || 'Giriş başlatılamadı')
        setLoading(false)
        return
      }
      // Ana süreç: loopback sunucusunu başlat + tarayıcıda Google'ı aç
      await window.api?.googleLogin(data.url)
      // Tarayıcıdan dönünce App, oturumu yakalayıp ekranı değiştirecek
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card animate-fade-in">
        <div className="login-brand">
          <div className="login-brand-icon">M</div>
          <div>
            <h1 className="login-title">{t('app.name')}</h1>
            <p className="login-subtitle">Çalışmalarını her cihazda güvende tut</p>
          </div>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <Cloud size={16} />
            <span>Notların, kişilerin ve projelerin buluta kaydedilir</span>
          </div>
          <div className="login-feature">
            <ShieldCheck size={16} />
            <span>Hangi cihazdan girersen gir verilerin hesabına bağlı kalır</span>
          </div>
        </div>

        <button className="login-google-btn" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? <Loader2 size={18} className="login-spin" /> : <GoogleIcon />}
          {loading ? 'Bekleniyor…' : 'Google ile giriş yap'}
        </button>

        {error && <div className="login-error">{error}</div>}

        <p className="login-hint">
          Giriş yapmak için tarayıcı açılır. Google hesabını seçtikten sonra otomatik olarak buraya dönersin.
        </p>
      </div>
    </div>
  )
}
