'use client'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import type { Notification, NotifRole } from '@/lib/types'

export function NotificationList() {
  const router = useRouter()
  const { notifications, notifRole, setNotifRole, markNotifRead, markAllRead, showToast } = useAppStore()

  const all   = notifications[notifRole]
  const unread = all.filter((n) => n.unread)
  const read   = all.filter((n) => !n.unread)

  const switchRole = (r: NotifRole) => setNotifRole(r)

  const onAction = (n: Notification) => {
    markNotifRead(n.id)
    if (n.id === 10 || n.btn.toLowerCase().includes('candidat')) {
      router.push('/dashboard')
      return
    }
    showToast(n.btn + '…')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-14 px-5 bg-white border-b border-g3 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <button className="bg-transparent border-none text-[18px] cursor-pointer text-g1" onClick={() => router.push('/home')}>←</button>
            <h1 className="font-serif text-[22px] text-navy">Notificaciones</h1>
          </div>
          <button className="text-[13px] font-semibold text-teal bg-transparent border-none cursor-pointer" onClick={() => { markAllRead(); showToast('Todo marcado como leído') }}>
            Marcar leídas
          </button>
        </div>

        {/* Role tabs */}
        <div className="flex bg-g4 rounded-[10px] p-[3px] mb-3.5">
          {(['arr','prop'] as NotifRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`flex-1 py-1.5 text-center rounded-[8px] text-[13px] font-semibold transition-all border-none cursor-pointer
                ${notifRole === r ? 'bg-white text-navy shadow-[0_1px_4px_rgba(13,27,42,.1)]' : 'text-g1 bg-transparent'}`}
            >
              {r === 'arr' ? 'Arrendatario' : 'Arrendador'}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-16">
        {unread.length > 0 && (
          <>
            <SectionLabel>Nuevas</SectionLabel>
            {unread.map((n) => <NotifRow key={n.id} n={n} onAction={onAction} onRead={markNotifRead} />)}
          </>
        )}
        {read.length > 0 && (
          <>
            <SectionLabel>Anteriores</SectionLabel>
            {read.map((n) => <NotifRow key={n.id} n={n} onAction={onAction} onRead={markNotifRead} />)}
          </>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[.6px] text-g2">
      {children}
    </div>
  )
}

function NotifRow({ n, onAction, onRead }: { n: Notification; onAction: (n: Notification) => void; onRead: (id: number) => void }) {
  return (
    <div
      className="flex items-start gap-3 px-5 py-3.5 border-b border-g3 cursor-pointer"
      style={n.unread ? { background: 'rgba(26,122,110,.03)', borderLeft: '3px solid var(--teal)' } : {}}
      onClick={() => onRead(n.id)}
    >
      <div className="w-10 h-10 rounded-[11px] flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: n.bg }}>
        {n.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-navy mb-0.5">{n.title}</div>
        <div className="text-xs text-g1 leading-[1.4] mb-1.5">{n.desc}</div>
        <div className="flex items-center gap-2.5">
          <button
            className="px-3 py-1 rounded-full text-[11px] font-bold border-none cursor-pointer"
            style={{ background: n.btnCls === 'var(--g1)' ? 'var(--g4)' : 'var(--teal)', color: n.btnCls === 'var(--g1)' ? 'var(--navy)' : '#fff' }}
            onClick={(e) => { e.stopPropagation(); onAction(n) }}
          >
            {n.btn}
          </button>
          <span className="text-[11px] text-g2">{n.time}</span>
        </div>
      </div>
      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: n.unread ? 'var(--teal)' : 'transparent' }} />
    </div>
  )
}
