import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Search, Plus, Trash2, Mail, Phone, Briefcase, Users2 } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
}

const DEFAULT_CONTACTS: Contact[] = []

export default function Contacts() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const saved = await window.api.getData('contacts') as Contact[]
        setContacts(saved && saved.length > 0 ? saved : DEFAULT_CONTACTS)
      } else {
        setContacts(DEFAULT_CONTACTS)
      }
      setLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    if (loaded && window.api) {
      window.api.setData('contacts', contacts)
    }
  }, [contacts, loaded])

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      addToast({ message: 'Lütfen isim ve e-posta alanlarını doldurun', type: 'error' })
      return
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      company
    }

    setContacts([...contacts, newContact])
    setName('')
    setEmail('')
    setPhone('')
    setCompany('')
    setShowForm(false)
    addToast({ message: 'Yeni kişi eklendi', type: 'success' })
  }

  const handleDelete = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id))
    addToast({ message: 'Kişi silindi', type: 'warning' })
  }

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('contacts.title')}</h1>
          <p className="page-subtitle">{t('contacts.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          {t('contacts.newContact')}
        </button>
      </div>

      <div className="top-nav">
        <div className="search-input-wrapper w-full">
          <Search size={16} />
          <input
            type="text"
            className="input search-input"
            placeholder={t('contacts.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="page-content mt-6 flex flex-col gap-6">
        {/* Dynamic Add Form */}
        {showForm && (
          <form className="card flex flex-col gap-4 animate-fade-in-up" onSubmit={handleAdd}>
            <div className="card-header">
              <h3 className="card-title">{t('contacts.newContact')}</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">{t('contacts.name')} *</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contacts.email')} *</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contacts.phone')}</label>
                <input
                  type="text"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contacts.company')}</label>
                <input
                  type="text"
                  className="input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowForm(false)}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Contacts Table / Empty State */}
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <Users2 className="empty-state-icon" />
            <h3 className="empty-state-title">{t('contacts.noContacts')}</h3>
            <p className="empty-state-text">{t('contacts.addFirst')}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('contacts.name')}</th>
                  <th>{t('contacts.email')}</th>
                  <th>{t('contacts.phone')}</th>
                  <th>{t('contacts.company')}</th>
                  <th style={{ width: '80px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2 font-bold">{c.name}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-muted">
                        <Mail size={12} />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-muted">
                        <Phone size={12} />
                        <span>{c.phone || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 text-muted">
                        <Briefcase size={12} />
                        <span>{c.company || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          style={{ width: 26, height: 26 }}
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
