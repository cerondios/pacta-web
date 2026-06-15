'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTokenCookie } from '@/lib/cookies'

/**
 * Redirect to /auth/login if the user has no session token.
 * Use at the top of every auth-required page/component.
 */
export function useRequireAuth() {
  const router = useRouter()

  useEffect(() => {
    if (!getTokenCookie()) {
      router.replace('/auth/login')
    }
  }, [router])
}
