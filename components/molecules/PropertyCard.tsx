'use client'
import { useRouter } from 'next/navigation'
import type { BackendProperty } from '@/lib/types'

const CURRENCY_SYMBOL: Record<string, string> = { COP: '$', USD: 'US$', EUR: '€' }

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE:     'Casa',
  ROOM:      'Habitación',
  PARKING:   'Parqueadero',
}

const TYPE_ICON: Record<string, string> = {
  APARTMENT: '🏢',
  HOUSE:     '🏠',
  ROOM:      '🛏️',
  PARKING:   '🅿️',
}

interface Props {
  property: BackendProperty
  onClick?: () => void
}

export function PropertyCard({ property: p, onClick }: Props) {
  const router = useRouter()
  const handleClick = onClick ?? (() => router.push(`/properties/${p.id}`))
  const symbol = CURRENCY_SYMBOL[p.currency ?? 'COP'] ?? '$'
  const rent   = p.monthly_rent
    ? `${symbol} ${p.monthly_rent.toLocaleString('es-CO')}`
    : null
  const cover  = p.photo_urls?.[0] ?? null

  const meta = [
    p.area        ? `${p.area} m²`        : null,
    p.bedrooms    ? `${p.bedrooms} hab.`  : null,
    p.bathrooms   ? `${p.bathrooms} baños` : null,
  ].filter(Boolean).join('  ·  ')

  return (
    <article
      className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden border border-g3/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      onClick={handleClick}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-g4 overflow-hidden flex-shrink-0">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={p.title ?? 'Propiedad'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {TYPE_ICON[p.type ?? ''] ?? '🏠'}
          </div>
        )}

        {/* Type badge */}
        {p.type && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-navy text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {TYPE_LABEL[p.type] ?? p.type}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] text-g1 truncate leading-tight">
            {[p.neighborhood, p.city].filter(Boolean).join(', ') || 'Sin ubicación'}
          </p>
        </div>

        <h3 className="text-[15px] font-semibold text-navy leading-snug line-clamp-1">
          {p.title ?? '—'}
        </h3>

        {meta && (
          <p className="text-[12px] text-g2">{meta}</p>
        )}

        {rent && (
          <div className="mt-auto pt-2 border-t border-g3/60 flex items-baseline gap-1">
            <span className="text-[17px] font-bold text-navy">{rent}</span>
            <span className="text-[12px] text-g2">/ mes</span>
          </div>
        )}
      </div>
    </article>
  )
}
