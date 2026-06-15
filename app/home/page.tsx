'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { PropertyGrid } from '@/components/organisms/PropertyGrid'
import { Toast } from '@/components/atoms/Toast'

function HomeContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const pathname     = usePathname()

  const handleSearch = (city: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    if (city) sp.set('city', city)
    else sp.delete('city')
    sp.delete('page')
    router.replace(`${pathname}?${sp.toString()}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f5' }}>
      <AppNav
        onSearch={handleSearch}
        searchCity={searchParams.get('city') ?? ''}
      />
      <main className="max-w-[1100px] mx-auto px-5 pt-8 pb-20">
        <PropertyGrid />
      </main>
      <Toast />
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </AuthGuard>
  )
}
