import { useEffect, useState } from 'react'
import { useAppStore } from './store'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import ToastContainer from './components/common/ToastContainer'
import UpdateModal from './components/common/UpdateModal'
import HomePage from './pages/HomePage'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'

function App() {
  const { activePage, setTheme, setLanguage, setActivePage } = useAppStore()

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

  const showSidebar = activePage === 'dashboard' || activePage === 'home'

  return (
    <>
      <TitleBar />
      <div className="app-container">
        {showSidebar && <Sidebar />}
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
