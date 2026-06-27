import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../store'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  StickyNote,
  Trash2,
  Clock,
  X
} from 'lucide-react'

// ── Types ──
interface CalendarAlarm {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  title: string
  triggered: boolean
}

interface CalendarNote {
  id: string
  date: string // YYYY-MM-DD
  text: string
}

// ── Helpers ──
const DAYS_TR = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
]
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

function formatDisplayDate(dateStr: string, lang: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = lang === 'tr' ? MONTHS_TR : MONTHS_EN
  return `${months[m - 1]} ${d}, ${y}`
}

export default function HomePage() {
  const { t, language, addToast, addNotification } = useAppStore()

  // Calendar state
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Data state
  const [alarms, setAlarms] = useState<CalendarAlarm[]>([])
  const [notes, setNotes] = useState<CalendarNote[]>([])
  const [loaded, setLoaded] = useState(false)

  // Modal state
  const [showAlarmModal, setShowAlarmModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [alarmTitle, setAlarmTitle] = useState('')
  const [alarmTime, setAlarmTime] = useState('09:00')
  const [noteText, setNoteText] = useState('')

  // ── Load data ──
  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const savedAlarms = await window.api.getData('calendarAlarms') as CalendarAlarm[]
        const savedNotes = await window.api.getData('calendarNotes') as CalendarNote[]
        if (savedAlarms && savedAlarms.length > 0) setAlarms(savedAlarms)
        if (savedNotes && savedNotes.length > 0) setNotes(savedNotes)
      }
      setLoaded(true)
    }
    load()
  }, [])

  // ── Save data on change ──
  useEffect(() => {
    if (loaded && window.api) {
      window.api.setData('calendarAlarms', alarms)
    }
  }, [alarms, loaded])

  useEffect(() => {
    if (loaded && window.api) {
      window.api.setData('calendarNotes', notes)
    }
  }, [notes, loaded])

  // ── Request notification permission ──
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // ── Alarm checker (every 30s) ──
  const checkAlarms = useCallback(() => {
    const now = new Date()
    const nowDate = formatDate(now.getFullYear(), now.getMonth(), now.getDate())
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    setAlarms(prev => {
      let changed = false
      const updated = prev.map(alarm => {
        if (!alarm.triggered && alarm.date === nowDate && alarm.time <= nowTime) {
          changed = true
          // Desktop notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Mavro Studio — ' + t('home.alarmTriggered'), {
              body: alarm.title,
              icon: undefined
            })
          }
          // In-app toast
          addToast({
            message: `⏰ ${alarm.title} — ${t('home.alarmTriggered')}`,
            type: 'warning',
            duration: 8000
          })
          // Bildirim merkezine ekle
          addNotification({
            title: `⏰ ${t('home.alarmTriggered')}`,
            message: alarm.title,
            type: 'warning'
          })
          return { ...alarm, triggered: true }
        }
        return alarm
      })
      return changed ? updated : prev
    })
  }, [addToast, addNotification, t])

  useEffect(() => {
    checkAlarms()
    const interval = setInterval(checkAlarms, 30000)
    return () => clearInterval(interval)
  }, [checkAlarms])

  // ── Navigation ──
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // ── Add handlers ──
  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) {
      addToast({ message: t('home.selectDateFirst'), type: 'error' })
      return
    }
    if (!alarmTitle.trim()) {
      addToast({ message: t('home.enterAlarmTitle'), type: 'error' })
      return
    }
    const newAlarm: CalendarAlarm = {
      id: crypto.randomUUID(),
      date: selectedDate,
      time: alarmTime,
      title: alarmTitle.trim(),
      triggered: false
    }
    setAlarms(prev => [...prev, newAlarm])
    setAlarmTitle('')
    setAlarmTime('09:00')
    setShowAlarmModal(false)
    addToast({ message: t('home.alarmAdded'), type: 'success' })
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) {
      addToast({ message: t('home.selectDateFirst'), type: 'error' })
      return
    }
    if (!noteText.trim()) {
      addToast({ message: t('home.enterNoteText'), type: 'error' })
      return
    }
    const newNote: CalendarNote = {
      id: crypto.randomUUID(),
      date: selectedDate,
      text: noteText.trim()
    }
    setNotes(prev => [...prev, newNote])
    setNoteText('')
    setShowNoteModal(false)
    addToast({ message: t('home.noteAdded'), type: 'success' })
  }

  const deleteAlarm = (id: string) => {
    setAlarms(prev => prev.filter(a => a.id !== id))
    addToast({ message: t('home.alarmDeleted'), type: 'warning' })
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    addToast({ message: t('home.noteDeleted'), type: 'warning' })
  }

  // ── Calendar rendering ──
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const months = language === 'tr' ? MONTHS_TR : MONTHS_EN
  const dayNames = language === 'tr' ? DAYS_TR : DAYS_EN
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())

  // Dates with notes for highlighting
  const datesWithNotes = new Set(notes.map(n => n.date))
  const datesWithAlarms = new Set(alarms.filter(a => !a.triggered).map(a => a.date))

  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  )

  // Build calendar grid
  const calendarCells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = []

  // Previous month trailing
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const m = currentMonth === 0 ? 11 : currentMonth - 1
    const y = currentMonth === 0 ? currentYear - 1 : currentYear
    calendarCells.push({ day, dateStr: formatDate(y, m, day), isCurrentMonth: false })
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({ day, dateStr: formatDate(currentYear, currentMonth, day), isCurrentMonth: true })
  }

  // Next month leading
  const remaining = 42 - calendarCells.length
  for (let day = 1; day <= remaining; day++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1
    const y = currentMonth === 11 ? currentYear + 1 : currentYear
    calendarCells.push({ day, dateStr: formatDate(y, m, day), isCurrentMonth: false })
  }

  // Events for selected date
  const selectedAlarms = selectedDate ? alarms.filter(a => a.date === selectedDate) : []
  const selectedNotes = selectedDate ? notes.filter(n => n.date === selectedDate) : []

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('home.title')}</h1>
          <p className="page-subtitle">{t('home.subtitle')}</p>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-4)' }}>
        <div className="calendar-card">
          {/* Action buttons (top of calendar) */}
          {selectedDate && (
            <div className="calendar-actions animate-fade-in">
              <button
                className="calendar-action-btn alarm-btn"
                onClick={() => setShowAlarmModal(true)}
              >
                <Bell size={15} />
                {t('home.addAlarm')}
              </button>
              <button
                className="calendar-action-btn note-btn"
                onClick={() => setShowNoteModal(true)}
              >
                <StickyNote size={15} />
                {t('home.addNote')}
              </button>
            </div>
          )}

          {/* Calendar Header */}
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={goToPrevMonth}>
              <ChevronLeft size={16} />
            </button>
            <span className="calendar-month-title">
              {months[currentMonth]} {currentYear}
            </span>
            <button className="calendar-nav-btn" onClick={goToNextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day names */}
          <div className="calendar-grid calendar-day-names">
            {dayNames.map(d => (
              <div key={d} className="calendar-day-name">{d}</div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-grid calendar-days">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr
              const isSelected = cell.dateStr === selectedDate
              const hasNote = datesWithNotes.has(cell.dateStr)
              const hasAlarm = datesWithAlarms.has(cell.dateStr)

              return (
                <div
                  key={idx}
                  className={[
                    'calendar-day',
                    !cell.isCurrentMonth && 'other-month',
                    isToday && 'today',
                    isSelected && 'selected',
                    hasNote && 'has-note',
                    hasAlarm && 'has-alarm'
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDate(cell.dateStr)}
                >
                  {cell.day}
                  {(hasNote || hasAlarm) && cell.isCurrentMonth && (
                    <div className="calendar-day-indicators">
                      {hasNote && <span className="indicator-dot note-dot" />}
                      {hasAlarm && <span className="indicator-dot alarm-dot" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Event Slots Section */}
          <div className="calendar-events-section">
            <div className="calendar-events-header">
              <span className="calendar-events-date">
                {selectedDate ? formatDisplayDate(selectedDate, language) : formatDisplayDate(todayStr, language)}
              </span>
              <button
                className="calendar-add-event-btn"
                onClick={() => {
                  if (!selectedDate) setSelectedDate(todayStr)
                  setShowAlarmModal(true)
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="calendar-events-list">
              {selectedAlarms.length === 0 && selectedNotes.length === 0 && (
                <div className="calendar-no-events">{t('home.noEvents')}</div>
              )}

              {selectedAlarms.map(alarm => (
                <div key={alarm.id} className={`calendar-event-item ${alarm.triggered ? 'triggered' : ''}`}>
                  <div className="event-color-bar alarm-bar" />
                  <div className="event-content">
                    <div className="event-title">{alarm.title}</div>
                    <div className="event-time">
                      <Clock size={11} />
                      {alarm.time} {alarm.triggered ? '✓' : ''}
                    </div>
                  </div>
                  <button className="event-delete-btn" onClick={() => deleteAlarm(alarm.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {selectedNotes.map(note => (
                <div key={note.id} className="calendar-event-item">
                  <div className="event-color-bar note-bar" />
                  <div className="event-content">
                    <div className="event-title">{note.text}</div>
                    <div className="event-time">
                      <StickyNote size={11} />
                      {t('home.notes')}
                    </div>
                  </div>
                  <button className="event-delete-btn" onClick={() => deleteNote(note.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alarm Modal */}
      {showAlarmModal && (
        <div className="modal-overlay" onClick={() => setShowAlarmModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <Bell size={18} style={{ color: 'var(--accent-warning)' }} />
                {t('home.addAlarm')}
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAlarmModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddAlarm}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('home.alarmTitle')} *</label>
                  <input
                    type="text"
                    className="input"
                    value={alarmTitle}
                    onChange={e => setAlarmTitle(e.target.value)}
                    placeholder={t('home.alarmTitle')}
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('home.alarmTime')} *</label>
                  <input
                    type="time"
                    className="input"
                    value={alarmTime}
                    onChange={e => setAlarmTime(e.target.value)}
                  />
                </div>
                <div className="code-block" style={{ fontSize: 'var(--font-sm)' }}>
                  📅 {selectedDate ? formatDisplayDate(selectedDate, language) : '-'}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAlarmModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Bell size={14} />
                  {t('home.addAlarm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2">
                <StickyNote size={18} style={{ color: 'var(--accent-success)' }} />
                {t('home.addNote')}
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNoteModal(false)}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddNote}>
              <div className="modal-body flex flex-col gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{t('home.noteText')} *</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder={t('home.noteText')}
                    autoFocus
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                </div>
                <div className="code-block" style={{ fontSize: 'var(--font-sm)' }}>
                  📅 {selectedDate ? formatDisplayDate(selectedDate, language) : '-'}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  <StickyNote size={14} />
                  {t('home.addNote')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
