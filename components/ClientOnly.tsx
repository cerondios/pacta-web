'use client'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Renders children only on the client, never on the server.
 * Use this to wrap any page or component that uses browser APIs,
 * localStorage, or Zustand — preventing all SSR/hydration mismatches.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return <>{children}</>
}
