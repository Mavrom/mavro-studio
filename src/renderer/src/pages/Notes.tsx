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
  const [isPreview, setIsPreview] = useState(false)

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

  const renderMarkdown = (md: string) => {
    if (!md) return <div className="markdown-placeholder">{t('notes.contentPlaceholder') || 'Boş not...'}</div>

    // Escape HTML first to prevent XSS
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // Helper: Code blocks
    const codeBlocks: string[] = []
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`
      codeBlocks.push(code.trim())
      return id
    })

    // Helper: Inline code
    const inlineCodes: string[] = []
    html = html.replace(/`([^`\n]+)`/g, (_, code) => {
      const id = `__INLINE_CODE_${inlineCodes.length}__`
      inlineCodes.push(code)
      return id
    })

    // Parse Wiki Links: [[Note Title]]
    html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, noteTitle, customLabel) => {
      const title = noteTitle.trim()
      const label = (customLabel || title).trim()
      return `<a href="#" class="wiki-link" data-note-title="${title}">${label}</a>`
    })

    // Parse Standard Links: [label](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    // Parse Bold: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    
    // Parse Italic: *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

    // Parse Strikethrough: ~~text~~
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

    // Parse Highlight: ==text==
    html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>')

    // Parse Headings
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')

    // Parse Horizontal Rule
    html = html.replace(/^---$/gm, '<hr />')

    // Parse Blockquotes
    html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>')

    // Parse Lists
    html = html.replace(/^- \[ \] (.*?)$/gm, '<li><input type="checkbox" disabled /> $1</li>')
    html = html.replace(/^- \[x\] (.*?)$/gm, '<li><input type="checkbox" checked disabled /> $1</li>')
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>')
    html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')

    // Re-insert inline codes
    inlineCodes.forEach((code, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, `<code>${code}</code>`)
    })

    // Re-insert code blocks
    codeBlocks.forEach((code, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, `<pre><code>${code}</code></pre>`)
    })

    const lines = html.split('\n')
    let processedHtml = ''
    let inList = false

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('<li>')) {
        if (!inList) {
          processedHtml += '<ul class="markdown-list">'
          inList = true
        }
        processedHtml += line
      } else {
        if (inList) {
          processedHtml += '</ul>'
          inList = false
        }
        if (trimmed === '') {
          processedHtml += '<div class="markdown-para-space"></div>'
        } else if (
          trimmed.startsWith('<h') ||
          trimmed.startsWith('<blockquote') ||
          trimmed.startsWith('<pre') ||
          trimmed.startsWith('<hr')
        ) {
          processedHtml += line
        } else {
          processedHtml += `<p>${line}</p>`
        }
      }
    })
    if (inList) {
      processedHtml += '</ul>'
    }

    return (
      <div 
        className="markdown-content"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.classList.contains('wiki-link')) {
            e.preventDefault()
            const title = target.getAttribute('data-note-title')
            if (title) {
              const found = notes.find(n => n.title.toLowerCase() === title.toLowerCase())
              if (found) {
                setActiveNoteId(found.id)
              } else {
                addToast({ message: `Not bulunamadı: "${title}"`, type: 'info' })
              }
            }
          }
        }}
      />
    )
  }

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
            <div className="notes-editor-header">
              <input
                type="text"
                className="notes-title-input"
                value={activeNote.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder={t('notes.untitled')}
              />
              <div className="notes-editor-actions">
                <button
                  className={`notes-toggle-btn ${!isPreview ? 'active' : ''}`}
                  onClick={() => setIsPreview(false)}
                >
                  <FileText size={14} /> {t('notes.edit', 'Düzenle')}
                </button>
                <button
                  className={`notes-toggle-btn ${isPreview ? 'active' : ''}`}
                  onClick={() => setIsPreview(true)}
                >
                  <Check size={14} /> {t('notes.preview', 'Önizleme')}
                </button>
              </div>
            </div>

            {!isPreview ? (
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
            ) : (
              <div className="obsidian-preview">
                {renderMarkdown(activeNote.content)}
              </div>
            )}

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
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('[[', ']]', 'not adı')); }}>
              <Link2 size={15} /> Bağlantı ekle
            </button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(insertExternalLink); }}>
              <ExternalLink size={15} /> Dış bağlantı ekle
            </button>

            <div className="ctx-sep" />

            {/* Biçimlendirme */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('format')}>
              <Highlighter size={15} /> Biçimlendirme
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'format' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('**', '**', 'kalın')); }}><Bold size={15} /> Kalın</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('*', '*', 'italik')); }}><Italic size={15} /> İtalik</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('~~', '~~', 'metin')); }}><Strikethrough size={15} /> Üstü çizili</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('==', '==', 'vurgu')); }}><Highlighter size={15} /> Vurgula</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrap('`', '`', 'kod')); }}><Code size={15} /> Satır içi kod</button>
                </div>
              )}
            </div>

            {/* Paragraf */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('paragraph')}>
              <Type size={15} /> Paragraf
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'paragraph' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('# ')); }}><Heading1 size={15} /> Başlık 1</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('## ')); }}><Heading2 size={15} /> Başlık 2</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('### ')); }}><Heading3 size={15} /> Başlık 3</button>
                  <div className="ctx-sep" />
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('> ')); }}><Quote size={15} /> Alıntı</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('- ')); }}><List size={15} /> Madde listesi</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('1. ')); }}><ListOrdered size={15} /> Numaralı liste</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => linePrefix('- [ ] ')); }}><ListChecks size={15} /> Görev listesi</button>
                </div>
              )}
            </div>

            {/* Ekle */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('insert')}>
              <Plus size={15} /> Ekle
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'insert' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(insertTable); }}><Table size={15} /> Tablo</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(insertCodeBlock); }}><SquareCode size={15} /> Kod bloğu</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => insertText('\n---\n')); }}><Minus size={15} /> Yatay çizgi</button>
                </div>
              )}
            </div>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doCut); }}><Scissors size={15} /> Kes</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doCopy); }}><Copy size={15} /> Kopyala</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doPaste); }}><ClipboardPaste size={15} /> Yapıştır</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doPaste); }}><Type size={15} /> Düz metin olarak yapıştır</button>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(selectAll); }}><TextSelect size={15} /> Tümünü seç</button>
          </div>
        </>
      )}
    </div>
  )
}
