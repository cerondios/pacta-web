'use client'
import { create } from 'zustand'
import type { User, Property, PropertyType, Notification, NotifRole } from '@/lib/types'
import { PROPERTIES } from '@/lib/data/properties'
import { NOTIFICATIONS } from '@/lib/data/notifications'

interface Toast {
  message: string
  visible: boolean
}

interface AppState {
  // Auth
  user: User | null
  setUser: (u: User | null) => void

  // Properties
  properties: Property[]
  activeTab: PropertyType
  activeCategory: string
  currentProperty: Property | null
  setActiveTab: (t: PropertyType) => void
  setActiveCategory: (c: string) => void
  setCurrentProperty: (p: Property | null) => void
  toggleFavorite: (id: number) => void

  // Apply flow
  applyStep: number
  bioRunning: boolean
  setApplyStep: (s: number) => void
  setBioRunning: (v: boolean) => void

  // Notifications
  notifications: Record<NotifRole, Notification[]>
  notifRole: NotifRole
  setNotifRole: (r: NotifRole) => void
  markNotifRead: (id: number) => void
  markAllRead: () => void
  unreadCount: () => number

  // Toast
  toast: Toast
  showToast: (msg: string) => void

  // Dashboard
  activeCandidateId: number | null
  setActiveCandidateId: (id: number | null) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ── Properties ───────────────────────────────────────
  properties: PROPERTIES,
  activeTab: 'arr',
  activeCategory: 'all',
  currentProperty: null,
  setActiveTab: (activeTab) => set({ activeTab, activeCategory: 'all' }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setCurrentProperty: (currentProperty) => set({ currentProperty }),
  toggleFavorite: (id) =>
    set((s) => ({
      properties: s.properties.map((p) =>
        p.id === id ? { ...p, fav: !p.fav } : p,
      ),
    })),

  // ── Apply flow ───────────────────────────────────────
  applyStep: 0,
  bioRunning: false,
  setApplyStep: (applyStep) => set({ applyStep }),
  setBioRunning: (bioRunning) => set({ bioRunning }),

  // ── Notifications ─────────────────────────────────────
  notifications: JSON.parse(JSON.stringify(NOTIFICATIONS)),
  notifRole: 'arr',
  setNotifRole: (notifRole) => set({ notifRole }),
  markNotifRead: (id) =>
    set((s) => {
      const clone = { ...s.notifications }
      for (const role of ['arr', 'prop'] as NotifRole[]) {
        clone[role] = clone[role].map((n) =>
          n.id === id ? { ...n, unread: false } : n,
        )
      }
      return { notifications: clone }
    }),
  markAllRead: () =>
    set((s) => {
      const clone = { ...s.notifications }
      const role = s.notifRole
      clone[role] = clone[role].map((n) => ({ ...n, unread: false }))
      return { notifications: clone }
    }),
  unreadCount: () => {
    const { notifications } = get()
    return [...notifications.arr, ...notifications.prop].filter((n) => n.unread).length
  },

  // ── Toast ─────────────────────────────────────────────
  toast: { message: '', visible: false },
  showToast: (message) => {
    set({ toast: { message, visible: true } })
    setTimeout(() => set({ toast: { message: '', visible: false } }), 2600)
  },

  // ── Dashboard ─────────────────────────────────────────
  activeCandidateId: null,
  setActiveCandidateId: (activeCandidateId) => set({ activeCandidateId }),
}))
