import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import {
  Search, Plus, Star, Edit, Trash2, Eye, X, ChevronLeft, ChevronRight,
  Folder, FolderOpen, File as FileIcon, ExternalLink, Link2, Hash, Calendar, Clock,
  LayoutGrid
} from 'lucide-react'
import BackButton from '../components/common/BackButton'

export type ProjectStatus = 'draft' | 'production' | 'published' | 'cancelled'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  creator: string
  platform: string
  shootDate: string
  publishDate: string
  viewCount: string
  favorite: boolean
  // Yeni alanlar
  folderPath?: string
  folderCreated?: string
  startDate?: string
  tags?: string[]
  links?: string[]
  createdAt?: string
}

interface DirEntryLite {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modifiedAt: string | null
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    name: '🔍 Hangisi Gerçek Medyum?',
    description: 'HANGİSİ GERÇEK',
    status: 'production',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '2026-04-27',
    publishDate: '2026-05-22',
    viewCount: '6.51K',
    favorite: true,
    tags: ['deneme', 'medyum'],
    links: []
  },
  {
    id: '2',
    name: '🍳 10 Liralık vs 1000 Liralık Menemen',
    description: 'FİYAT KARŞILAŞTIRMASI',
    status: 'published',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '2026-05-10',
    publishDate: '2026-06-01',
    viewCount: '1.2M',
    favorite: true,
    tags: ['yemek'],
    links: []
  },
  {
    id: '3',
    name: '🤫 Gizli Görev: Güvenlikçi Oldum',
    description: 'GİZLİ GÖREV',
    status: 'production',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '2026-06-05',
    publishDate: '2026-06-25',
    viewCount: '450K',
    favorite: false,
    tags: [],
    links: []
  },
  {
    id: '4',
    name: '🤖 Yapay Zeka Hayatımı Yönetiyor',
    description: 'TEKNOLOJİ DENEYLERİ',
    status: 'draft',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '2026-06-20',
    publishDate: '2026-07-05',
    viewCount: '-',
    favorite: false,
    tags: ['ai', 'teknoloji'],
    links: []
  },
  {
    id: '5',
    name: '📦 Çin\'den Gelen En İlginç Ürünler',
    description: 'KUTU AÇILIMI',
    status: 'cancelled',
    creator: 'Orkun Işıtmak',
    platform: 'Instagram Reels',
    shootDate: '2026-04-12',
    publishDate: '2026-04-15',
    viewCount: '89K',
    favorite: false,
    tags: [],
    links: []
  },
  {
    id: '6',
    name: '🏃‍♂️ 24 Saat Boyunca Kaçtım',
    description: 'KOVALAMACA',
    status: 'draft',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '',
    publishDate: '',
    viewCount: '-',
    favorite: false,
    tags: [],
    links: []
  }
]

const COLUMNS: { id: ProjectStatus; labelKey: string; colorClass: string; color: string }[] = [
  { id: 'draft', labelKey: 'projects.draft', colorClass: 'draft', color: '#8b95a5' },
  { id: 'production', labelKey: 'projects.production', colorClass: 'production', color: '#4F8FFF' },
  { id: 'published', labelKey: 'projects.published', colorClass: 'published', color: '#34D399' },
  { id: 'cancelled', labelKey: 'projects.cancelled', colorClass: 'cancelled', color: '#F87171' }
]

const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: '#8b95a5',
  production: '#4F8FFF',
  published: '#34D399',
  cancelled: '#F87171'
}

const VALID_STATUSES: ProjectStatus[] = ['draft', 'production', 'published', 'cancelled']

const COLLAPSE_KEY = 'mavro.kanban.collapsed'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export default function Projects() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [loaded, setLoaded] = useState(false)

  // Drag and Drop state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProjectStatus | null>(null)

  // Collapsed columns
  const [collapsed, setCollapsed] = useState<Set<ProjectStatus>>(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY)
      return raw ? new Set(JSON.parse(raw) as ProjectStatus[]) : new Set()
    } catch {
      return new Set()
    }
  })

  // Detail page
  const [detailId, setDetailId] = useState<string | null>(null)
  const [folderEntries, setFolderEntries] = useState<DirEntryLite[] | null>(null)
  const [folderLoading, setFolderLoading] = useState(false)

  // Modal form state
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState<ProjectStatus>('draft')
  const [formCreator, setFormCreator] = useState('')
  const [formPlatform, setFormPlatform] = useState('YouTube')
  const [formShootDate, setFormShootDate] = useState('')
  const [formPublishDate, setFormPublishDate] = useState('')
  const [formViewCount, setFormViewCount] = useState('')
  const [formFolderPath, setFormFolderPath] = useState('')
  const [formFolderCreated, setFormFolderCreated] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [formLinks, setFormLinks] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [linkInput, setLinkInput] = useState('')
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    const migrate = (list: Project[]) =>
      list.map(p => ({
        ...p,
        // Kaldırılan "Test" sütunundaki projeleri Geliştirme'ye taşı
        status: (VALID_STATUSES.includes(p.status) ? p.status : 'production') as ProjectStatus
      }))
    const load = async () => {
      if (window.api) {
        const saved = await window.api.getData('projects') as Project[]
        setProjects(migrate(saved && saved.length > 0 ? saved : DEFAULT_PROJECTS))
      } else {
        setProjects(migrate(DEFAULT_PROJECTS))
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded && window.api) {
      window.api.setData('projects', projects)
    }
  }, [projects, loaded])

  const detailProject = projects.find(p => p.id === detailId) || null

  // Load folder contents when opening detail
  useEffect(() => {
    let active = true
    const run = async () => {
      if (!detailProject?.folderPath || !window.api) {
        setFolderEntries(null)
        return
      }
      setFolderLoading(true)
      const entries = await window.api.readDir(detailProject.folderPath)
      if (active) {
        setFolderEntries(entries)
        setFolderLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [detailId, detailProject?.folderPath])

  const persistCollapsed = (next: Set<ProjectStatus>) => {
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]))
    } catch { /* ignore */ }
  }

  const toggleCollapse = (status: ProjectStatus, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = new Set(collapsed)
    if (next.has(status)) next.delete(status)
    else next.add(status)
    persistCollapsed(next)
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjects(projects.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p))
    addToast({ message: t('projects.projectUpdated'), type: 'success' })
  }

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(t('projects.projectDeleted') + '?')) {
      setProjects(projects.filter(p => p.id !== id))
      if (detailId === id) setDetailId(null)
      addToast({ message: t('projects.projectDeleted'), type: 'warning' })
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    setDraggingId(id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDrop = (e: React.DragEvent, status: ProjectStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) updateProjectStatus(id, status)
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    addToast({ message: t('projects.statusChanged') || 'Durum değiştirildi', type: 'success' })
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormStatus('draft')
    setFormCreator('Orkun Işıtmak')
    setFormPlatform('YouTube')
    setFormShootDate('')
    setFormPublishDate('')
    setFormViewCount('')
    setFormFolderPath('')
    setFormFolderCreated('')
    setFormStartDate('')
    setFormTags([])
    setFormLinks([])
    setTagInput('')
    setLinkInput('')
    setShowMore(false)
  }

  const openAddModal = () => {
    setEditingProject(null)
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (p: Project, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingProject(p)
    setFormName(p.name)
    setFormDescription(p.description)
    setFormStatus(p.status)
    setFormCreator(p.creator)
    setFormPlatform(p.platform)
    setFormShootDate(p.shootDate)
    setFormPublishDate(p.publishDate)
    setFormViewCount(p.viewCount)
    setFormFolderPath(p.folderPath || '')
    setFormFolderCreated(p.folderCreated || '')
    setFormStartDate(p.startDate || '')
    setFormTags(p.tags || [])
    setFormLinks(p.links || [])
    setTagInput('')
    setLinkInput('')
    setShowMore(Boolean(p.creator || p.platform !== 'YouTube' || p.viewCount && p.viewCount !== '-' || p.shootDate || p.publishDate))
    setShowModal(true)
  }

  const handlePickFolder = async () => {
    if (!window.api) {
      addToast({ message: 'Klasör seçimi yalnızca uygulamada çalışır', type: 'info' })
      return
    }
    const path = await window.api.openDirectory()
    if (!path) return
    setFormFolderPath(path)
    const info = await window.api.pathInfo(path)
    if (info?.exists) {
      if (info.createdAt) {
        setFormFolderCreated(info.createdAt)
        if (!formStartDate) setFormStartDate(info.createdAt.slice(0, 10))
      }
      if (!formName.trim() && info.name) setFormName(info.name)
    }
  }

  const addTag = () => {
    const raw = tagInput.trim().replace(/^#+/, '').trim()
    if (!raw) return
    if (!formTags.includes(raw)) setFormTags([...formTags, raw])
    setTagInput('')
  }

  const addLink = () => {
    let url = linkInput.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url
    if (!formLinks.includes(url)) setFormLinks([...formLinks, url])
    setLinkInput('')
  }

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      addToast({ message: t('projects.name') + ' ' + t('common.required'), type: 'error' })
      return
    }

    const common = {
      name: formName.trim(),
      description: formDescription.trim(),
      status: formStatus,
      creator: formCreator.trim(),
      platform: formPlatform,
      shootDate: formShootDate,
      publishDate: formPublishDate,
      viewCount: formViewCount.trim() || '-',
      folderPath: formFolderPath.trim() || undefined,
      folderCreated: formFolderCreated || undefined,
      startDate: formStartDate || undefined,
      tags: formTags,
      links: formLinks
    }

    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...common } : p))
      addToast({ message: t('projects.projectUpdated'), type: 'success' })
    } else {
      const newProj: Project = {
        id: Date.now().toString(),
        favorite: false,
        createdAt: new Date().toISOString(),
        ...common,
        creator: formCreator.trim() || 'Orkun Işıtmak'
      }
      setProjects(prev => [newProj, ...prev])
      addToast({ message: t('projects.projectCreated'), type: 'success' })
    }
    setShowModal(false)
  }

  const scrollToColumn = (status: ProjectStatus) => {
    if (collapsed.has(status)) toggleCollapse(status)
    const element = document.getElementById(`kanban-col-${status}`)
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.creator.toLowerCase().includes(q) ||
      p.platform.toLowerCase().includes(q) ||
      (p.tags || []).some(tag => tag.toLowerCase().includes(q))
    const matchesTab = activeTab === 'all' || p.favorite
    return matchesSearch && matchesTab
  })

  const getCountByStatus = (status: ProjectStatus) =>
    filteredProjects.filter(p => p.status === status).length

  const getPlatformClass = (platform: string) => {
    const p = platform.toLowerCase()
    if (p.includes('youtube')) return 'youtube'
    if (p.includes('instagram') || p.includes('reels')) return 'instagram'
    if (p.includes('tiktok')) return 'tiktok'
    if (p.includes('twitter') || p.includes('x')) return 'twitter'
    return ''
  }

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.slice(0, 10).split('-')
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
    return dateStr
  }

  const openExternalLink = (url: string) => {
    if (window.api) window.api.openExternal(url)
    else window.open(url, '_blank')
  }

  const openFolder = (path?: string) => {
    if (!path) return
    if (window.api) window.api.openPath(path)
  }

  // ============ DETAIL PAGE ============
  const renderDetail = (p: Project) => {
    const col = COLUMNS.find(c => c.id === p.status)!
    return (
      <div className="project-detail animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDetailId(null)}>
              <ChevronLeft size={15} /> {t('common.back')}
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="page-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h1>
              <p className="page-subtitle">
                <span className="detail-status-pill" style={{ ['--col-color' as string]: col.color } as React.CSSProperties}>
                  <span className="kanban-badge-dot" style={{ ['--col-color' as string]: col.color } as React.CSSProperties} />
                  {t(col.labelKey)}
                </span>
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary" onClick={() => openEditModal(p)}>
              <Edit size={15} /> {t('projects.edit')}
            </button>
            <button className="btn btn-danger" onClick={(e) => deleteProject(p.id, e)}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="project-detail-content">
          <div className="detail-grid">
            {/* Sol kolon: bilgiler */}
            <div className="detail-main">
              {p.description && (
                <div className="detail-card">
                  <div className="detail-card-title"><Hash size={14} /> {t('projects.description')}</div>
                  <p className="detail-description">{p.description}</p>
                </div>
              )}

              {/* Klasör içeriği */}
              <div className="detail-card">
                <div className="detail-card-header">
                  <div className="detail-card-title"><Folder size={14} /> {t('projects.folderContents')}</div>
                  {p.folderPath && (
                    <button className="btn btn-secondary btn-sm" onClick={() => openFolder(p.folderPath)}>
                      <FolderOpen size={14} /> {t('projects.openFolder')}
                    </button>
                  )}
                </div>

                {!p.folderPath ? (
                  <div className="detail-empty">{t('projects.noFolder')}</div>
                ) : folderLoading ? (
                  <div className="detail-empty">{t('common.loading')}</div>
                ) : folderEntries === null ? (
                  <div className="detail-empty detail-empty-warn">{t('projects.folderMissing')}</div>
                ) : folderEntries.length === 0 ? (
                  <div className="detail-empty">{t('projects.emptyFolder')}</div>
                ) : (
                  <div className="file-list">
                    {folderEntries.map(entry => (
                      <div
                        key={entry.path}
                        className="file-row"
                        onDoubleClick={() => openFolder(entry.path)}
                        title={entry.path}
                      >
                        <span className={`file-icon ${entry.isDirectory ? 'dir' : ''}`}>
                          {entry.isDirectory ? <Folder size={15} /> : <FileIcon size={15} />}
                        </span>
                        <span className="file-name">{entry.name}</span>
                        <span className="file-meta">
                          {entry.isDirectory ? '' : formatBytes(entry.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bağlantılar */}
              <div className="detail-card">
                <div className="detail-card-title"><Link2 size={14} /> {t('projects.links')}</div>
                {(p.links && p.links.length > 0) ? (
                  <div className="link-list">
                    {p.links.map((url, i) => (
                      <button key={i} className="link-row" onClick={() => openExternalLink(url)} title={url}>
                        <ExternalLink size={14} />
                        <span className="link-url">{url}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="detail-empty">{t('projects.noLinks')}</div>
                )}
              </div>
            </div>

            {/* Sağ kolon: meta */}
            <div className="detail-side">
              <div className="detail-card">
                <div className="detail-card-title">{t('projects.info')}</div>
                <div className="detail-meta">
                  {p.folderPath && (
                    <div className="meta-row">
                      <span className="meta-label"><Folder size={13} /> {t('projects.folderPath')}</span>
                      <span className="meta-value meta-path" title={p.folderPath}>{p.folderPath}</span>
                    </div>
                  )}
                  <div className="meta-row">
                    <span className="meta-label"><Calendar size={13} /> {t('projects.startDate')}</span>
                    <span className="meta-value">{formatDateDisplay(p.startDate)}</span>
                  </div>
                  {p.folderCreated && (
                    <div className="meta-row">
                      <span className="meta-label"><Clock size={13} /> {t('projects.folderCreated')}</span>
                      <span className="meta-value">{formatDateDisplay(p.folderCreated)}</span>
                    </div>
                  )}
                  {p.platform && (
                    <div className="meta-row">
                      <span className="meta-label">{t('projects.platform')}</span>
                      <span className={`platform-badge ${getPlatformClass(p.platform)}`}>{p.platform}</span>
                    </div>
                  )}
                  {p.creator && (
                    <div className="meta-row">
                      <span className="meta-label">{t('projects.creator')}</span>
                      <span className="meta-value">{p.creator}</span>
                    </div>
                  )}
                  {p.viewCount && p.viewCount !== '-' && (
                    <div className="meta-row">
                      <span className="meta-label"><Eye size={13} /> {t('projects.viewCount')}</span>
                      <span className="meta-value" style={{ color: 'var(--accent-success)', fontFamily: 'var(--font-mono)' }}>{p.viewCount}</span>
                    </div>
                  )}
                </div>
              </div>

              {p.tags && p.tags.length > 0 && (
                <div className="detail-card">
                  <div className="detail-card-title"><Hash size={14} /> {t('projects.tags')}</div>
                  <div className="tag-chips">
                    {p.tags.map(tag => <span key={tag} className="tag-chip">#{tag}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============ BOARD ============
  const renderBoard = () => (
    <>
      <div className="page-header page-header-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BackButton />
          <div className="page-header-icon">
            <LayoutGrid size={22} />
          </div>
          <div>
            <h1 className="page-title">{t('projects.title')}</h1>
            <p className="page-subtitle">{filteredProjects.length} {t('projects.title').toLowerCase()}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          {t('projects.newProject')}
        </button>
      </div>

      <div className="projects-toolbar">
        <div className="seg-tabs">
          <button className={`seg-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            {t('projects.all')}
          </button>
          <button className={`seg-tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
            <Star size={13} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
            {t('projects.favorites')}
          </button>
        </div>
        <div className="search-input-wrapper projects-search">
          <Search size={16} />
          <input
            type="text"
            className="input search-input"
            placeholder={t('projects.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="kanban-filter-bar">
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className={`kanban-badge ${col.colorClass} ${collapsed.has(col.id) ? 'is-collapsed' : ''}`}
            style={{ ['--col-color' as string]: col.color } as React.CSSProperties}
            onClick={() => scrollToColumn(col.id)}
          >
            <span className={`kanban-badge-dot ${col.colorClass}`} />
            {t(col.labelKey)}
            <span style={{ opacity: 0.6 }}>({getCountByStatus(col.id)})</span>
          </div>
        ))}
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden' }}>
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const columnProjects = filteredProjects.filter(p => p.status === col.id)
            const isOver = dragOverColumn === col.id
            const isCollapsed = collapsed.has(col.id)

            if (isCollapsed) {
              return (
                <div
                  key={col.id}
                  id={`kanban-col-${col.id}`}
                  className={`kanban-column collapsed ${col.colorClass} ${isOver ? 'drag-over' : ''}`}
                  style={{ ['--col-color' as string]: col.color } as React.CSSProperties}
                  onClick={() => toggleCollapse(col.id)}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  title={t(col.labelKey)}
                >
                  <div className="kanban-collapsed-top">
                    <span className={`kanban-badge-dot ${col.colorClass}`} />
                    <span className="kanban-collapsed-count">{columnProjects.length}</span>
                  </div>
                  <span className="kanban-collapsed-title">{t(col.labelKey)}</span>
                  <ChevronRight size={14} className="kanban-collapsed-chevron" />
                </div>
              )
            }

            return (
              <div
                key={col.id}
                id={`kanban-col-${col.id}`}
                className={`kanban-column ${col.colorClass} ${isOver ? 'drag-over' : ''}`}
                style={{ ['--col-color' as string]: col.color } as React.CSSProperties}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className={`kanban-badge-dot ${col.colorClass}`} />
                    {t(col.labelKey)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="kanban-column-count">{columnProjects.length}</div>
                    <button
                      className="kanban-collapse-btn"
                      onClick={(e) => toggleCollapse(col.id, e)}
                      title="Sütunu kapat"
                    >
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>

                <div className="kanban-column-cards" onDragLeave={() => setDragOverColumn(null)}>
                  {columnProjects.length === 0 ? (
                    <div className="kanban-empty-col">{t('projects.noProjects') || 'Boş'}</div>
                  ) : (
                    columnProjects.map(p => {
                      const isDragging = draggingId === p.id
                      return (
                        <div
                          key={p.id}
                          className={`kanban-card ${col.colorClass} ${isDragging ? 'dragging' : ''}`}
                          style={{ ['--col-color' as string]: STATUS_COLOR[p.status] } as React.CSSProperties}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, p.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setDetailId(p.id)}
                        >
                          <div className="kanban-card-title">{p.name}</div>

                          {p.creator && (
                            <div className="kanban-card-creator">
                              <span className="kanban-card-creator-dot" />
                              {p.creator}
                            </div>
                          )}

                          {p.tags && p.tags.length > 0 && (
                            <div className="kanban-card-tags">
                              {p.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="kanban-tag">#{tag}</span>
                              ))}
                              {p.tags.length > 3 && <span className="kanban-tag more">+{p.tags.length - 3}</span>}
                            </div>
                          )}

                          {p.folderPath && (
                            <div className="kanban-card-folder" title={p.folderPath}>
                              <Folder size={11} /> {p.folderPath.split(/[\\/]/).pop()}
                            </div>
                          )}

                          {p.platform && (
                            <div className={`platform-badge ${getPlatformClass(p.platform)}`}>{p.platform}</div>
                          )}

                          {p.viewCount && p.viewCount !== '-' && (
                            <div className="kanban-card-views"><Eye size={11} /> {p.viewCount}</div>
                          )}

                          <div className="kanban-card-actions">
                            <button
                              onClick={(e) => toggleFavorite(p.id, e)}
                              style={{ color: p.favorite ? 'var(--accent-warning)' : 'var(--text-muted)' }}
                              title={t('projects.favorites')}
                            >
                              <Star size={12} fill={p.favorite ? 'currentColor' : 'none'} />
                            </button>
                            <button onClick={(e) => openEditModal(p, e)} title={t('projects.edit')}>
                              <Edit size={12} />
                            </button>
                            <button className="danger" onClick={(e) => deleteProject(p.id, e)} title={t('projects.delete')}>
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <select
                            className="kanban-status-select"
                            value={p.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateProjectStatus(p.id, e.target.value as ProjectStatus)}
                            style={{ marginTop: '4px' }}
                          >
                            {COLUMNS.map(colOpt => (
                              <option key={colOpt.id} value={colOpt.id}>{t(colOpt.labelKey)}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {detailProject ? renderDetail(detailProject) : renderBoard()}

      {/* Add & Edit Modal */}
      {showModal && (
        <div className="kanban-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="kanban-modal project-modal" onClick={(e) => e.stopPropagation()}>
            <div className="project-modal-header">
              <h3>{editingProject ? t('projects.editProject') : t('projects.newProject')}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProject} className="project-modal-body">
              {/* GENEL */}
              <div className="modal-section">
                <div className="modal-section-label">{t('projects.overview')}</div>

                <div className="form-group">
                  <label className="form-label">{t('projects.folderName')} *</label>
                  <input
                    type="text"
                    className="input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Proje adı..."
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('projects.description')}</label>
                  <input
                    type="text"
                    className="input"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Kısa açıklama / seri adı"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('projects.category') || 'Durum'}</label>
                    <select className="select" value={formStatus} onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}>
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{t(c.labelKey)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('projects.startDate')}</label>
                    <input type="date" className="input" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                  </div>
                </div>

                {/* Etiketler */}
                <div className="form-group">
                  <label className="form-label"><Hash size={13} style={{ verticalAlign: '-2px' }} /> {t('projects.tags')}</label>
                  <div className="tag-input-wrap">
                    {formTags.map(tag => (
                      <span key={tag} className="tag-chip editable" onClick={() => setFormTags(formTags.filter(x => x !== tag))}>
                        #{tag} <X size={11} />
                      </span>
                    ))}
                    <input
                      type="text"
                      className="tag-input"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addTag() }
                        else if (e.key === 'Backspace' && !tagInput && formTags.length) {
                          setFormTags(formTags.slice(0, -1))
                        }
                      }}
                      placeholder={formTags.length ? '' : t('projects.tagsPlaceholder')}
                    />
                  </div>
                </div>
              </div>

              {/* KLASÖR & BAĞLANTILAR */}
              <div className="modal-section">
                <div className="modal-section-label">{t('projects.folderPath')} & {t('projects.links')}</div>

                <div className="form-group">
                  <label className="form-label"><Folder size={13} style={{ verticalAlign: '-2px' }} /> {t('projects.folderPath')}</label>
                  {formFolderPath ? (
                    <div className="folder-picked">
                      <Folder size={15} className="folder-picked-icon" />
                      <div className="folder-picked-info">
                        <span className="folder-picked-path" title={formFolderPath}>{formFolderPath}</span>
                        {formFolderCreated && (
                          <span className="folder-picked-date">
                            <Clock size={11} /> {t('projects.folderCreated')}: {formatDateDisplay(formFolderCreated)}
                          </span>
                        )}
                      </div>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={handlePickFolder}>{t('projects.changeFolder')}</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setFormFolderPath(''); setFormFolderCreated('') }}><X size={14} /></button>
                    </div>
                  ) : (
                    <button type="button" className="folder-pick-btn" onClick={handlePickFolder}>
                      <FolderOpen size={16} /> {t('projects.selectFolder')}
                      <span className="folder-pick-hint">{t('projects.noFolder')}</span>
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label"><Link2 size={13} style={{ verticalAlign: '-2px' }} /> {t('projects.links')}</label>
                  {formLinks.length > 0 && (
                    <div className="link-edit-list">
                      {formLinks.map((url, i) => (
                        <div key={i} className="link-edit-row">
                          <ExternalLink size={13} />
                          <span className="link-url">{url}</span>
                          <button type="button" onClick={() => setFormLinks(formLinks.filter((_, idx) => idx !== i))}><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-with-btn">
                    <input
                      type="text"
                      className="input"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                      placeholder={t('projects.linkPlaceholder')}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addLink}>{t('projects.addLink')}</button>
                  </div>
                </div>
              </div>

              {/* EK DETAYLAR */}
              <div className="modal-section">
                <button type="button" className="modal-more-toggle" onClick={() => setShowMore(!showMore)}>
                  {showMore ? <ChevronLeft size={14} style={{ transform: 'rotate(-90deg)' }} /> : <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />}
                  {t('projects.moreDetails')}
                </button>

                {showMore && (
                  <div className="modal-more-body animate-fade-in">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">{t('projects.creator')}</label>
                        <input type="text" className="input" value={formCreator} onChange={(e) => setFormCreator(e.target.value)} placeholder="Orkun Işıtmak" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('projects.platform')}</label>
                        <select className="select" value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)}>
                          <option value="YouTube">YouTube</option>
                          <option value="Instagram Reels">Instagram Reels</option>
                          <option value="TikTok">TikTok</option>
                          <option value="Google">Google</option>
                          <option value="Twitter/X">Twitter/X</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">{t('projects.viewCount') || 'İzlenme'}</label>
                        <input type="text" className="input" value={formViewCount} onChange={(e) => setFormViewCount(e.target.value)} placeholder="6.51K veya 1.2M" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t('projects.shootDate') || 'Çekim'}</label>
                        <input type="date" className="input" value={formShootDate} onChange={(e) => setFormShootDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('projects.publishDate') || 'Yayın'}</label>
                      <input type="date" className="input" value={formPublishDate} onChange={(e) => setFormPublishDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="project-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingProject ? t('projects.save') : t('projects.newProject')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
