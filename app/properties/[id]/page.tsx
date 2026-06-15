'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { SettingsTab, ModalOverlay } from '@/components/organisms/PropertyManagement'
import { Toast } from '@/components/atoms/Toast'
import { propertiesApi, landlordApi, applicationApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { BackendProperty } from '@/lib/types'
import type { PropertyRequest } from '@/lib/api'

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  APARTMENT: 'Apartamento',
  HOUSE:     'Casa',
  ROOM:      'Habitación',
  PARKING:   'Parqueadero',
}


// ── Lightbox ──────────────────────────────────────────────────────────────────

function LightboxCarousel({ urls, initial, onClose }: { urls: string[]; initial: number; onClose: () => void }) {
  const [active, setActive] = useState(initial)
  const prev = () => setActive((i) => (i - 1 + urls.length) % urls.length)
  const next = () => setActive((i) => (i + 1) % urls.length)

  return (
    <div
      className="fixed inset-0 z-[700] bg-black/95 flex flex-col outline-none"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') prev(); if (e.key === 'ArrowRight') next(); if (e.key === 'Escape') onClose() }}
      tabIndex={0}
      ref={(el) => el?.focus()}
      role="dialog"
    >
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
        <div className="bg-white/10 text-white text-[12px] font-semibold px-3 py-1 rounded-full">{active + 1} / {urls.length}</div>
        <button className="w-9 h-9 rounded-full bg-white/10 text-white text-lg flex items-center justify-center hover:bg-white/20 transition-colors border-none cursor-pointer" onClick={onClose}>✕</button>
      </div>
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-16" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[active]} alt={`Foto ${active + 1}`} className="max-h-full max-w-full object-contain rounded-xl" style={{ maxHeight: 'calc(100vh - 140px)' }} />
        {urls.length > 1 && (
          <>
            <button className="absolute left-3 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-none cursor-pointer" onClick={(e) => { e.stopPropagation(); prev() }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="absolute right-3 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/25 transition-colors border-none cursor-pointer" onClick={(e) => { e.stopPropagation(); next() }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </>
        )}
      </div>
      {urls.length > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto scrollbar-none px-5 py-3 justify-center" onClick={(e) => e.stopPropagation()}>
          {urls.map((u, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={u} alt={`Miniatura ${i + 1}`} onClick={() => setActive(i)}
              className={`h-[56px] w-[72px] flex-shrink-0 rounded-lg object-cover cursor-pointer transition-all ${i === active ? 'ring-2 ring-white ring-offset-1 ring-offset-black opacity-100' : 'opacity-35 hover:opacity-65'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Photo gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ urls }: { urls: string[] }) {
  const [lb, setLb] = useState<number | null>(null)
  if (urls.length === 0) return null
  return (
    <>
      {urls.length === 1 ? (
        <div className="rounded-2xl overflow-hidden cursor-zoom-in bg-black" style={{ height: 360 }} onClick={() => setLb(0)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[0]} alt="Foto 1" className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="grid gap-1.5 rounded-2xl overflow-hidden" style={{ gridTemplateColumns: '2fr 1fr', height: 360 }}>
          <div className="bg-black cursor-zoom-in overflow-hidden" onClick={() => setLb(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urls[0]} alt="Portada" className="w-full h-full object-contain hover:opacity-90 transition-opacity" />
          </div>
          <div className="grid gap-1.5" style={{ gridTemplateRows: `repeat(${Math.min(urls.length - 1, 4)}, 1fr)` }}>
            {urls.slice(1, 5).map((u, i) => (
              <div key={i} className="relative overflow-hidden cursor-zoom-in bg-black" onClick={() => setLb(i + 1)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Foto ${i + 2}`} className="w-full h-full object-contain hover:opacity-90 transition-opacity" />
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
      {lb !== null && <LightboxCarousel urls={urls} initial={lb} onClose={() => setLb(null)} />}
    </>
  )
}

// ── Property info content (shared between owner and public) ───────────────────

function PropertyInfoContent({ p, isOwner, myRequest, onApply }: { p: BackendProperty; isOwner: boolean; myRequest?: PropertyRequest | null; onApply?: () => void }) {
  const router   = useRouter()
  const price    = p.monthly_rent != null ? `$${p.monthly_rent.toLocaleString('es-CO')}` : null
  const adminFee = p.admin_fee    != null ? `$${p.admin_fee.toLocaleString('es-CO')}`    : null
  const typeLbl  = TYPE_LABEL[p.type ?? ''] ?? p.type ?? '—'
  const location = [p.neighborhood, p.city, p.country].filter(Boolean).join(', ')

  const quickStats = [
    p.bedrooms      != null && { icon: '🛏', val: p.bedrooms,      unit: p.bedrooms === 1 ? 'habitación' : 'habitaciones' },
    p.bathrooms     != null && { icon: '🚿', val: p.bathrooms,     unit: p.bathrooms === 1 ? 'baño' : 'baños' },
    p.area          != null && { icon: '📐', val: p.area,          unit: p.area_unit === 'FT2' ? 'ft²' : 'm²' },
    p.floors        != null && { icon: '🏢', val: `${p.floors} piso${p.floors !== 1 ? 's' : ''}`, unit: '' },
    p.parking_spots != null && p.parking_spots > 0 && { icon: '🚗', val: p.parking_spots, unit: p.parking_spots === 1 ? 'parqueadero' : 'parqueaderos' },
  ].filter(Boolean) as { icon: string; val: string | number; unit: string }[]

  return (
    <div className="overflow-y-auto bg-white flex-1">
      {/* Gallery */}
      {(p.photo_urls?.length ?? 0) > 0 && (
        <div className="max-w-[1100px] mx-auto px-6 pt-6">
          <PhotoGallery urls={p.photo_urls ?? []} />
        </div>
      )}

      {/* Two-column layout */}
      <div className="max-w-[1100px] mx-auto px-6 pb-16 pt-8">
        <div className="flex gap-16 items-start">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            <div className="pb-6 border-b border-gray-200">
              <h1 className="text-[28px] font-semibold text-gray-900 leading-tight mb-2">
                {p.title ?? `${typeLbl} en ${p.city ?? '—'}`}
              </h1>
              {location && <p className="text-[15px] text-gray-500">{location}</p>}
              {p.address && <p className="text-[13px] text-gray-400 mt-0.5">{p.address}</p>}
            </div>

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

            {p.description && (
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-[18px] font-semibold text-gray-900 mb-3">Acerca de este espacio</h2>
                <p className="text-[15px] text-gray-600 leading-[1.75]">{p.description}</p>
              </div>
            )}

            {p.amenities?.length > 0 && (
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

            <div className="py-6 border-b border-gray-200">
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
                  <div key={label}>
                    <div className="text-[12px] text-gray-400 font-medium mb-0.5">{label}</div>
                    <div className="text-[14px] text-gray-800 font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="py-6">
              <h2 className="text-[18px] font-semibold text-gray-900 mb-4">Reseñas</h2>
              <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-gray-100 text-center gap-2">
                <span className="text-4xl">💬</span>
                <p className="text-[14px] font-semibold text-gray-700">Sin reseñas aún</p>
                <p className="text-[12px] text-gray-400">Cuando los inquilinos califiquen esta propiedad, aparecerán aquí.</p>
              </div>
            </div>
          </div>

          {/* ── Right column — sticky price card ── */}
          <div className="w-[340px] flex-shrink-0 sticky top-6">
            <div className="rounded-2xl border border-gray-200 shadow-[0_6px_30px_rgba(0,0,0,0.10)] p-6">
              {price ? (
                <>
                  <div className="flex items-baseline gap-1.5 mb-5">
                    <span className="text-[26px] font-bold text-gray-900">{price}</span>
                    <span className="text-[14px] text-gray-500">/ mes</span>
                  </div>
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
                </>
              ) : (
                <p className="text-[15px] text-gray-400 italic mb-5">Precio no disponible</p>
              )}

              {isOwner ? (
                <p className="text-center text-[13px] text-gray-400 py-2">Eres el propietario de esta propiedad</p>
              ) : myRequest ? (
                <>
                  <a
                    href="/tenant/requests"
                    className="w-full py-3.5 rounded-xl text-white text-[15px] font-semibold border-none cursor-pointer transition-colors text-center block"
                    style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
                  >
                    Ver mi solicitud
                  </a>
                  <p className="text-center text-[12px] text-gray-400 mt-3">
                    {myRequest.status === 'PENDING' && 'Tu solicitud está pendiente de revisión'}
                    {myRequest.status === 'ACCEPTED' && '🎉 ¡Tu solicitud fue aceptada!'}
                    {myRequest.status === 'REJECTED' && 'Tu solicitud no fue seleccionada'}
                  </p>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onApply?.()}
                    className="w-full py-3.5 rounded-xl bg-[#E61E4D] hover:bg-[#d61849] text-white text-[15px] font-semibold border-none cursor-pointer transition-colors"
                  >
                    Solicitar esta propiedad
                  </button>
                  <p className="text-center text-[12px] text-gray-400 mt-3">Tu solicitud será revisada por el propietario</p>
                </>
              )}

              {p.min_contract_months != null && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center text-[13px] text-gray-500">
                  Contrato mínimo de <span className="font-semibold text-gray-700">{p.min_contract_months} meses</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = 'loading' | 'owner' | 'public'
type Tab      = 'info' | 'applications' | 'settings'

export default function PropertyPage() {
  const { id }    = useParams<{ id: string }>()
  const user      = useAppStore((s) => s.user)
  const showToast = useAppStore((s) => s.showToast)
  const router    = useRouter()

  const [mode,              setMode]              = useState<ViewMode>('loading')
  const [property,          setProperty]          = useState<BackendProperty | null>(null)
  const [tab,               setTab]               = useState<Tab>('info')
  const [requests,          setRequests]          = useState<PropertyRequest[]>([])
  const [requestsLoaded,    setRequestsLoaded]    = useState(false)
  const [applyModal,        setApplyModal]        = useState(false)
  const [applying,          setApplying]          = useState(false)
  const [myRequest,         setMyRequest]         = useState<PropertyRequest | null>(null)

  useEffect(() => {
    if (!user) return

    const isLandlord = user.roles?.includes('LANDLORD')

    const redirectHome = (err: unknown) => {
      showToast(apiErrorMessage(err, 'Propiedad no disponible.'))
      router.replace('/home')
    }

    const loadMyRequest = () =>
      applicationApi.myRequests()
        .then((reqs) => setMyRequest(reqs.find((r) => r.property_id === id) ?? null))
        .catch(() => {})

    if (isLandlord) {
      landlordApi.getProperty(id)
        .then((p) => {
          if (p.landlord_id === user.id) {
            setProperty(p); setMode('owner')
          } else if (p.status === 'PUBLISHED') {
            setProperty(p); setMode('public'); loadMyRequest()
          } else {
            router.replace('/home')
          }
        })
        .catch(() => {
          propertiesApi.get(id)
            .then((p) => {
              if (p.status !== 'PUBLISHED') { router.replace('/home'); return }
              setProperty(p); setMode('public'); loadMyRequest()
            })
            .catch(redirectHome)
        })
    } else {
      propertiesApi.get(id)
        .then((p) => {
          if (p.status !== 'PUBLISHED') { router.replace('/home'); return }
          setProperty(p); setMode('public'); loadMyRequest()
        })
        .catch(redirectHome)
    }
  }, [id, user]) // eslint-disable-line

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'applications' && !requestsLoaded) {
      applicationApi.listForProperty(id)
        .then((r) => { setRequests(r); setRequestsLoaded(true) })
        .catch(() => {})
    }
  }

  const handleAccept = async (requestId: string) => {
    await applicationApi.accept(requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: 'ACCEPTED' as const } : r))
    showToast('Solicitud aceptada. El arrendatario será notificado.')
  }

  const handleReject = async (requestId: string) => {
    await applicationApi.reject(requestId)
    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: 'REJECTED' as const } : r))
    showToast('Solicitud rechazada.')
  }

  const propPrice = property?.monthly_rent != null ? `$${property.monthly_rent.toLocaleString('es-CO')}` : null
  const isOwner   = mode === 'owner'

  const handleApply = async () => {
    if (!property) return
    setApplying(true)
    try {
      const req = await applicationApi.apply(property.id)
      setMyRequest(req)
      setApplyModal(false)
      showToast('¡Solicitud enviada! El propietario será notificado.')
      router.push('/tenant/requests')
    } catch (err) {
      showToast(apiErrorMessage(err, 'No se pudo enviar la solicitud.'))
    } finally {
      setApplying(false)
    }
  }

  const tabCls = (t: Tab) =>
    `px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-all bg-transparent cursor-pointer flex items-center gap-1.5
     ${tab === t ? 'text-teal border-teal' : 'text-g1 border-transparent hover:text-navy'}`

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-white">

        {/* Nav */}
        <AppNav minimal />

        {/* Tabs — owner only */}
        {isOwner && (
          <div className="sticky top-[68px] z-50 border-b border-gray-200 bg-white">
            <div className="max-w-[1100px] mx-auto px-6 flex">
            <button className={tabCls('info')} onClick={() => handleTabChange('info')}>
              Propiedad
            </button>
            <button className={tabCls('applications')} onClick={() => handleTabChange('applications')}>
              Solicitudes
              {requests.length > 0 && (
                <span className="bg-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{requests.length}</span>
              )}
            </button>
            <button className={tabCls('settings')} onClick={() => handleTabChange('settings')}>
              Ajustes
            </button>
            </div>
          </div>
        )}

        {/* Content */}
        {mode === 'loading' && (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        )}

        {mode !== 'loading' && property && tab === 'info' && (
          <PropertyInfoContent p={property} isOwner={isOwner} myRequest={myRequest} onApply={() => setApplyModal(true)} />
        )}

        {isOwner && tab === 'applications' && (
          <div className="max-w-[1100px] mx-auto px-6 pb-16 pt-8">
            <RequestsTab
              requests={requests}
              propertyId={id}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          </div>
        )}

        {isOwner && property && tab === 'settings' && (
          <SettingsTab
            property={property}
            onUpdate={(updated) => { setProperty(updated); showToast('Cambios guardados · La propiedad quedó en revisión') }}
            onDelete={() => router.push('/landlord/properties')}
          />
        )}

      </div>

      {applyModal && property && (
        <ModalOverlay onClose={() => !applying && setApplyModal(false)}>
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">🏠</div>
            <h3 className="font-serif text-xl text-navy mb-1">¿Confirmas tu solicitud?</h3>
            <p className="text-sm text-g1 leading-relaxed">
              Enviarás tu perfil al propietario de <strong className="text-navy">{property.title}</strong>.
              Podrás ver el estado en <em>Mis solicitudes</em>.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              disabled={applying}
              onClick={handleApply}
              className="w-full py-3 rounded-xl text-white text-sm font-bold border-none cursor-pointer disabled:opacity-50 transition-colors"
              style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
            >
              {applying ? 'Enviando…' : 'Sí, enviar solicitud'}
            </button>
            <button
              disabled={applying}
              onClick={() => setApplyModal(false)}
              className="w-full py-3 rounded-xl bg-transparent text-navy text-sm font-semibold border border-g3 cursor-pointer hover:border-navy transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}
      <Toast />
    </AuthGuard>
  )
}

// ── Requests tab ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pendiente',  cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  ACCEPTED: { label: 'Aceptada',   cls: 'bg-green-50 text-green-700 border-green-200'   },
  REJECTED: { label: 'Rechazada',  cls: 'bg-red-50 text-red-700 border-red-200'         },
}

function RequestsTab({
  requests,
  propertyId,
  onAccept,
  onReject,
}: {
  requests: PropertyRequest[]
  propertyId: string
  onAccept: (id: string) => void
  onReject: (id: string) => void
}) {
  const router = useRouter()

  if (requests.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 text-center px-4">
        <span className="text-4xl opacity-30">👥</span>
        <p className="text-sm font-semibold text-g1">Sin solicitudes aún</p>
        <p className="text-xs text-g2">Los arrendatarios interesados aparecerán aquí.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-serif text-xl text-navy mb-2">{requests.length} solicitud{requests.length !== 1 ? 'es' : ''}</h2>
        {requests.map((r) => {
          const s = STATUS_LABEL[r.status]
          const isPending = r.status === 'PENDING'
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-g3 shadow-[0_2px_12px_rgba(13,27,42,.06)] overflow-hidden">
              {/* Clickable header → tenant detail */}
              <button
                onClick={() => router.push(`/users/${r.tenant_id}`)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-g4 transition-colors cursor-pointer bg-transparent border-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    👤
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-navy">Ver perfil del arrendatario →</div>
                    <div className="text-xs text-g1">
                      Solicitó {new Date(r.applied_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${s.cls}`}>
                  {s.label}
                </span>
              </button>

              {isPending && (
                <div className="flex gap-2 px-4 pb-4">
                  <button
                    onClick={() => onReject(r.id)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-navy bg-white border border-g3 cursor-pointer hover:border-navy transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => onAccept(r.id)}
                    className="flex-[2] py-2 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-colors"
                    style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
                  >
                    Aceptar solicitud
                  </button>
                </div>
              )}
            </div>
          )
        })}
    </div>
  )
}
