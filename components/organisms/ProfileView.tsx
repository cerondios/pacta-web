'use client'
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { filesApi, kycApi, complianceApi, bankingApi, paymentApi } from '@/lib/api'
import type { Bank } from '@/lib/api'
import type {
  KycResponse,
  ComplianceRequirement,
  DocumentStatus,
  BankAccountResponse,
  BankAccountRequest,
  AccountType,
} from '@/lib/types'

// ── Types ─────────────────────────────────────────────────

interface UploadSlot {
  file: File | null
  fileName: string | null
}

const emptySlot = (): UploadSlot => ({ file: null, fileName: null })

// ── Constants ─────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────

function StatusBadge({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, { label: string; cls: string }> = {
    PENDING_REVIEW: { label: 'En revisión', cls: 'bg-yellow-100 text-yellow-800' },
    APPROVED:       { label: 'Aprobado',    cls: 'bg-green-100 text-green-800'  },
    REJECTED:       { label: 'Rechazado',   cls: 'bg-red-100 text-red-800'      },
    EXPIRED:        { label: 'Vencido',     cls: 'bg-gray-100 text-gray-600'    },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

function FileUploadSlot({
  label,
  slot,
  disabled,
  onChange,
}: {
  label: string
  slot: UploadSlot
  disabled?: boolean
  onChange: (file: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="text-[11px] font-semibold text-g1 mb-1 block">{label}</label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex items-center gap-2.5 h-10 border rounded-[9px] px-3 transition-colors select-none
          ${slot.file
            ? 'border-navy bg-blue-50 cursor-pointer'
            : 'border-g3 bg-g4 hover:border-navy cursor-pointer'}
          ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <span className="text-[16px] flex-shrink-0">
          {slot.file ? '📎' : '📁'}
        </span>
        <span className="text-[12px] text-navy truncate flex-1">
          {slot.fileName ?? 'Seleccionar archivo'}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onChange(f)
          e.target.value = ''
        }}
      />
      <p className="text-[10.5px] text-g2 mt-1">Máximo 10MB.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────

export function ProfileView() {
  const { user, showToast } = useAppStore()
  const searchParams = useSearchParams()
  const router   = useRouter()
  const pathname = usePathname()
  const reason = searchParams.get('reason')
  const incompleteRedirect = reason === 'incomplete'
  const incompleteApply    = reason === 'incomplete_apply' && user?.status !== 'COMPLETED'
  const initials = (user?.fullName?.slice(0, 2) ?? 'VR').toUpperCase()

  useEffect(() => {
    if (reason) {
      const sp = new URLSearchParams(searchParams.toString())
      sp.delete('reason')
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }
  }, []) // eslint-disable-line

  // KYC
  const [kyc, setKyc] = useState<KycResponse | null | undefined>(undefined)
  const [frontSlot,  setFrontSlot]  = useState<UploadSlot>(emptySlot())
  const [rearSlot,   setRearSlot]   = useState<UploadSlot>(emptySlot())
  const [selfieSlot, setSelfieSlot] = useState<UploadSlot>(emptySlot())
  const [kycSubmitting, setKycSubmitting] = useState(false)

  // Compliance
  const [requirements, setRequirements] = useState<ComplianceRequirement[] | undefined>(undefined)
  const [docSlots,     setDocSlots]     = useState<Record<string, UploadSlot>>({})
  const [issuedDates,  setIssuedDates]  = useState<Record<string, string>>({})
  const [submittingDoc, setSubmittingDoc] = useState<string | null>(null)
  const [removingDoc,   setRemovingDoc]  = useState<string | null>(null)

  // Banking
  const [accounts, setAccounts] = useState<BankAccountResponse[] | undefined>(undefined)
  const [showBankForm, setShowBankForm] = useState(false)
  const [bankForm, setBankForm] = useState<BankAccountRequest>({
    bank_name: '', account_number: '', account_type: 'SAVINGS', holder_name: '',
  })
  const [bankSubmitting, setBankSubmitting] = useState(false)
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(true)

  useEffect(() => {
    kycApi.get().then((k) => setKyc(k ?? null)).catch(() => setKyc(null))
    complianceApi.getRequirements().then(setRequirements).catch(() => setRequirements([]))
    bankingApi.get().then(setAccounts).catch(() => setAccounts([]))
    paymentApi.getAvailableBanks().then(setAvailableBanks).catch(() => setAvailableBanks([])).finally(() => setLoadingBanks(false))
  }, [])

  // ── Handlers ─────────────────────────────────────────────

  function selectFile(file: File, setter: (s: UploadSlot) => void) {
    setter({ file, fileName: file.name })
  }

  async function submitKyc() {
    if (!frontSlot.file || !rearSlot.file || !selfieSlot.file) return
    setKycSubmitting(true)
    try {
      const [front, rear, selfie] = await Promise.all([
        filesApi.upload(frontSlot.file),
        filesApi.upload(rearSlot.file),
        filesApi.upload(selfieSlot.file),
      ])
      const result = await kycApi.submit({
        front_key:  front.key,
        rear_key:   rear.key,
        selfie_key: selfie.key,
      })
      setKyc(result)
      setFrontSlot(emptySlot())
      setRearSlot(emptySlot())
      setSelfieSlot(emptySlot())
      showToast('KYC enviado para revisión')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al enviar KYC')
    } finally {
      setKycSubmitting(false)
    }
  }

  async function submitDoc(typeCode: string) {
    const slot = docSlots[typeCode]
    const issuedAt = issuedDates[typeCode]
    if (!slot?.file || !issuedAt) return
    setSubmittingDoc(typeCode)
    try {
      const { key } = await filesApi.upload(slot.file)
      await complianceApi.submit({
        type_code: typeCode,
        key,
        issued_at: new Date(issuedAt).toISOString(),
      })
      const fresh = await complianceApi.getRequirements()
      setRequirements(fresh)
      setDocSlots((prev) => ({ ...prev, [typeCode]: emptySlot() }))
      setIssuedDates((prev) => ({ ...prev, [typeCode]: '' }))
      showToast('Documento enviado para revisión')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al enviar documento')
    } finally {
      setSubmittingDoc(null)
    }
  }

  async function removeDoc(docId: string, typeCode: string) {
    setRemovingDoc(docId)
    try {
      await complianceApi.remove(docId)
      const fresh = await complianceApi.getRequirements()
      setRequirements(fresh)
      setDocSlots((prev) => ({ ...prev, [typeCode]: emptySlot() }))
      setIssuedDates((prev) => ({ ...prev, [typeCode]: '' }))
      showToast('Documento eliminado')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar documento')
    } finally {
      setRemovingDoc(null)
    }
  }

  async function addBankAccount() {
    if (!bankForm.bank_name || !bankForm.account_number || !bankForm.holder_name) return
    setBankSubmitting(true)
    try {
      const result = await bankingApi.add(bankForm)
      setAccounts((prev) => [...(prev ?? []), result])
      setBankForm({ bank_name: '', account_number: '', account_type: 'SAVINGS', holder_name: '' })
      setShowBankForm(false)
      showToast('Cuenta agregada')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al agregar cuenta')
    } finally {
      setBankSubmitting(false)
    }
  }

  async function deleteAccount(id: string) {
    try {
      await bankingApi.remove(id)
      setAccounts((prev) => (prev ?? []).filter((a) => a.id !== id))
      showToast('Cuenta eliminada')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar cuenta')
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="max-w-[700px] mx-auto p-5 pb-20 space-y-5">

      {/* Incomplete redirect banner */}
      {(incompleteRedirect || incompleteApply) && (
        <div className="bg-warning-l border border-warning/30 rounded-[14px] px-5 py-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-[13px] font-bold text-warning">
              {incompleteApply
                ? 'Necesitas completar tu perfil para postularte a una propiedad'
                : 'Necesitas completar tu perfil para publicar propiedades'}
            </p>
            <p className="text-[12px] text-warning/80 mt-0.5">
              {incompleteApply
                ? 'Sube los documentos requeridos y espera su aprobación. Una vez tu cuenta esté verificada podrás postularte.'
                : 'Sube los documentos requeridos y espera su aprobación. Una vez tu cuenta esté completa podrás crear propiedades.'}
            </p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white border border-g3 rounded-[16px] p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-navy flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[18px] font-bold text-navy truncate">{user?.fullName ?? '—'}</h1>
          <p className="text-[13px] text-g1 truncate">{user?.email ?? ''}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] font-semibold bg-navy text-white px-2.5 py-0.5 rounded-full">
              Score {user?.score ?? 0}
            </span>
            {user?.city && (
              <span className="text-[11px] text-g1">📍 {user.city}</span>
            )}
            {user?.status && (
              <span className="text-[11px] font-semibold bg-g4 text-g1 px-2 py-0.5 rounded-full uppercase">
                {user.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KYC */}
      <section className="bg-white border border-g3 rounded-[16px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-navy">🪪 Verificación de identidad</h2>
          {kyc && <StatusBadge status={kyc.status} />}
        </div>

        {kyc === undefined && (
          <p className="text-[13px] text-g1">Cargando...</p>
        )}

        {kyc !== undefined && kyc?.status === 'APPROVED' && (
          <p className="text-[13px] text-g1">Tu identidad ha sido verificada correctamente.</p>
        )}

        {kyc !== undefined && kyc?.status === 'PENDING_REVIEW' && (
          <p className="text-[13px] text-g1">
            Tus documentos están siendo revisados. Te notificaremos cuando haya una respuesta.
          </p>
        )}

        {kyc !== undefined && (kyc === null || kyc.status === 'REJECTED' || kyc.status === 'EXPIRED') && (
          <div className="space-y-3">
            {kyc?.status === 'REJECTED' && (
              <p className="text-[13px] text-warm">
                Tu verificación fue rechazada. Por favor vuelve a subir tus documentos.
              </p>
            )}
            <FileUploadSlot
              label="Documento frente"
              slot={frontSlot}
              disabled={kycSubmitting}
              onChange={(f) => selectFile(f, setFrontSlot)}
            />
            <FileUploadSlot
              label="Documento reverso"
              slot={rearSlot}
              disabled={kycSubmitting}
              onChange={(f) => selectFile(f, setRearSlot)}
            />
            <FileUploadSlot
              label="Selfie con documento"
              slot={selfieSlot}
              disabled={kycSubmitting}
              onChange={(f) => selectFile(f, setSelfieSlot)}
            />
            <button
              onClick={submitKyc}
              disabled={!frontSlot.file || !rearSlot.file || !selfieSlot.file || kycSubmitting}
              className="w-full h-10 rounded-[10px] bg-navy text-white text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {kycSubmitting ? 'Enviando...' : 'Enviar para verificación'}
            </button>
          </div>
        )}
      </section>

      {/* Compliance documents */}
      <section className="bg-white border border-g3 rounded-[16px] p-6">
        <h2 className="text-[15px] font-bold text-navy mb-4">📄 Documentos de cumplimiento</h2>

        {requirements === undefined ? (
          <p className="text-[13px] text-g1">Cargando...</p>
        ) : requirements.length === 0 ? (
          <p className="text-[13px] text-g1">No hay documentos requeridos para tu país.</p>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => {
              const { type_code: typeCode, display_name: label, status, doc_id: docId, expires_at: expiresAt } = req
              const canResubmit = status === 'NOT_SUBMITTED' || status === 'REJECTED' || status === 'EXPIRED'
              const canRemove   = docId !== null && status === 'PENDING_REVIEW'
              const slot        = docSlots[typeCode] ?? emptySlot()

              return (
                <div key={typeCode} className="border border-g3 rounded-[12px] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-navy">{label}</span>
                    <div className="flex items-center gap-2">
                      {status !== 'NOT_SUBMITTED' && (
                        <StatusBadge status={status as DocumentStatus} />
                      )}
                      {canRemove && docId && (
                        <button
                          onClick={() => removeDoc(docId, typeCode)}
                          disabled={removingDoc === docId}
                          className="text-[11px] font-semibold text-warm border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity disabled:opacity-40"
                        >
                          {removingDoc === docId ? '…' : 'Eliminar'}
                        </button>
                      )}
                    </div>
                  </div>

                  {!canResubmit ? (
                    <p className="text-[12px] text-g1">
                      {status === 'APPROVED' && expiresAt
                        ? `Vence: ${new Date(expiresAt).toLocaleDateString('es-CO')}`
                        : 'En revisión'}
                    </p>
                  ) : (
                    <div className="space-y-2.5 mt-1">
                      {status === 'REJECTED' && (
                        <p className="text-[12px] text-warm">
                          Documento rechazado. Por favor vuelve a subirlo.
                        </p>
                      )}
                      <FileUploadSlot
                        label="Archivo"
                        slot={slot}
                        disabled={submittingDoc === typeCode}
                        onChange={(f) =>
                          selectFile(f, (s) =>
                            setDocSlots((prev) => ({ ...prev, [typeCode]: s }))
                          )
                        }
                      />
                      <div>
                        <label className="text-[11px] font-semibold text-g1 mb-1 block">
                          Fecha de expedición
                        </label>
                        <input
                          type="date"
                          value={issuedDates[typeCode] ?? ''}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={(e) =>
                            setIssuedDates((prev) => ({ ...prev, [typeCode]: e.target.value }))
                          }
                          className="w-full h-9 rounded-[8px] border border-g3 px-3 text-[12px] text-navy bg-white focus:outline-none focus:border-navy"
                        />
                      </div>
                      <button
                        onClick={() => submitDoc(typeCode)}
                        disabled={!slot.file || !issuedDates[typeCode] || submittingDoc === typeCode}
                        className="w-full h-9 rounded-[9px] bg-navy text-white text-[12px] font-semibold border-none cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity"
                      >
                        {submittingDoc === typeCode ? 'Enviando...' : 'Enviar documento'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Banking */}
      <section className="bg-white border border-g3 rounded-[16px] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-navy">🏦 Cuentas bancarias</h2>
          <button
            onClick={() => setShowBankForm((v) => !v)}
            className="text-[12px] font-semibold text-navy border border-g3 rounded-[8px] px-3 py-1.5 bg-transparent hover:border-navy transition-colors cursor-pointer"
          >
            {showBankForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>

        {accounts === undefined ? (
          <p className="text-[13px] text-g1">Cargando...</p>
        ) : (
          <>
            {accounts.length === 0 && !showBankForm && (
              <p className="text-[13px] text-g1">No tienes cuentas registradas.</p>
            )}

            {accounts.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between py-3 border-b border-g3 last:border-0"
              >
                <div>
                  <p className="text-[13px] font-semibold text-navy">{a.bank_name}</p>
                  <p className="text-[12px] text-g1">
                    {a.account_number} · {a.account_type === 'SAVINGS' ? 'Ahorros' : 'Corriente'} · {a.holder_name}
                  </p>
                </div>
                <button
                  onClick={() => deleteAccount(a.id)}
                  className="text-warm text-[11px] font-semibold border-none bg-transparent cursor-pointer hover:opacity-70 transition-opacity ml-3 flex-shrink-0"
                >
                  Eliminar
                </button>
              </div>
            ))}

            {showBankForm && (
              <div className="space-y-2.5 pt-4 mt-2 border-t border-g3">
                {loadingBanks ? (
                  <div className="text-[13px] text-g2">Cargando bancos…</div>
                ) : (
                  <select
                    value={bankForm.bank_name}
                    onChange={(e) => setBankForm((f) => ({ ...f, bank_name: e.target.value }))}
                    className="w-full h-9 rounded-[8px] border border-g3 px-3 text-[13px] text-navy bg-white focus:outline-none focus:border-navy"
                  >
                    <option value="">Selecciona tu banco</option>
                    {availableBanks.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  placeholder="Número de cuenta"
                  value={bankForm.account_number}
                  onChange={(e) => setBankForm((f) => ({ ...f, account_number: e.target.value }))}
                  className="w-full h-9 rounded-[8px] border border-g3 px-3 text-[13px] text-navy focus:outline-none focus:border-navy"
                />
                <input
                  placeholder="Titular de la cuenta"
                  value={bankForm.holder_name}
                  onChange={(e) => setBankForm((f) => ({ ...f, holder_name: e.target.value }))}
                  className="w-full h-9 rounded-[8px] border border-g3 px-3 text-[13px] text-navy focus:outline-none focus:border-navy"
                />
                <select
                  value={bankForm.account_type}
                  onChange={(e) =>
                    setBankForm((f) => ({ ...f, account_type: e.target.value as AccountType }))
                  }
                  className="w-full h-9 rounded-[8px] border border-g3 px-3 text-[13px] text-navy bg-white focus:outline-none focus:border-navy"
                >
                  <option value="SAVINGS">Ahorros</option>
                  <option value="CHECKING">Corriente</option>
                </select>
                <button
                  onClick={addBankAccount}
                  disabled={
                    bankSubmitting ||
                    !bankForm.bank_name ||
                    !bankForm.account_number ||
                    !bankForm.holder_name
                  }
                  className="w-full h-10 rounded-[10px] bg-navy text-white text-[13px] font-semibold border-none cursor-pointer disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {bankSubmitting ? 'Guardando...' : 'Guardar cuenta'}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
