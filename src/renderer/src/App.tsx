import { useEffect } from 'react'
import { useAppStore } from './store'
import TitleBar from './components/layout/TitleBar'
import Sidebar from './components/layout/Sidebar'
import StatusBar from './components/layout/StatusBar'
import ToastContainer from './components/common/ToastContainer'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Notes from './pages/Notes'
import Analytics from './pages/Analytics'
import Tools from './pages/Tools'
import Contacts from './pages/Contacts'
import Security from './pages/Security'
import Settings from './pages/Settings'

function App() {
  const { activePage, setTheme, setLanguage } = useAppStore()

  useEffect(() => {
    // Load saved settings on mount
    const loadSettings = async () => {
      try {
        if (window.api) {
          const theme = await window.api.getTheme() as string
          const lang = await window.api.getSetting('language') as string
          if (theme) setTheme(theme as 'dark' | 'light' | 'system')
          if (lang) setLanguage(lang)
        } else {
          // Dev mode fallback - apply default dark theme
          document.documentElement.setAttribute('data-theme', 'dark')
        }
      } catch {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
    loadSettings()
  }, [])

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'projects': return <Projects />
      case 'notes': return <Notes />
      case 'analytics': return <Analytics />
      case 'tools': return <Tools />
      case 'contacts': return <Contacts />
      case 'security': return <Security />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
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
    </>
  )
}

export default App
