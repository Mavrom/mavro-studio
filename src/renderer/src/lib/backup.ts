import { loadData, saveData, type DataKey } from './cloudData'

/**
 * Tüm uygulama verisinin yedeklenmesi / geri yüklenmesi.
 *  - notes / contacts / projects  → bulut (Supabase)
 *  - calendarAlarms / calendarNotes → yerel (electron-store)
 */

export interface BackupFile {
  app: 'mavro-studio'
  version: number
  exportedAt: string
  data: {
    notes: unknown[]
    contacts: unknown[]
    projects: unknown[]
    calendarAlarms: unknown[]
    calendarNotes: unknown[]
  }
}

const CLOUD_KEYS: DataKey[] = ['notes', 'contacts', 'projects']
const LOCAL_KEYS = ['calendarAlarms', 'calendarNotes'] as const

export async function buildBackup(): Promise<BackupFile> {
  const [notes, contacts, projects] = await Promise.all(CLOUD_KEYS.map(k => loadData(k)))
  let calendarAlarms: unknown[] = []
  let calendarNotes: unknown[] = []
  if (window.api) {
    calendarAlarms = ((await window.api.getData('calendarAlarms')) as unknown[]) || []
    calendarNotes = ((await window.api.getData('calendarNotes')) as unknown[]) || []
  }
  return {
    app: 'mavro-studio',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { notes, contacts, projects, calendarAlarms, calendarNotes }
  }
}

export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `mavro-studio-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function isValidBackup(obj: unknown): obj is BackupFile {
  if (!obj || typeof obj !== 'object') return false
  const b = obj as Partial<BackupFile>
  return b.app === 'mavro-studio' && !!b.data && typeof b.data === 'object'
}

export async function restoreBackup(backup: BackupFile): Promise<void> {
  const d = backup.data
  await Promise.all([
    Array.isArray(d.notes) ? saveData('notes', d.notes) : Promise.resolve(),
    Array.isArray(d.contacts) ? saveData('contacts', d.contacts) : Promise.resolve(),
    Array.isArray(d.projects) ? saveData('projects', d.projects) : Promise.resolve()
  ])
  if (window.api) {
    if (Array.isArray(d.calendarAlarms)) await window.api.setData('calendarAlarms', d.calendarAlarms)
    if (Array.isArray(d.calendarNotes)) await window.api.setData('calendarNotes', d.calendarNotes)
  }
}

export async function clearAllData(): Promise<void> {
  await Promise.all(CLOUD_KEYS.map(k => saveData(k, [])))
  if (window.api) {
    for (const k of LOCAL_KEYS) await window.api.setData(k, [])
  }
}

/** Bir backup nesnesindeki kayıt sayılarını özetler. */
export function countBackup(backup: BackupFile): Record<string, number> {
  const d = backup.data
  return {
    notes: Array.isArray(d.notes) ? d.notes.length : 0,
    contacts: Array.isArray(d.contacts) ? d.contacts.length : 0,
    projects: Array.isArray(d.projects) ? d.projects.length : 0,
    calendarAlarms: Array.isArray(d.calendarAlarms) ? d.calendarAlarms.length : 0,
    calendarNotes: Array.isArray(d.calendarNotes) ? d.calendarNotes.length : 0
  }
}
