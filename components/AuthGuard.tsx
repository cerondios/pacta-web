'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getTokenCookie, clearTokenCookie } from '@/lib/cookies'
import { useAppStore } from '@/store/useAppStore'
import { authApi } from '@/lib/api'

interface AuthGuardProps {
  children: ReactNode
  skipOnboardingCheck?: boolean
  /** If set, redirects away if the user doesn't have this role. */
  requiredRole?: 'TENANT' | 'LANDLORD'
  /** If set, redirects to /profile?reason=incomplete unless the user has this status. */
  requiredStatus?: string
}

function defaultRouteForRoles(roles: string[]): string {
  if (roles.includes('LANDLORD') && !roles.includes('TENANT')) return '/landlord/properties'
  return '/home'
}

export function AuthGuard({ children, skipOnboardingCheck = false, requiredRole, requiredStatus }: AuthGuardProps) {
  const router  = useRouter()
  const { setUser } = useAppStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getTokenCookie()) {
      router.replace('/auth/login')
      return
    }

    const check = async () => {
      // Always re-fetch — never trust the in-memory cached user. Status/roles can
      // change server-side (e.g. KYC approved by a reviewer) while this tab stays open.
      let profile
      try {
        const data = await authApi.getProfile()
        profile = {
          id:        data.id,
          fullName:  data.full_name,
          email:     data.email,
          roles:     data.roles,
          status:    data.status,
          score:     data.score,
          phone:     data.phone,
          country:   data.country,
          city:      data.city,
          createdAt: data.created_at,
        }
        setUser(profile)
      } catch {
        // Any failure to confirm who's logged in — 401/403/404, a 500, or a network
        // error — must never grant access. Only a known-good profile fetch can do that.
        clearTokenCookie()
        router.replace('/auth/login')
        return
      }

      const onboardingDone = profile.roles.length > 0 && !!profile.city
      if (!skipOnboardingCheck && !onboardingDone) {
        router.replace('/onboarding')
        return
      }
      if (skipOnboardingCheck && onboardingDone) {
        router.replace(defaultRouteForRoles(profile.roles))
        return
      }

      if (requiredRole && !profile.roles.includes(requiredRole)) {
        router.replace(defaultRouteForRoles(profile.roles))
        return
      }

      if (requiredStatus && profile.status !== requiredStatus) {
        router.replace('/profile?reason=incomplete')
        return
      }

      setReady(true)
    }

    check()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null
  return <>{children}</>
}
