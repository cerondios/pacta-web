'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { Toast } from '@/components/atoms/Toast'
import { dealApi, propertiesApi, tenantApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Deal, TenantDetail } from '@/lib/api'
import type { BackendProperty } from '@/lib/types'

interface EnrichedDeal extends Deal {
  property?: BackendProperty
  counterpart?: TenantDetail
}

export default function MyDealsPage() {
  const router    = useRouter()
  const user      = useAppStore((s) => s.user)
  const showToast = useAppStore((s) => s.showToast)
  const [deals,   setDeals]   = useState<EnrichedDeal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dealApi.myDeals()
      .then(async (raw) => {
        const enriched = await Promise.all(
          raw.map(async (d) => {
            const counterpartId = d.landlord_id === user?.id ? d.tenant_id : d.landlord_id
            const [property, counterpart] = await Promise.all([
              propertiesApi.get(d.property_id).catch(() => undefined),
              tenantApi.get(counterpartId).catch(() => undefined),
            ])
            return { ...d, property, counterpart }
          }),
        )
        setDeals(enriched)
      })
      .catch((err) => showToast(apiErrorMessage(err, 'No se pudieron cargar tus negocios.')))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--g4)' }}>
        <AppNav minimal />

        <div className="max-w-[920px] mx-auto w-full px-6 py-10">
          <div className="mb-7">
            <h1 className="font-serif text-[34px] leading-tight text-navy mb-1.5">Mis negocios</h1>
            <p className="text-[14px] text-g1">Contratos de arrendamiento en curso, listos para firmar.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            </div>
          ) : deals.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-g3 p-14 text-center shadow-[0_4px_24px_rgba(13,27,42,.06)]">
              <div className="text-6xl mb-5">🤝</div>
              <h3 className="font-serif text-2xl text-navy mb-2">Aún no tienes negocios en curso</h3>
              <p className="text-[14px] text-g1 max-w-sm mx-auto">
                Cuando un propietario acepte tu solicitud (o tú aceptes la de un arrendatario), el contrato aparecerá aquí para que ambos lo firmen.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {deals.map((d) => {
                const isLandlord = d.landlord_id === user?.id
                const youSigned = isLandlord ? d.landlord_signed : d.tenant_signed
                const theySigned = isLandlord ? d.tenant_signed : d.landlord_signed
                const active = d.status === 'ACTIVE'
                return (
                  <div
                    key={d.id}
                    onClick={() => router.push(`/deals/${d.id}`)}
                    className="bg-white rounded-[24px] border border-g3 p-5 shadow-[0_2px_14px_rgba(13,27,42,.05)] hover:shadow-[0_12px_32px_rgba(13,27,42,.1)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    style={{ borderLeft: `4px solid ${active ? '#16a34a' : '#d97706'}` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="font-serif text-[17px] text-navy truncate mb-0.5">
                          {d.property?.title ?? 'Propiedad'}
                        </div>
                        <div className="text-[12.5px] text-g1">
                          {isLandlord ? 'Arrendatario' : 'Arrendador'}: {d.counterpart?.full_name ?? '—'}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0 border ${
                          active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-yellow-400'}`} />
                        {active ? 'Contrato activo' : 'Pendiente de firmas'}
                      </span>
                    </div>

                    {!active && (
                      <div className="flex items-center gap-4 text-[12.5px]">
                        <span className={youSigned ? 'text-green-700 font-medium' : 'text-g1'}>
                          {youSigned ? '✓ Tú ya firmaste' : '○ Falta tu firma'}
                        </span>
                        <span className={theySigned ? 'text-green-700 font-medium' : 'text-g1'}>
                          {theySigned ? `✓ ${d.counterpart?.full_name ?? 'La otra parte'} ya firmó` : `○ Falta la firma de ${d.counterpart?.full_name ?? 'la otra parte'}`}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Toast />
    </AuthGuard>
  )
}
