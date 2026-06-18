import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { loadData, saveData } from '../lib/cloudData'
import {
  Search, Plus, Trash2, FileText, Check,
  Link2, ExternalLink, Bold, Italic, Strikethrough, Highlighter, Code,
  Heading1, Heading2, Heading3, Quote, List, ListOrdered, ListChecks,
  Table, SquareCode, Minus, Scissors, Copy, ClipboardPaste, Type, TextSelect,
  ChevronRight
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  isSnippet: boolean
  updatedAt: string
}

export default function Notes() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>('1')
  const [loaded, setLoaded] = useState(false)

  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const cloud = await loadData<Note>('notes')
      if (cloud.length > 0) {
        setNotes(cloud)
        setActiveNoteId(cloud[0].id)
      } else {
        // Bulut boş — bu cihazdaki eski yerel notları taşı (varsa)
        const local = window.api ? ((await window.api.getData('notes')) as Note[]) : []
        if (local && local.length > 0) {
          setNotes(local)
          setActiveNoteId(local[0].id)
          saveData('notes', local)
        } else {
          setNotes([])
        }
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded) saveData('notes', notes)
  }, [notes, loaded])

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0]

  const handleSave = async () => {
    await saveData('notes', notes)
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

  // ============ EDITOR / MARKDOWN HELPERS ============
  // Seçimi alıp dönüştürür, içeriği günceller ve imleci geri konumlandırır.
  const editSelection = (
    fn: (sel: string, full: string, start: number, end: number) =>
      { text: string; selStart: number; selEnd: number }
  ) => {
    const ta = editorRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const full = ta.value
    const sel = full.slice(start, end)
    const { text, selStart, selEnd } = fn(sel, full, start, end)
    updateContent(text)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(selStart, selEnd)
    })
  }

  // Seçimi before/after ile sarar (kalın, italik, kod...)
  const wrap = (before: string, after: string, placeholder = '') =>
    editSelection((sel, full, start, end) => {
      const inner = sel || placeholder
      const insert = before + inner + after
      const text = full.slice(0, start) + insert + full.slice(end)
      const selStart = start + before.length
      return { text, selStart, selEnd: selStart + inner.length }
    })

  // Seçili satır(lar)ın başına önek ekler (başlık, liste, alıntı...)
  const linePrefix = (prefix: string) =>
    editSelection((_sel, full, start, end) => {
      const lineStart = full.lastIndexOf('\n', start - 1) + 1
      const block = full.slice(lineStart, end)
      const prefixed = block.split('\n').map((l) => prefix + l).join('\n')
      const text = full.slice(0, lineStart) + prefixed + full.slice(end)
      return { text, selStart: lineStart, selEnd: lineStart + prefixed.length }
    })

  // İmlece düz metin ekler
  const insertText = (chunk: string) =>
    editSelection((_sel, full, start, end) => {
      const text = full.slice(0, start) + chunk + full.slice(end)
      const pos = start + chunk.length
      return { text, selStart: pos, selEnd: pos }
    })

  const insertExternalLink = () =>
    editSelection((sel, full, start, end) => {
      const label = sel || 'metin'
      const insert = `[${label}](url)`
      const text = full.slice(0, start) + insert + full.slice(end)
      const urlStart = start + 1 + label.length + 2 // [label](
      return { text, selStart: urlStart, selEnd: urlStart + 3 }
    })

  const insertCodeBlock = () =>
    editSelection((sel, full, start, end) => {
      const inner = sel || 'kod'
      const insert = '```\n' + inner + '\n```'
      const text = full.slice(0, start) + insert + full.slice(end)
      const selStart = start + 4 // ```\n
      return { text, selStart, selEnd: selStart + inner.length }
    })

  const insertTable = () =>
    insertText('| Başlık | Başlık |\n| --- | --- |\n| Hücre | Hücre |\n')

  const doCut = () => { editorRef.current?.focus(); document.execCommand('cut') }
  const doCopy = () => { editorRef.current?.focus(); document.execCommand('copy') }
  const doPaste = async () => {
    try {
      const txt = await navigator.clipboard.readText()
      if (txt) insertText(txt)
    } catch {
      addToast({ message: 'Pano okunamadı', type: 'error' })
    }
  }
  const selectAll = () => { editorRef.current?.focus(); editorRef.current?.select() }

  // Menü aksiyonunu çalıştırıp menüyü kapatır
  const run = (action: () => void) => {
    action()
    setMenu(null)
    setOpenSub(null)
  }

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    // Menü ekran dışına taşmasın diye konumu sınırla
    const x = Math.min(e.clientX, window.innerWidth - 230)
    const y = Math.min(e.clientY, window.innerHeight - 380)
    setMenu({ x, y })
    setOpenSub(null)
  }

  useEffect(() => {
    if (!menu) return
    const close = () => { setMenu(null); setOpenSub(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Liste önizlemesi: ilk dolu satır, markdown işaretleri ayıklanmış
  const previewLine = (c: string) => {
    const line = (c || '').split('\n').find((l) => l.trim()) || ''
    return line.replace(/^[#>\-*\d.\s[\]x]+/i, '').trim()
  }

  const wordCount = activeNote ? (activeNote.content.trim().match(/\S+/g)?.length ?? 0) : 0
  const charCount = activeNote ? activeNote.content.length : 0

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header notes-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <h1 className="page-title">{t('notes.title')}</h1>
        </div>
      </div>

      <div className="notes-workspace">
        {/* Sol: dosya gezgini */}
        <aside className="notes-sidebar">
          <div className="notes-sidebar-head">
            <span className="notes-sidebar-label">
              {t('notes.title')}
              <span className="notes-count">{notes.length}</span>
            </span>
            <button className="notes-icon-btn" onClick={createNote} title={t('notes.newNote')}>
              <Plus size={16} />
            </button>
          </div>

          <div className="notes-search">
            <Search size={14} />
            <input
              type="text"
              placeholder={t('notes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="notes-list">
            {filteredNotes.length === 0 ? (
              <div className="notes-list-empty">{t('notes.noNotes')}</div>
            ) : (
              filteredNotes.map((n) => {
                const preview = previewLine(n.content)
                return (
                  <div
                    key={n.id}
                    className={`note-item ${n.id === activeNoteId ? 'active' : ''}`}
                    onClick={() => setActiveNoteId(n.id)}
                  >
                    <span className="note-item-icon">
                      {n.isSnippet ? <Code size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="note-item-body">
                      <span className="note-item-title">{n.title || t('notes.untitled')}</span>
                      <span className="note-item-snippet">{preview || t('notes.untitled')}</span>
                    </span>
                    <button
                      className="note-item-del"
                      title={t('notes.delete') || 'Sil'}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(n.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* Sağ: editör */}
        {activeNote ? (
          <section className="notes-editor-pane">
            <input
              type="text"
              className="notes-title-input"
              value={activeNote.title}
              onChange={(e) => updateTitle(e.target.value)}
              placeholder={t('notes.untitled')}
            />
            <textarea
              ref={editorRef}
              className="obsidian-editor"
              spellCheck={false}
              placeholder={t('notes.contentPlaceholder') || 'Yazmaya başla… (sağ tıkla biçimlendir)'}
              value={activeNote.content}
              onChange={(e) => updateContent(e.target.value)}
              onContextMenu={openMenu}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                  e.preventDefault()
                  handleSave()
                }
              }}
            />
            <div className="notes-statusbar">
              <span>{wordCount} kelime</span>
              <span className="notes-statusbar-dot">·</span>
              <span>{charCount} karakter</span>
              <span className="notes-saved">
                <Check size={12} /> Otomatik kaydedildi
              </span>
            </div>
          </section>
        ) : (
          <section className="notes-editor-pane notes-empty-pane">
            <FileText size={40} />
            <h3>{t('notes.noNotes')}</h3>
            <p>{t('notes.createFirst')}</p>
            <button className="btn btn-primary btn-sm" onClick={createNote}>
              <Plus size={15} /> {t('notes.newNote')}
            </button>
          </section>
        )}
      </div>

      {/* ============ OBSIDIAN BENZERİ SAĞ TIK MENÜSÜ ============ */}
      {menu && (
        <>
          <div
            className="ctx-backdrop"
            onMouseDown={() => { setMenu(null); setOpenSub(null) }}
            onContextMenu={(e) => { e.preventDefault(); setMenu(null); setOpenSub(null) }}
          />
          <div
            className="ctx-menu animate-fade-in"
            style={{ top: menu.y, left: menu.x }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(() => wrap('[[', ']]', 'not adı'))}>
              <Link2 size={15} /> Bağlantı ekle
            </button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(insertExternalLink)}>
              <ExternalLink size={15} /> Dış bağlantı ekle
            </button>

            <div className="ctx-sep" />

            {/* Biçimlendirme */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('format')}>
              <Highlighter size={15} /> Biçimlendirme
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'format' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onClick={() => run(() => wrap('**', '**', 'kalın'))}><Bold size={15} /> Kalın</button>
                  <button className="ctx-item" onClick={() => run(() => wrap('*', '*', 'italik'))}><Italic size={15} /> İtalik</button>
                  <button className="ctx-item" onClick={() => run(() => wrap('~~', '~~', 'metin'))}><Strikethrough size={15} /> Üstü çizili</button>
                  <button className="ctx-item" onClick={() => run(() => wrap('==', '==', 'vurgu'))}><Highlighter size={15} /> Vurgula</button>
                  <button className="ctx-item" onClick={() => run(() => wrap('`', '`', 'kod'))}><Code size={15} /> Satır içi kod</button>
                </div>
              )}
            </div>

            {/* Paragraf */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('paragraph')}>
              <Type size={15} /> Paragraf
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'paragraph' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onClick={() => run(() => linePrefix('# '))}><Heading1 size={15} /> Başlık 1</button>
                  <button className="ctx-item" onClick={() => run(() => linePrefix('## '))}><Heading2 size={15} /> Başlık 2</button>
                  <button className="ctx-item" onClick={() => run(() => linePrefix('### '))}><Heading3 size={15} /> Başlık 3</button>
                  <div className="ctx-sep" />
                  <button className="ctx-item" onClick={() => run(() => linePrefix('> '))}><Quote size={15} /> Alıntı</button>
                  <button className="ctx-item" onClick={() => run(() => linePrefix('- '))}><List size={15} /> Madde listesi</button>
                  <button className="ctx-item" onClick={() => run(() => linePrefix('1. '))}><ListOrdered size={15} /> Numaralı liste</button>
                  <button className="ctx-item" onClick={() => run(() => linePrefix('- [ ] '))}><ListChecks size={15} /> Görev listesi</button>
                </div>
              )}
            </div>

            {/* Ekle */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('insert')}>
              <Plus size={15} /> Ekle
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'insert' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onClick={() => run(insertTable)}><Table size={15} /> Tablo</button>
                  <button className="ctx-item" onClick={() => run(insertCodeBlock)}><SquareCode size={15} /> Kod bloğu</button>
                  <button className="ctx-item" onClick={() => run(() => insertText('\n---\n'))}><Minus size={15} /> Yatay çizgi</button>
                </div>
              )}
            </div>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(doCut)}><Scissors size={15} /> Kes</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(doCopy)}><Copy size={15} /> Kopyala</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(doPaste)}><ClipboardPaste size={15} /> Yapıştır</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(doPaste)}><Type size={15} /> Düz metin olarak yapıştır</button>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onClick={() => run(selectAll)}><TextSelect size={15} /> Tümünü seç</button>
          </div>
        </>
      )}
    </div>
  )
}
