import { useState, useEffect } from 'react'
import { useAppStore } from '../../store'
import { Minus, Square, X, Copy } from 'lucide-react'
import NotificationCenter from '../common/NotificationCenter'

export default function TitleBar() {
  const { t } = useAppStore()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.api) {
        const max = await window.api.isMaximized()
        setIsMaximized(max)
      }
    }
    checkMaximized()
  }, [])

  const handleMinimize = () => window.api?.minimize()
  const handleMaximize = () => {
    window.api?.maximize()
    setIsMaximized(!isMaximized)
  }
  const handleClose = () => window.api?.close()

  return (
    <div className="titlebar">
      <div className="titlebar-title">
        <div className="titlebar-logo">M</div>
        <span>{t('app.name')}</span>
      </div>
      <div className="titlebar-controls">
        <NotificationCenter />
        <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
          <Minus size={16} />
        </button>
        <button className="titlebar-btn" onClick={handleMaximize} title="Maximize">
          {isMaximized ? <Copy size={14} /> : <Square size={14} />}
        </button>
        <button className="titlebar-btn close" onClick={handleClose} title="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
