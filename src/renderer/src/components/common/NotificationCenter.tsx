import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../../store'
import { Notification as BellIcon, Close, Tick, Delete } from '../icons/iconly'

function timeAgo(ts: number, lang: string): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  const tr = lang === 'tr'
  if (diff < 60) return tr ? 'az önce' : 'just now'
  const min = Math.floor(diff / 60)
  if (min < 60) return tr ? `${min} dk önce` : `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return tr ? `${hr} sa önce` : `${hr}h ago`
  const day = Math.floor(hr / 24)
  return tr ? `${day} gün önce` : `${day}d ago`
}

export default function NotificationCenter() {
  const {
    t, language, notifications,
    markNotificationRead, markAllNotificationsRead, clearNotifications, removeNotification
  } = useAppStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="notif-center" ref={ref} style={{ ['WebkitAppRegion' as string]: 'no-drag' } as React.CSSProperties}>
      <button
        className="notif-bell"
        onClick={() => { setOpen(o => !o); if (!open && unread) markAllNotificationsRead() }}
        title={t('notif.title')}
      >
        <BellIcon size={16} />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel animate-fade-in">
          <div className="notif-panel-head">
            <span className="notif-panel-title">{t('notif.title')}</span>
            {notifications.length > 0 && (
              <button className="notif-clear" onClick={clearNotifications}>
                <Delete size={13} /> {t('notif.clear')}
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <BellIcon size={28} />
                <span>{t('notif.empty')}</span>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? '' : 'unread'}`}
                  onClick={() => markNotificationRead(n.id)}
                >
                  <span className={`notif-dot ${n.type}`} />
                  <div className="notif-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-time">{timeAgo(n.timestamp, language)}</div>
                  </div>
                  <button
                    className="notif-remove"
                    onClick={(e) => { e.stopPropagation(); removeNotification(n.id) }}
                    title={t('notif.remove')}
                  >
                    <Close size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && unread > 0 && (
            <button className="notif-markall" onClick={markAllNotificationsRead}>
              <Tick size={14} /> {t('notif.markAll')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
