import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import {
  FolderGit2,
  FileText,
  Users2,
  Clock,
  Cpu,
  Activity,
  ArrowRight,
  Plus,
  TrendingUp
} from 'lucide-react'

interface SystemStats {
  cpuUsage: number
  memUsage: number
  diskUsage: number
  uptimeString: string
}

export default function Dashboard() {
  const { t, setActivePage, addToast } = useAppStore()
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 12,
    memUsage: 45,
    diskUsage: 68,
    uptimeString: '00:00:00'
  })

  useEffect(() => {
    // Periodically query main process system stats or mock them realistically
    const interval = setInterval(async () => {
      if (window.api) {
        try {
          const info = await window.api.getSystemInfo()
          const freeMem = info.freeMemory
          const totalMem = info.totalMemory
          const memPercentage = Math.round(((totalMem - freeMem) / totalMem) * 100)

          // Format uptime
          const uptime = info.uptime
          const hours = Math.floor(uptime / 3600).toString().padStart(2, '0')
          const minutes = Math.floor((uptime % 3600) / 60).toString().padStart(2, '0')
          const seconds = Math.floor(uptime % 60).toString().padStart(2, '0')

          // Mock CPU variations around basic tasks
          const simulatedCpu = Math.floor(Math.random() * 15) + 5

          setStats({
            cpuUsage: simulatedCpu,
            memUsage: memPercentage,
            diskUsage: 62, // Static or mock disk
            uptimeString: `${hours}:${minutes}:${seconds}`
          })
        } catch (err) {
          // Dev fallback
          setStats((prev) => ({
            ...prev,
            cpuUsage: Math.floor(Math.random() * 20) + 10,
            memUsage: 50 + Math.floor(Math.random() * 10)
          }))
        }
      } else {
        // Dev fallback
        setStats((prev) => ({
          ...prev,
          cpuUsage: Math.floor(Math.random() * 20) + 10,
          memUsage: 48,
          uptimeString: '03:14:15'
        }))
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const handleAction = (msg: string, page?: string) => {
    addToast({ message: msg, type: 'info' })
    if (page) setActivePage(page)
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleAction(t('dashboard.newProject'), 'projects')}
        >
          <Plus size={16} />
          {t('dashboard.newProject')}
        </button>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Welcome hero card */}
        <div className="card card-glow flex items-center justify-between animate-fade-in-up stagger-1">
          <div>
            <h2 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '4px' }}>
              {t('dashboard.welcome')}, Mavro Developer!
            </h2>
            <p className="card-description">
              {t('dashboard.welcomeMessage')}
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setActivePage('projects')}
          >
            {t('nav.projects')}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="card-grid">
          <div className="stat-card animate-fade-in-up stagger-1" onClick={() => setActivePage('projects')}>
            <div className="stat-icon blue">
              <FolderGit2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">3</span>
              <span className="stat-label">{t('dashboard.totalProjects')}</span>
              <span className="stat-change up">
                <TrendingUp size={10} />
                Active
              </span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up stagger-2" onClick={() => setActivePage('contacts')}>
            <div className="stat-icon green">
              <Users2 size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">2</span>
              <span className="stat-label">{t('dashboard.totalContacts')}</span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up stagger-3" onClick={() => setActivePage('notes')}>
            <div className="stat-icon purple">
              <FileText size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">5</span>
              <span className="stat-label">{t('dashboard.totalNotes')}</span>
            </div>
          </div>

          <div className="stat-card animate-fade-in-up stagger-4">
            <div className="stat-icon cyan">
              <Clock size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-mono)' }}>
                {stats.uptimeString}
              </span>
              <span className="stat-label">{t('dashboard.uptime')}</span>
            </div>
          </div>
        </div>

        {/* Core Layout section: System resources & activities */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* System Monitor */}
          <div className="card flex flex-col gap-4 animate-fade-in-up stagger-5">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
                {t('dashboard.systemStatus')}
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{t('dashboard.cpu')}</span>
                  <span className="font-mono text-sm">{stats.cpuUsage}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${stats.cpuUsage}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{t('dashboard.memory')}</span>
                  <span className="font-mono text-sm">{stats.memUsage}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${stats.memUsage}%`, background: 'linear-gradient(90deg, var(--accent-success), var(--accent-purple))' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{t('dashboard.disk')}</span>
                  <span className="font-mono text-sm">{stats.diskUsage}%</span>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{ width: `${stats.diskUsage}%`, background: 'linear-gradient(90deg, var(--accent-warning), var(--accent-danger))' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card flex flex-col gap-4 animate-fade-in-up stagger-6">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2">
                <Activity size={18} style={{ color: 'var(--accent-purple)' }} />
                {t('dashboard.quickActions')}
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <button className="btn btn-secondary text-left w-full justify-between" onClick={() => setActivePage('notes')}>
                <span>{t('dashboard.newNote')}</span>
                <FileText size={14} />
              </button>
              <button className="btn btn-secondary text-left w-full justify-between" onClick={() => setActivePage('contacts')}>
                <span>{t('nav.contacts')}</span>
                <Users2 size={14} />
              </button>
              <button className="btn btn-secondary text-left w-full justify-between" onClick={() => setActivePage('settings')}>
                <span>{t('nav.settings')}</span>
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
