import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store'
import {
  Search, Home, Category, Chart, Folder, Paper, Profile,
  Setting, ShieldDone, ArrowRight, Swap, Notification
} from '../icons/iconly'

interface Command {
  id: string
  label: string
  hint: string
  icon: React.ReactNode
  run: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onOpenHelp: () => void
}

export default function CommandPalette({ open, onClose, onOpenHelp }: Props) {
  const { t, setActivePage, toggleSidebar, language, setLanguage, addToast } = useAppStore()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const go = (page: string) => { setActivePage(page); onClose() }

  const commands: Command[] = useMemo(() => [
    { id: 'home', label: t('nav.home'), hint: t('cmd.goto'), icon: <Home size={17} />, run: () => go('home') },
    { id: 'dashboard', label: t('nav.dashboard'), hint: t('cmd.goto'), icon: <Chart size={17} />, run: () => go('dashboard') },
    { id: 'projects', label: t('nav.projects'), hint: t('cmd.goto'), icon: <Folder size={17} />, run: () => go('projects') },
    { id: 'notes', label: t('nav.notes'), hint: t('cmd.goto'), icon: <Paper size={17} />, run: () => go('notes') },
    { id: 'contacts', label: t('nav.contacts'), hint: t('cmd.goto'), icon: <Profile size={17} />, run: () => go('contacts') },
    { id: 'tools', label: t('nav.tools'), hint: t('cmd.goto'), icon: <Category size={17} />, run: () => go('tools') },
    { id: 'security', label: t('nav.security'), hint: t('cmd.goto'), icon: <ShieldDone size={17} />, run: () => go('security') },
    { id: 'settings', label: t('nav.settings'), hint: t('cmd.goto'), icon: <Setting size={17} />, run: () => go('settings') },
    { id: 'sidebar', label: t('cmd.toggleSidebar'), hint: t('cmd.action'), icon: <Swap size={17} />, run: () => { toggleSidebar(); onClose() } },
    {
      id: 'lang', label: t('cmd.toggleLanguage'), hint: t('cmd.action'), icon: <Swap size={17} />,
      run: () => { const next = language === 'tr' ? 'en' : 'tr'; setLanguage(next); addToast({ message: next.toUpperCase(), type: 'info' }); onClose() }
    },
    { id: 'help', label: t('cmd.shortcuts'), hint: t('cmd.action'), icon: <Notification size={17} />, run: () => { onClose(); onOpenHelp() } }
  ], [t, language])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(c => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setIndex(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('.cmd-item.active')
    el?.scrollIntoView({ block: 'nearest' })
  }, [index])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[index]?.run() }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div className="cmd-overlay" onMouseDown={onClose}>
      <div className="cmd-palette animate-fade-in" onMouseDown={e => e.stopPropagation()}>
        <div className="cmd-search">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t('cmd.placeholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>
        <div className="cmd-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cmd-empty">{t('common.noData')}</div>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                className={`cmd-item ${i === index ? 'active' : ''}`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => c.run()}
              >
                <span className="cmd-item-icon">{c.icon}</span>
                <span className="cmd-item-label">{c.label}</span>
                <span className="cmd-item-hint">{c.hint}</span>
                <ArrowRight size={14} className="cmd-item-arrow" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
