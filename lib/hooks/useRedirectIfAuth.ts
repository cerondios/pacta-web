'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTokenCookie } from '@/lib/cookies'

/**
 * Redirect to /home if the user already has a valid session token.
 * Use at the top of login / register pages.
 */
export function useRedirectIfAuth() {
  const router = useRouter()

  useEffect(() => {
    if (getTokenCookie()) {
      router.replace('/home')
    }
  }, [router])
}
