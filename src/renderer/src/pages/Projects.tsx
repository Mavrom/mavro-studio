import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { FolderGit2, Search, Plus, Star, ExternalLink, Trash2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  category: string
  modified: string
  favorite: boolean
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Mavro Studio Installer',
    description: 'electron-builder configuration and setup files.',
    category: 'Production',
    modified: '16.06.2026',
    favorite: true
  },
  {
    id: '2',
    name: 'Corporate Website CMS',
    description: 'Next.js based custom portal dashboard backend integration.',
    category: 'Development',
    modified: '15.06.2026',
    favorite: false
  },
  {
    id: '3',
    name: 'Database Backup Automation',
    description: 'Node script to sync hourly data tables to cold storage.',
    category: 'Utility',
    modified: '10.06.2026',
    favorite: true
  }
]

export default function Projects() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [loaded, setLoaded] = useState(false)

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

  const toggleFavorite = (id: string) => {
    setProjects(projects.map(p => p.id === id ? { ...p, favorite: !p.favorite } : p))
    addToast({ message: 'Proje favori durumu güncellendi', type: 'success' })
  }

  const deleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id))
    addToast({ message: 'Proje silindi', type: 'warning' })
  }

  const addNewProject = () => {
    const today = new Date()
    const dateStr = `${today.getDate().toString().padStart(2,'0')}.${(today.getMonth()+1).toString().padStart(2,'0')}.${today.getFullYear()}`
    const newProj: Project = {
      id: Date.now().toString(),
      name: `New Project ${projects.length + 1}`,
      description: 'Enter description details here.',
      category: 'Draft',
      modified: dateStr,
      favorite: false
    }
    setProjects([newProj, ...projects])
    addToast({ message: 'Yeni proje taslağı oluşturuldu', type: 'success' })
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTab = activeTab === 'all' || p.favorite
    return matchesSearch && matchesTab
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('projects.title')}</h1>
          <p className="page-subtitle">{t('projects.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={addNewProject}>
          <Plus size={16} />
          {t('projects.newProject')}
        </button>
      </div>

      <div className="top-nav">
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

      <div className="page-content mt-6">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <FolderGit2 className="empty-state-icon" />
            <h3 className="empty-state-title">{t('projects.noProjects')}</h3>
            <p className="empty-state-text">{t('projects.createFirst')}</p>
          </div>
        ) : (
          <div className="card-grid">
            {filteredProjects.map((p) => (
              <div key={p.id} className="card flex flex-col justify-between" style={{ minHeight: '180px' }}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="badge badge-primary">{p.category}</span>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => toggleFavorite(p.id)}
                      style={{ color: p.favorite ? 'var(--accent-warning)' : 'var(--text-muted)' }}
                    >
                      <Star size={16} fill={p.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <h3 className="card-title" style={{ fontSize: 'var(--font-md)' }}>{p.name}</h3>
                  <p className="card-description" style={{ fontSize: 'var(--font-sm)', marginTop: '4px' }}>
                    {p.description}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-6 pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <span className="text-sm text-muted">
                    {t('projects.modified')}: {p.modified}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-secondary btn-sm btn-icon"
                      onClick={() => addToast({ message: 'Proje açılıyor...', type: 'info' })}
                      title={t('projects.open')}
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm btn-icon"
                      onClick={() => deleteProject(p.id)}
                      title={t('projects.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
