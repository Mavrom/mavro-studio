import { create } from 'zustand'
import tr from '../i18n/tr.json'
import en from '../i18n/en.json'

const languages: Record<string, Record<string, unknown>> = { tr, en }

interface AppState {
  // Theme
  theme: 'dark' | 'light' | 'system'
  setTheme: (theme: 'dark' | 'light' | 'system') => void

  // Language
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string

  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Active page
  activePage: string
  setActivePage: (page: string) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void

  // Toast
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  read: boolean
}

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'dark',
  setTheme: (theme) => {
    set({ theme })
    document.documentElement.setAttribute('data-theme', theme === 'system' ? 'dark' : theme)
    window.api?.setTheme(theme)
  },

  // Language
  language: 'tr',
  setLanguage: (language) => {
    set({ language })
    window.api?.setSetting('language', language)
  },
  t: (key: string) => {
    const { language } = get()
    const langData = languages[language] || languages.tr
    return getNestedValue(langData, key)
  },

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Active page
  activePage: 'home',
  setActivePage: (page) => set({ activePage: page }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          read: false
        },
        ...state.notifications
      ]
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  // Toast
  toasts: [],
  addToast: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }))
    }, toast.duration || 3000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}))
