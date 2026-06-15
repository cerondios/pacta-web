'use client'
import { useState, useEffect, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { landlordApi, filesApi, apiErrorMessage } from '@/lib/api'
import type { BackendProperty } from '@/lib/types'

const STATUS_LABEL: Record<string, string> = {
  DRAFT:          'Borrador',
  PENDING_REVIEW: 'En revisión',
  PUBLISHED:      'Publicado',
  PAUSED:         'Pausado',
  RENTED:         'Arrendado',
  ARCHIVED:       'Archivado',
  BLOCKED:        'Bloqueado',
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:          'bg-[#F3F4F6] text-[#6B7280]',
  PENDING_REVIEW: 'bg-amber-50 text-amber-600',
  PUBLISHED:      'bg-emerald-50 text-emerald-600',
  PAUSED:         'bg-amber-50 text-amber-600',
  RENTED:         'bg-teal-xl text-teal-d',
  ARCHIVED:       'bg-[#F3F4F6] text-[#9CA3AF]',
  BLOCKED:        'bg-red-50 text-red-500',
}

const STATUS_DOT: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500',
  RENTED:    'bg-teal',
}

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE:     'Casa',
  PARKING:   'Parqueadero',
  ROOM:      'Habitación',
}

const COVER_COLORS = [
  ['#0D2B1F', '#1A7A6E'],
  ['#1D3045', '#2A6496'],
  ['#2C1F3E', '#6B46C1'],
  ['#2C1A0E', '#C05621'],
]

export function LandlordPropertiesList() {
  const router = useRouter()
  const [properties, setProperties] = useState<BackendProperty[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  useEffect(() => {
    landlordApi.getMyProperties()
      .then(setProperties)
      .catch((e) => setError(apiErrorMessage(e, 'Error al cargar propiedades')))
      .finally(() => setLoading(false))
  }, [])

  const handleRestore = async (id: string) => {
    const updated = await landlordApi.restoreProperty(id)
    setProperties((prev) => prev.map((p) => p.id === id ? updated : p))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-navy border-t-transparent animate-spin" />
          <span className="text-[13px] text-g2">Cargando propiedades…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FB]">
        <div className="bg-red-50 text-red-600 rounded-2xl px-6 py-5 text-[13px] font-medium max-w-sm text-center border border-red-100">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FB]">
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-[30px] text-navy leading-tight">Mis propiedades</h1>
            <p className="text-[13px] text-g1 mt-1">
              {properties.length === 0
                ? 'Aún no tienes propiedades publicadas'
                : `${properties.length} propiedad${properties.length !== 1 ? 'es' : ''} registrada${properties.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => router.push('/landlord/properties/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold border-none cursor-pointer hover:bg-navy/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
            Nueva propiedad
          </button>
        </div>

        {properties.length === 0 ? (
          <EmptyState onNew={() => router.push('/landlord/properties/new')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p, i) => (
              <PropertyCard
                key={p.id}
                property={p}
                colors={COVER_COLORS[i % COVER_COLORS.length]}
                onAction={() =>
                  p.status === 'DRAFT'
                    ? router.push(`/landlord/properties/new?draftId=${p.id}`)
                    : router.push(`/properties/${p.id}`)
                }
                onRestore={() => handleRestore(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PropertyCard({
  property: p,
  colors,
  onAction,
  onRestore,
}: {
  property:  BackendProperty
  colors:    string[]
  onAction:  () => void
  onRestore: () => Promise<void>
}) {
  const isDraft         = p.status === 'DRAFT'
  const isArchived      = p.status === 'ARCHIVED'
  const isPendingReview = p.status === 'PENDING_REVIEW'
  const [restoring,     setRestoring]     = useState(false)

  const handleRestore = async (e: MouseEvent) => {
    e.stopPropagation()
    setRestoring(true)
    try { await onRestore() } finally { setRestoring(false) }
  }

  const price = p.monthly_rent != null
    ? `$${p.monthly_rent.toLocaleString('es-CO')}`
    : null

  const coverPhoto = p.photo_urls?.[0]
  const typeLabel  = p.type ? (TYPE_LABEL[p.type] ?? p.type) : null

  return (
    <div
      onClick={onAction}
      className="bg-white rounded-2xl border border-g3 overflow-hidden flex flex-col hover:shadow-lg hover:shadow-black/5 transition-shadow duration-200 cursor-pointer"
    >

      {/* Cover */}
      <div className="relative h-[140px] flex-shrink-0">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverPhoto} alt="Portada" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
          />
        )}
        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm ${STATUS_STYLE[p.status] ?? 'bg-g4 text-g1'}`}>
            {STATUS_DOT[p.status] && (
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status]}`} />
            )}
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        </div>
        {/* Type badge */}
        {typeLabel && (
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-bold text-white/80 bg-black/25 backdrop-blur-sm px-2 py-0.5 rounded-full">
              {typeLabel}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">

        {/* Title & location */}
        <div>
          <h3 className="font-serif text-[16px] text-navy leading-snug line-clamp-1">
            {p.title || (p.city ? `${typeLabel ?? 'Propiedad'} en ${p.city}` : `Propiedad #${p.id.slice(0, 6)}`)}
          </h3>
          <p className="text-[12px] text-g1 mt-0.5 line-clamp-1">
            {isDraft
              ? 'Borrador — completa la información'
              : [p.neighborhood, p.city].filter(Boolean).join(', ') || '—'}
          </p>
        </div>

        {/* Stats row */}
        {(p.bedrooms != null || p.bathrooms != null || p.area != null) && (
          <div className="flex items-center gap-3 text-[12px] text-g1">
            {p.bedrooms  != null && <span className="flex items-center gap-1"><span className="text-[13px]">🛏</span>{p.bedrooms} hab.</span>}
            {p.bathrooms != null && <span className="flex items-center gap-1"><span className="text-[13px]">🚿</span>{p.bathrooms} baños</span>}
            {p.area      != null && <span className="flex items-center gap-1"><span className="text-[13px]">📐</span>{p.area} {p.area_unit === 'FT2' ? 'ft²' : 'm²'}</span>}
          </div>
        )}

        {/* Price */}
        <div className="flex-1 flex items-end">
          {price ? (
            <div>
              <span className="text-[18px] font-bold text-navy">{price}</span>
              <span className="text-[11px] text-g2 ml-1">/ mes</span>
            </div>
          ) : (
            <span className="text-[13px] text-g2 italic">Sin precio definido</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-g3">
          {isArchived ? (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="flex-1 py-2 rounded-xl text-[12px] font-semibold bg-[#F8F9FB] text-navy border border-g3 cursor-pointer hover:border-navy transition-colors disabled:opacity-40"
            >
              {restoring ? 'Restaurando…' : 'Restaurar'}
            </button>
          ) : (
            <button
              onClick={onAction}
              className={`flex-1 py-2 rounded-xl text-[12px] font-semibold border-none cursor-pointer transition-colors ${
                isDraft
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-navy text-white hover:bg-navy/90'
              }`}
            >
              {isDraft ? 'Continuar borrador' : 'Gestionar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white border border-g3 flex items-center justify-center shadow-sm">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M6 30V15L18 6l12 9v15" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13 30v-9h10v9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <h2 className="font-serif text-[22px] text-navy">Sin propiedades aún</h2>
        <p className="text-[13px] text-g1 mt-1.5 max-w-xs leading-relaxed">
          Publica tu primera propiedad para empezar a recibir postulantes verificados por Pacta.
        </p>
      </div>
      <button
        onClick={onNew}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white text-[13px] font-semibold border-none cursor-pointer hover:bg-navy/90 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
        Publicar primera propiedad
      </button>
    </div>
  )
}
