import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { useAppStore } from './store'
import { supabase } from './lib/supabase'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import ToastContainer from './components/common/ToastContainer'
import UpdateModal from './components/common/UpdateModal'
import LoginScreen from './components/auth/LoginScreen'
import { Loader2 } from 'lucide-react'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'

function App() {
  const { activePage, setTheme, setLanguage } = useAppStore()

  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)
  const [updateDownloading, setUpdateDownloading] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<number | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Oturumu yükle + değişiklikleri dinle
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Tarayıcıdan dönen OAuth kodunu oturuma çevir
  useEffect(() => {
    window.api?.onAuthCode(async (code: string) => {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) console.error('exchangeCodeForSession', error.message)
    })
  }, [])


  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.api) {
          const theme = await window.api.getTheme() as string
          const lang = await window.api.getSetting('language') as string
          if (theme) setTheme(theme as 'dark' | 'light' | 'system')
          if (lang) setLanguage(lang)
        } else {
          document.documentElement.setAttribute('data-theme', 'dark')
        }
      } catch {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
    loadSettings()
  }, [])

  useEffect(() => {
    if (!window.api) return
    window.api.onUpdateAvailable((info: unknown) => {
      const data = info as { version: string }
      if (data?.version) setUpdateInfo(data)
    })
    window.api.onDownloadProgress((progress: unknown) => {
      const p = progress as { percent: number }
      if (p?.percent !== undefined) setUpdateProgress(p.percent)
    })
    window.api.onUpdateDownloaded(() => {
      setUpdateDownloaded(true)
      setUpdateDownloading(false)
    })
  }, [])

  const handleUpdate = () => {
    setUpdateDownloading(true)
    window.api?.downloadUpdate()
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <HomePage />
      case 'dashboard': return <Dashboard />
      case 'projects': return <Projects />
      case 'notes': return <Notes />
      case 'contacts': return <Contacts />
      case 'settings': return <Settings />
      default: return <HomePage />
    }
  }

  // Oturum kontrol edilirken kısa yükleme
  if (authLoading) {
    return (
      <>
        <TitleBar />
        <div className="auth-loading">
          <Loader2 size={28} className="login-spin" />
        </div>
        <StatusBar />
      </>
    )
  }

  // Giriş zorunlu: oturum yoksa giriş ekranı
  if (!session) {
    return (
      <>
        <TitleBar />
        <LoginScreen />
        <ToastContainer />
      </>
    )
  }

  return (
    <>
      <TitleBar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
      {updateInfo && (
        <UpdateModal
          version={updateInfo.version}
          onUpdate={handleUpdate}
          onDismiss={() => setUpdateInfo(null)}
          downloading={updateDownloading}
          progress={updateProgress}
          downloaded={updateDownloaded}
        />
      )}
    </>
  )
}

export default App
