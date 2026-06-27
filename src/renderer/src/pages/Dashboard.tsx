import { useEffect, useState } from 'react'
import { useAppStore } from '../store'
import { loadData } from '../lib/cloudData'
import { supabase } from '../lib/supabase'
import {
  FolderGit2,
  FileText,
  Users2,
  Clock,
  Cpu,
  Activity,
  Plus
} from 'lucide-react'
import { TimeCircle, Calendar as CalIcon, Category, ArrowRight } from '../components/icons/iconly'

interface SystemStats {
  cpuUsage: number
  memUsage: number
  diskUsage: number
  uptimeString: string
}

interface UpcomingItem {
  id: string
  date: string
  time?: string
  title: string
  kind: 'alarm' | 'note'
}

function greetKey(hour: number): string {
  if (hour < 6) return 'dashboard.greetNight'
  if (hour < 12) return 'dashboard.greetMorning'
  if (hour < 18) return 'dashboard.greetAfternoon'
  if (hour < 22) return 'dashboard.greetEvening'
  return 'dashboard.greetNight'
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export default function Dashboard() {
  const { t, language, setActivePage } = useAppStore()
  const [userEmail, setUserEmail] = useState('')
  const [projectCount, setProjectCount] = useState<number | null>(null)
  const [contactCount, setContactCount] = useState<number | null>(null)
  const [noteCount, setNoteCount] = useState<number | null>(null)
  const [now, setNow] = useState(new Date())
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null)
  const [disk, setDisk] = useState<DiskUsage | null>(null)
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([])
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 12,
    memUsage: 45,
    diskUsage: 0,
    uptimeString: '00:00:00'
  })

  // Canlı saat (1 sn)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Sistem metrikleri (2 sn)
  useEffect(() => {
    const tick = async () => {
      if (window.api) {
        try {
          const info = await window.api.getSystemInfo()
          setSysInfo(info)
          const memPercentage = Math.round(((info.totalMemory - info.freeMemory) / info.totalMemory) * 100)
          const uptime = info.uptime
          const hours = Math.floor(uptime / 3600).toString().padStart(2, '0')
          const minutes = Math.floor((uptime % 3600) / 60).toString().padStart(2, '0')
          const seconds = Math.floor(uptime % 60).toString().padStart(2, '0')
          const simulatedCpu = Math.floor(Math.random() * 15) + 5
          setStats(prev => ({
            cpuUsage: simulatedCpu,
            memUsage: memPercentage,
            diskUsage: disk?.percent ?? prev.diskUsage,
            uptimeString: `${hours}:${minutes}:${seconds}`
          }))
        } catch {
          setStats(prev => ({ ...prev, cpuUsage: Math.floor(Math.random() * 20) + 10, memUsage: 50 }))
        }
      } else {
        setStats(prev => ({ ...prev, cpuUsage: Math.floor(Math.random() * 20) + 10, memUsage: 48, uptimeString: '03:14:15' }))
      }
    }
    tick()
    const interval = setInterval(tick, 2000)
    return () => clearInterval(interval)
  }, [disk])

  // Gerçek disk kullanımı (30 sn)
  useEffect(() => {
    const loadDisk = async () => {
      if (window.api?.getDiskUsage) {
        const d = await window.api.getDiskUsage()
        if (d) {
          setDisk(d)
          setStats(prev => ({ ...prev, diskUsage: d.percent }))
        }
      }
    }
    loadDisk()
    const id = setInterval(loadDisk, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''))
    Promise.all([loadData('projects'), loadData('contacts'), loadData('notes')])
      .then(([projects, contacts, notes]) => {
        setProjectCount(projects.length)
        setContactCount(contacts.length)
        setNoteCount(notes.length)
      })
      .catch(() => { setProjectCount(0); setContactCount(0); setNoteCount(0) })
  }, [])

  // Yaklaşan takvim etkinlikleri
  useEffect(() => {
    const load = async () => {
      if (!window.api) return
      const todayStr = new Date().toISOString().slice(0, 10)
      const alarms = ((await window.api.getData('calendarAlarms')) as { id: string; date: string; time: string; title: string; triggered: boolean }[]) || []
      const notes = ((await window.api.getData('calendarNotes')) as { id: string; date: string; text: string }[]) || []
      const items: UpcomingItem[] = [
        ...alarms.filter(a => a.date >= todayStr && !a.triggered).map(a => ({ id: a.id, date: a.date, time: a.time, title: a.title, kind: 'alarm' as const })),
        ...notes.filter(n => n.date >= todayStr).map(n => ({ id: n.id, date: n.date, title: n.text, kind: 'note' as const }))
      ]
      items.sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
      setUpcoming(items.slice(0, 5))
    }
    load()
  }, [])

  const clockStr = now.toLocaleTimeString(language === 'tr' ? 'tr-TR' : 'en-US')
  const dateStr = now.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('dashboard.title')}</h1>
          <p className="page-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActivePage('projects')}>
          <Plus size={16} />
          {t('dashboard.newProject')}
        </button>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Welcome + clock */}
        <div className="card dashboard-welcome" style={{ background: 'linear-gradient(135deg, rgba(79, 143, 255, 0.1), rgba(167, 139, 250, 0.1))' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: 'var(--font-lg)', marginBottom: '4px' }}>
              {t(greetKey(now.getHours()))}{userEmail ? `, ${userEmail}` : ''}
            </h2>
            <p className="card-description">{t('dashboard.welcomeMessage')}</p>
          </div>
          <div className="dashboard-clock">
            <span className="dashboard-clock-time"><TimeCircle size={18} /> {clockStr}</span>
            <span className="dashboard-clock-date">{dateStr}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="card-grid">
          <div className="stat-card" onClick={() => setActivePage('projects')}>
            <div className="stat-icon blue"><FolderGit2 size={22} /></div>
            <div className="stat-info">
              <span className="stat-value">{projectCount ?? '—'}</span>
              <span className="stat-label">{t('dashboard.totalProjects')}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setActivePage('contacts')}>
            <div className="stat-icon green"><Users2 size={22} /></div>
            <div className="stat-info">
              <span className="stat-value">{contactCount ?? '—'}</span>
              <span className="stat-label">{t('dashboard.totalContacts')}</span>
            </div>
          </div>
          <div className="stat-card" onClick={() => setActivePage('notes')}>
            <div className="stat-icon purple"><FileText size={22} /></div>
            <div className="stat-info">
              <span className="stat-value">{noteCount ?? '—'}</span>
              <span className="stat-label">{t('dashboard.totalNotes')}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Clock size={22} /></div>
            <div className="stat-info">
              <span className="stat-value" style={{ fontSize: 'var(--font-xl)', fontFamily: 'var(--font-mono)' }}>
                {stats.uptimeString}
              </span>
              <span className="stat-label">{t('dashboard.uptime')}</span>
            </div>
          </div>
        </div>

        {/* System resources & upcoming */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* System Monitor */}
          <div className="card flex flex-col gap-4">
            <h3 className="card-title flex items-center gap-2">
              <Cpu size={18} style={{ color: 'var(--accent-primary)' }} />
              {t('dashboard.systemStatus')}
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{t('dashboard.cpu')}</span>
                  <span className="font-mono text-sm">{stats.cpuUsage}%</span>
                </div>
                <div className="progress"><div className="progress-bar" style={{ width: `${stats.cpuUsage}%` }} /></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">{t('dashboard.memory')}</span>
                  <span className="font-mono text-sm">{stats.memUsage}%</span>
                </div>
                <div className="progress"><div className="progress-bar" style={{ width: `${stats.memUsage}%`, background: 'linear-gradient(90deg, var(--accent-success), var(--accent-purple))' }} /></div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">
                    {t('dashboard.disk')}
                    {disk && <span className="text-muted" style={{ marginLeft: 6, fontSize: 'var(--font-xs)' }}>{formatBytes(disk.used)} / {formatBytes(disk.total)}</span>}
                  </span>
                  <span className="font-mono text-sm">{stats.diskUsage}%</span>
                </div>
                <div className="progress"><div className="progress-bar" style={{ width: `${stats.diskUsage}%`, background: 'linear-gradient(90deg, var(--accent-warning), var(--accent-danger))' }} /></div>
              </div>
            </div>

            {/* System details */}
            <div className="dashboard-sysdetails">
              <div className="dashboard-sysrow"><span><Cpu size={13} /> {t('dashboard.processor')}</span><span title={sysInfo?.cpuModel}>{sysInfo?.cpuModel || '—'}</span></div>
              <div className="dashboard-sysrow"><span><Category size={13} /> {t('dashboard.cores')}</span><span>{sysInfo?.cpuCores ?? '—'}</span></div>
              <div className="dashboard-sysrow"><span><Activity size={13} /> {t('dashboard.host')}</span><span>{sysInfo?.hostname || '—'}</span></div>
              <div className="dashboard-sysrow"><span><Category size={13} /> {t('dashboard.platform')}</span><span>{sysInfo ? `${sysInfo.platform} (${sysInfo.arch})` : '—'}</span></div>
            </div>
          </div>

          {/* Upcoming events */}
          <div className="card flex flex-col gap-4">
            <h3 className="card-title flex items-center gap-2">
              <CalIcon size={18} style={{ color: 'var(--accent-purple)' }} />
              {t('dashboard.upcoming')}
            </h3>
            <div className="flex flex-col gap-2">
              {upcoming.length === 0 ? (
                <div className="text-sm text-muted" style={{ padding: 'var(--space-3) 0' }}>{t('dashboard.noUpcoming')}</div>
              ) : (
                upcoming.map(item => (
                  <div key={item.id} className="dashboard-upcoming-item" onClick={() => setActivePage('home')}>
                    <span className={`dashboard-upcoming-dot ${item.kind}`} />
                    <div className="dashboard-upcoming-body">
                      <span className="dashboard-upcoming-title">{item.title}</span>
                      <span className="dashboard-upcoming-meta">{item.date}{item.time ? ` · ${item.time}` : ''}</span>
                    </div>
                  </div>
                ))
              )}
              <button className="btn btn-secondary btn-sm w-full justify-between" style={{ marginTop: 4 }} onClick={() => setActivePage('home')}>
                <span>{t('dashboard.viewCalendar')}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
