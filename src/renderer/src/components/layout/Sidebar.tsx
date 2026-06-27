import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../../store'
import { supabase } from '../../lib/supabase'
import {
  Home,
  LayoutDashboard,
  FolderGit2,
  FileText,
  Users2,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  ChevronDown
} from 'lucide-react'
import { Category, Chart } from '../icons/iconly'

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
  const [userEmail, setUserEmail] = useState('')
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '')
    })
  }, [])

  const handleLogout = async () => {
    setShowProfileMenu(false)
    setActivePage('home')
    await supabase.auth.signOut()
  }

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">M</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">{t('app.name')}</span>
            <span className="sidebar-brand-version">{t('app.version')} {appVersion}</span>
          </div>
          <ChevronDown size={15} className="sidebar-brand-caret" />
        </div>
        <button className="sidebar-collapse-btn" onClick={toggleSidebar} title="Daralt / Genişlet">
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <SidebarItem
          page="home"
          icon={<Home />}
          label={t('nav.home')}
        />
        <SidebarItem
          page="dashboard"
          icon={<LayoutDashboard />}
          label={t('nav.dashboard')}
        />
        <SidebarItem
          page="projects"
          icon={<FolderGit2 />}
          label={t('nav.projects')}
        />
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
        <SidebarItem
          page="tools"
          icon={<Category size={22} />}
          label={t('nav.tools')}
        />
        <SidebarItem
          page="analytics"
          icon={<Chart size={22} />}
          label={t('nav.analytics')}
        />
      </nav>

      <div className="sidebar-footer" ref={profileMenuRef} style={{ position: 'relative' }}>
        <div
          className={`sidebar-item sidebar-admin ${showProfileMenu ? 'open' : ''}`}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          title="Admin"
        >
          <div className="sidebar-item-icon"><Settings /></div>
          <span className="sidebar-item-text">Admin</span>
        </div>

        {/* Profile Popup Menu */}
        {showProfileMenu && (
          <div className="profile-popup-menu animate-fade-in">
            {userEmail && (
              <div className="profile-popup-email" title={userEmail}>{userEmail}</div>
            )}
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
            <div className="profile-popup-item danger" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Çıkış yap</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
