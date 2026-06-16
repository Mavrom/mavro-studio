import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { Search, Plus, Trash2, Edit2, User, Key, Phone, Calendar, Info, Eye, EyeOff } from 'lucide-react'
import BackButton from '../components/common/BackButton'

interface Contact {
  id: string
  name: string        // Ad Soyad
  username: string    // Kullanıcı Adı
  customId: string    // ID
  phone: string       // Telefon
  birthday: string    // Doğum Günü (YYYY-MM-DD format)
  info: string        // Info (dip not)
}

const DEFAULT_CONTACTS: Contact[] = []

// ── Privacy Masking Functions ──
function maskName(fullName: string): string {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) {
    return '*****'
  }
  return parts.slice(0, -1).join(' ') + ' *****'
}

function maskUsername(username: string): string {
  if (!username) return ''
  return username.charAt(0) + '*****'
}

function maskId(id: string): string {
  if (!id) return ''
  if (id.length <= 6) return '***'
  return id.slice(0, 3) + '*'.repeat(id.length - 6) + id.slice(-3)
}

function maskPhone(phone: string): string {
  if (!phone) return ''
  if (phone.length <= 5) return '***'
  return phone.slice(0, 3) + '*'.repeat(phone.length - 5) + phone.slice(-2)
}

function maskInfo(info: string): string {
  if (!info) return ''
  return '*****'
}

// ── Custom Date Picker component ──
interface DatePickerProps {
  value: string
  onChange: (dateStr: string) => void
  placeholder: string
}

function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
  const { language } = useAppStore()
  const [showPopup, setShowPopup] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calendar display state
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Sync state with value if value changes
  useEffect(() => {
    if (value) {
      const parts = value.split('-').map(Number)
      if (parts.length === 3) {
        const [y, m] = parts
        if (y && !isNaN(y) && m !== undefined && !isNaN(m)) {
          setYear(y)
          setMonth(m - 1)
        }
      }
    }
  }, [value])

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPopup(false)
      }
    }
    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showPopup])

  const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]
  const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const months = language === 'tr' ? MONTHS_TR : MONTHS_EN
  const daysHeader = language === 'tr' ? ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const years: number[] = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= 1930; y--) {
    years.push(y)
  }

  // Get total days in month
  const totalDays = new Date(year, month + 1, 0).getDate()
  // Get first day offset
  const firstDayIndex = new Date(year, month, 1).getDay()

  const daysCells: { day: number; isCurrentMonth: boolean; dateStr: string }[] = []

  // Prepend trailing days of prev month
  const prevMonthTotalDays = new Date(year, month, 0).getDate()
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    daysCells.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    daysCells.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  // Append leading days of next month to complete the grid (42 cells)
  const remaining = 42 - daysCells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    daysCells.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    })
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(prev => prev - 1)
    } else {
      setMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(prev => prev + 1)
    } else {
      setMonth(prev => prev + 1)
    }
  }

  return (
    <div className="custom-date-picker-container" ref={containerRef}>
      <input
        type="text"
        className="input"
        value={value}
        placeholder={placeholder}
        readOnly
        onClick={() => setShowPopup(true)}
      />
      {showPopup && (
        <div className="date-picker-popup animate-fade-in">
          <div className="date-picker-header">
            <button type="button" className="date-picker-nav-btn" onClick={handlePrevMonth}>
              &lt;
            </button>
            <div className="flex gap-1">
              <select
                className="select"
                style={{ padding: '2px 20px 2px 8px', fontSize: '11px', width: 'auto', backgroundPosition: 'right 4px center' }}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                className="select"
                style={{ padding: '2px 20px 2px 8px', fontSize: '11px', width: 'auto', backgroundPosition: 'right 4px center' }}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" className="date-picker-nav-btn" onClick={handleNextMonth}>
              &gt;
            </button>
          </div>

          <div className="date-picker-grid">
            {daysHeader.map(h => (
              <div key={h} className="date-picker-day-name">{h}</div>
            ))}
            {daysCells.map((cell, idx) => {
              const isSelected = cell.dateStr === value
              const isToday = cell.dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

              return (
                <div
                  key={idx}
                  className={`date-picker-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => {
                    onChange(cell.dateStr)
                    setShowPopup(false)
                  }}
                >
                  {cell.day}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Contacts() {
  const { t, addToast } = useAppStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loaded, setLoaded] = useState(false)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editContactId, setEditContactId] = useState<string | null>(null) // null if adding new contact
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [customId, setCustomId] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [info, setInfo] = useState('')
  const [censorEnabled, setCensorEnabled] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const saved = await window.api.getData('contacts') as any[]
        if (saved && saved.length > 0) {
          const mapped = saved.map((item: any) => ({
            id: item.id || Date.now().toString() + Math.random(),
            name: item.name || '',
            username: item.username || item.email?.split('@')[0] || '',
            customId: item.customId || `ID-${Math.floor(Math.random() * 10000)}`,
            phone: item.phone || '',
            birthday: item.birthday || '1995-01-01',
            info: item.info || item.company || ''
          }))
          setContacts(mapped)
        } else {
          setContacts(DEFAULT_CONTACTS)
        }
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalName = name.trim() || t('contacts.unnamed')
    const finalUsername = username.trim()
    const finalCustomId = customId.trim() || `ID-${Math.floor(1000 + Math.random() * 9000)}`
    const finalPhone = phone.trim()
    const finalBirthday = birthday || ''
    const finalInfo = info.trim()

    if (editContactId) {
      // Edit Mode
      setContacts(prev => prev.map(c => c.id === editContactId ? {
        id: editContactId,
        name: finalName,
        username: finalUsername,
        customId: finalCustomId,
        phone: finalPhone,
        birthday: finalBirthday,
        info: finalInfo
      } : c))
      addToast({ message: 'Kişi başarıyla güncellendi', type: 'success' })
    } else {
      // Add Mode
      const newContact: Contact = {
        id: crypto.randomUUID(),
        name: finalName,
        username: finalUsername,
        customId: finalCustomId,
        phone: finalPhone,
        birthday: finalBirthday,
        info: finalInfo
      }
      setContacts(prev => [...prev, newContact])
      addToast({ message: 'Yeni kişi eklendi', type: 'success' })
    }

    // Reset Form
    setName('')
    setUsername('')
    setCustomId('')
    setPhone('')
    setBirthday('')
    setInfo('')
    setEditContactId(null)
    setShowForm(false)
  }

  const handleEditInit = (contact: Contact) => {
    setName(contact.name)
    setUsername(contact.username)
    setCustomId(contact.customId)
    setPhone(contact.phone)
    setBirthday(contact.birthday)
    setInfo(contact.info)
    setEditContactId(contact.id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
    addToast({ message: 'Kişi silindi', type: 'warning' })
  }

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BackButton />
          <div>
            <h1 className="page-title">{t('contacts.title')}</h1>
            <p className="page-subtitle">{t('contacts.subtitle')}</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm && editContactId) {
              // Reset edit state first
              setName('')
              setUsername('')
              setCustomId('')
              setPhone('')
              setBirthday('')
              setInfo('')
              setEditContactId(null)
            } else {
              setShowForm(!showForm)
            }
          }}
        >
          <Plus size={16} />
          {t('contacts.newContact')}
        </button>
      </div>

      <div className="top-nav" style={{ gap: 'var(--space-3)' }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="text"
            className="input search-input"
            placeholder={t('contacts.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setCensorEnabled(!censorEnabled)}
          title={censorEnabled ? t('contacts.censorOff') : t('contacts.censorOn')}
          type="button"
        >
          {censorEnabled ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>{censorEnabled ? t('contacts.censorOff') : t('contacts.censorOn')}</span>
        </button>
      </div>

      <div className="page-content mt-6 flex flex-col gap-6">
        {/* Dynamic Add / Edit Form */}
        {showForm && (
          <form className="card flex flex-col gap-4 animate-fade-in-up" onSubmit={handleSave}>
            <h3 className="card-title">
              {editContactId ? t('contacts.editContact') : t('contacts.newContact')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">{t('contacts.name')}</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contacts.username')}</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('contacts.customId')}</label>
                <input
                  type="text"
                  className="input"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
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
                <label className="form-label">{t('contacts.birthday')}</label>
                <DatePicker
                  value={birthday}
                  onChange={(dateStr) => setBirthday(dateStr)}
                  placeholder={t('contacts.selectDate')}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">{t('contacts.info')}</label>
                <textarea
                  className="input"
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setName('')
                  setUsername('')
                  setCustomId('')
                  setPhone('')
                  setBirthday('')
                  setInfo('')
                  setEditContactId(null)
                  setShowForm(false)
                }}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('common.save')}
              </button>
            </div>
          </form>
        )}

        {/* Contacts Table / Grid */}
        {filteredContacts.length === 0 ? (
          <div className="card text-center py-8">
            <h3 className="card-title">{t('contacts.noContacts')}</h3>
            <p className="card-description">{t('contacts.addFirst')}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('contacts.name')}</th>
                  <th>{t('contacts.username')}</th>
                  <th>{t('contacts.customId')}</th>
                  <th>{t('contacts.phone')}</th>
                  <th>{t('contacts.birthday')}</th>
                  <th>{t('contacts.info')}</th>
                  <th style={{ width: '100px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((c) => {
                  const displayName = censorEnabled ? maskName(c.name) : c.name
                  const displayUsername = censorEnabled ? maskUsername(c.username) : (c.username || '-')
                  const displayCustomId = censorEnabled ? maskId(c.customId) : (c.customId || '-')
                  const displayPhone = censorEnabled ? maskPhone(c.phone) : (c.phone || '-')
                  const displayInfo = censorEnabled ? maskInfo(c.info) : (c.info || '-')

                  return (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2 font-bold" title={c.name}>
                          {displayName}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted">
                          <User size={12} />
                          <span>{displayUsername}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted">
                          <Key size={12} />
                          <span>{displayCustomId}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted">
                          <Phone size={12} />
                          <span>{displayPhone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted">
                          <Calendar size={12} />
                          <span>{c.birthday || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted" title={c.info} style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Info size={12} />
                          <span>{displayInfo}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-center gap-2">
                          <button
                            className="btn btn-secondary btn-sm btn-icon"
                            style={{ width: 26, height: 26 }}
                            onClick={() => handleEditInit(c)}
                          >
                            <Edit2 size={12} />
                          </button>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
