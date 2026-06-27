import { useAppStore } from '../../store'
import { Close } from '../icons/iconly'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ShortcutsHelp({ open, onClose }: Props) {
  const { t } = useAppStore()
  if (!open) return null

  const groups: { title: string; items: { keys: string[]; desc: string }[] }[] = [
    {
      title: t('shortcuts.general'),
      items: [
        { keys: ['Ctrl', 'K'], desc: t('shortcuts.palette') },
        { keys: ['Ctrl', 'B'], desc: t('shortcuts.sidebar') },
        { keys: ['?'], desc: t('shortcuts.help') },
        { keys: ['Esc'], desc: t('shortcuts.close') }
      ]
    },
    {
      title: t('shortcuts.navigation'),
      items: [
        { keys: ['Ctrl', '1'], desc: t('nav.home') },
        { keys: ['Ctrl', '2'], desc: t('nav.dashboard') },
        { keys: ['Ctrl', '3'], desc: t('nav.projects') },
        { keys: ['Ctrl', '4'], desc: t('nav.notes') },
        { keys: ['Ctrl', '5'], desc: t('nav.contacts') },
        { keys: ['Ctrl', '6'], desc: t('nav.tools') },
        { keys: ['Ctrl', '7'], desc: t('nav.settings') }
      ]
    }
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3 className="modal-title">{t('shortcuts.title')}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <Close size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {groups.map(g => (
            <div key={g.title}>
              <div className="shortcuts-group-title">{g.title}</div>
              <div className="shortcuts-list">
                {g.items.map(item => (
                  <div key={item.desc} className="shortcuts-row">
                    <span className="shortcuts-desc">{item.desc}</span>
                    <span className="shortcuts-keys">
                      {item.keys.map(k => <kbd key={k} className="cmd-kbd">{k}</kbd>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
