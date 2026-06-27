import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { loadData, saveData } from '../lib/cloudData'
import {
  Search, Plus, Trash2, FileText, Check,
  Link2, ExternalLink, Bold, Italic, Underline, Strikethrough, Highlighter, Code,
  Heading1, Heading2, Heading3, Quote, List, ListOrdered, ListChecks,
  Table, SquareCode, Minus, Scissors, Copy, ClipboardPaste, Type, TextSelect,
  ChevronRight, CaseSensitive, ArrowDownUp
} from 'lucide-react'
import { Bookmark, Download, Show, Copy as CopyIcon } from '../components/icons/iconly'

interface Note {
  id: string
  title: string
  content: string
  isSnippet: boolean
  updatedAt: string
  format?: 'html'
  pinned?: boolean
}

type SortBy = 'default' | 'titleAsc' | 'titleDesc'

// Basit HTML → Markdown dönüştürücü (dışa aktarma için)
function htmlToMarkdown(html: string): string {
  let md = html
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
  md = md.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
  md = md.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
  md = md.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  md = md.replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<\/(p|div|h[1-6]|ul|ol|tr)>/gi, '\n')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<[^>]+>/g, '')
  md = md.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  return md.replace(/\n{3,}/g, '\n\n').trim()
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function safeFileName(name: string): string {
  return (name || 'not').replace(/[^a-z0-9çğıöşü _-]/gi, '').trim().slice(0, 60) || 'not'
}

// Mevcut (eski) markdown notları tek seferlik HTML'e çevirmek için.
function markdownToHtml(md: string): string {
  if (!md) return ''

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const codeBlocks: string[] = []
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    const id = `__CODE_BLOCK_${codeBlocks.length}__`
    codeBlocks.push(code.trim())
    return id
  })

  const inlineCodes: string[] = []
  html = html.replace(/`([^`\n]+)`/g, (_, code) => {
    const id = `__INLINE_CODE_${inlineCodes.length}__`
    inlineCodes.push(code)
    return id
  })

  html = html.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, noteTitle, customLabel) => {
    const title = noteTitle.trim()
    const label = (customLabel || title).trim()
    return `<a href="#" class="wiki-link" data-note-title="${title}">${label}</a>`
  })

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>')
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote>$1</blockquote>')
  html = html.replace(/^- \[ \] (.*?)$/gm, '<li><input type="checkbox" disabled /> $1</li>')
  html = html.replace(/^- \[x\] (.*?)$/gm, '<li><input type="checkbox" checked disabled /> $1</li>')
  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>')
  html = html.replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')

  inlineCodes.forEach((code, index) => {
    html = html.replace(`__INLINE_CODE_${index}__`, `<code>${code}</code>`)
  })
  codeBlocks.forEach((code, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, `<pre><code>${code}</code></pre>`)
  })

  const lines = html.split('\n')
  let out = ''
  let inList = false
  lines.forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('<li>')) {
      if (!inList) { out += '<ul>'; inList = true }
      out += line
    } else {
      if (inList) { out += '</ul>'; inList = false }
      if (trimmed === '') {
        out += '<p><br></p>'
      } else if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<hr')
      ) {
        out += line
      } else {
        out += `<p>${line}</p>`
      }
    }
  })
  if (inList) out += '</ul>'
  return out
}

const FONT_OPTIONS = [
  { label: 'Varsayılan', value: 'var(--font-sans)' },
  { label: 'Serif (Georgia)', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier (monospace)', value: '"Courier New", monospace' },
  { label: 'Comic Sans', value: '"Comic Sans MS", cursive' }
]

const SIZE_OPTIONS = [
  { label: 'Çok küçük', value: '12px' },
  { label: 'Küçük', value: '14px' },
  { label: 'Normal', value: '16px' },
  { label: 'Büyük', value: '20px' },
  { label: 'Çok büyük', value: '26px' },
  { label: 'Dev', value: '34px' }
]

export default function Notes() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [notes, setNotes] = useState<Note[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string>('1')
  const [loaded, setLoaded] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [openSub, setOpenSub] = useState<string | null>(null)
  const [isPreview, setIsPreview] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('default')
  const [showExport, setShowExport] = useState(false)

  const today = () => {
    const d = new Date()
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`
  }

  // Eski markdown notlarını HTML'e taşır (tek sefer)
  const migrate = (arr: Note[]): Note[] =>
    arr.map((n) =>
      n.format === 'html' ? n : { ...n, content: markdownToHtml(n.content || ''), format: 'html' as const }
    )

  useEffect(() => {
    const load = async () => {
      const cloud = await loadData<Note>('notes')
      if (cloud.length > 0) {
        const m = migrate(cloud)
        setNotes(m)
        setActiveNoteId(m[0].id)
      } else {
        const local = window.api ? ((await window.api.getData('notes')) as Note[]) : []
        if (local && local.length > 0) {
          const m = migrate(local)
          setNotes(m)
          setActiveNoteId(m[0].id)
          saveData('notes', m)
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

  // Not değiştiğinde / düzenlemeye geçildiğinde editör içeriğini bir kez yükle.
  // (Yazarken çalışmaz; aksi halde imleç başa atlar.)
  useEffect(() => {
    if (!loaded || isPreview) return
    if (editorRef.current) {
      editorRef.current.innerHTML = activeNote?.content || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNoteId, loaded, isPreview])

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
    const newNote: Note = {
      id: Date.now().toString(),
      title: t('notes.untitled'),
      content: '',
      isSnippet: false,
      updatedAt: today(),
      format: 'html'
    }
    setNotes([newNote, ...notes])
    setActiveNoteId(newNote.id)
    addToast({ message: 'Yeni not oluşturuldu', type: 'success' })
  }

  // Editördeki HTML'i state'e yazar (editörü yeniden render etmeden).
  const handleInput = () => {
    const el = editorRef.current
    if (!el) return
    const html = el.innerHTML
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNoteId ? { ...n, content: html, updatedAt: today(), format: 'html' } : n))
    )
  }

  const updateTitle = (val: string) => {
    setNotes(notes.map((n) => (n.id === activeNoteId ? { ...n, title: val } : n)))
  }

  const togglePin = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)))
  }

  const toggleSnippet = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, isSnippet: !n.isSnippet } : n)))
  }

  const duplicateNote = (id: string) => {
    const src = notes.find((n) => n.id === id)
    if (!src) return
    const copy: Note = {
      ...src,
      id: Date.now().toString(),
      title: `${src.title} (kopya)`,
      pinned: false,
      updatedAt: today()
    }
    setNotes([copy, ...notes])
    setActiveNoteId(copy.id)
    addToast({ message: 'Not çoğaltıldı', type: 'success' })
  }

  const exportNote = (fmt: 'html' | 'md') => {
    if (!activeNote) return
    const base = safeFileName(activeNote.title)
    if (fmt === 'html') {
      const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${activeNote.title}</title></head><body>${activeNote.content || ''}</body></html>`
      downloadFile(`${base}.html`, doc, 'text/html')
    } else {
      const md = `# ${activeNote.title}\n\n${htmlToMarkdown(activeNote.content || '')}`
      downloadFile(`${base}.md`, md, 'text/markdown')
    }
    setShowExport(false)
    addToast({ message: t('notes.exported'), type: 'success' })
  }

  // ============ WYSIWYG BİÇİMLENDİRME ============
  const exec = (cmd: string, val?: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    try { document.execCommand('styleWithCSS', false, 'true') } catch { /* yoksay */ }
    document.execCommand(cmd, false, val)
    handleInput()
  }

  // Seçimi verilen etiketle (gerekirse stil) sarar — font boyutu, satır içi kod vb.
  const wrapInline = (tag: string, style?: Partial<CSSStyleDeclaration>) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) {
      addToast({ message: 'Önce metin seçin', type: 'info' })
      return
    }
    const node = document.createElement(tag)
    if (style) Object.assign(node.style, style)
    node.appendChild(range.extractContents())
    range.insertNode(node)
    sel.removeAllRanges()
    const r = document.createRange()
    r.selectNodeContents(node)
    sel.addRange(r)
    handleInput()
  }

  const insertHTML = (html: string) => exec('insertHTML', html)

  const applyFont = (font: string) => {
    if (font === 'var(--font-sans)') {
      wrapInline('span', { fontFamily: 'var(--font-sans)' })
    } else {
      wrapInline('span', { fontFamily: font })
    }
  }
  const applyFontSize = (size: string) => wrapInline('span', { fontSize: size })

  const insertWikiLink = () => {
    const sel = window.getSelection()?.toString().trim() || 'not adı'
    insertHTML(`<a href="#" class="wiki-link" data-note-title="${sel}">${sel}</a>&nbsp;`)
  }
  const insertExternalLink = () => {
    const sel = window.getSelection()?.toString().trim() || 'metin'
    const href = sel.startsWith('http') ? sel : 'https://'
    insertHTML(`<a href="${href}" target="_blank" rel="noopener noreferrer">${sel}</a>&nbsp;`)
  }

  const insertTable = () =>
    insertHTML(
      '<table class="md-table"><thead><tr><th>Başlık</th><th>Başlık</th></tr></thead>' +
      '<tbody><tr><td>Hücre</td><td>Hücre</td></tr><tr><td>Hücre</td><td>Hücre</td></tr></tbody></table><p><br></p>'
    )
  const insertCodeBlock = () => insertHTML('<pre><code>kod</code></pre><p><br></p>')
  const insertTaskList = () => insertHTML('<ul><li><input type="checkbox" /> görev</li></ul>')

  const doCut = () => exec('cut')
  const doCopy = () => exec('copy')
  const doPaste = async () => {
    try {
      const txt = await navigator.clipboard.readText()
      if (txt) exec('insertText', txt)
    } catch {
      addToast({ message: 'Pano okunamadı', type: 'error' })
    }
  }
  const selectAll = () => exec('selectAll')

  const run = (action: () => void) => {
    action()
    setMenu(null)
    setOpenSub(null)
  }

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const x = Math.min(e.clientX, window.innerWidth - 240)
    const y = Math.min(e.clientY, window.innerHeight - 430)
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

  const filteredNotes = notes
    .filter((n) => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      // Sabitlenmiş notlar her zaman üstte
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
      if (sortBy === 'titleAsc') return a.title.localeCompare(b.title)
      if (sortBy === 'titleDesc') return b.title.localeCompare(a.title)
      return 0
    })

  // Liste önizlemesi: HTML etiketleri ayıklanmış ilk metin
  const previewLine = (c: string) =>
    (c || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()

  const plainText = activeNote ? previewLine(activeNote.content) : ''
  const wordCount = plainText ? (plainText.match(/\S+/g)?.length ?? 0) : 0
  const charCount = plainText.length

  const handlePreviewClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('wiki-link')) {
      e.preventDefault()
      const title = target.getAttribute('data-note-title')
      if (title) {
        const found = notes.find((n) => n.title.toLowerCase() === title.toLowerCase())
        if (found) setActiveNoteId(found.id)
        else addToast({ message: `Not bulunamadı: "${title}"`, type: 'info' })
      }
    }
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
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                className="notes-icon-btn"
                onClick={() => setSortBy((s) => (s === 'default' ? 'titleAsc' : s === 'titleAsc' ? 'titleDesc' : 'default'))}
                title={`${t('notes.sort')}: ${t('notes.sort_' + sortBy)}`}
              >
                <ArrowDownUp size={15} />
              </button>
              <button className="notes-icon-btn" onClick={createNote} title={t('notes.newNote')}>
                <Plus size={16} />
              </button>
            </div>
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
                    className={`note-item ${n.id === activeNoteId ? 'active' : ''} ${n.pinned ? 'pinned' : ''}`}
                    onClick={() => setActiveNoteId(n.id)}
                  >
                    <span className="note-item-icon">
                      {n.isSnippet ? <Code size={15} /> : <FileText size={15} />}
                    </span>
                    <span className="note-item-body">
                      <span className="note-item-title">
                        {n.pinned && <Bookmark size={11} />}
                        {n.title || t('notes.untitled')}
                      </span>
                      <span className="note-item-snippet">{preview || t('notes.untitled')}</span>
                    </span>
                    <button
                      className="note-item-del"
                      title={n.pinned ? t('notes.unpin') : t('notes.pin')}
                      onClick={(e) => { e.stopPropagation(); togglePin(n.id) }}
                    >
                      <Bookmark size={13} />
                    </button>
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
              <div className="notes-editor-tools">
                <button
                  className={`notes-tool-btn ${isPreview ? 'active' : ''}`}
                  onClick={() => setIsPreview((p) => !p)}
                  title={t('notes.preview')}
                >
                  <Show size={15} />
                </button>
                <button
                  className={`notes-tool-btn ${activeNote.pinned ? 'active' : ''}`}
                  onClick={() => togglePin(activeNote.id)}
                  title={activeNote.pinned ? t('notes.unpin') : t('notes.pin')}
                >
                  <Bookmark size={15} />
                </button>
                <button
                  className={`notes-tool-btn ${activeNote.isSnippet ? 'active' : ''}`}
                  onClick={() => toggleSnippet(activeNote.id)}
                  title={t('notes.markSnippet')}
                >
                  <Code size={15} />
                </button>
                <button className="notes-tool-btn" onClick={() => duplicateNote(activeNote.id)} title={t('notes.duplicate')}>
                  <CopyIcon size={15} />
                </button>
                <div className="notes-export-wrap">
                  <button className="notes-tool-btn" onClick={() => setShowExport((s) => !s)} title={t('notes.export')}>
                    <Download size={15} />
                  </button>
                  {showExport && (
                    <>
                      <div className="notes-export-backdrop" onClick={() => setShowExport(false)} />
                      <div className="notes-export-menu animate-fade-in">
                        <button onClick={() => exportNote('md')}>Markdown (.md)</button>
                        <button onClick={() => exportNote('html')}>HTML (.html)</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isPreview ? (
              <div
                ref={editorRef}
                className="obsidian-editor markdown-content"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={t('notes.contentPlaceholder') || 'Yazmaya başla… (sağ tıkla biçimlendir)'}
                onInput={handleInput}
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
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: activeNote.content || '' }}
                  onClick={handlePreviewClick}
                />
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

      {/* ============ SAĞ TIK BİÇİMLENDİRME MENÜSÜ ============ */}
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
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(insertWikiLink); }}>
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
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('bold')); }}><Bold size={15} /> Kalın</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('italic')); }}><Italic size={15} /> İtalik</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('underline')); }}><Underline size={15} /> Altı çizili</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('strikeThrough')); }}><Strikethrough size={15} /> Üstü çizili</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('hiliteColor', '#fde68a')); }}><Highlighter size={15} /> Vurgula</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => wrapInline('code')); }}><Code size={15} /> Satır içi kod</button>
                </div>
              )}
            </div>

            {/* Yazı tipi */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('font')}>
              <Type size={15} /> Yazı tipi
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'font' && (
                <div className="ctx-submenu">
                  {FONT_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      className="ctx-item"
                      style={{ fontFamily: f.value }}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => applyFont(f.value)); }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Boyut */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('size')}>
              <CaseSensitive size={15} /> Yazı boyutu
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'size' && (
                <div className="ctx-submenu">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      className="ctx-item"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => applyFontSize(s.value)); }}
                    >
                      <span style={{ fontSize: s.value, lineHeight: 1 }}>A</span> {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Paragraf */}
            <div className="ctx-item has-sub" onMouseEnter={() => setOpenSub('paragraph')}>
              <Type size={15} /> Paragraf
              <ChevronRight size={14} className="ctx-arrow" />
              {openSub === 'paragraph' && (
                <div className="ctx-submenu">
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('formatBlock', 'H1')); }}><Heading1 size={15} /> Başlık 1</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('formatBlock', 'H2')); }}><Heading2 size={15} /> Başlık 2</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('formatBlock', 'H3')); }}><Heading3 size={15} /> Başlık 3</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('formatBlock', 'P')); }}><Type size={15} /> Normal metin</button>
                  <div className="ctx-sep" />
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('formatBlock', 'BLOCKQUOTE')); }}><Quote size={15} /> Alıntı</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('insertUnorderedList')); }}><List size={15} /> Madde listesi</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('insertOrderedList')); }}><ListOrdered size={15} /> Numaralı liste</button>
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(insertTaskList); }}><ListChecks size={15} /> Görev listesi</button>
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
                  <button className="ctx-item" onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(() => exec('insertHorizontalRule')); }}><Minus size={15} /> Yatay çizgi</button>
                </div>
              )}
            </div>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doCut); }}><Scissors size={15} /> Kes</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doCopy); }}><Copy size={15} /> Kopyala</button>
            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(doPaste); }}><ClipboardPaste size={15} /> Yapıştır</button>

            <div className="ctx-sep" />

            <button className="ctx-item" onMouseEnter={() => setOpenSub(null)} onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); run(selectAll); }}><TextSelect size={15} /> Tümünü seç</button>
          </div>
        </>
      )}
    </div>
  )
}
