import { useAppStore } from '../../store'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  if (toasts.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: 'var(--accent-success)' }} />
      case 'warning':
        return <AlertTriangle size={18} style={{ color: 'var(--accent-warning)' }} />
      case 'error':
        return <AlertCircle size={18} style={{ color: 'var(--accent-danger)' }} />
      case 'info':
      default:
        return <Info size={18} style={{ color: 'var(--accent-primary)' }} />
    }
  }

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="flex items-center gap-3 w-full">
            {getIcon(toast.type)}
            <div style={{ flex: 1, fontSize: 'var(--font-base)', fontWeight: 500 }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn btn-ghost btn-sm btn-icon"
              style={{ width: 24, height: 24, padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
