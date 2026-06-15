'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { Toast } from '@/components/atoms/Toast'
import { PayRentModal } from '@/components/organisms/PayRentModal'
import { dealApi, tenantApi, propertiesApi, paymentApi, apiErrorMessage } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Deal, TenantDetail, Payment } from '@/lib/api'
import type { BackendProperty } from '@/lib/types'

const PAYMENT_STATUS_CONFIG: Record<Payment['status'], { label: string; bg: string; text: string }> = {
  PENDING:  { label: 'Pendiente',  bg: 'bg-yellow-50', text: 'text-yellow-700' },
  APPROVED: { label: 'Aprobado',   bg: 'bg-green-50',  text: 'text-green-700' },
  DECLINED: { label: 'Rechazado',  bg: 'bg-red-50',    text: 'text-red-600' },
  ERROR:    { label: 'Error',      bg: 'bg-red-50',    text: 'text-red-600' },
  VOIDED:   { label: 'Anulado',    bg: 'bg-g4',         text: 'text-g1' },
}

function isSameMonth(isoA: string, isoB: string) {
  const a = new Date(isoA), b = new Date(isoB)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export default function DealDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()
  const user      = useAppStore((s) => s.user)
  const showToast = useAppStore((s) => s.showToast)

  const [deal,         setDeal]         = useState<Deal | null>(null)
  const [property,     setProperty]     = useState<BackendProperty | null>(null)
  const [counterpart,  setCounterpart]  = useState<TenantDetail | null>(null)
  const [contractUrl,  setContractUrl]  = useState<string | null>(null)
  const [payments,     setPayments]     = useState<Payment[]>([])
  const [loading,       setLoading]     = useState(true)
  const [signatureName, setSignatureName] = useState('')
  const [signing,        setSigning]      = useState(false)
  const [showContract,   setShowContract] = useState(false)
  const [showPayModal,   setShowPayModal] = useState(false)

  const load = async () => {
    try {
      const d = await dealApi.get(id)
      setDeal(d)
      const counterpartId = d.landlord_id === user?.id ? d.tenant_id : d.landlord_id
      const [tenant, contract, prop, dealPayments] = await Promise.all([
        tenantApi.get(counterpartId).catch(() => null),
        dealApi.getContractUrl(id).catch(() => null),
        propertiesApi.get(d.property_id).catch(() => null),
        paymentApi.byDeal(id).catch(() => []),
      ])
      setCounterpart(tenant)
      setContractUrl(contract?.url ?? null)
      setProperty(prop)
      setPayments(dealPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (err) {
      showToast(apiErrorMessage(err, 'No se pudo cargar el negocio.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--g4)' }}>
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        </div>
      </AuthGuard>
    )
  }

  if (!deal) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--g4)' }}>
          <AppNav minimal />
          <div className="max-w-md mx-auto w-full px-6 py-16 text-center">
            <p className="text-sm text-g1">No encontramos este negocio.</p>
          </div>
        </div>
        <Toast />
      </AuthGuard>
    )
  }

  const isLandlord = deal.landlord_id === user?.id
  const youSigned  = isLandlord ? deal.landlord_signed : deal.tenant_signed
  const theySigned = isLandlord ? deal.tenant_signed : deal.landlord_signed
  const active     = deal.status === 'ACTIVE'

  const now = new Date().toISOString()
  const approvedThisMonth = payments.some((p) => p.status === 'APPROVED' && isSameMonth(p.created_at, now))
  const pendingThisMonth  = payments.some((p) => p.status === 'PENDING' && isSameMonth(p.created_at, now))
  const totalPaid = payments.filter((p) => p.status === 'APPROVED').reduce((sum, p) => sum + p.amount_in_cents, 0)

  const handleSign = async () => {
    if (!signatureName.trim()) return
    setSigning(true)
    try {
      const updated = await dealApi.sign(id, signatureName.trim())
      setDeal(updated)
      showToast(updated.status === 'ACTIVE' ? '¡Contrato firmado por ambas partes!' : 'Firmaste el contrato. Falta la otra parte.')
    } catch (err) {
      showToast(apiErrorMessage(err, 'No se pudo firmar el contrato.'))
    } finally {
      setSigning(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--g4)' }}>
        <AppNav minimal />

        <div className="max-w-[920px] mx-auto w-full px-6 py-10">
          <button
            onClick={() => router.push('/deals')}
            className="text-[13px] text-g1 font-medium bg-transparent border-none cursor-pointer hover:text-navy transition-colors mb-4"
          >
            ← Mis negocios
          </button>

          <div className="flex items-start justify-between gap-3 mb-7">
            <div>
              <h1 className="font-serif text-[30px] leading-tight text-navy mb-1.5">
                {active ? (property?.title ?? 'Negocio') : 'Contrato de arrendamiento'}
              </h1>
              <p className="text-[11.5px] text-g2 font-mono">
                ID {isLandlord ? 'arrendatario' : 'arrendador'}:{' '}
                <button
                  onClick={() => router.push(`/users/${isLandlord ? deal.tenant_id : deal.landlord_id}`)}
                  className="text-teal font-mono bg-transparent border-none cursor-pointer hover:underline p-0"
                >
                  {isLandlord ? deal.tenant_id : deal.landlord_id}
                </button>
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold flex-shrink-0 border ${
                active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-yellow-400'}`} />
              {active ? 'Contrato activo' : 'Pendiente de firmas'}
            </span>
          </div>

          {/* Contract viewer — always visible while pending signatures, collapsible once active */}
          {active ? (
            <div className="bg-white rounded-[24px] border border-g3 shadow-[0_2px_14px_rgba(13,27,42,.05)] mb-6 overflow-hidden">
              <button
                onClick={() => setShowContract((v) => !v)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 bg-transparent border-none cursor-pointer text-left"
              >
                <span className="text-[14px] font-semibold text-navy">📄 Contrato de arrendamiento firmado</span>
                <span className="text-[12px] text-teal font-semibold">{showContract ? 'Ocultar ▲' : 'Ver contrato ▼'}</span>
              </button>
              {showContract && (
                contractUrl ? (
                  <iframe src={contractUrl} className="w-full h-[560px] border-t border-g3" title="Contrato de arrendamiento" />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-g1 border-t border-g3">
                    No se pudo cargar el documento del contrato.
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[24px] border border-g3 overflow-hidden shadow-[0_2px_14px_rgba(13,27,42,.05)] mb-6">
              {contractUrl ? (
                <iframe src={contractUrl} className="w-full h-[560px]" title="Contrato de arrendamiento" />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-g1">
                  No se pudo cargar el documento del contrato.
                </div>
              )}
            </div>
          )}

          {/* Signature status — only relevant while pending */}
          {!active && (
            <div className="bg-white rounded-[24px] border border-g3 p-6 shadow-[0_2px_14px_rgba(13,27,42,.05)] mb-6">
              <div className="flex items-center gap-6 mb-5 text-[13px]">
                <span className={youSigned ? 'text-green-700 font-semibold' : 'text-g1'}>
                  {youSigned ? '✓ Tú ya firmaste' : '○ Falta tu firma'}
                </span>
                <span className={theySigned ? 'text-green-700 font-semibold' : 'text-g1'}>
                  {theySigned ? `✓ ${counterpart?.full_name ?? 'La otra parte'} ya firmó` : `○ Falta la firma de ${counterpart?.full_name ?? 'la otra parte'}`}
                </span>
              </div>

              {youSigned ? (
                <p className="text-[13px] text-g1">Ya firmaste. En cuanto la otra parte firme, el negocio quedará activo.</p>
              ) : (
                <div>
                  <p className="text-[13px] text-g1 mb-3">
                    Al firmar, declaras haber leído y aceptado las condiciones del contrato anterior.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Escribe tu nombre completo como firma"
                      className="flex-1 h-11 rounded-xl border border-g3 px-4 text-[14px] text-navy outline-none focus:border-navy"
                    />
                    <button
                      onClick={handleSign}
                      disabled={!signatureName.trim() || signing}
                      className="px-6 h-11 rounded-xl text-white text-[13px] font-bold border-none cursor-pointer disabled:opacity-40 transition-opacity"
                      style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
                    >
                      {signing ? 'Firmando…' : 'Firmar contrato'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payments — only once the deal is active */}
          {active && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-g3 p-5 shadow-[0_2px_14px_rgba(13,27,42,.05)]">
                  <p className="text-[11px] font-bold uppercase tracking-[.5px] text-g2 mb-1.5">Canon mensual</p>
                  <p className="text-[20px] font-bold text-navy">
                    {property?.monthly_rent != null ? `$${property.monthly_rent.toLocaleString('es-CO')}` : '—'}
                    <span className="text-[12px] font-medium text-g2"> {property?.currency}</span>
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-g3 p-5 shadow-[0_2px_14px_rgba(13,27,42,.05)]">
                  <p className="text-[11px] font-bold uppercase tracking-[.5px] text-g2 mb-1.5">Estado este mes</p>
                  <p className={`text-[14px] font-bold ${approvedThisMonth ? 'text-green-700' : pendingThisMonth ? 'text-yellow-700' : 'text-red-600'}`}>
                    {approvedThisMonth ? '✓ Pagado' : pendingThisMonth ? '⏳ En proceso' : '○ Pendiente'}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-g3 p-5 shadow-[0_2px_14px_rgba(13,27,42,.05)]">
                  <p className="text-[11px] font-bold uppercase tracking-[.5px] text-g2 mb-1.5">Total pagado</p>
                  <p className="text-[20px] font-bold text-navy">
                    ${totalPaid.toLocaleString('es-CO')}
                    <span className="text-[12px] font-medium text-g2"> {property?.currency}</span>
                  </p>
                </div>
              </div>

              {!isLandlord && !approvedThisMonth && !pendingThisMonth && property?.monthly_rent != null && (
                <div className="bg-white rounded-2xl border border-g3 p-5 shadow-[0_2px_14px_rgba(13,27,42,.05)] mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-navy mb-0.5">Tienes un pago pendiente este mes</p>
                    <p className="text-[12.5px] text-g1">Paga tu arriendo directamente desde tu cuenta bancaria vía PSE.</p>
                  </div>
                  <button
                    onClick={() => setShowPayModal(true)}
                    className="flex-shrink-0 px-6 py-3 rounded-full text-[13px] font-bold text-white border-none cursor-pointer shadow-[0_4px_12px_rgba(20,140,140,.25)] hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
                  >
                    Pagar arriendo
                  </button>
                </div>
              )}

              <div className="bg-white rounded-[24px] border border-g3 p-6 shadow-[0_2px_14px_rgba(13,27,42,.05)]">
                <h2 className="font-serif text-[17px] text-navy mb-4">Historial de pagos</h2>
                {payments.length === 0 ? (
                  <p className="text-[13px] text-g1">Aún no hay pagos registrados.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {payments.map((p) => {
                      const cfg = PAYMENT_STATUS_CONFIG[p.status]
                      return (
                        <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-g4 last:border-0">
                          <div>
                            <div className="text-[13.5px] font-semibold text-navy">
                              ${p.amount_in_cents.toLocaleString('es-CO')} {p.currency}
                            </div>
                            <div className="text-[11.5px] text-g2">
                              {new Date(p.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {showPayModal && property?.monthly_rent != null && (
        <PayRentModal
          propertyRequestId={deal.property_request_id}
          monthlyRent={property.monthly_rent}
          currency={property.currency ?? 'COP'}
          onClose={() => { setShowPayModal(false); load() }}
        />
      )}

      <Toast />
    </AuthGuard>
  )
}
