import { useEffect, useState } from 'react'
import { useAppStore } from './store'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import ToastContainer from './components/common/ToastContainer'
import UpdateModal from './components/common/UpdateModal'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Contacts from './pages/Contacts'
import Security from './pages/Security'
import Settings from './pages/Settings'
import Setup from './pages/Setup'

function App() {
  const { activePage, setTheme, setLanguage } = useAppStore()

  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)
  const [updateDownloading, setUpdateDownloading] = useState(false)
  const [updateProgress, setUpdateProgress] = useState<number | null>(null)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.api) {
          const theme = await window.api.getTheme() as string
          const lang = await window.api.getSetting('language') as string
          const setupComplete = await window.api.getSetting('setupComplete')
          if (theme) setTheme(theme as 'dark' | 'light' | 'system')
          if (lang) setLanguage(lang)
          setNeedsSetup(!setupComplete)
        } else {
          document.documentElement.setAttribute('data-theme', 'dark')
          setNeedsSetup(false)
        }
      } catch {
        document.documentElement.setAttribute('data-theme', 'dark')
        setNeedsSetup(false)
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
      case 'dashboard': return <Dashboard />
      case 'projects': return <Projects />
      case 'notes': return <Notes />
      case 'contacts': return <Contacts />
      case 'security': return <Security />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  if (needsSetup === null) {
    return <TitleBar />
  }

  if (needsSetup) {
    return (
      <>
        <TitleBar />
        <Setup onComplete={() => setNeedsSetup(false)} />
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
