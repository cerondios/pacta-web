'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { candidatesApi, landlordApi, filesApi, propertyConfigsApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { CandidateRow } from '@/components/molecules'
import { Badge } from '@/components/atoms'
import type { BackendProperty, Candidate, PropertyAttributeConfig } from '@/lib/types'

type Tab = 'info' | 'applications' | 'settings'

const scoreColor: Record<string, string> = { high: 'var(--success)', mid: 'var(--warning)', low: 'var(--danger)' }
const scoreBg:    Record<string, string> = { high: 'var(--success-l)', mid: 'var(--warning-l)', low: 'var(--danger-l)' }

const STATUS_LABEL: Record<string, string> = {
  DRAFT:          'Borrador',
  PENDING_REVIEW: 'En revisión',
  PUBLISHED:      'Publicado',
  PAUSED:         'Pausado',
  RESERVED:       'Reservado',
  RENTED:         'Arrendado',
  ARCHIVED:       'Archivado',
  BLOCKED:        'Bloqueado',
}

const STATUS_STYLE: Record<string, string> = {
  DRAFT:          'bg-g4 text-g1',
  PENDING_REVIEW: 'bg-warning-l text-warning',
  PUBLISHED:      'bg-success-l text-success',
  PAUSED:         'bg-warning-l text-warning',
  RESERVED:       'bg-teal-xl text-teal-d',
  RENTED:         'bg-teal-xl text-teal-d',
  ARCHIVED:       'bg-g4 text-g2',
  BLOCKED:        'bg-danger-l text-danger',
}

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE:     'Casa',
  PARKING:   'Parqueadero',
  ROOM:      'Habitación',
}

export function PropertyManagement({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const { showToast } = useAppStore()

  const [property,   setProperty]   = useState<BackendProperty | null>(null)
  const [candidates,       setCandidates]       = useState<Candidate[]>([])
  const [candidatesLoaded, setCandidatesLoaded] = useState(false)
  const [loading,          setLoading]          = useState(true)
  const [tab,              setTab]              = useState<Tab>('info')
  const [selected,         setSelected]         = useState<Candidate | null>(null)
  const [modal,            setModal]            = useState<'accept' | 'reject' | null>(null)

  useEffect(() => {
    landlordApi.getProperty(propertyId)
      .then(setProperty).catch(() => null)
      .finally(() => setLoading(false))
  }, [propertyId])

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'applications' && !candidatesLoaded) {
      candidatesApi.list(propertyId)
        .then((cands) => { setCandidates(cands); setCandidatesLoaded(true) })
        .catch(() => {})
    }
  }

  const rejectCandidate = () => {
    if (!selected) return
    showToast(`Rechazo notificado a ${selected.name}`)
    setCandidates((prev) => prev.filter((c) => c.id !== selected.id))
    setSelected(null)
    setModal(null)
  }

  const acceptCandidate = () => {
    if (!selected) return
    showToast(`Contrato generado para ${selected.name} · Pendiente de firma`)
    setModal(null)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-g2 text-sm">Cargando propiedad…</span>
      </div>
    )
  }

  const propName = property?.title ?? (property ? `${TYPE_LABEL[property.type ?? ''] ?? property.type ?? 'Propiedad'} · ${property.city ?? ''}` : `Propiedad #${propertyId.slice(0, 8)}`)
  const propPrice = property?.monthly_rent != null
    ? `$${property.monthly_rent.toLocaleString('es-CO')}`
    : null

  const tabClass = (t: Tab) =>
    `px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-all bg-transparent cursor-pointer flex items-center gap-1.5
     ${tab === t ? 'text-teal border-teal' : 'text-g1 border-transparent hover:text-navy'}`

  const handlePropertyUpdate = (updated: BackendProperty) => {
    setProperty(updated)
    showToast('Cambios guardados · La propiedad quedó en revisión')
  }

  const handlePropertyDelete = () => {
    router.push('/landlord/properties')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Top bar */}
      <div className="flex-shrink-0 h-[60px] bg-white border-b border-g3 flex items-center px-6 gap-3">
        <button
          className="text-xs font-semibold text-g1 bg-transparent border-none cursor-pointer hover:text-navy"
          onClick={() => router.push('/landlord/properties')}
        >
          ← Mis propiedades
        </button>
        <span className="text-g3">/</span>
        <span className="text-xs font-semibold text-navy line-clamp-1">{propName}</span>
        <div className="flex-1" />
        {property?.status && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[property.status] ?? 'bg-g4 text-g1'}`}>
            {STATUS_LABEL[property.status] ?? property.status}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-g3 bg-white flex-shrink-0 px-6">
        <button className={tabClass('info')} onClick={() => handleTabChange('info')}>
          Propiedad
        </button>
        <button className={tabClass('applications')} onClick={() => handleTabChange('applications')}>
          Solicitudes
          {candidates.length > 0 && (
            <span className="bg-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{candidates.length}</span>
          )}
        </button>
        <button className={tabClass('settings')} onClick={() => handleTabChange('settings')}>
          Ajustes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {tab === 'info' && property && <PropertyInfoTab property={property} />}
        {tab === 'info' && !property && (
          <div className="flex-1 flex items-center justify-center text-g2 text-sm">No se pudo cargar la propiedad.</div>
        )}
        {tab === 'settings' && property && (
          <SettingsTab
            property={property}
            onUpdate={handlePropertyUpdate}
            onDelete={handlePropertyDelete}
          />
        )}
        {tab === 'applications' && (
          <ApplicationsTab
            candidates={candidates}
            selected={selected}
            onSelect={setSelected}
            onAccept={() => setModal('accept')}
            onReject={() => setModal('reject')}
            onMsg={() => showToast('Chat con candidato')}
          />
        )}
      </div>

      {/* Accept modal */}
      {modal === 'accept' && selected && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="text-[40px] text-center mb-3">🤝</div>
          <h2 className="font-serif text-[22px] text-center text-navy mb-1.5">Confirmar selección</h2>
          <p className="text-[13px] text-g1 text-center mb-5">
            Vas a aceptar a <strong>{selected.name}</strong>. Se generará el contrato para firma.
          </p>
          <div className="bg-teal-xl rounded-[10px] px-4 py-3 mb-4">
            {[['Propiedad', propName], ['Canon', propPrice ?? '—']].map(([l, v]) => (
              <div key={l} className="flex justify-between py-0.5">
                <span className="text-xs text-teal-d">{l}</span>
                <span className="text-xs font-bold text-teal-d">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-full border-[1.5px] border-g3 text-[13px] font-semibold text-navy bg-transparent cursor-pointer hover:border-navy" onClick={() => setModal(null)}>Cancelar</button>
            <button className="flex-[2] py-2.5 rounded-full bg-teal text-white text-[13px] font-bold border-none cursor-pointer hover:bg-teal-l" onClick={acceptCandidate}>Generar contrato →</button>
          </div>
        </ModalOverlay>
      )}

      {/* Reject modal */}
      {modal === 'reject' && selected && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="text-[40px] text-center mb-3">✖</div>
          <h2 className="font-serif text-[22px] text-center text-danger mb-1.5">Rechazar solicitud</h2>
          <p className="text-[13px] text-g1 text-center mb-5">El candidato recibirá una notificación.</p>
          <div className="bg-warm-l rounded-[10px] px-4 py-3 mb-4">
            {[['Candidato', selected.name], ['Score', `${selected.score} / 100`]].map(([l, v]) => (
              <div key={l} className="flex justify-between py-0.5">
                <span className="text-xs text-warm">{l}</span>
                <span className="text-xs font-bold text-warm">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-full border-[1.5px] border-g3 text-[13px] font-semibold text-navy bg-transparent cursor-pointer" onClick={() => setModal(null)}>Cancelar</button>
            <button className="flex-[2] py-2.5 rounded-full bg-danger text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#b91c1c]" onClick={rejectCandidate}>Confirmar rechazo</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ── Photo gallery: collage outside, carousel lightbox inside ─────────────────

function PhotoGallery({ urls }: { urls: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (urls.length === 0) return null

  const open  = (i: number) => setLightboxIndex(i)
  const close = () => setLightboxIndex(null)

  return (
    <>
      {/* Collage */}
      {urls.length === 1 ? (
        <div className="rounded-2xl overflow-hidden cursor-zoom-in bg-black" style={{ height: 360 }} onClick={() => open(0)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[0]} alt="Foto 1" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="grid gap-1.5 rounded-2xl overflow-hidden" style={{ gridTemplateColumns: '2fr 1fr', height: 360 }}>
          <div className="bg-black cursor-zoom-in overflow-hidden" onClick={() => open(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[0]} alt="Portada" className="w-full h-full object-contain hover:opacity-90 transition-opacity" />
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateRows: `repeat(${Math.min(urls.length - 1, 4)}, 1fr)` }}>
            {urls.slice(1, 5).map((url, i) => (
              <div key={i} className="relative overflow-hidden cursor-zoom-in bg-black" onClick={() => open(i + 1)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 2}`} className="w-full h-full object-contain hover:opacity-90 transition-opacity" />
                {i === 3 && urls.length > 5 && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-[15px] font-bold">+{urls.length - 5} fotos</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <LightboxCarousel urls={urls} initial={lightboxIndex} onClose={close} />
      )}
    </>
  )
}

function LightboxCarousel({ urls, initial, onClose }: { urls: string[]; initial: number; onClose: () => void }) {
  const [active, setActive] = useState(initial)

  const prev = () => setActive((i) => (i - 1 + urls.length) % urls.length)
  const next = () => setActive((i) => (i + 1) % urls.length)

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  prev()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'Escape')     onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[700] bg-black/95 flex flex-col outline-none"
      onClick={onClose}
      onKeyDown={handleKey}
      tabIndex={0}
      ref={(el) => el?.focus()}
      role="dialog"
    >
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
        <div className="bg-white/10 text-white text-[12px] font-semibold px-3 py-1 rounded-full">
          {active + 1} / {urls.length}
        </div>
        <button
          className="w-9 h-9 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors border-none cursor-pointer"
          onClick={onClose}
        >✕</button>
      </div>

      {/* Image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-16" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[active]}
          alt={`Foto ${active + 1}`}
          className="max-h-full max-w-full object-contain rounded-xl"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        />

        {urls.length > 1 && (
          <>
            <button
              className="absolute left-3 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-none cursor-pointer"
              onClick={(e) => { e.stopPropagation(); prev() }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              className="absolute right-3 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-none cursor-pointer"
              onClick={(e) => { e.stopPropagation(); next() }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {urls.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto scrollbar-none px-5 py-3 justify-center" onClick={(e) => e.stopPropagation()}>
          {urls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Miniatura ${i + 1}`}
              onClick={() => setActive(i)}
              className={`h-[56px] w-[72px] flex-shrink-0 rounded-lg object-cover cursor-pointer transition-all ${
                i === active ? 'ring-2 ring-white ring-offset-1 ring-offset-black opacity-100' : 'opacity-35 hover:opacity-65'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyInfoTab({ property: p }: { property: BackendProperty }) {
  const photoUrls = p.photo_urls ?? []
  const price     = p.monthly_rent != null ? `$${p.monthly_rent.toLocaleString('es-CO')}` : null
  const adminFee  = p.admin_fee    != null ? `$${p.admin_fee.toLocaleString('es-CO')}`    : null
  const typeLbl   = TYPE_LABEL[p.type ?? ''] ?? p.type ?? '—'
  const location  = [p.neighborhood, p.city, p.country].filter(Boolean).join(', ')

  const quickStats = [
    p.bedrooms      != null && { icon: '🛏', val: p.bedrooms,      unit: p.bedrooms === 1 ? 'habitación' : 'habitaciones' },
    p.bathrooms     != null && { icon: '🚿', val: p.bathrooms,     unit: p.bathrooms === 1 ? 'baño' : 'baños' },
    p.area          != null && { icon: '📐', val: p.area,          unit: p.area_unit === 'FT2' ? 'ft²' : 'm²' },
    p.floors        != null && { icon: '🏢', val: `${p.floors} piso${p.floors !== 1 ? 's' : ''}`, unit: '' },
    p.parking_spots != null && p.parking_spots > 0 && { icon: '🚗', val: p.parking_spots, unit: p.parking_spots === 1 ? 'parqueadero' : 'parqueaderos' },
  ].filter(Boolean) as { icon: string; val: string | number; unit: string }[]

  return (
    <div className="flex-1 overflow-y-auto bg-white">

      {/* Full-width gallery */}
      {photoUrls.length > 0 && (
        <div className="max-w-[1100px] mx-auto px-6 pt-6">
          <PhotoGallery urls={photoUrls} />
        </div>
      )}

      {/* Two-column layout */}
      <div className="max-w-[1100px] mx-auto px-6 pb-16 pt-8">
        <div className="flex gap-16 items-start">

          {/* ── Left column ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Title & location */}
            <div className="pb-6 border-b border-gray-200">
              <h1 className="text-[28px] font-semibold text-gray-900 leading-tight mb-2">
                {p.title ?? `${typeLbl} en ${p.city ?? '—'}`}
              </h1>
              {location && (
                <p className="text-[15px] text-gray-500">{location}</p>
              )}
              {p.address && (
                <p className="text-[13px] text-gray-400 mt-0.5">{p.address}</p>
              )}
            </div>

            {/* Quick stats */}
            {quickStats.length > 0 && (
              <div className="py-6 border-b border-gray-200">
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {quickStats.map(({ icon, val, unit }) => (
                    <div key={`${val}${unit}`} className="flex items-center gap-2">
                      <span className="text-[18px]">{icon}</span>
                      <span className="text-[15px] text-gray-700">
                        <span className="font-semibold">{val}</span>
                        {unit && <span className="font-normal text-gray-500"> {unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-900 mb-3">Acerca de este espacio</h2>
                <p className="text-[15px] text-gray-600 leading-[1.75]">{p.description}</p>
              </div>
            )}

            {/* Amenities */}
            {p.amenities.length > 0 && (
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Lo que ofrece este lugar</h2>
                <div className="grid grid-cols-2 gap-3">
                  {p.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-3 text-[14px] text-gray-700">
                      <span className="w-5 h-5 flex-shrink-0 text-gray-400">✓</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Condiciones del lugar</h2>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { icon: '🐾', label: 'Mascotas',  allowed: p.allows_pets },
                  { icon: '🚬', label: 'Fumadores', allowed: p.allows_smokers },
                  { icon: '👶', label: 'Niños',     allowed: p.allows_children },
                ] as { icon: string; label: string; allowed: boolean }[]).map(({ icon, label, allowed }) => (
                  <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-gray-50 text-center">
                    <span className="text-[24px]">{icon}</span>
                    <span className="text-[13px] font-medium text-gray-700">{label}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${allowed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                      {allowed ? 'Permitido' : 'No permitido'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Details list */}
            <div className="py-6">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Detalles de la propiedad</h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {([
                  ['Tipo de inmueble', typeLbl],
                  p.city         && ['Ciudad',          p.city],
                  p.neighborhood && ['Barrio',          p.neighborhood],
                  p.country      && ['País',            p.country],
                  p.currency     && ['Moneda',          p.currency],
                  p.min_contract_months != null && ['Contrato mínimo', `${p.min_contract_months} meses`],
                  adminFee       && ['Administración',  adminFee],
                ] as ([string, string] | null | false | undefined)[]).filter((x): x is [string, string] => !!x).map(([label, value]) => (
                  <div key={label as string}>
                    <div className="text-[12px] text-gray-400 font-medium mb-0.5">{label}</div>
                    <div className="text-[14px] text-gray-800 font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing fields warning */}
            {p.missing_publish_fields.length > 0 && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[13px] font-semibold text-amber-700 mb-1.5">Campos faltantes para publicar</p>
                <ul className="list-disc list-inside text-[13px] text-amber-600 space-y-0.5">
                  {p.missing_publish_fields.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* ── Right column — sticky price card ────────────── */}
          {price && (
            <div className="w-[340px] flex-shrink-0 sticky top-6">
              <div className="rounded-2xl border border-gray-200 shadow-[0_6px_30px_rgba(0,0,0,0.10)] p-6">
                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-5">
                  <span className="text-[26px] font-bold text-gray-900">{price}</span>
                  <span className="text-[14px] text-gray-500">/ mes</span>
                </div>

                {/* Pricing breakdown */}
                <div className="divide-y divide-gray-100 mb-5">
                  <div className="flex justify-between py-3">
                    <span className="text-[14px] text-gray-600">Canon mensual</span>
                    <span className="text-[14px] font-medium text-gray-900">{price}</span>
                  </div>
                  {adminFee && (
                    <div className="flex justify-between py-3">
                      <span className="text-[14px] text-gray-600">Administración</span>
                      <span className="text-[14px] font-medium text-gray-900">{adminFee}</span>
                    </div>
                  )}
                  {(p.monthly_rent != null || p.admin_fee != null) && (
                    <div className="flex justify-between py-3">
                      <span className="text-[14px] font-semibold text-gray-900">Total estimado</span>
                      <span className="text-[14px] font-semibold text-gray-900">
                        ${((p.monthly_rent ?? 0) + (p.admin_fee ?? 0)).toLocaleString('es-CO')}
                      </span>
                    </div>
                  )}
                </div>

                <button className="w-full py-3.5 rounded-xl bg-[#E61E4D] hover:bg-[#d61849] text-white text-[15px] font-semibold border-none cursor-pointer transition-colors">
                  Contactar arrendador
                </button>

                <p className="text-center text-[12px] text-gray-400 mt-3">No se realizará ningún cargo ahora</p>

                {p.min_contract_months != null && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center text-[13px] text-gray-500">
                    Contrato mínimo de <span className="font-semibold text-gray-700">{p.min_contract_months} meses</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Applications tab ──────────────────────────────────────────────────────────

export function ApplicationsTab({
  candidates,
  selected,
  onSelect,
  onAccept,
  onReject,
  onMsg,
}: {
  candidates:  Candidate[]
  selected:    Candidate | null
  onSelect:    (c: Candidate) => void
  onAccept:    () => void
  onReject:    () => void
  onMsg:       () => void
}) {
  const [filter, setFilter] = useState('Todos')

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* List */}
      <div className="w-[340px] flex-shrink-0 border-r border-g3 flex flex-col overflow-hidden bg-white">
        <div className="px-4 pt-4 pb-2">
          <div className="text-sm font-bold text-navy">{candidates.length} solicitudes</div>
          <div className="text-[11px] text-g1">Ordenadas por score</div>
        </div>
        <div className="flex gap-1.5 px-4 py-2 border-b border-g3 overflow-x-auto scrollbar-none flex-shrink-0">
          {['Todos', '⚡ Alto score', '✓ Verificados', '🔔 Nuevos'].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-full border-[1.5px] text-[11px] font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 transition-all
                ${filter === c ? 'bg-navy text-white border-navy' : 'border-g3 text-g1 bg-transparent hover:border-navy hover:text-navy'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1">
          {candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <span className="text-3xl opacity-30">👥</span>
              <p className="text-sm font-semibold text-g1">Sin solicitudes aún</p>
              <p className="text-xs text-g2">Los postulantes aparecerán aquí cuando apliquen.</p>
            </div>
          ) : candidates.map((c, i) => (
            <CandidateRow
              key={c.id}
              candidate={c}
              rank={i}
              isActive={selected?.id === c.id}
              onClick={() => onSelect(c)}
            />
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col overflow-hidden bg-sand">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-g2">
            <span className="text-[42px] opacity-35">👥</span>
            <span className="text-sm font-semibold text-g1">Selecciona una solicitud</span>
          </div>
        ) : (
          <CandidateDetail c={selected} onAccept={onAccept} onReject={onReject} onMsg={onMsg} />
        )}
      </div>
    </div>
  )
}

// ── Candidate detail ──────────────────────────────────────────────────────────

function CandidateDetail({ c, onAccept, onReject, onMsg }: { c: Candidate; onAccept: () => void; onReject: () => void; onMsg: () => void }) {
  const months = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May']
  const maxOb  = Math.max(...c.obData)
  const sbColor = (cls: string) =>
    cls === 'high' ? 'linear-gradient(90deg,var(--teal),var(--teal-l))' :
    cls === 'mid'  ? 'linear-gradient(90deg,var(--warning),#FCD34D)' :
                     'linear-gradient(90deg,var(--danger),#F87171)'

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-g3 px-6 py-5 flex items-start gap-4 sticky top-0 z-10">
        <div className="relative">
          <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: c.color }}>
            {c.initials}
            <div className="absolute inset-[-4px] rounded-full border-[3px]" style={{ borderColor: scoreColor[c.scoreClass] }} />
            <div className="absolute bottom-[-2px] right-[-2px] w-[18px] h-[18px] rounded-full bg-success border-2 border-white flex items-center justify-center text-[9px] text-white">✓</div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-navy mb-0.5">{c.name}</h2>
          <div className="flex gap-1.5 flex-wrap mb-1.5">
            {c.badges.includes('verified') && <Badge variant="success">✓ Identidad</Badge>}
            {c.badges.includes('ob') && <Badge variant="teal">🏦 Open Banking</Badge>}
            {c.badges.includes('bio') && <Badge variant="purple">🔬 Biometría</Badge>}
            {c.isNew && <Badge variant="warm">NUEVO</Badge>}
          </div>
          <p className="text-[11px] text-g1">{c.meta}</p>
        </div>
        <div className="rounded-[13px] px-4 py-3 text-center flex-shrink-0" style={{ background: scoreBg[c.scoreClass] }}>
          <div className="font-serif text-[36px] leading-none" style={{ color: scoreColor[c.scoreClass] }}>{c.score}</div>
          <div className="text-[9px] font-bold uppercase tracking-[.5px] mt-0.5" style={{ color: scoreColor[c.scoreClass] }}>Score Pacta</div>
          <div className="text-[10px] text-g1 mt-1">{c.rankLabel}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Section title="Desglose del Score" icon="🏆" sub="Actualizado hoy">
          {c.scoreBreakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xs text-navy w-[120px] flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-g4 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.val}%`, background: sbColor(b.cls) }} />
              </div>
              <span className="text-[11px] font-bold text-navy w-[22px] text-right">{b.val}</span>
            </div>
          ))}
        </Section>

        <Section title="Información Financiera · Open Banking" icon="🏦" sub="Verificado">
          <div className="grid grid-cols-2 gap-px bg-g3">
            {Object.entries({
              'Ingreso mensual':        [c.fin.ingreso,    c.fin.ingresoSub,    parseFloat(c.fin.ingreso.replace(/\D/g, '')) > 3e6 ? 'pos' : ''],
              'Relación ingreso/canon': [c.fin.relacion,   c.fin.relacionSub,   parseFloat(c.fin.relacion) < 2 ? 'warn' : 'pos'],
              'Cuentas conectadas':     [c.fin.cuentas,    c.fin.cuentasSub,    ''],
              'Deudas activas':         [c.fin.deudas,     c.fin.deudasSub,     c.fin.deudas === '$0' ? 'pos' : ''],
              'Ahorros promedio':       [c.fin.ahorros,    c.fin.ahorrosSub,    ''],
              'Antigüedad laboral':     [c.fin.antiguedad, c.fin.antiguedadSub, ''],
            }).map(([label, [val, sub, cls]]) => (
              <div key={label} className="bg-white p-3">
                <div className="text-[9px] font-semibold uppercase tracking-[.5px] text-g2 mb-0.5">{label}</div>
                <div className={`text-[13px] font-semibold ${cls === 'pos' ? 'text-success' : cls === 'warn' ? 'text-warning' : 'text-navy'}`}>{val}</div>
                <div className="text-[9px] text-g1 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[.5px] text-g1 mb-2">Ingresos mensuales · Open Banking</div>
            <div className="flex items-end gap-1 h-16 mb-1">
              {c.obData.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-[3px] min-h-[3px]" style={{ height: `${Math.round((v / maxOb) * 100)}%`, background: i === 6 ? 'var(--teal)' : 'var(--teal-xl)' }} />
              ))}
            </div>
            <div className="flex gap-1">{months.map((m) => <div key={m} className="flex-1 text-center text-[8px] text-g2">{m}</div>)}</div>
          </div>
        </Section>

        <Section title="Historial de Arriendo" icon="🏠" sub={c.histSub}>
          {c.rentHist.length ? c.rentHist.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.ok ? 'var(--success)' : 'var(--warning)' }} />
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-navy">{r.addr}</div>
                <div className="text-[10px] text-g1">{r.period}</div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.ok ? 'bg-success-l text-success' : 'bg-warning-l text-warning'}`}>{r.label}</span>
            </div>
          )) : <p className="text-xs text-g1 py-1">Sin arriendos previos registrados.</p>}
        </Section>

        <Section title="Proceso de Verificación" icon="🔍" sub="Completado">
          <div className="flex flex-col gap-0 pb-1">
            {c.verifySteps.map((s, i) => (
              <div key={i} className="flex gap-2.5 relative">
                {i < c.verifySteps.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-g3" />}
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] border-2 border-success bg-success-l text-success z-10 flex-shrink-0 mt-0.5">{s.icon}</div>
                <div className="pb-3">
                  <div className="text-[11px] font-semibold text-navy">{s.title}</div>
                  <div className="text-[9px] text-g1">{s.time}</div>
                  <div className="text-[10px] text-g1 mt-0.5 leading-[1.5]">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="flex-shrink-0 bg-white border-t border-g3 px-4 py-3 flex items-center gap-2">
        <button className="px-4 py-2 rounded-full border-[1.5px] border-danger text-danger text-xs font-semibold bg-transparent cursor-pointer hover:bg-danger hover:text-white transition-all" onClick={onReject}>✕ Rechazar</button>
        <button className="px-4 py-2 rounded-full border-[1.5px] border-g3 text-navy text-xs font-semibold bg-transparent cursor-pointer hover:border-navy transition-all" onClick={onMsg}>💬 Mensaje</button>
        <button className="flex-1 py-2.5 rounded-full bg-teal text-white text-[13px] font-bold border-none cursor-pointer shadow-[0_4px_14px_rgba(26,122,110,.3)] hover:bg-teal-l hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5" onClick={onAccept}>✓ Aceptar →</button>
      </div>
    </div>
  )
}

function Section({ title, icon, sub, children }: { title: string; icon: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[13px] mb-3 overflow-hidden">
      <div className="px-4 py-3 border-b border-g4 flex items-center gap-1.5">
        <span className="text-[15px]">{icon}</span>
        <span className="text-xs font-bold text-navy flex-1">{title}</span>
        <span className="text-[10px] text-g1">{sub}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'CO', label: 'Colombia'   },
  { code: 'MX', label: 'México'     },
  { code: 'AR', label: 'Argentina'  },
  { code: 'CL', label: 'Chile'      },
  { code: 'PE', label: 'Perú'       },
  { code: 'EC', label: 'Ecuador'    },
  { code: 'VE', label: 'Venezuela'  },
  { code: 'UY', label: 'Uruguay'    },
  { code: 'PY', label: 'Paraguay'   },
  { code: 'BO', label: 'Bolivia'    },
]
const CURRENCIES = [
  { code: 'COP', symbol: '$',   label: 'COP' },
  { code: 'USD', symbol: 'US$', label: 'USD' },
  { code: 'EUR', symbol: '€',   label: 'EUR' },
]
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const S_TYPE_CONFIG: Record<string, { showBedrooms: boolean; showBathrooms: boolean; showFloor: boolean; floorLabel: string; showParkingSpots: boolean; showAdminFee: boolean; showContractTerms: boolean; showAmenities: boolean; minPhotos: number }> = {
  APARTMENT: { showBedrooms: true,  showBathrooms: true,  showFloor: true,  floorLabel: 'Piso',              showParkingSpots: false, showAdminFee: true,  showContractTerms: true,  showAmenities: true,  minPhotos: 4 },
  HOUSE:     { showBedrooms: true,  showBathrooms: true,  showFloor: true,  floorLabel: 'Número de pisos',   showParkingSpots: true,  showAdminFee: true,  showContractTerms: true,  showAmenities: true,  minPhotos: 4 },
  PARKING:   { showBedrooms: false, showBathrooms: false, showFloor: false, floorLabel: '',                  showParkingSpots: false, showAdminFee: false, showContractTerms: true,  showAmenities: false, minPhotos: 2 },
  ROOM:      { showBedrooms: false, showBathrooms: false, showFloor: false, floorLabel: '',                  showParkingSpots: false, showAdminFee: false, showContractTerms: true,  showAmenities: true,  minPhotos: 2 },
}
const S_CATEGORY_ORDER = ['FEATURE', 'AMENITY', 'SERVICE'] as const
const S_CATEGORY_LABEL: Record<string, string> = { FEATURE: 'Características', AMENITY: 'Amenidades', SERVICE: 'Servicios incluidos' }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-g3 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-g3 bg-g4/40">
        <h2 className="text-[13px] font-bold uppercase tracking-[.6px] text-g1">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

function SCounter({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-g3">
      <span className="text-[13px] text-navy font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-7 h-7 rounded-full border border-g3 bg-g4 text-g1 text-[16px] flex items-center justify-center cursor-pointer hover:border-navy hover:text-navy disabled:opacity-30 transition-colors">−</button>
        <span className="text-[14px] font-bold text-navy w-5 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-7 h-7 rounded-full border border-g3 bg-g4 text-g1 text-[16px] flex items-center justify-center cursor-pointer hover:border-navy hover:text-navy disabled:opacity-30 transition-colors">+</button>
      </div>
    </div>
  )
}

export function SettingsTab({
  property: p,
  onUpdate,
  onDelete,
}: {
  property: BackendProperty
  onUpdate: (updated: BackendProperty) => void
  onDelete: () => void
}) {
  const { showToast } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDraft    = p.status === 'DRAFT'
  const isArchived = p.status === 'ARCHIVED'
  const isBlocked  = p.status === 'BLOCKED'
  const canDelete  = isDraft || isArchived
  const canEdit    = !isArchived && !isBlocked
  const cfg        = S_TYPE_CONFIG[p.type ?? ''] ?? null

  const initialFormRef = useRef<typeof form | null>(null)

  const [saving,        setSaving]        = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [archiving,     setArchiving]     = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lightboxIndex,   setLightboxIndex]   = useState<number | null>(null)
  const [configs,       setConfigs]       = useState<PropertyAttributeConfig[]>([])
  const pendingDeleteKeys = useRef<string[]>([])

  const [form, setForm] = useState({
    title:             p.title             ?? '',
    country:           p.country           ?? 'CO',
    city:              p.city              ?? '',
    neighborhood:      p.neighborhood      ?? '',
    address:           p.address           ?? '',
    area:              p.area              ?? 0,
    areaUnit:          (p.area_unit as 'M2' | 'FT2') ?? 'M2',
    bedrooms:          p.bedrooms          ?? 1,
    bathrooms:         p.bathrooms         ?? 1,
    floors:            p.floors            ?? 1,
    parkingSpots:      p.parking_spots     ?? 0,
    amenities:         p.amenities         ?? [] as string[],
    description:       p.description       ?? '',
    monthlyRent:       p.monthly_rent      != null ? String(p.monthly_rent) : '',
    adminFee:          p.admin_fee         != null ? String(p.admin_fee)    : '',
    currency:          p.currency          ?? 'COP',
    minContractMonths: p.min_contract_months ?? 12,
    allowsPets:        p.allows_pets,
    allowsSmokers:     p.allows_smokers,
    allowsChildren:    p.allows_children,
    photoKeys:         p.photo_keys        ?? [] as string[],
  })
  const [photoUrls, setPhotoUrls] = useState<string[]>(p.photo_urls ?? [])
  if (initialFormRef.current === null) initialFormRef.current = form

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialFormRef.current)

  useEffect(() => {
    if (!p.type) return
    propertyConfigsApi.listEnabled(p.type).then(setConfigs).catch(() => setConfigs([]))
  }, [p.type])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toggleAmenity = (name: string) =>
    set('amenities', form.amenities.includes(name)
      ? form.amenities.filter((x) => x !== name)
      : [...form.amenities, name])

  const appendPhoto = (url: string, key: string) => {
    setPhotoUrls((u) => [...u, url])
    setForm((f) => ({ ...f, photoKeys: [...f.photoKeys, key] }))
  }

  const removePhoto = (i: number) => {
    const key = form.photoKeys[i]
    setPhotoUrls((u) => u.filter((_, idx) => idx !== i))
    setForm((f) => ({ ...f, photoKeys: f.photoKeys.filter((_, idx) => idx !== i) }))
    if (key) pendingDeleteKeys.current.push(key)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) { showToast('Solo JPG, PNG, WEBP o HEIC.'); continue }
      try {
        const uploaded = await filesApi.upload(file)
        appendPhoto(uploaded.url, uploaded.key)
      } catch (err) { showToast(apiErrorMessage(err, 'Error al subir imagen.')) }
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        title:               form.title       || undefined,
        country:             form.country     || undefined,
        city:                form.city        || undefined,
        neighborhood:        form.neighborhood || undefined,
        address:             form.address     || undefined,
        area:                form.area        || undefined,
        area_unit:           form.areaUnit,
        bedrooms:            cfg?.showBedrooms     ? form.bedrooms     : null,
        bathrooms:           cfg?.showBathrooms    ? form.bathrooms    : null,
        floors:              cfg?.showFloor        ? form.floors       : null,
        parking_spots:       form.parkingSpots || undefined,
        amenities:           form.amenities,
        photo_keys:          form.photoKeys,
        description:         form.description || undefined,
        currency:            form.currency,
        monthly_rent:        form.monthlyRent ? parseInt(form.monthlyRent, 10) : undefined,
        admin_fee:           form.adminFee    ? parseInt(form.adminFee,    10) : undefined,
        min_contract_months: form.minContractMonths,
        allows_pets:         form.allowsPets,
        allows_smokers:      form.allowsSmokers,
        allows_children:     form.allowsChildren,
      }
      const updated = await landlordApi.update(p.id, body as Parameters<typeof landlordApi.update>[1])
      const keysToDelete = pendingDeleteKeys.current.splice(0)
      await Promise.allSettled(keysToDelete.map((k) => filesApi.deleteFile(k)))
      initialFormRef.current = { ...form }
      onUpdate(updated)
    } catch (err) {
      showToast(apiErrorMessage(err, 'Error al guardar cambios'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await landlordApi.deleteProperty(p.id); onDelete() }
    catch (err) { showToast(apiErrorMessage(err, 'Error al eliminar la propiedad')); setDeleting(false) }
  }

  const handleRestore = async () => {
    try { const updated = await landlordApi.restoreProperty(p.id); onUpdate(updated) }
    catch (err) { showToast(apiErrorMessage(err, 'Error al restaurar la propiedad')) }
  }

  const handleArchive = async () => {
    setArchiving(true)
    try { await landlordApi.archiveProperty(p.id); onDelete() }
    catch (err) { showToast(apiErrorMessage(err, 'Error al archivar la propiedad')); setArchiving(false) }
  }

  const iCls = `w-full border border-g3 rounded-xl px-4 py-2.5 text-[14px] text-navy outline-none focus:border-teal focus:shadow-[0_0_0_3px_rgba(26,122,110,.08)] bg-white transition-all`
  const lCls = `block text-[11px] font-bold uppercase tracking-[.5px] text-g2 mb-1.5`

  const grouped = configs.reduce<Record<string, PropertyAttributeConfig[]>>((acc, c) => {
    ;(acc[c.category] ??= []).push(c); return acc
  }, {})



  return (
    <>
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--g4)' }}>
      <div className="max-w-[680px] mx-auto px-5 py-8 flex flex-col gap-4">

        {/* Status banner */}
        {!isDraft && canEdit && (
          <div className="flex items-center gap-3 bg-warning-l border border-warning/20 rounded-2xl px-5 py-3.5">
            <span className="text-[16px]">⚠️</span>
            <p className="text-[13px] font-semibold text-warning">Guardar enviará la propiedad a revisión nuevamente.</p>
          </div>
        )}
        {isArchived && (
          <div className="flex items-center gap-3 bg-g4 border border-g3 rounded-2xl px-5 py-3.5">
            <span className="text-[16px]">📦</span>
            <p className="text-[13px] font-semibold text-g1">Esta propiedad está archivada. Puedes eliminarla o restaurarla.</p>
          </div>
        )}

        {(<fieldset disabled={!canEdit} className="contents">{/* eslint-disable-next-line */}

          {/* ── Listing + Photos ── */}
          <SectionCard title="Anuncio">
            <div className="flex flex-col gap-5">
              <div>
                <label className={lCls}>Título</label>
                <input className={iCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ej: Apartamento luminoso en Chapinero" />
              </div>
              <div>
                <label className={lCls}>Descripción</label>
                <textarea className={`${iCls} resize-none`} rows={3}
                  value={form.description} onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe la propiedad: acabados, vista, zonas comunes, transporte…" />
                <p className="text-[11px] text-g2 mt-1 text-right">{form.description.length} / 500</p>
              </div>

              <div>
                <label className={lCls}>Fotos</label>
                {/* Photo grid + add slot */}
                <div className="grid grid-cols-4 gap-2">
                  {photoUrls.map((url, i) => (
                    <div key={url} className="relative group aspect-square rounded-xl overflow-hidden bg-g3 cursor-zoom-in" onClick={() => setLightboxIndex(i)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl" />
                      {canEdit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-[11px] font-bold border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
                        >✕</button>
                      )}
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-navy text-white px-2 py-0.5 rounded-full">Portada</span>
                      )}
                    </div>
                  ))}

                  {/* Add photo slot — hidden when archived */}
                  {canEdit && (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-g3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-teal hover:bg-teal-xl/40 transition-all group"
                    >
                      {uploading ? (
                        <div className="w-5 h-5 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-g2 group-hover:text-teal transition-colors">
                            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          </svg>
                          <span className="text-[10px] font-semibold text-g2 group-hover:text-teal transition-colors">Añadir</span>
                        </>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden"
                        onChange={(e) => handleFiles(e.target.files)} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-g2 mt-2">JPG · PNG · WEBP · HEIC — mín. {cfg?.minPhotos ?? 2} fotos · máximo 10MB por foto</p>
              </div>
            </div>
          </SectionCard>

          {/* ── Location ── */}
          <SectionCard title="Ubicación">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls}>País</label>
                  <select className={iCls} value={form.country} onChange={(e) => set('country', e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lCls}>Ciudad</label>
                  <input className={iCls} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Bogotá" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls}>Barrio / Sector</label>
                  <input className={iCls} value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder="Chapinero Alto" />
                </div>
                <div>
                  <label className={lCls}>Dirección</label>
                  <input className={iCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Calle 72 # 10-35" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Dimensions ── */}
          {cfg && (cfg.showBedrooms || cfg.showBathrooms || cfg.showFloor || cfg.showParkingSpots) && (
            <SectionCard title="Dimensiones">
              <div className="flex flex-col gap-4">
                <div>
                  <label className={lCls}>Área</label>
                  <div className="flex gap-2">
                    <input type="number" min={1} className={`${iCls} flex-1`} value={form.area || ''} onChange={(e) => { const n = Number(e.target.value); set('area', isNaN(n) || n < 0 ? 0 : n) }} placeholder="65" />
                    <div className="flex rounded-xl border border-g3 overflow-hidden text-[12px] font-bold flex-shrink-0">
                      {(['M2', 'FT2'] as const).map((u) => (
                        <button key={u} onClick={() => set('areaUnit', u)}
                          className={`px-3.5 py-2.5 border-none cursor-pointer transition-colors ${u === form.areaUnit ? 'bg-navy text-white' : 'bg-white text-g1 hover:text-navy'}`}>
                          {u === 'M2' ? 'm²' : 'ft²'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {cfg.showBedrooms     && <SCounter label="Habitaciones"   min={0} max={20} value={form.bedrooms}     onChange={(v) => set('bedrooms', v)} />}
                  {cfg.showBathrooms    && <SCounter label="Baños"           min={0} max={10} value={form.bathrooms}    onChange={(v) => set('bathrooms', v)} />}
                  {cfg.showFloor        && <SCounter label={cfg.floorLabel}  min={1} max={80} value={form.floors}       onChange={(v) => set('floors', v)} />}
                  {cfg.showParkingSpots && <SCounter label="Parqueaderos"    min={0} max={10} value={form.parkingSpots} onChange={(v) => set('parkingSpots', v)} />}
                </div>
              </div>
            </SectionCard>
          )}


          {/* ── Amenities ── */}
          {cfg?.showAmenities && configs.length > 0 && (
            <SectionCard title="Atributos">
              <div className="flex flex-col gap-5">
                {S_CATEGORY_ORDER.map((cat) => {
                  const items = grouped[cat]
                  if (!items?.length) return null
                  return (
                    <div key={cat}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-g2 mb-2.5">{S_CATEGORY_LABEL[cat]}</p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((c) => {
                          const active = form.amenities.includes(c.display_name)
                          return (
                            <button key={c.id} onClick={() => toggleAmenity(c.display_name)}
                              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium cursor-pointer border transition-all ${active ? 'bg-navy text-white border-navy' : 'bg-white text-g1 border-g3 hover:border-navy hover:text-navy'}`}>
                              {active && <span className="mr-1 text-[10px]">✓</span>}
                              {c.display_name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Pricing ── */}
          <SectionCard title="Precio">
            {/* Currency toggle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-semibold text-g1 uppercase tracking-[.5px] mr-1">Moneda</span>
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => set('currency', c.code)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors ${form.currency === c.code ? 'bg-navy text-white' : 'bg-g4 text-g1 hover:text-navy'}`}>
                  {c.code}
                </button>
              ))}
            </div>

            <div className="h-px bg-g3 -mx-5 mb-4" />

            {/* Rent */}
            <div className="mb-1">
              <label className={lCls}>Arriendo mensual</label>
              <div className="flex items-center rounded-xl border-[1.5px] border-g3 overflow-hidden focus-within:border-teal transition-all">
                <span className="px-3 py-3 text-[13px] font-semibold text-g1 bg-g4 border-r border-g3 select-none flex-shrink-0">
                  {CURRENCIES.find((c) => c.code === form.currency)?.symbol}
                </span>
                <input type="text"
                  placeholder={form.currency === 'COP' ? '2.800.000' : form.currency === 'USD' ? '700' : '650'}
                  value={form.monthlyRent ? Number(form.monthlyRent).toLocaleString('es-CO') : ''}
                  onChange={(e) => set('monthlyRent', e.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 px-3 py-3 text-[14px] font-semibold text-navy bg-white outline-none" />
                <span className="px-3 py-3 text-[11px] font-bold text-g2 bg-white select-none flex-shrink-0">/ mes</span>
              </div>
            </div>

            {/* Admin fee */}
            {cfg?.showAdminFee && (
              <div className="mt-4">
                <label className={lCls}>Administración <span className="font-normal normal-case tracking-normal text-g2">(opcional)</span></label>
                <div className="flex items-center rounded-xl border-[1.5px] border-g3 overflow-hidden focus-within:border-teal transition-all">
                  <span className="px-3 py-3 text-[13px] font-semibold text-g1 bg-g4 border-r border-g3 select-none flex-shrink-0">
                    {CURRENCIES.find((c) => c.code === form.currency)?.symbol}
                  </span>
                  <input type="text" placeholder="0"
                    value={form.adminFee ? Number(form.adminFee).toLocaleString('es-CO') : ''}
                    onChange={(e) => set('adminFee', e.target.value.replace(/[^0-9]/g, ''))}
                    className="flex-1 px-3 py-3 text-[14px] font-semibold text-navy bg-white outline-none" />
                  <span className="px-3 py-3 text-[11px] font-bold text-g2 bg-white select-none flex-shrink-0">/ mes</span>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Contract terms ── */}
          {cfg?.showContractTerms && (
            <SectionCard title="Condiciones del contrato">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[13px] font-semibold text-navy">Meses mínimos de contrato</span>
                    <span className="text-[13px] font-bold text-teal bg-teal-xl px-3 py-1 rounded-full">{form.minContractMonths} {form.minContractMonths === 1 ? 'mes' : 'meses'}</span>
                  </div>
                  <input type="range" min={1} max={36} value={form.minContractMonths}
                    onChange={(e) => set('minContractMonths', Number(e.target.value))}
                    className="w-full accent-teal" />
                  <div className="flex justify-between text-[11px] text-g2 mt-1.5"><span>1 mes</span><span>36 meses</span></div>
                </div>
                <div className="flex flex-col divide-y divide-g3">
                  {([
                    ['allowsPets',      '🐾', 'Mascotas'],
                    ['allowsSmokers',   '🚬', 'Fumadores'],
                    ['allowsChildren',  '👶', 'Niños'],
                  ] as [keyof typeof form, string, string][]).map(([key, icon, label]) => (
                    <div key={key} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[18px]">{icon}</span>
                        <span className="text-[14px] font-medium text-navy">{label}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[12px] font-semibold ${form[key] ? 'text-teal' : 'text-g2'}`}>
                          {form[key] ? 'Se permiten' : 'No se permiten'}
                        </span>
                        <button
                          onClick={() => set(key, !form[key] as (typeof form)[keyof typeof form])}
                          className="relative w-11 h-6 rounded-full border-none cursor-pointer transition-colors flex-shrink-0"
                          style={{ background: form[key] ? 'var(--teal)' : 'var(--g3)' }}
                        >
                          <span
                            className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all"
                            style={{ left: form[key] ? '22px' : '3px' }}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          )}

        </fieldset>)}

          {/* ── Actions ── */}
          {isArchived ? (
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(true)}
                className="px-5 py-3.5 rounded-2xl border-[1.5px] border-warm/40 text-warm text-[14px] font-bold bg-transparent cursor-pointer hover:bg-warm-l transition-all flex-shrink-0">
                Eliminar
              </button>
              <button onClick={handleRestore}
                className="flex-1 py-3.5 rounded-2xl bg-navy hover:bg-navy/90 text-white text-[14px] font-bold border-none cursor-pointer transition-all shadow-lg shadow-navy/10">
                Restaurar propiedad
              </button>
            </div>
          ) : canEdit && (
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(true)}
                className="px-5 py-3.5 rounded-2xl border-[1.5px] border-warm/40 text-warm text-[14px] font-bold bg-transparent cursor-pointer hover:bg-warm-l transition-all flex-shrink-0">
                Eliminar
              </button>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                className="flex-1 py-3.5 rounded-2xl bg-navy hover:bg-navy/90 text-white text-[14px] font-bold border-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-navy/10">
                {saving ? 'Guardando…' : isDraft ? 'Guardar cambios' : 'Guardar y enviar a revisión'}
              </button>
            </div>
          )}


      </div>
    </div>

    {showDeleteModal && (
      <ModalOverlay onClose={() => setShowDeleteModal(false)}>
        {isArchived ? (
          <>
            <h2 className="font-serif text-[20px] text-navy mb-2">¿Eliminar propiedad?</h2>
            <p className="text-[13px] text-g1 mb-6">Esta acción es permanente y no se puede deshacer. Se eliminarán todos los datos e imágenes.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="w-full py-3 rounded-xl bg-warm text-white text-[14px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
                {deleting ? 'Eliminando…' : 'Sí, eliminar permanentemente'}
              </button>
              <button onClick={() => setShowDeleteModal(false)}
                className="w-full py-3 rounded-xl border border-g3 text-g1 text-[14px] bg-transparent cursor-pointer hover:border-navy hover:text-navy transition-colors">
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-serif text-[20px] text-navy mb-2">¿Qué deseas hacer?</h2>
            <p className="text-[13px] text-g1 mb-6">
              Puedes archivar la propiedad para ocultarla temporalmente y restaurarla después,
              o eliminarla de forma permanente junto con todas sus imágenes.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={async () => { setShowDeleteModal(false); handleArchive() }} disabled={archiving}
                className="w-full py-3 rounded-xl border border-g3 text-navy text-[14px] font-semibold bg-transparent cursor-pointer hover:bg-g4 transition-colors disabled:opacity-50">
                {archiving ? 'Archivando…' : 'Archivar propiedad'}
              </button>
              <button onClick={async () => { setShowDeleteModal(false); handleDelete() }} disabled={deleting}
                className="w-full py-3 rounded-xl bg-warm text-white text-[14px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50">
                {deleting ? 'Eliminando…' : 'Eliminar permanentemente'}
              </button>
              <button onClick={() => setShowDeleteModal(false)}
                className="w-full py-3 rounded-xl border border-g3 text-g1 text-[14px] bg-transparent cursor-pointer hover:border-navy hover:text-navy transition-colors">
                Cancelar
              </button>
            </div>
          </>
        )}
      </ModalOverlay>
    )}

    {lightboxIndex !== null && (
      <LightboxCarousel urls={photoUrls} initial={lightboxIndex} onClose={() => setLightboxIndex(null)} />
    )}
    </>
  )
}

export function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[rgba(13,27,42,.5)] z-[600] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-[90%]" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
