'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { Toast } from '@/components/atoms/Toast'
import { PayRentModal } from '@/components/organisms/PayRentModal'
import { applicationApi, propertiesApi, dealApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { PropertyRequest, Deal } from '@/lib/api'
import type { BackendProperty } from '@/lib/types'

type Status = PropertyRequest['status']

const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string; dot: string; accent: string }> = {
  PENDING:  { label: 'Pendiente',  bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200',  dot: 'bg-yellow-400', accent: '#d97706' },
  ACCEPTED: { label: 'Aceptada',   bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500',  accent: '#16a34a' },
  REJECTED: { label: 'Rechazada',  bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     dot: 'bg-red-400',    accent: '#dc2626' },
}

const FILTERS: { key: 'ALL' | Status; label: string }[] = [
  { key: 'ALL',      label: 'Todas' },
  { key: 'PENDING',  label: 'Pendientes' },
  { key: 'ACCEPTED', label: 'Aceptadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
]

interface EnrichedRequest extends PropertyRequest {
  property?: BackendProperty
}

export default function TenantRequestsPage() {
  const router    = useRouter()
  const showToast = useAppStore((s) => s.showToast)
  const [requests, setRequests] = useState<EnrichedRequest[]>([])
  const [deals,    setDeals]    = useState<Deal[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<'ALL' | Status>('ALL')
  const [payModalRequest, setPayModalRequest] = useState<EnrichedRequest | null>(null)

  useEffect(() => {
    applicationApi.myRequests()
      .then(async (reqs) => {
        const enriched = await Promise.all(
          reqs.map(async (r) => {
            try {
              const property = await propertiesApi.get(r.property_id)
              return { ...r, property }
            } catch {
              return r
            }
          }),
        )
        setRequests(enriched)
      })
      .catch((err) => showToast(apiErrorMessage(err, 'No se pudieron cargar las solicitudes.')))
      .finally(() => setLoading(false))
    dealApi.myDeals().then(setDeals).catch(() => setDeals([]))
  }, []) // eslint-disable-line

  const counts = useMemo(() => ({
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    ACCEPTED: requests.filter((r) => r.status === 'ACCEPTED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  }), [requests])

  const visibleRequests = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter)

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--g4)' }}>
        <AppNav minimal />

        <div className="max-w-[920px] mx-auto w-full px-6 py-10">
          <div className="mb-7">
            <h1 className="font-serif text-[34px] leading-tight text-navy mb-1.5">Mis solicitudes</h1>
            <p className="text-[14px] text-g1">Historial de propiedades a las que has aplicado.</p>
          </div>

          {!loading && requests.length > 0 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
              {FILTERS.map((f) => {
                const active = filter === f.key
                const count = counts[f.key]
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border cursor-pointer transition-colors"
                    style={
                      active
                        ? { background: 'var(--navy)', color: 'white', borderColor: 'var(--navy)' }
                        : { background: 'white', color: 'var(--navy)', borderColor: 'var(--g3, #e2e2dd)' }
                    }
                  >
                    {f.label}
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={
                        active
                          ? { background: 'rgba(255,255,255,.2)' }
                          : { background: 'var(--g4)' }
                      }
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-g3 p-14 text-center shadow-[0_4px_24px_rgba(13,27,42,.06)]">
              <div className="text-6xl mb-5">🏠</div>
              <h3 className="font-serif text-2xl text-navy mb-2">Aún no has aplicado a ninguna propiedad</h3>
              <p className="text-[14px] text-g1 mb-7 max-w-sm mx-auto">Explora las propiedades disponibles y envía tu primera solicitud de arriendo.</p>
              <button
                onClick={() => router.push('/home')}
                className="px-7 py-3.5 rounded-2xl text-white text-[14px] font-bold border-none cursor-pointer shadow-[0_8px_20px_rgba(20,140,140,.25)] hover:opacity-95 transition-opacity"
                style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
              >
                Explorar propiedades →
              </button>
            </div>
          ) : visibleRequests.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-g3 p-14 text-center shadow-[0_4px_24px_rgba(13,27,42,.06)]">
              <p className="text-[14px] text-g1">No tienes solicitudes en este estado.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {visibleRequests.map((r) => {
                const s = STATUS_CONFIG[r.status]
                const p = r.property
                const deal = deals.find((d) => d.property_request_id === r.id)
                return (
                  <div
                    key={r.id}
                    className="group bg-white rounded-[24px] border border-g3 overflow-hidden shadow-[0_2px_14px_rgba(13,27,42,.05)] hover:shadow-[0_12px_32px_rgba(13,27,42,.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    style={{ borderLeft: `4px solid ${s.accent}` }}
                    onClick={() => router.push(`/properties/${r.property_id}`)}
                  >
                    <div className="flex">
                      {/* Property thumbnail */}
                      <div className="relative w-44 h-44 flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#0a2342,#1a6b7e)' }}>
                        {p?.photo_urls?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.photo_urls[0]}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl opacity-40">🏠</div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="font-serif text-[17px] text-navy truncate mb-0.5">
                              {p?.title ?? 'Propiedad'}
                            </div>
                            <div className="text-[12.5px] text-g1 flex items-center gap-1">
                              <span>📍</span>
                              {p?.neighborhood ?? '—'}, {p?.city ?? '—'}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 border ${s.bg} ${s.text} ${s.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>

                        {p?.monthly_rent != null && (
                          <div className="text-[19px] font-bold text-teal mb-3">
                            ${p.monthly_rent.toLocaleString('es-CO')}
                            <span className="text-[12px] font-medium text-g2"> /mes</span>
                          </div>
                        )}

                        <div className="mt-auto flex items-center gap-2 text-[11.5px] text-g2">
                          <span>Enviada {new Date(r.applied_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          {r.reviewed_at && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-g3" />
                              <span>Revisada {new Date(r.reviewed_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {r.status === 'ACCEPTED' && (
                      <div className="px-5 py-3.5 bg-green-50 border-t border-green-100 flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-green-700 font-medium flex items-center gap-1.5">
                          <span className="text-base">🎉</span>
                          {deal?.status === 'ACTIVE'
                            ? 'Contrato firmado. Ya puedes pagar tu arriendo.'
                            : '¡Felicidades! El propietario aceptó tu solicitud.'}
                        </span>
                        {deal?.status === 'ACTIVE' ? (
                          p?.monthly_rent && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setPayModalRequest(r) }}
                              className="flex-shrink-0 px-5 py-2 rounded-full text-[12.5px] font-bold text-white border-none cursor-pointer shadow-[0_4px_12px_rgba(20,140,140,.25)] hover:opacity-90 transition-opacity"
                              style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
                            >
                              Pagar arriendo
                            </button>
                          )
                        ) : deal ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/deals/${deal.id}`) }}
                            className="flex-shrink-0 px-5 py-2 rounded-full text-[12.5px] font-bold text-white border-none cursor-pointer shadow-[0_4px_12px_rgba(20,140,140,.25)] hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg,var(--navy),#1a3a5c)' }}
                          >
                            Firmar contrato
                          </button>
                        ) : null}
                      </div>
                    )}
                    {r.status === 'REJECTED' && (
                      <div className="px-5 py-3.5 bg-red-50/60 border-t border-red-100 text-[12.5px] text-red-600">
                        El propietario no seleccionó tu perfil para esta propiedad. Sigue explorando otras opciones.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {payModalRequest?.property?.monthly_rent != null && (
        <PayRentModal
          propertyRequestId={payModalRequest.id}
          monthlyRent={payModalRequest.property.monthly_rent}
          currency={payModalRequest.property.currency ?? 'COP'}
          onClose={() => setPayModalRequest(null)}
        />
      )}

      <Toast />
    </AuthGuard>
  )
}
