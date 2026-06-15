'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { Avatar } from '@/components/atoms'
import { clearTokenCookie } from '@/lib/cookies'

interface NavItem {
  icon: string
  label: string
  href?: string
  action?: () => void
  match?: string
}

export function LandlordNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, setUser, unreadCount } = useAppStore()
  const initials = (user?.fullName?.slice(0, 2) ?? 'PR').toUpperCase()
  const hasUnread = unreadCount() > 0

  const logout = () => {
    clearTokenCookie()
    setUser(null)
    router.replace('/auth/login')
  }

  const items: NavItem[] = [
    { icon: '🏢', label: 'Mis propiedades', href: '/landlord/properties', match: '/landlord' },
    ...(user?.roles.includes('TENANT')
      ? [{ icon: '🔍', label: 'Buscar arriendo', href: '/home', match: '/home' }]
      : []),
    { icon: '🔔', label: 'Notificaciones', href: '/notifications', match: '/notifications' },
    { icon: '👤', label: 'Mi perfil', href: '/profile', match: '/profile' },
  ]

  const isActive = (item: NavItem) =>
    item.match ? pathname.startsWith(item.match) : false

  return (
    <div className="w-[60px] flex-shrink-0 bg-navy flex flex-col items-center py-4 gap-1.5 z-50">
      {/* Logo */}
      <button
        className="font-serif text-[16px] text-teal-l mb-4 bg-transparent border-none cursor-pointer"
        onClick={() => router.push('/landlord/properties')}
      >
        P<span className="text-white">.</span>
      </button>

      {/* Nav items */}
      {items.map((item) => (
        <button
          key={item.label}
          title={item.label}
          onClick={() => item.href ? router.push(item.href) : item.action?.()}
          className={`relative w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] border-none cursor-pointer transition-colors
            ${isActive(item)
              ? 'bg-[rgba(26,166,150,.2)] text-teal-l'
              : 'bg-transparent text-white/40 hover:bg-white/10 hover:text-white/80'}`}
        >
          {item.icon}
          {item.match === '/notifications' && hasUnread && (
            <span className="absolute top-[7px] right-[7px] w-[7px] h-[7px] rounded-full bg-warm border-[1.5px] border-navy" />
          )}
        </button>
      ))}

      <div className="flex-1" />

      <button
        title="Cerrar sesión"
        onClick={logout}
        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] border-none cursor-pointer text-white/40 hover:text-white/80 bg-transparent"
      >
        🚪
      </button>
      <Avatar initials={initials} size="sm" className="mt-1.5" />
    </div>
  )
}
