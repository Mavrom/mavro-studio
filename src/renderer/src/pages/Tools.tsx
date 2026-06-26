import { useMemo, useState } from 'react'
import { useAppStore } from '../store'
import {
  Category, Swap, Hash, Scan, TimeCircle, Password,
  Paper, Search, Copy, Refresh, ArrowRight
} from '../components/icons/iconly'

/* ──────────────────────────────────────────────────────────────
 *  Araçlar sayfası — tamamı çevrimdışı çalışan gerçek yardımcılar.
 *  Her araç bağımsız bir bileşendir; sol listeden seçilir.
 * ────────────────────────────────────────────────────────────── */

type ToolId =
  | 'base64' | 'json' | 'uuid' | 'hash' | 'color' | 'timestamp'
  | 'case' | 'password' | 'numbase' | 'counter' | 'lorem' | 'url'

interface ToolDef {
  id: ToolId
  title: string
  desc: string
  icon: React.ReactNode
}

function useCopy() {
  const { addToast, t } = useAppStore()
  return (value: string) => {
    if (!value) return
    navigator.clipboard.writeText(value).then(
      () => addToast({ message: t('tools.copied'), type: 'success' }),
      () => addToast({ message: t('tools.copyFailed'), type: 'error' })
    )
  }
}

function Field({
  label, children, onCopy
}: { label: string; children: React.ReactNode; onCopy?: () => void }) {
  return (
    <div className="form-group" style={{ marginBottom: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="form-label">{label}</label>
        {onCopy && (
          <button type="button" className="tool-copy-btn" onClick={onCopy} title="Kopyala">
            <Copy size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Base64 ── */
function Base64Tool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [text, setText] = useState('')
  const encoded = useMemo(() => {
    try { return text ? btoa(unescape(encodeURIComponent(text))) : '' } catch { return '⚠︎' }
  }, [text])
  const decoded = useMemo(() => {
    try { return text ? decodeURIComponent(escape(atob(text.trim()))) : '' } catch { return '' }
  }, [text])
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input" rows={4} value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </Field>
      <Field label={`Base64 (${t('tools.encode')})`} onCopy={() => copy(encoded)}>
        <textarea className="input input-mono" rows={3} readOnly value={encoded} />
      </Field>
      <Field label={`${t('tools.decode')}`} onCopy={() => copy(decoded)}>
        <textarea className="input input-mono" rows={3} readOnly value={decoded} placeholder={t('tools.decodeHint')} />
      </Field>
    </div>
  )
}

/* ── JSON formatlayıcı ── */
function JsonTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [raw, setRaw] = useState('')
  const [indent, setIndent] = useState(2)
  const result = useMemo(() => {
    if (!raw.trim()) return { ok: true, out: '', msg: '' }
    try {
      const parsed = JSON.parse(raw)
      return { ok: true, out: JSON.stringify(parsed, null, indent), msg: t('tools.jsonValid') }
    } catch (e) {
      return { ok: false, out: '', msg: (e as Error).message }
    }
  }, [raw, indent, t])
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input input-mono" rows={5} value={raw} onChange={e => setRaw(e.target.value)} placeholder='{"key":"value"}' style={{ resize: 'vertical' }} />
      </Field>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <label className="form-label" style={{ margin: 0 }}>{t('tools.indent')}</label>
        <select className="select" style={{ width: 'auto' }} value={indent} onChange={e => setIndent(Number(e.target.value))}>
          <option value={2}>2</option>
          <option value={4}>4</option>
          <option value={0}>Minify</option>
        </select>
        <span className={result.ok ? 'tool-badge ok' : 'tool-badge err'}>{raw.trim() ? result.msg : '—'}</span>
      </div>
      <Field label={t('tools.output')} onCopy={() => copy(result.out)}>
        <textarea className="input input-mono" rows={6} readOnly value={result.out} />
      </Field>
    </div>
  )
}

/* ── UUID üretici ── */
function UuidTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [count, setCount] = useState(5)
  const [list, setList] = useState<string[]>(() => Array.from({ length: 5 }, () => crypto.randomUUID()))
  const gen = () => setList(Array.from({ length: Math.max(1, Math.min(100, count)) }, () => crypto.randomUUID()))
  return (
    <div className="tool-stack">
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t('tools.count')}</label>
          <input type="number" className="input" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <button className="btn btn-primary" onClick={gen}><Refresh size={15} /> {t('tools.generate')}</button>
        <button className="btn btn-secondary" onClick={() => copy(list.join('\n'))}><Copy size={15} /> {t('tools.copyAll')}</button>
      </div>
      <div className="tool-result-list">
        {list.map((u, i) => (
          <button key={i} className="tool-result-row" onClick={() => copy(u)}>
            <span className="font-mono">{u}</span>
            <Copy size={13} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Hash üretici (SHA) ── */
function HashTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [text, setText] = useState('')
  const [hashes, setHashes] = useState<{ algo: string; value: string }[]>([])
  const run = async () => {
    const enc = new TextEncoder().encode(text)
    const algos: { name: string; algo: AlgorithmIdentifier }[] = [
      { name: 'SHA-1', algo: 'SHA-1' },
      { name: 'SHA-256', algo: 'SHA-256' },
      { name: 'SHA-384', algo: 'SHA-384' },
      { name: 'SHA-512', algo: 'SHA-512' }
    ]
    const out = await Promise.all(algos.map(async a => {
      const buf = await crypto.subtle.digest(a.algo, enc)
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      return { algo: a.name, value: hex }
    }))
    setHashes(out)
  }
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input" rows={3} value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </Field>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={run}><Hash size={15} /> {t('tools.generate')}</button>
      <div className="tool-stack">
        {hashes.map(h => (
          <Field key={h.algo} label={h.algo} onCopy={() => copy(h.value)}>
            <input className="input input-mono" readOnly value={h.value} />
          </Field>
        ))}
      </div>
    </div>
  )
}

/* ── Renk dönüştürücü ── */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}
function ColorTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [hex, setHex] = useState('#4F8FFF')
  const rgb = hexToRgb(hex)
  const rgbStr = rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : '—'
  const hslStr = rgb ? (() => { const [h, s, l] = rgbToHsl(...rgb); return `hsl(${h}, ${s}%, ${l}%)` })() : '—'
  return (
    <div className="tool-stack">
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <input type="color" value={rgb ? hex : '#000000'} onChange={e => setHex(e.target.value)} className="tool-color-input" />
        <div className="tool-color-preview" style={{ background: rgb ? hex : 'transparent' }} />
        <input className="input input-mono" value={hex} onChange={e => setHex(e.target.value)} style={{ maxWidth: 160 }} />
      </div>
      <Field label="RGB" onCopy={() => copy(rgbStr)}><input className="input input-mono" readOnly value={rgbStr} /></Field>
      <Field label="HSL" onCopy={() => copy(hslStr)}><input className="input input-mono" readOnly value={hslStr} /></Field>
      <div className="form-hint">{t('tools.colorHint')}</div>
    </div>
  )
}

/* ── Zaman damgası ── */
function TimestampTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [unix, setUnix] = useState(() => Math.floor(Date.now() / 1000).toString())
  const [iso, setIso] = useState('')
  const fromUnix = () => {
    const n = Number(unix)
    if (!isNaN(n)) setIso(new Date(n * (unix.length > 10 ? 1 : 1000)).toLocaleString())
  }
  const now = () => {
    const ts = Math.floor(Date.now() / 1000)
    setUnix(ts.toString())
    setIso(new Date().toLocaleString())
  }
  return (
    <div className="tool-stack">
      <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={now}><TimeCircle size={15} /> {t('tools.now')}</button>
      <Field label="Unix Timestamp" onCopy={() => copy(unix)}>
        <input className="input input-mono" value={unix} onChange={e => setUnix(e.target.value)} />
      </Field>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={fromUnix}><ArrowRight size={15} /> {t('tools.convert')}</button>
      <Field label={t('tools.humanDate')} onCopy={() => copy(iso)}>
        <input className="input" readOnly value={iso} />
      </Field>
    </div>
  )
}

/* ── Büyük/küçük harf dönüştürücü ── */
function toTitle(s: string) { return s.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()) }
function toCamel(s: string) { return s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase()) }
function toSnake(s: string) { return s.trim().replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase() }
function toKebab(s: string) { return s.trim().replace(/\s+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() }
function CaseTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [text, setText] = useState('')
  const rows: [string, string][] = [
    ['UPPERCASE', text.toUpperCase()],
    ['lowercase', text.toLowerCase()],
    ['Title Case', toTitle(text)],
    ['camelCase', toCamel(text)],
    ['snake_case', toSnake(text)],
    ['kebab-case', toKebab(text)]
  ]
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input" rows={3} value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </Field>
      {rows.map(([label, val]) => (
        <Field key={label} label={label} onCopy={() => copy(val)}>
          <input className="input" readOnly value={val} />
        </Field>
      ))}
    </div>
  )
}

/* ── Şifre üretici ── */
function PasswordTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [len, setLen] = useState(16)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [nums, setNums] = useState(true)
  const [syms, setSyms] = useState(true)
  const [pw, setPw] = useState('')
  const gen = () => {
    let set = ''
    if (upper) set += 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    if (lower) set += 'abcdefghijkmnpqrstuvwxyz'
    if (nums) set += '23456789'
    if (syms) set += '!@#$%^&*()-_=+[]{}'
    if (!set) { setPw(''); return }
    const arr = new Uint32Array(len)
    crypto.getRandomValues(arr)
    setPw(Array.from(arr, n => set[n % set.length]).join(''))
  }
  const strength = pw.length >= 16 ? t('tools.strong') : pw.length >= 10 ? t('tools.medium') : t('tools.weak')
  return (
    <div className="tool-stack">
      <Field label={`${t('tools.length')}: ${len}`}>
        <input type="range" min={6} max={48} value={len} onChange={e => setLen(Number(e.target.value))} style={{ width: '100%' }} />
      </Field>
      <div className="tool-checks">
        <label><input type="checkbox" checked={upper} onChange={e => setUpper(e.target.checked)} /> A-Z</label>
        <label><input type="checkbox" checked={lower} onChange={e => setLower(e.target.checked)} /> a-z</label>
        <label><input type="checkbox" checked={nums} onChange={e => setNums(e.target.checked)} /> 0-9</label>
        <label><input type="checkbox" checked={syms} onChange={e => setSyms(e.target.checked)} /> !@#</label>
      </div>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={gen}><Password size={15} /> {t('tools.generate')}</button>
      <Field label={`${t('tools.result')}${pw ? ' · ' + strength : ''}`} onCopy={() => copy(pw)}>
        <input className="input input-mono" readOnly value={pw} style={{ fontSize: 'var(--font-lg)' }} />
      </Field>
    </div>
  )
}

/* ── Sayı tabanı dönüştürücü ── */
function NumBaseTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [dec, setDec] = useState('255')
  const n = parseInt(dec, 10)
  const valid = !isNaN(n)
  return (
    <div className="tool-stack">
      <Field label={t('tools.decimal')}>
        <input className="input input-mono" value={dec} onChange={e => setDec(e.target.value.replace(/[^0-9-]/g, ''))} />
      </Field>
      <Field label="Binary" onCopy={() => valid && copy(n.toString(2))}><input className="input input-mono" readOnly value={valid ? n.toString(2) : '—'} /></Field>
      <Field label="Octal" onCopy={() => valid && copy(n.toString(8))}><input className="input input-mono" readOnly value={valid ? n.toString(8) : '—'} /></Field>
      <Field label="Hex" onCopy={() => valid && copy(n.toString(16).toUpperCase())}><input className="input input-mono" readOnly value={valid ? n.toString(16).toUpperCase() : '—'} /></Field>
    </div>
  )
}

/* ── Metin sayacı ── */
function CounterTool() {
  const { t } = useAppStore()
  const [text, setText] = useState('')
  const words = text.trim() ? (text.trim().match(/\S+/g)?.length ?? 0) : 0
  const chars = text.length
  const charsNoSpace = text.replace(/\s/g, '').length
  const lines = text ? text.split('\n').length : 0
  const sentences = text.trim() ? (text.match(/[.!?]+/g)?.length ?? 0) : 0
  const readMin = Math.max(1, Math.ceil(words / 200))
  const stats: [string, string | number][] = [
    [t('tools.words'), words], [t('tools.chars'), chars],
    [t('tools.charsNoSpace'), charsNoSpace], [t('tools.lines'), lines],
    [t('tools.sentences'), sentences], [t('tools.readTime'), `~${readMin} dk`]
  ]
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input" rows={6} value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </Field>
      <div className="tool-stat-grid">
        {stats.map(([label, val]) => (
          <div key={label} className="tool-stat">
            <span className="tool-stat-value">{val}</span>
            <span className="tool-stat-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Lorem ipsum ── */
const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident'.split(' ')
function LoremTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [paras, setParas] = useState(3)
  const [out, setOut] = useState('')
  const gen = () => {
    const make = () => {
      const len = 30 + Math.floor(Math.random() * 30)
      const w = Array.from({ length: len }, () => LOREM[Math.floor(Math.random() * LOREM.length)])
      const s = w.join(' ')
      return s[0].toUpperCase() + s.slice(1) + '.'
    }
    setOut(Array.from({ length: Math.max(1, paras) }, make).join('\n\n'))
  }
  return (
    <div className="tool-stack">
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">{t('tools.paragraphs')}</label>
          <input type="number" className="input" min={1} max={20} value={paras} onChange={e => setParas(Number(e.target.value))} style={{ width: 120 }} />
        </div>
        <button className="btn btn-primary" onClick={gen}><Paper size={15} /> {t('tools.generate')}</button>
        <button className="btn btn-secondary" onClick={() => copy(out)}><Copy size={15} /> {t('tools.copy')}</button>
      </div>
      <textarea className="input" rows={8} readOnly value={out} style={{ resize: 'vertical' }} />
    </div>
  )
}

/* ── URL encode/decode ── */
function UrlTool() {
  const { t } = useAppStore()
  const copy = useCopy()
  const [text, setText] = useState('')
  let enc = '', dec = ''
  try { enc = text ? encodeURIComponent(text) : '' } catch { enc = '⚠︎' }
  try { dec = text ? decodeURIComponent(text) : '' } catch { dec = '' }
  return (
    <div className="tool-stack">
      <Field label={t('tools.input')}>
        <textarea className="input" rows={3} value={text} onChange={e => setText(e.target.value)} style={{ resize: 'vertical' }} />
      </Field>
      <Field label={t('tools.encode')} onCopy={() => copy(enc)}><textarea className="input input-mono" rows={2} readOnly value={enc} /></Field>
      <Field label={t('tools.decode')} onCopy={() => copy(dec)}><textarea className="input input-mono" rows={2} readOnly value={dec} /></Field>
    </div>
  )
}

const TOOL_COMPONENTS: Record<ToolId, () => React.ReactElement> = {
  base64: Base64Tool, json: JsonTool, uuid: UuidTool, hash: HashTool,
  color: ColorTool, timestamp: TimestampTool, case: CaseTool, password: PasswordTool,
  numbase: NumBaseTool, counter: CounterTool, lorem: LoremTool, url: UrlTool
}

export default function Tools() {
  const { t } = useAppStore()
  const [active, setActive] = useState<ToolId>('base64')
  const [query, setQuery] = useState('')

  const tools: ToolDef[] = [
    { id: 'base64', title: t('tools.base64'), desc: t('tools.base64Desc'), icon: <Swap size={18} /> },
    { id: 'json', title: t('tools.jsonFormatter'), desc: t('tools.jsonFormatterDesc'), icon: <Paper size={18} /> },
    { id: 'uuid', title: t('tools.uuidGenerator'), desc: t('tools.uuidGeneratorDesc'), icon: <Hash size={18} /> },
    { id: 'hash', title: t('tools.hashGenerator'), desc: t('tools.hashGeneratorDesc'), icon: <Scan size={18} /> },
    { id: 'color', title: t('tools.colorPicker'), desc: t('tools.colorPickerDesc'), icon: <Category size={18} /> },
    { id: 'timestamp', title: t('tools.timestampConverter'), desc: t('tools.timestampConverterDesc'), icon: <TimeCircle size={18} /> },
    { id: 'case', title: t('tools.caseConverter'), desc: t('tools.caseConverterDesc'), icon: <Paper size={18} /> },
    { id: 'password', title: t('tools.passwordGenerator'), desc: t('tools.passwordGeneratorDesc'), icon: <Password size={18} /> },
    { id: 'numbase', title: t('tools.numBase'), desc: t('tools.numBaseDesc'), icon: <Hash size={18} /> },
    { id: 'counter', title: t('tools.textCounter'), desc: t('tools.textCounterDesc'), icon: <Paper size={18} /> },
    { id: 'lorem', title: t('tools.lorem'), desc: t('tools.loremDesc'), icon: <Paper size={18} /> },
    { id: 'url', title: t('tools.urlEncoder'), desc: t('tools.urlEncoderDesc'), icon: <Swap size={18} /> }
  ]

  const filtered = tools.filter(tool =>
    tool.title.toLowerCase().includes(query.toLowerCase()) ||
    tool.desc.toLowerCase().includes(query.toLowerCase())
  )
  const ActiveComp = TOOL_COMPONENTS[active]
  const activeDef = tools.find(tl => tl.id === active)!

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div className="page-header-icon"><Category size={22} /></div>
          <div>
            <h1 className="page-title">{t('tools.title')}</h1>
            <p className="page-subtitle">{t('tools.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="tools-layout">
        {/* Sol: araç listesi */}
        <aside className="tools-sidebar">
          <div className="notes-search" style={{ margin: 0 }}>
            <Search size={14} />
            <input type="text" placeholder={t('tools.search')} value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="tools-list">
            {filtered.map(tool => (
              <button
                key={tool.id}
                className={`tool-list-item ${tool.id === active ? 'active' : ''}`}
                onClick={() => setActive(tool.id)}
              >
                <span className="tool-list-icon">{tool.icon}</span>
                <span className="tool-list-body">
                  <span className="tool-list-title">{tool.title}</span>
                  <span className="tool-list-desc">{tool.desc}</span>
                </span>
              </button>
            ))}
            {filtered.length === 0 && <div className="notes-list-empty">{t('common.noData')}</div>}
          </div>
        </aside>

        {/* Sağ: aktif araç */}
        <section className="tools-content">
          <div className="card tool-panel">
            <div className="tool-panel-head">
              <span className="tool-list-icon">{activeDef.icon}</span>
              <div>
                <h2 className="card-title">{activeDef.title}</h2>
                <p className="card-description">{activeDef.desc}</p>
              </div>
            </div>
            <div className="tool-panel-body">
              <ActiveComp />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
