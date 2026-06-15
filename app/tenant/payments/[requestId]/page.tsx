'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { AppNav } from '@/components/organisms/AppNav'
import { Toast } from '@/components/atoms/Toast'
import { paymentApi, apiErrorMessage } from '@/lib/api'
import type { Payment } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

const STATUS_CONFIG: Record<Payment['status'], { icon: string; title: string; desc: string; color: string }> = {
  PENDING:  { icon: '⏳', title: 'Procesando tu pago', desc: 'Estamos esperando la confirmación de tu banco. Esto puede tardar unos minutos.', color: 'text-yellow-600' },
  APPROVED: { icon: '✅', title: '¡Pago aprobado!',     desc: 'Tu pago se procesó correctamente.', color: 'text-green-600' },
  DECLINED: { icon: '❌', title: 'Pago rechazado',      desc: 'Tu banco rechazó la transacción. Puedes intentarlo de nuevo.', color: 'text-red-600' },
  ERROR:    { icon: '⚠️', title: 'Algo salió mal',      desc: 'Ocurrió un error procesando el pago. Intenta de nuevo o contacta soporte.', color: 'text-red-600' },
  VOIDED:   { icon: '🚫', title: 'Pago anulado',        desc: 'Esta transacción fue anulada.', color: 'text-g1' },
}

const POLL_INTERVAL_MS = 4000
const MAX_POLLS = 30 // ~2 minutes

export default function PaymentStatusPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const router         = useRouter()
  const showToast      = useAppStore((s) => s.showToast)
  const [payment, setPayment]   = useState<Payment | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [gaveUp,   setGaveUp]   = useState(false)
  const pollCount = useRef(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const payments = await paymentApi.myPayments()
        const latest = payments
          .filter((p) => p.property_request_id === requestId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        if (cancelled) return
        setPayment(latest ?? null)
        setLoading(false)

        if (latest?.status === 'PENDING' && pollCount.current < MAX_POLLS) {
          pollCount.current += 1
          timer = setTimeout(poll, POLL_INTERVAL_MS)
        } else if (latest?.status === 'PENDING') {
          setGaveUp(true)
        }
      } catch (err) {
        if (!cancelled) {
          showToast(apiErrorMessage(err, 'No se pudo consultar el estado del pago.'))
          setLoading(false)
        }
      }
    }

    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  const cfg = payment ? STATUS_CONFIG[payment.status] : null

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--sand)' }}>
        <AppNav minimal />

        <div className="max-w-md mx-auto w-full px-6 py-16 flex-1 flex items-center">
          {loading ? (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
            </div>
          ) : !payment ? (
            <div className="w-full bg-white rounded-2xl border border-g3 p-8 text-center shadow-[0_2px_16px_rgba(13,27,42,.06)]">
              <div className="text-4xl mb-3">🔍</div>
              <h2 className="font-serif text-xl text-navy mb-2">No encontramos un pago</h2>
              <p className="text-sm text-g1 mb-6">No hay ningún pago registrado para esta solicitud.</p>
              <button
                onClick={() => router.push('/tenant/requests')}
                className="px-6 py-3 rounded-xl text-white text-sm font-bold border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
              >
                Volver a mis solicitudes
              </button>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl border border-g3 p-8 text-center shadow-[0_2px_16px_rgba(13,27,42,.06)]">
              <div className="text-5xl mb-4">{cfg!.icon}</div>
              <h2 className="font-serif text-xl text-navy mb-2">{cfg!.title}</h2>
              <p className="text-sm text-g1 mb-2">{cfg!.desc}</p>
              {payment.status === 'PENDING' && gaveUp && (
                <p className="text-xs text-g2 mb-4">Está tardando más de lo usual — puedes cerrar esta página, te notificaremos cuando se confirme.</p>
              )}
              <div className="text-xs text-g2 mt-4 mb-6">
                {payment.currency} {payment.amount_in_cents.toLocaleString('es-CO')}
              </div>
              <button
                onClick={() => router.push('/tenant/requests')}
                className="px-6 py-3 rounded-xl text-navy text-sm font-bold border border-g3 cursor-pointer hover:border-navy transition-colors"
              >
                Volver a mis solicitudes
              </button>
            </div>
          )}
        </div>
      </div>
      <Toast />
    </AuthGuard>
  )
}
