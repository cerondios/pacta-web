'use client'
import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Logo, Avatar } from '@/components/atoms'
import { useAppStore } from '@/store/useAppStore'
import { clearTokenCookie } from '@/lib/cookies'

interface Props {
  minimal?: boolean
  /** Called when the search pill is submitted */
  onSearch?: (city: string) => void
  searchCity?: string
}

export function AppNav({ minimal = false, onSearch, searchCity = '' }: Props) {
  const router = useRouter()
  const { user, setUser } = useAppStore()
  const initials = (user?.fullName?.slice(0, 2) ?? 'VR').toUpperCase()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [cityInput,  setCityInput]  = useState(searchCity)
  const menuRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [searchOpen])

  const handleLogout = () => {
    clearTokenCookie()
    setUser(null)
    router.replace('/auth/login')
  }

  const handleSearch = () => {
    setSearchOpen(false)
    onSearch?.(cityInput.trim())
  }

  return (
    <div className="sticky top-0 z-[100] bg-white border-b border-g3">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-5 h-[68px] gap-4">

        {/* Logo */}
        <div className="flex-shrink-0">
          <Logo size="md" />
        </div>

        {/* Search pill — center */}
        {!minimal && (
          <div className="flex-1 max-w-[480px]">
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 bg-white border border-g3 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left group"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="text-g2 flex-shrink-0">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-navy truncate">
                    {searchCity || 'Explorar propiedades'}
                  </span>
                  {searchCity && (
                    <>
                      <span className="text-g3 flex-shrink-0">·</span>
                      <span className="text-[13px] text-g1 flex-shrink-0">Arriendos</span>
                    </>
                  )}
                </div>
              </button>
            ) : (
              <div className="flex items-center bg-white border border-teal rounded-full shadow-[0_0_0_3px_rgba(26,122,110,.1)] overflow-hidden">
                <input
                  ref={inputRef}
                  type="text"
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="¿En qué ciudad?"
                  className="flex-1 px-4 py-2.5 text-[13px] text-navy outline-none bg-transparent placeholder:text-g2"
                />
                <button
                  onClick={handleSearch}
                  className="w-9 h-9 rounded-full bg-teal text-white flex items-center justify-center flex-shrink-0 m-1 border-none cursor-pointer hover:bg-teal/90 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="1.5"/>
                    <path d="M10.5 10.5l3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Landlord */}
          {user?.roles.includes('LANDLORD') && (
            <button
              className="hidden sm:flex px-3 py-1.5 rounded-full border border-g3 text-[12px] font-semibold text-navy bg-transparent whitespace-nowrap hover:border-navy cursor-pointer transition-colors"
              onClick={() => router.push('/landlord/properties')}
            >
              Mis propiedades
            </button>
          )}

          {/* Tenant */}
          {user?.roles.includes('TENANT') && (
            <button
              className="hidden sm:flex px-3 py-1.5 rounded-full border border-g3 text-[12px] font-semibold text-navy bg-transparent whitespace-nowrap hover:border-navy cursor-pointer transition-colors"
              onClick={() => router.push('/tenant/requests')}
            >
              Mis solicitudes
            </button>
          )}

          {/* Negocios — both roles */}
          {user && (
            <button
              className="hidden sm:flex px-3 py-1.5 rounded-full border border-g3 text-[12px] font-semibold text-navy bg-transparent whitespace-nowrap hover:border-navy cursor-pointer transition-colors"
              onClick={() => router.push('/deals')}
            >
              Mis negocios
            </button>
          )}

          {/* Avatar + dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center gap-2 border border-g3 rounded-full pl-2 pr-1 py-1 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-g2">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <Avatar initials={initials} size="sm" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,.12)] border border-g3 py-1.5 z-50">
                <div className="px-4 py-3 border-b border-g3">
                  <p className="text-[12px] font-bold text-navy truncate">{user?.fullName ?? '—'}</p>
                  <p className="text-[11px] text-g1 truncate">{user?.email ?? ''}</p>
                </div>
                {user?.roles.includes('LANDLORD') && (
                  <button onClick={() => { setMenuOpen(false); router.push('/landlord/properties') }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-navy font-medium bg-transparent border-none cursor-pointer hover:bg-g4 transition-colors">
                    Mis propiedades
                  </button>
                )}
                {user?.roles.includes('TENANT') && (
                  <button onClick={() => { setMenuOpen(false); router.push('/tenant/requests') }}
                    className="w-full text-left px-4 py-2.5 text-[13px] text-navy font-medium bg-transparent border-none cursor-pointer hover:bg-g4 transition-colors">
                    Mis solicitudes
                  </button>
                )}
                <button onClick={() => { setMenuOpen(false); router.push('/deals') }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-navy font-medium bg-transparent border-none cursor-pointer hover:bg-g4 transition-colors">
                  Mis negocios
                </button>
                <button onClick={() => { setMenuOpen(false); router.push('/profile') }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-navy font-medium bg-transparent border-none cursor-pointer hover:bg-g4 transition-colors">
                  Mi perfil
                </button>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-warm font-medium bg-transparent border-none cursor-pointer hover:bg-g4 transition-colors rounded-b-2xl">
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
