import { useEffect, useMemo, useState } from 'react'
import { useAppStore } from '../store'
import { loadData } from '../lib/cloudData'
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import { Chart, Folder, Profile, Paper, Star } from '../components/icons/iconly'
import type { Project } from './Projects'

interface ContactLite { birthday?: string }

const PALETTE = ['#4F8FFF', '#34D399', '#A78BFA', '#FBBF24', '#F87171', '#22D3EE', '#FB923C']

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className="card analytics-stat">
      <div className="analytics-stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}

export default function Analytics() {
  const { t, language } = useAppStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [contacts, setContacts] = useState<ContactLite[]>([])
  const [noteCount, setNoteCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const months = language === 'tr' ? MONTHS_TR : MONTHS_EN

  useEffect(() => {
    Promise.all([loadData<Project>('projects'), loadData<ContactLite>('contacts'), loadData('notes')])
      .then(([p, c, n]) => { setProjects(p); setContacts(c); setNoteCount(n.length) })
      .catch(() => { /* boş */ })
      .finally(() => setLoaded(true))
  }, [])

  const favCount = projects.filter(p => p.favorite).length

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    const labels: Record<string, string> = {
      draft: t('projects.draft'), production: t('projects.production'),
      published: t('projects.published'), cancelled: t('projects.cancelled')
    }
    projects.forEach(p => { map[p.status] = (map[p.status] || 0) + 1 })
    return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v }))
  }, [projects, t])

  const byPlatform = useMemo(() => {
    const map: Record<string, number> = {}
    projects.forEach(p => { const k = p.platform || '—'; map[k] = (map[k] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [projects])

  const byMonth = useMemo(() => {
    const counts = new Array(12).fill(0)
    projects.forEach(p => {
      const d = p.createdAt ? new Date(p.createdAt) : null
      if (d && !isNaN(d.getTime())) counts[d.getMonth()]++
    })
    return months.map((m, i) => ({ name: m, value: counts[i] }))
  }, [projects, months])

  const birthdaysByMonth = useMemo(() => {
    const counts = new Array(12).fill(0)
    contacts.forEach(c => {
      if (c.birthday) {
        const parts = c.birthday.split('-')
        const m = Number(parts[1])
        if (m >= 1 && m <= 12) counts[m - 1]++
      }
    })
    return months.map((m, i) => ({ name: m, value: counts[i] }))
  }, [contacts, months])

  const tooltipStyle = {
    background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
    color: '#e8edf5', fontSize: 12
  }

  const hasData = projects.length > 0 || contacts.length > 0 || noteCount > 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="page-header-icon"><Chart size={22} /></div>
          <div>
            <h1 className="page-title">{t('analytics.title')}</h1>
            <p className="page-subtitle">{t('analytics.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Summary cards */}
        <div className="card-grid">
          <StatCard icon={<Folder size={22} />} value={projects.length} label={t('dashboard.totalProjects')} color="#4F8FFF" />
          <StatCard icon={<Paper size={22} />} value={noteCount} label={t('dashboard.totalNotes')} color="#A78BFA" />
          <StatCard icon={<Profile size={22} />} value={contacts.length} label={t('dashboard.totalContacts')} color="#34D399" />
          <StatCard icon={<Star size={22} />} value={favCount} label={t('projects.favorites')} color="#FBBF24" />
        </div>

        {!loaded ? (
          <div className="card text-center py-8"><span className="text-muted">{t('common.loading')}</span></div>
        ) : !hasData ? (
          <div className="card text-center py-8">
            <h3 className="card-title">{t('common.noData')}</h3>
            <p className="card-description">{t('analytics.emptyHint')}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
              {/* Projects by status (donut) */}
              <div className="card flex flex-col gap-3">
                <h3 className="card-title">{t('analytics.byStatus')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {byStatus.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Projects by platform (bar) */}
              <div className="card flex flex-col gap-3">
                <h3 className="card-title">{t('analytics.byPlatform')}</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byPlatform}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill: '#8b95a5', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#8b95a5', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(79,143,255,0.08)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {byPlatform.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Projects created per month (area) */}
            <div className="card flex flex-col gap-3">
              <h3 className="card-title">{t('analytics.byMonth')}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={byMonth}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F8FFF" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#4F8FFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" tick={{ fill: '#8b95a5', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#8b95a5', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" stroke="#4F8FFF" strokeWidth={2} fill="url(#projGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Birthdays by month */}
            {contacts.length > 0 && (
              <div className="card flex flex-col gap-3">
                <h3 className="card-title">{t('analytics.birthdays')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={birthdaysByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill: '#8b95a5', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#8b95a5', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(52,211,153,0.08)' }} />
                    <Bar dataKey="value" fill="#34D399" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
