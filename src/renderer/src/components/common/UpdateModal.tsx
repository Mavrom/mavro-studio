import { Download, CheckCircle, X } from 'lucide-react'

interface UpdateModalProps {
  version: string
  onUpdate: () => void
  onDismiss: () => void
  downloading: boolean
  progress: number | null
  downloaded: boolean
}

export default function UpdateModal({ version, onUpdate, onDismiss, downloading, progress, downloaded }: UpdateModalProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-secondary)',
        borderRadius: '16px',
        padding: '32px',
        width: '440px',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        animation: 'fadeInUp 0.2s ease',
      }}>
        {!downloading && !downloaded && (
          <button
            onClick={onDismiss}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 4, borderRadius: 6,
            }}
          >
            <X size={16} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: downloaded ? 'var(--accent-success-glow)' : 'var(--accent-primary-glow)',
            border: `1px solid ${downloaded ? 'rgba(52,211,153,0.4)' : 'rgba(79,143,255,0.4)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: downloaded ? 'var(--accent-success)' : 'var(--accent-primary)',
          }}>
            {downloaded ? <CheckCircle size={26} /> : <Download size={26} />}
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Yeni Sürüm Mevcut
            </div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: 3 }}>
              Mavro Studio <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>v{version}</span> yayınlandı
            </div>
          </div>
        </div>

        {downloading && progress !== null && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>İndiriliyor...</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{Math.round(progress)}%</span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%`, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {downloaded && (
          <div style={{
            background: 'var(--accent-success-glow)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 20,
            color: 'var(--accent-success)',
            fontSize: 'var(--font-sm)',
            textAlign: 'center',
          }}>
            İndirme tamamlandı. Güncellemek için yeniden başlatın.
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {!downloading && !downloaded && (
            <button className="btn btn-secondary" onClick={onDismiss}>
              Teşekkürler
            </button>
          )}
          {!downloaded && (
            <button className="btn btn-primary" onClick={onUpdate} disabled={downloading}>
              <Download size={15} />
              {downloading ? 'İndiriliyor...' : 'Güncelle'}
            </button>
          )}
          {downloaded && (
            <button className="btn btn-primary" onClick={() => window.api?.installUpdate()}>
              <CheckCircle size={15} />
              Yeniden Başlat & Güncelle
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
