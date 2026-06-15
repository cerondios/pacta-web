'use client'
import { useEffect, useState } from 'react'
import { ModalOverlay } from './PropertyManagement'
import { paymentApi, apiErrorMessage } from '@/lib/api'
import type { Bank } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'

const LEGAL_ID_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PP', label: 'Pasaporte' },
]

interface Props {
  propertyRequestId: string
  monthlyRent: number
  currency: string
  onClose: () => void
}

export function PayRentModal({ propertyRequestId, monthlyRent, currency, onClose }: Props) {
  const { user, showToast } = useAppStore()
  const [banks, setBanks]           = useState<Bank[]>([])
  const [bankCode, setBankCode]     = useState('')
  const [legalIdType, setLegalIdType] = useState('CC')
  const [legalId, setLegalId]       = useState('')
  const [loadingBanks, setLoadingBanks] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    paymentApi.getAvailableBanks()
      .then(setBanks)
      .catch(() => showToast('No se pudo cargar la lista de bancos PSE.'))
      .finally(() => setLoadingBanks(false))
  }, []) // eslint-disable-line

  const canSubmit = !!bankCode && !!legalId.trim() && !submitting

  const handlePay = async () => {
    if (!canSubmit || !user?.email) return
    setSubmitting(true)
    try {
      const redirectUrl = `${window.location.origin}/tenant/payments/${propertyRequestId}`
      const payment = await paymentApi.initiate({
        property_request_id: propertyRequestId,
        bank_code: bankCode,
        payer_legal_id_type: legalIdType,
        payer_legal_id: legalId.trim(),
        payer_type: 0,
        customer_email: user.email,
        redirect_url: redirectUrl,
      })
      if (payment.redirect_url) {
        window.location.href = payment.redirect_url
      } else {
        showToast('No se recibió la URL de pago de PSE.')
        setSubmitting(false)
      }
    } catch (err) {
      showToast(apiErrorMessage(err, 'No se pudo iniciar el pago.'))
      setSubmitting(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="text-center mb-5">
        <div className="text-4xl mb-3">🏦</div>
        <h3 className="font-serif text-xl text-navy mb-1">Pagar arriendo</h3>
        <p className="text-sm text-g1">
          {currency} {monthlyRent.toLocaleString('es-CO')} vía PSE, desde tu cuenta bancaria
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-g1 mb-1.5">Banco</label>
          {loadingBanks ? (
            <div className="text-xs text-g2">Cargando bancos…</div>
          ) : (
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-g3 text-[13px] text-navy outline-none focus:border-teal bg-white"
            >
              <option value="">Selecciona tu banco</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          <div className="w-[40%]">
            <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-g1 mb-1.5">Tipo doc.</label>
            <select
              value={legalIdType}
              onChange={(e) => setLegalIdType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-g3 text-[13px] text-navy outline-none focus:border-teal bg-white"
            >
              {LEGAL_ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.value}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-g1 mb-1.5">Número de documento</label>
            <input
              type="text"
              value={legalId}
              onChange={(e) => setLegalId(e.target.value.replace(/\D/g, ''))}
              placeholder="1234567890"
              className="w-full px-3 py-2.5 rounded-xl border-[1.5px] border-g3 text-[13px] text-navy outline-none focus:border-teal"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={submitting}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-navy bg-white border border-g3 cursor-pointer hover:border-navy transition-colors disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          onClick={handlePay}
          disabled={!canSubmit}
          className="flex-[2] py-3 rounded-xl text-sm font-bold text-white border-none cursor-pointer disabled:opacity-40 transition-colors"
          style={{ background: 'linear-gradient(135deg,var(--teal),var(--teal-l))' }}
        >
          {submitting ? 'Redirigiendo a tu banco…' : 'Continuar a PSE'}
        </button>
      </div>
    </ModalOverlay>
  )
}
