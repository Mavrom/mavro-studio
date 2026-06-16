import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store'
import {
  Home,
  LayoutDashboard,
  FolderGit2,
  FileText,
  Users2,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface SidebarItemProps {
  page: string
  icon: React.ReactNode
  label: string
  badge?: number
}

function SidebarItem({ page, icon, label, badge }: SidebarItemProps) {
  const { activePage, setActivePage } = useAppStore()
  const isActive = activePage === page

  return (
    <div
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={() => setActivePage(page)}
      title={label}
    >
      <div className="sidebar-item-icon">{icon}</div>
      <span className="sidebar-item-text">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="sidebar-item-badge">{badge}</span>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { t, sidebarCollapsed, toggleSidebar, setActivePage } = useAppStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [appVersion, setAppVersion] = useState('1.1.8')
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu])

  useEffect(() => {
    const loadVersion = async () => {
      try {
        if (window.api) {
          const info = await window.api.getSystemInfo() as { appVersion: string }
          if (info?.appVersion) setAppVersion(info.appVersion)
        }
      } catch {
        // keep fallback
      }
    }
    loadVersion()
  }, [])

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">M</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">{t('app.name')}</span>
            <span className="sidebar-brand-version">{t('app.version')} {appVersion}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">{t('sections.home')}</div>
        <SidebarItem
          page="home"
          icon={<Home />}
          label={t('nav.home')}
        />

        <div className="sidebar-section-title">{t('sections.main')}</div>
        <SidebarItem
          page="dashboard"
          icon={<LayoutDashboard />}
          label={t('nav.dashboard')}
        />
        <SidebarItem
          page="projects"
          icon={<FolderGit2 />}
          label={t('nav.projects')}
          badge={3}
        />

        <div className="sidebar-section-title">{t('sections.workspace')}</div>
        <SidebarItem
          page="notes"
          icon={<FileText />}
          label={t('nav.notes')}
        />
        <SidebarItem
          page="contacts"
          icon={<Users2 />}
          label={t('nav.contacts')}
        />
      </nav>

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sidebar-footer" ref={profileMenuRef} style={{ position: 'relative' }}>
        <div
          className="sidebar-user"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="sidebar-avatar">U</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Mavro User</span>
            <span className="sidebar-user-role">Developer</span>
          </div>
        </div>

        {/* Profile Popup Menu */}
        {showProfileMenu && (
          <div className="profile-popup-menu animate-fade-in">
            <div
              className="profile-popup-item"
              onClick={() => {
                setActivePage('settings')
                setShowProfileMenu(false)
              }}
            >
              <Settings size={15} />
              <span>{t('profile.settings')}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
