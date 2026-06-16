import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { FolderGit2, Search, Plus, Star, Edit, Trash2, Calendar, Eye, X } from 'lucide-react'
import BackButton from '../components/common/BackButton'

export type ProjectStatus = 'draft' | 'production' | 'post' | 'published' | 'cancelled'

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
    favorite: true
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
    favorite: true
  },
  {
    id: '3',
    name: '🤫 Gizli Görev: Güvenlikçi Oldum',
    description: 'GİZLİ GÖREV',
    status: 'post',
    creator: 'Orkun Işıtmak',
    platform: 'YouTube',
    shootDate: '2026-06-05',
    publishDate: '2026-06-25',
    viewCount: '450K',
    favorite: false
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
    favorite: false
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
    favorite: false
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
    favorite: false
  }
]

const COLUMNS: { id: ProjectStatus; labelKey: string; colorClass: string; color: string }[] = [
  { id: 'draft', labelKey: 'projects.draft', colorClass: 'draft', color: '#8b95a5' },
  { id: 'production', labelKey: 'projects.production', colorClass: 'production', color: '#4F8FFF' },
  { id: 'post', labelKey: 'projects.postProduction', colorClass: 'post', color: '#A78BFA' },
  { id: 'published', labelKey: 'projects.published', colorClass: 'published', color: '#34D399' },
  { id: 'cancelled', labelKey: 'projects.cancelled', colorClass: 'cancelled', color: '#F87171' }
]

const STATUS_COLOR: Record<ProjectStatus, string> = {
  draft: '#8b95a5',
  production: '#4F8FFF',
  post: '#A78BFA',
  published: '#34D399',
  cancelled: '#F87171'
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

  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const saved = await window.api.getData('projects') as Project[]
        setProjects(saved && saved.length > 0 ? saved : DEFAULT_PROJECTS)
      } else {
        setProjects(DEFAULT_PROJECTS)
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

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjects(projects.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p))
    addToast({ message: t('projects.projectUpdated'), type: 'success' })
  }

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(t('projects.projectDeleted') + '?')) {
      setProjects(projects.filter(p => p.id !== id))
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
    if (id) {
      updateProjectStatus(id, status)
    }
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    addToast({ message: t('projects.statusChanged') || 'Durum değiştirildi', type: 'success' })
  }

  const openAddModal = () => {
    setEditingProject(null)
    setFormName('')
    setFormDescription('')
    setFormStatus('draft')
    setFormCreator('Orkun Işıtmak')
    setFormPlatform('YouTube')
    setFormShootDate('')
    setFormPublishDate('')
    setFormViewCount('')
    setShowModal(true)
  }

  const openEditModal = (p: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProject(p)
    setFormName(p.name)
    setFormDescription(p.description)
    setFormStatus(p.status)
    setFormCreator(p.creator)
    setFormPlatform(p.platform)
    setFormShootDate(p.shootDate)
    setFormPublishDate(p.publishDate)
    setFormViewCount(p.viewCount)
    setShowModal(true)
  }

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      addToast({ message: t('projects.name') + ' ' + t('common.required'), type: 'error' })
      return
    }

    if (editingProject) {
      // Edit mode
      setProjects(prev => prev.map(p => p.id === editingProject.id ? {
        ...p,
        name: formName.trim(),
        description: formDescription.trim(),
        status: formStatus,
        creator: formCreator.trim(),
        platform: formPlatform,
        shootDate: formShootDate,
        publishDate: formPublishDate,
        viewCount: formViewCount.trim() || '-'
      } : p))
      addToast({ message: t('projects.projectUpdated'), type: 'success' })
    } else {
      // Add mode
      const newProj: Project = {
        id: Date.now().toString(),
        name: formName.trim(),
        description: formDescription.trim(),
        status: formStatus,
        creator: formCreator.trim() || 'Orkun Işıtmak',
        platform: formPlatform,
        shootDate: formShootDate,
        publishDate: formPublishDate,
        viewCount: formViewCount.trim() || '-',
        favorite: false
      }
      setProjects(prev => [newProj, ...prev])
      addToast({ message: t('projects.projectCreated'), type: 'success' })
    }
    setShowModal(false)
  }

  const scrollToColumn = (status: ProjectStatus) => {
    const element = document.getElementById(`kanban-col-${status}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || p.favorite
    return matchesSearch && matchesTab
  })

  // Get project count by status
  const getCountByStatus = (status: ProjectStatus) => {
    return filteredProjects.filter(p => p.status === status).length
  }

  const getPlatformClass = (platform: string) => {
    const p = platform.toLowerCase()
    if (p.includes('youtube')) return 'youtube'
    if (p.includes('instagram') || p.includes('reels')) return 'instagram'
    if (p.includes('tiktok')) return 'tiktok'
    if (p.includes('twitter') || p.includes('x')) return 'twitter'
    return ''
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`
    }
    return dateStr
  }

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BackButton />
          <div>
            <h1 className="page-title">{t('projects.title')}</h1>
            <p className="page-subtitle">{t('projects.subtitle')}</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          {t('projects.newProject')}
        </button>
      </div>

      {/* Top Filter and Search Bar */}
      <div className="top-nav" style={{ padding: '0 var(--space-4) var(--space-3)' }}>
        <div
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          {t('projects.all')}
        </div>
        <div
          className={`tab ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t('projects.favorites')}
        </div>
        <div className="top-nav-spacer" />
        <div className="search-input-wrapper">
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

      {/* Kanban Filter Badges Row */}
      <div className="kanban-filter-bar" style={{ padding: '0 var(--space-4) var(--space-3)' }}>
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className={`kanban-badge ${col.colorClass}`}
            style={{ '--col-color': col.color } as React.CSSProperties}
            onClick={() => scrollToColumn(col.id)}
          >
            <span className={`kanban-badge-dot ${col.colorClass}`} />
            {t(col.labelKey)}
            <span style={{ opacity: 0.6 }}>({getCountByStatus(col.id)})</span>
          </div>
        ))}
      </div>

      {/* Kanban Board Container */}
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 0, overflow: 'hidden' }}>
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const columnProjects = filteredProjects.filter(p => p.status === col.id)
            const isOver = dragOverColumn === col.id

            return (
              <div
                key={col.id}
                id={`kanban-col-${col.id}`}
                className={`kanban-column ${col.colorClass} ${isOver ? 'drag-over' : ''}`}
                style={{ '--col-color': col.color } as React.CSSProperties}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span className={`kanban-badge-dot ${col.colorClass}`} />
                    {t(col.labelKey)}
                  </div>
                  <div className="kanban-column-count">
                    {columnProjects.length}
                  </div>
                </div>

                {/* Column Card List */}
                <div className="kanban-column-cards" onDragLeave={() => setDragOverColumn(null)}>
                  {columnProjects.length === 0 ? (
                    <div
                      style={{
                        height: '100%',
                        minHeight: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'color-mix(in srgb, var(--col-color) 55%, var(--text-muted))',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 500,
                        border: '1.5px dashed color-mix(in srgb, var(--col-color) 38%, var(--border-primary))',
                        borderRadius: 'var(--radius-lg)',
                        background: 'color-mix(in srgb, var(--col-color) 7%, transparent)'
                      }}
                    >
                      {t('projects.noProjects') || 'Boş'}
                    </div>
                  ) : (
                    columnProjects.map(p => {
                      const isDragging = draggingId === p.id
                      return (
                        <div
                          key={p.id}
                          className={`kanban-card ${col.colorClass} ${isDragging ? 'dragging' : ''}`}
                          style={{ '--col-color': STATUS_COLOR[p.status] } as React.CSSProperties}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, p.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => openEditModal(p, e)}
                        >
                          {/* Title with Emoji */}
                          <div className="kanban-card-title">
                            {p.name}
                          </div>

                          {/* Creator Dot & Text */}
                          <div className="kanban-card-creator">
                            <span className="kanban-card-creator-dot" />
                            {p.creator}
                          </div>

                          {/* Description/Series Label */}
                          {p.description && (
                            <div className="kanban-card-series">
                              📍 {p.description}
                            </div>
                          )}

                          {/* Platform Badge */}
                          {p.platform && (
                            <div className={`platform-badge ${getPlatformClass(p.platform)}`}>
                              {p.platform}
                            </div>
                          )}

                          {/* Shoot & Publish Dates */}
                          {(p.shootDate || p.publishDate) && (
                            <div className="kanban-card-dates">
                              {p.shootDate && (
                                <span>
                                  📅 {t('projects.shootDate') || 'Çekim'}: {formatDateDisplay(p.shootDate)}
                                </span>
                              )}
                              {p.publishDate && (
                                <span>
                                  📅 {t('projects.publishDate') || 'Yayın'}: {formatDateDisplay(p.publishDate)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Monospace View Count Metric */}
                          {p.viewCount && p.viewCount !== '-' && (
                            <div className="kanban-card-views">
                              👁️ {p.viewCount}
                            </div>
                          )}

                          {/* Actions on Card Hover */}
                          <div className="kanban-card-actions">
                            {/* Favorite Status Toggle */}
                            <button
                              onClick={(e) => toggleFavorite(p.id, e)}
                              style={{ color: p.favorite ? 'var(--accent-warning)' : 'var(--text-muted)' }}
                              title={t('projects.favorites')}
                            >
                              <Star size={12} fill={p.favorite ? 'currentColor' : 'none'} />
                            </button>

                            {/* Direct Edit Button */}
                            <button
                              onClick={(e) => openEditModal(p, e)}
                              title={t('projects.edit')}
                            >
                              <Edit size={12} />
                            </button>

                            {/* Direct Delete Button */}
                            <button
                              className="danger"
                              onClick={(e) => deleteProject(p.id, e)}
                              title={t('projects.delete')}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {/* Direct Status Selector Dropdown */}
                          <select
                            className="kanban-status-select"
                            value={p.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateProjectStatus(p.id, e.target.value as ProjectStatus)}
                            style={{ marginTop: '4px' }}
                          >
                            {COLUMNS.map(colOpt => (
                              <option key={colOpt.id} value={colOpt.id}>
                                {t(colOpt.labelKey)}
                              </option>
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

      {/* Add & Edit Modal */}
      {showModal && (
        <div className="kanban-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              {editingProject ? t('projects.editProject') : t('projects.newProject')}
            </h3>

            <form onSubmit={handleSaveProject} className="form-grid">
              {/* Project Name (Emoji Support) */}
              <div className="form-group form-full">
                <label className="form-label">{t('projects.name')} *</label>
                <input
                  type="text"
                  className="input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="🔍 Hangisi Gerçek Medyum?"
                  autoFocus
                />
              </div>

              {/* Description / Series Name */}
              <div className="form-group form-full">
                <label className="form-label">{t('projects.description')}</label>
                <input
                  type="text"
                  className="input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="HANGİSİ GERÇEK"
                />
              </div>

              {/* Creator Name */}
              <div className="form-group">
                <label className="form-label">{t('projects.creator')}</label>
                <input
                  type="text"
                  className="input"
                  value={formCreator}
                  onChange={(e) => setFormCreator(e.target.value)}
                  placeholder="Orkun Işıtmak"
                />
              </div>

              {/* Platform (Dropdown or Select Option) */}
              <div className="form-group">
                <label className="form-label">{t('projects.platform')}</label>
                <select
                  className="select"
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                >
                  <option value="YouTube">YouTube</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Google">Google</option>
                  <option value="Twitter/X">Twitter/X</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              {/* If "Diğer" selected, display text input */}
              {formPlatform === 'Diğer' && (
                <div className="form-group form-full animate-fade-in">
                  <label className="form-label">Platform Adı</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Platform adını girin..."
                    onChange={(e) => setFormPlatform(e.target.value)}
                  />
                </div>
              )}

              {/* Kanban Column Status */}
              <div className="form-group">
                <label className="form-label">{t('projects.category') || 'Durum'}</label>
                <select
                  className="select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                >
                  {COLUMNS.map(c => (
                    <option key={c.id} value={c.id}>
                      {t(c.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Count Metric */}
              <div className="form-group">
                <label className="form-label">{t('projects.viewCount') || 'İzlenme'}</label>
                <input
                  type="text"
                  className="input"
                  value={formViewCount}
                  onChange={(e) => setFormViewCount(e.target.value)}
                  placeholder="6.51K veya 1.2M"
                />
              </div>

              {/* Shoot Date */}
              <div className="form-group">
                <label className="form-label">{t('projects.shootDate') || 'Çekim Tarihi'}</label>
                <input
                  type="date"
                  className="input"
                  value={formShootDate}
                  onChange={(e) => setFormShootDate(e.target.value)}
                />
              </div>

              {/* Publish Date */}
              <div className="form-group">
                <label className="form-label">{t('projects.publishDate') || 'Yayın Tarihi'}</label>
                <input
                  type="date"
                  className="input"
                  value={formPublishDate}
                  onChange={(e) => setFormPublishDate(e.target.value)}
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="kanban-modal-footer form-full">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProject ? t('projects.edit') : t('projects.newProject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
