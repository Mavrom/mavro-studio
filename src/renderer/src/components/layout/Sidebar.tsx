import { useState, useEffect } from 'react'
import { useAppStore } from '../../store'
import {
  LayoutDashboard,
  FolderGit2,
  FileText,
  Users2,
  ShieldCheck,
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
  const { t, sidebarCollapsed, toggleSidebar } = useAppStore()
  const [appVersion, setAppVersion] = useState('1.0.2')

  useEffect(() => {
    window.api?.getSystemInfo().then((info) => {
      if (info?.appVersion) setAppVersion(info.appVersion)
    }).catch(() => {})
  }, [])

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">M</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">{t('app.name')}</span>
            <span className="sidebar-brand-version">{t('app.version')} v{appVersion}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
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

        <div className="sidebar-section-title">{t('sections.system')}</div>
        <SidebarItem
          page="security"
          icon={<ShieldCheck />}
          label={t('nav.security')}
        />
        <SidebarItem
          page="settings"
          icon={<Settings />}
          label={t('nav.settings')}
        />
      </nav>

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">U</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Mavro User</span>
            <span className="sidebar-user-role">Developer</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
