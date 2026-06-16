import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Search, Plus, Trash2, FileText, Save } from 'lucide-react'
import BackButton from '../components/common/BackButton'

interface Note {
  id: string
  title: string
  content: string
  isSnippet: boolean
  updatedAt: string
}

const DEFAULT_NOTES: Note[] = [
  {
    id: '1',
    title: 'TODO List',
    content: '- Complete Phase 1 altyapı features\n- Add electron-store config integration\n- Design setup wizard with NSIS installer',
    isSnippet: false,
    updatedAt: '16.06.2026'
  },
  {
    id: '2',
    title: 'Webpack config snippet',
    content: 'module.exports = {\n  mode: "production",\n  entry: "./src/index.js",\n  output: {\n    filename: "bundle.js"\n  }\n};',
    isSnippet: true,
    updatedAt: '15.06.2026'
  }
]

export default function Notes() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>('1')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const saved = await window.api.getData('notes') as Note[]
        if (saved && saved.length > 0) {
          setNotes(saved)
          setActiveNoteId(saved[0].id)
        } else {
          setNotes(DEFAULT_NOTES)
        }
      } else {
        setNotes(DEFAULT_NOTES)
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded && window.api) {
      window.api.setData('notes', notes)
    }
  }, [notes, loaded])

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0]

  const handleSave = async () => {
    if (window.api) {
      await window.api.setData('notes', notes)
    }
    addToast({ message: t('settings.saved'), type: 'success' })
  }

  const handleDelete = (id: string) => {
    const updated = notes.filter((n) => n.id !== id)
    setNotes(updated)
    if (activeNoteId === id && updated.length > 0) {
      setActiveNoteId(updated[0].id)
    }
    addToast({ message: 'Not silindi', type: 'warning' })
  }

  const createNote = () => {
    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2,'0')}.${(today.getMonth()+1).toString().padStart(2,'0')}.${today.getFullYear()}`
    const newNote: Note = {
      id: Date.now().toString(),
      title: t('notes.untitled'),
      content: '',
      isSnippet: false,
      updatedAt: dateStr
    }
    setNotes([newNote, ...notes])
    setActiveNoteId(newNote.id)
    addToast({ message: 'Yeni not oluşturuldu', type: 'success' })
  }

  const updateContent = (val: string) => {
    setNotes(
      notes.map((n) =>
        n.id === activeNoteId
          ? { ...n, content: val, updatedAt: '16.06.2026' }
          : n
      )
    )
  }

  const updateTitle = (val: string) => {
    setNotes(
      notes.map((n) =>
        n.id === activeNoteId ? { ...n, title: val } : n
      )
    )
  }

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BackButton />
          <div>
            <h1 className="page-title">{t('notes.title')}</h1>
            <p className="page-subtitle">{t('notes.subtitle')}</p>
          </div>
        </div>
      </div>

      <div
        className="page-content"
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: 'var(--space-6)',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Left Side: Note List */}
        <div className="card flex flex-col gap-4" style={{ height: '100%', overflow: 'hidden' }}>
          <button className="btn btn-primary w-full" onClick={createNote}>
            <Plus size={16} />
            {t('notes.newNote')}
          </button>

          <div className="search-input-wrapper">
            <Search size={16} />
            <input
              type="text"
              className="input search-input"
              placeholder={t('notes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredNotes.map((n) => (
              <div
                key={n.id}
                className={`sidebar-item ${n.id === activeNoteId ? 'active' : ''}`}
                style={{ padding: 'var(--space-2) var(--space-3)', margin: 0 }}
                onClick={() => setActiveNoteId(n.id)}
              >
                <FileText size={16} style={{ flexShrink: 0 }} />
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {n.title || t('notes.untitled')}
                </div>
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  style={{ width: 22, height: 22, padding: 0 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(n.id)
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Editor */}
        {activeNote ? (
          <div className="card flex flex-col gap-4" style={{ height: '100%' }}>
            <div className="flex justify-between items-center pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <input
                type="text"
                className="input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 'var(--font-lg)',
                  fontWeight: 600,
                  padding: 0
                }}
                value={activeNote.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder={t('notes.untitled')}
              />
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={handleSave}>
                  <Save size={14} />
                  {t('notes.save')}
                </button>
              </div>
            </div>
            <textarea
              className="input input-mono"
              style={{
                flex: 1,
                resize: 'none',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                padding: 'var(--space-4)',
                fontSize: 'var(--font-base)',
                lineHeight: 1.6
              }}
              value={activeNote.content}
              onChange={(e) => updateContent(e.target.value)}
            />
          </div>
        ) : (
          <div className="card flex items-center justify-center text-center">
            <div>
              <FileText size={48} className="text-muted mb-4" />
              <h3 className="card-title">{t('notes.noNotes')}</h3>
              <p className="card-description">{t('notes.createFirst')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
