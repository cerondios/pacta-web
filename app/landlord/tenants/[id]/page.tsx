'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/** Superseded by /users/[id] — kept as a redirect until the old route is removed. */
export default function TenantDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/users/${id}`)
  }, [id]) // eslint-disable-line

  return null
}
