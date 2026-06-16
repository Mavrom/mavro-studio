import { useState } from 'react'
import { useAppStore } from '../store'
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react'

export default function Analytics() {
  const { t, addToast } = useAppStore()
  const [range, setRange] = useState('7')

  const handleExport = () => {
    addToast({ message: 'Rapor PDF olarak dışa aktarılıyor...', type: 'info' })
  }

  // Pure SVG/CSS graphs to avoid dynamic loading errors of heavy charting libraries
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('analytics.title')}</h1>
          <p className="page-subtitle">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <select
            className="select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="7">{t('analytics.last7days')}</option>
            <option value="30">{t('analytics.last30days')}</option>
            <option value="90">{t('analytics.last90days')}</option>
          </select>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} />
            {t('analytics.export')}
          </button>
        </div>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          <div className="card text-center">
            <span className="text-sm text-muted">{t('analytics.apiRequests')}</span>
            <div className="font-mono text-2xl font-bold mt-2 text-primary">1,482</div>
            <div className="stat-change up mt-1">
              <TrendingUp size={12} /> +12.4%
            </div>
          </div>
          <div className="card text-center">
            <span className="text-sm text-muted">{t('analytics.projectsCreated')}</span>
            <div className="font-mono text-2xl font-bold mt-2 text-primary">18</div>
            <div className="stat-change up mt-1">
              <TrendingUp size={12} /> +8.2%
            </div>
          </div>
          <div className="card text-center">
            <span className="text-sm text-muted">{t('analytics.notesWritten')}</span>
            <div className="font-mono text-2xl font-bold mt-2 text-primary">54</div>
            <div className="stat-change down mt-1">
              <TrendingUp size={12} style={{ transform: 'rotate(180deg)' }} /> -3.1%
            </div>
          </div>
          <div className="card text-center">
            <span className="text-sm text-muted">{t('analytics.toolsUsed')}</span>
            <div className="font-mono text-2xl font-bold mt-2 text-primary">312</div>
            <div className="stat-change up mt-1">
              <TrendingUp size={12} /> +15.9%
            </div>
          </div>
        </div>

        {/* Charts and Data tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          {/* SVG Custom Premium Chart */}
          <div className="card flex flex-col gap-4">
            <h3 className="card-title flex items-center gap-2">
              <BarChart3 size={18} style={{ color: 'var(--accent-primary)' }} />
              {t('analytics.overview')}
            </h3>

            {/* Custom SVG Line Chart */}
            <div style={{ height: '240px', width: '100%', position: 'relative', marginTop: 'var(--space-4)' }}>
              <svg viewBox="0 0 500 200" width="100%" height="100%">
                {/* Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="var(--border-primary)" strokeDasharray="4" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="var(--border-primary)" strokeDasharray="4" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border-primary)" strokeDasharray="4" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="var(--border-primary)" />

                {/* Gradient Fill */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path
                  d="M 40 170 Q 110 120, 180 140 T 320 80 T 480 50 L 480 170 L 40 170 Z"
                  fill="url(#chartGrad)"
                />

                <path
                  d="M 40 170 Q 110 120, 180 140 T 320 80 T 480 50"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Interactive Dots */}
                <circle cx="110" cy="143" r="5" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2" />
                <circle cx="250" cy="110" r="5" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2" />
                <circle cx="390" cy="65" r="5" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* Breakdown / Reports */}
          <div className="card flex flex-col gap-4">
            <h3 className="card-title flex items-center gap-2">
              <Calendar size={18} style={{ color: 'var(--accent-purple)' }} />
              {t('analytics.performance')}
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <span className="text-sm">API Gateway</span>
                <span className="badge badge-success">99.9%</span>
              </div>
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <span className="text-sm">Local Storage Sync</span>
                <span className="badge badge-success">12 ms</span>
              </div>
              <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <span className="text-sm">Auto-update Checks</span>
                <span className="badge badge-primary">Daily</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backup Service</span>
                <span className="badge badge-warning">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
