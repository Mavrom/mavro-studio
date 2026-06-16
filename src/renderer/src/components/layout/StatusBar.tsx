import { useState, useEffect } from 'react'
import { useAppStore } from '../../store'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function StatusBar() {
  const { t, language } = useAppStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <div className={`status-dot ${isOnline ? '' : 'offline'}`} />
        <span>
          {isOnline ? t('common.online') : t('common.offline')}
        </span>
        <span className="text-muted">|</span>
        <span>{t('statusBar.ready')}</span>
      </div>
      <div className="status-bar-right">
        <span>{language.toUpperCase()}</span>
        <span className="text-muted">|</span>
        <span className="flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin stagger-3" style={{ animationDuration: '4s' }} />
          <span>v1.0.0</span>
        </span>
      </div>
    </footer>
  )
}
