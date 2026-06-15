'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/atoms'
import { Button } from '@/components/atoms'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Sync with current scroll position immediately after mount
    setScrolled(window.scrollY > 10)
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[200] h-[68px] flex items-center justify-between px-[5%] bg-[rgba(255,255,255,.94)] backdrop-blur-xl border-b border-[rgba(13,27,42,.06)] transition-shadow duration-300 ${scrolled ? 'shadow-[0_2px_20px_rgba(13,27,42,.08)]' : ''}`}
    >
      <Logo size="lg" />

      <ul className="hidden md:flex gap-7 list-none">
        <li><a href="#steps" className="text-sm font-medium text-navy/70 no-underline hover:text-navy transition-opacity">Cómo funciona</a></li>
        <li><a href="#dual"  className="text-sm font-medium text-navy/70 no-underline hover:text-navy transition-opacity">Para propietarios</a></li>
      </ul>

      <div className="flex gap-2.5">
        <Link href="/auth/login">
          <Button variant="ghost" size="sm">Iniciar sesión</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="solid" size="sm">Registrarse gratis</Button>
        </Link>
      </div>
    </nav>
  )
}
