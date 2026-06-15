'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { landlordApi, filesApi, propertyConfigsApi, pricingApi, apiErrorMessage } from '@/lib/api'
import type { PricingBreakdown } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { BackendProperty, PropertyAttributeConfig } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────

type PropertyType = 'APARTMENT' | 'HOUSE' | 'PARKING' | 'ROOM'

interface TypeConfig {
  label:             string
  icon:              string
  showBedrooms:      boolean
  requireBedrooms:   boolean
  showBathrooms:     boolean
  requireBathrooms:  boolean
  showFloor:         boolean
  requireFloor:      boolean
  floorLabel:        string
  showParkingSpots:  boolean
  showAdminFee:      boolean
  showContractTerms: boolean
  showAmenities:     boolean
  minPhotos:         number
}

const TYPE_CONFIG: Record<PropertyType, TypeConfig> = {
  APARTMENT: {
    label: 'Apartamento', icon: '🏢',
    showBedrooms: true,  requireBedrooms: false,
    showBathrooms: true, requireBathrooms: false,
    showFloor: true,     requireFloor: true,  floorLabel: 'Número de pisos',
    showParkingSpots: false, showAdminFee: true,  showContractTerms: true, showAmenities: true, minPhotos: 4,
  },
  HOUSE: {
    label: 'Casa', icon: '🏠',
    showBedrooms: true,  requireBedrooms: true,
    showBathrooms: true, requireBathrooms: true,
    showFloor: true,     requireFloor: false, floorLabel: 'Número de pisos',
    showParkingSpots: true, showAdminFee: true, showContractTerms: true, showAmenities: true, minPhotos: 4,
  },
  PARKING: {
    label: 'Parqueadero', icon: '🅿️',
    showBedrooms: false, requireBedrooms: false,
    showBathrooms: false, requireBathrooms: false,
    showFloor: false,    requireFloor: false, floorLabel: '',
    showParkingSpots: false, showAdminFee: false, showContractTerms: true, showAmenities: false, minPhotos: 2,
  },
  ROOM: {
    label: 'Habitación', icon: '🛏️',
    showBedrooms: false, requireBedrooms: false,
    showBathrooms: false, requireBathrooms: false,
    showFloor: false,    requireFloor: false, floorLabel: '',
    showParkingSpots: false, showAdminFee: false, showContractTerms: true, showAmenities: true, minPhotos: 2,
  },
}

interface Form {
  type:              PropertyType | null
  title:             string
  country:           string
  city:              string
  neighborhood:      string
  address:           string
  area:              number
  areaUnit:          'M2' | 'FT2'
  bedrooms:          number
  bathrooms:         number
  floors:            number
  parkingSpots:      number
  amenities:         string[]
  currency:          string
  monthlyRent:       string
  adminFee:          string
  adminFeeIncluded:  boolean
  minContractMonths: number
  allowsPets:        boolean
  allowsSmokers:     boolean
  allowsChildren:    boolean
  photoKeys:         string[]
  description:       string
}

const EMPTY: Form = {
  type: null, title: '', country: 'CO', city: '', neighborhood: '', address: '',
  area: 0, areaUnit: 'M2', bedrooms: 0, bathrooms: 0, floors: 1, parkingSpots: 0,
  amenities: [], currency: 'COP', monthlyRent: '', adminFee: '', adminFeeIncluded: false,
  minContractMonths: 12, allowsPets: false, allowsSmokers: false, allowsChildren: false,
  photoKeys: [], description: '',
}

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

const STEPS = [
  { key: 'tipo',      label: 'Tipo' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'detalles',  label: 'Detalles' },
  { key: 'fotos',     label: 'Fotos' },
  { key: 'revisar',   label: 'Revisar' },
]

// ── Converters ─────────────────────────────────────────────

function draftToForm(d: BackendProperty): Form {
  const typeMap: Record<string, PropertyType> = {
    APARTMENT: 'APARTMENT', HOUSE: 'HOUSE', PARKING: 'PARKING', ROOM: 'ROOM',
  }
  return {
    ...EMPTY,
    type:              d.type ? (typeMap[d.type] ?? null) : null,
    title:             d.title ?? '',
    country:           d.country ?? 'Colombia',
    city:              d.city ?? '',
    neighborhood:      d.neighborhood ?? '',
    address:           d.address ?? '',
    area:              d.area ?? 0,
    areaUnit:          (d.area_unit as 'M2' | 'FT2') ?? 'M2',
    bedrooms:          d.bedrooms ?? 0,
    bathrooms:         d.bathrooms ?? 0,
    floors:            d.floors ?? 1,
    parkingSpots:      d.parking_spots ?? 0,
    amenities:         d.amenities ?? [],
    currency:          d.currency ?? 'COP',
    monthlyRent:       d.monthly_rent != null ? String(d.monthly_rent) : '',
    adminFee:          d.admin_fee != null ? String(d.admin_fee) : '',
    adminFeeIncluded:  d.admin_fee == null,
    minContractMonths: d.min_contract_months ?? 12,
    allowsPets:        d.allows_pets,
    allowsSmokers:     d.allows_smokers,
    allowsChildren:    d.allows_children,
    photoKeys:         d.photo_keys ?? [],
    description:       d.description ?? '',
  }
}

function formToRequest(form: Form) {
  const cfg = form.type ? TYPE_CONFIG[form.type] : null
  return {
    type:                form.type ?? undefined,
    title:               form.title || undefined,
    country:             form.country || undefined,
    city:                form.city || undefined,
    neighborhood:        form.neighborhood || undefined,
    address:             form.address || undefined,
    area:                form.area || undefined,
    area_unit:           form.areaUnit,
    bedrooms:            cfg?.showBedrooms  ? (form.bedrooms  || undefined) : null,
    bathrooms:           cfg?.showBathrooms ? (form.bathrooms || undefined) : null,
    floors:              cfg?.showFloor     ? (form.floors    || undefined) : null,
    parking_spots:       form.parkingSpots || undefined,
    amenities:           form.amenities,
    photo_keys:          form.photoKeys,
    description:         form.description || undefined,
    currency:            form.currency,
    monthly_rent:        form.monthlyRent ? parseInt(form.monthlyRent.replace(/\D/g, ''), 10) : undefined,
    admin_fee:           form.adminFee    ? parseInt(form.adminFee.replace(/\D/g, ''), 10)    : undefined,
    min_contract_months: form.minContractMonths,
    allows_pets:         form.allowsPets,
    allows_smokers:      form.allowsSmokers,
    allows_children:     form.allowsChildren,
  }
}

// ── Shell ──────────────────────────────────────────────────

export function CreatePropertyFlow({ draftId: initialDraftId }: { draftId?: string }) {
  const router = useRouter()
  const { showToast } = useAppStore()
  const [step,       setStep]       = useState(0)
  const [showErrors, setShowErrors] = useState(false)
  const [form,       setForm]       = useState<Form>(EMPTY)
  const [photoUrls,  setPhotoUrls]  = useState<string[]>([])
  const [draftId,    setDraftId]    = useState<string | null>(initialDraftId ?? null)
  const draftIdRef   = useRef<string | null>(initialDraftId ?? null)
  const photoKeysRef = useRef<string[]>([])
  const [configs,    setConfigs]    = useState<PropertyAttributeConfig[]>([])
  const [saving,     setSaving]     = useState(false)
  const [loading,    setLoading]    = useState(!!initialDraftId)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!initialDraftId) return
    landlordApi.getProperty(initialDraftId)
      .then((d) => {
        setForm(draftToForm(d))
        setPhotoUrls(d.photo_urls ?? [])
        photoKeysRef.current = d.photo_keys ?? []
      })
      .catch(() => showToast('No se pudo cargar el borrador.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraftId])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }))

  const appendPhoto = async (url: string, key: string) => {
    const newKeys = [...photoKeysRef.current, key]
    photoKeysRef.current = newKeys
    setPhotoUrls((u) => [...u, url])
    setForm((f) => ({ ...f, photoKeys: newKeys }))
    setSaving(true)
    try {
      const id = await ensureDraft()
      await landlordApi.update(id, { photo_keys: newKeys })
    } catch (err) {
      showToast(apiErrorMessage(err, 'Error al guardar las fotos.'))
    } finally {
      setSaving(false)
    }
  }
  const removePhoto = async (index: number) => {
    const key = form.photoKeys[index]
    const newKeys = form.photoKeys.filter((_, i) => i !== index)
    photoKeysRef.current = newKeys
    setPhotoUrls((u) => u.filter((_, i) => i !== index))
    setForm((f) => ({ ...f, photoKeys: newKeys }))
    if (key) {
      try { await filesApi.deleteFile(key) } catch { /* best-effort */ }
    }
  }
  const cfg = form.type ? TYPE_CONFIG[form.type] : null

  const canNext = () => {
    if (step === 0) return form.type != null
    if (step === 1) return !!form.title && !!form.country && !!form.city && !!form.neighborhood && !!form.address
    if (step === 2) return (
      form.area > 0 &&
      !!form.monthlyRent &&
      !!form.currency &&
      (!cfg?.requireFloor || form.floors >= 1)
    )
    if (step === 3) return cfg != null && form.photoKeys.length >= cfg.minPhotos
    return true
  }

  const ensureDraft = async (): Promise<string> => {
    if (draftIdRef.current) return draftIdRef.current
    const created = await landlordApi.create()
    draftIdRef.current = created.id
    setDraftId(created.id)
    window.history.replaceState(null, '', `/landlord/properties/new?draftId=${created.id}`)
    return created.id
  }

  const saveDraft = async (): Promise<boolean> => {
    setSaving(true)
    try {
      const id = await ensureDraft()
      await landlordApi.update(id, formToRequest(form))
      router.push('/landlord/properties')
      return true
    } catch (err) {
      showToast(apiErrorMessage(err, 'Error al guardar borrador.'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const goToProperties = () => {
    router.push('/landlord/properties')
  }

  const cancelAndDelete = async () => {
    setCancelling(true)
    try {
      if (draftId) await landlordApi.deleteProperty(draftId)
      router.push('/landlord/properties')
    } catch (err) {
      showToast(apiErrorMessage(err, 'Error al eliminar el borrador.'))
      setCancelling(false)
    }
  }

  const goNext = () => {
    if (!canNext()) { setShowErrors(true); return }
    setShowErrors(false)
    setStep((s) => s + 1)
  }

  const publish = async () => {
    setSaving(true)
    try {
      const id = await ensureDraft()
      await landlordApi.update(id, formToRequest(form))
      await landlordApi.submit(id)
      showToast('Propiedad publicada ✓')
      router.push('/landlord/properties')
    } catch (err) {
      showToast(apiErrorMessage(err, 'Error al publicar. Intenta de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          <span className="text-g2 text-sm">Cargando borrador…</span>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8F9FB]">

      {/* Top bar */}
      <div className="flex-shrink-0 bg-white border-b border-g3 px-6 h-14 flex items-center gap-4">
        <button
          onClick={goToProperties}
          disabled={saving}
          className="flex items-center gap-1.5 text-[13px] text-g1 font-medium bg-transparent border-none cursor-pointer hover:text-navy transition-colors disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Mis propiedades
        </button>
        <div className="flex-1" />
        <span className="text-[12px] text-g2 font-medium">{draftId ? 'Borrador' : 'Nueva propiedad'}</span>
        <button
          onClick={cancelAndDelete}
          disabled={cancelling || saving}
          className="text-[12px] text-danger font-semibold bg-transparent border-none cursor-pointer hover:opacity-70 disabled:opacity-40 transition-opacity"
        >
          {cancelling ? '…' : 'Cancelar y eliminar'}
        </button>
      </div>

      {/* Step bar */}
      <div className="flex-shrink-0 bg-white border-b border-g3 px-6 py-3">
        <div className="flex items-center gap-1.5 max-w-2xl mx-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                i === step ? 'bg-navy' : i < step ? 'bg-teal/10' : 'bg-transparent'
              }`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  i < step  ? 'bg-teal' :
                  i === step ? 'bg-white/20' :
                               'bg-g3'
                }`}>
                  {i < step ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <span className={`text-[9px] font-bold leading-none ${i === step ? 'text-white' : 'text-g2'}`}>{i + 1}</span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold whitespace-nowrap hidden sm:block ${
                  i === step ? 'text-white' : i < step ? 'text-teal' : 'text-g2'
                }`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px rounded-full" style={{ background: i < step ? 'var(--color-teal,#1A7A6E)' : '#E5E7EB' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 py-8">
          {step === 0 && <StepType    form={form} set={set} setForm={setForm} showErrors={showErrors} />}
          {step === 1 && <StepLocation form={form} set={set} showErrors={showErrors} />}
          {step === 2 && cfg && (
            <div className="flex flex-col gap-6">
              <StepPrice form={form} set={set} cfg={cfg} showErrors={showErrors} />
              <StepDetails form={form} set={set} cfg={cfg} showErrors={showErrors} configs={configs} setConfigs={setConfigs} />
            </div>
          )}
          {step === 3 && cfg && <StepPhotos   form={form} set={set} cfg={cfg} photoUrls={photoUrls} appendPhoto={appendPhoto} removePhoto={removePhoto} />}
          {step === 4 && cfg && <StepReview   form={form} cfg={cfg} photoUrls={photoUrls} allConfigs={configs} />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-g3 px-6 py-4 flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => { setStep(step - 1); setShowErrors(false) }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-g3 text-[13px] font-semibold text-navy bg-transparent cursor-pointer hover:border-navy transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Atrás
          </button>
        )}
        <button
          disabled={saving}
          onClick={saveDraft}
          className="px-4 py-2.5 rounded-xl border border-g3 text-[13px] font-semibold text-g1 bg-transparent cursor-pointer hover:border-navy hover:text-navy disabled:opacity-40 transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar borrador'}
        </button>
        <div className="flex-1" />
        {step < STEPS.length - 1 ? (
          <button
            disabled={!canNext() || saving}
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy text-white text-[13px] font-bold border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-navy/90 transition-colors"
          >
            {saving ? 'Guardando…' : 'Continuar'}
            {!saving && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={publish}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal text-white text-[13px] font-bold border-none cursor-pointer disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg shadow-teal/20"
          >
            {saving ? 'Publicando…' : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Publicar propiedad
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step 1: Tipo ───────────────────────────────────────────

function StepType({ form, set, setForm, showErrors }: StepProps) {
  return (
    <div className="flex flex-col gap-8">
      <StepHeader
        title="¿Qué vas a arrendar?"
        subtitle="Selecciona el tipo de inmueble que quieres publicar."
      />
      {showErrors && !form.type && errMsg('Selecciona un tipo de inmueble para continuar.')}
      <div className="flex flex-col gap-3">
        {(Object.entries(TYPE_CONFIG) as [PropertyType, TypeConfig][]).map(([type, c]) => {
          const selected = form.type === type
          return (
            <button
              key={type}
              onClick={() => setForm!((f) => ({
                ...f,
                type,
                bedrooms:     0,
                bathrooms:    0,
                floors:       1,
                parkingSpots: 0,
                amenities:    [],
                adminFee:     '',
              }))}
              className={`flex items-center gap-4 w-full px-5 py-4 rounded-2xl border-2 text-left cursor-pointer transition-all bg-white ${
                selected ? 'border-navy shadow-md shadow-navy/8' : 'border-g3 hover:border-g2'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${
                selected ? 'bg-navy/8' : 'bg-g4'
              }`}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-navy leading-tight">{c.label}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                selected ? 'border-navy bg-navy' : 'border-g3 bg-white'
              }`}>
                {selected && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Ubicación ──────────────────────────────────────

function StepLocation({ form, set, showErrors }: StepProps) {
  const e = showErrors
  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="¿Dónde está ubicado?" subtitle="Esta información aparecerá en el anuncio." />

      <Card>
        <Field label="Título del anuncio">
          <input
            type="text"
            placeholder="Ej: Apartamento luminoso con vista al parque"
            value={form.title}
            autoFocus
            onChange={(e) => set('title', e.target.value)}
            className={e && !form.title ? inputErrCls : inputCls}
          />
          {e && !form.title && errMsg('El título es obligatorio.')}
        </Field>
      </Card>

      <Card title="Ubicación">
        <div className="grid grid-cols-2 gap-4">
          <Field label="País">
            <select value={form.country} onChange={(ev) => set('country', ev.target.value)} className={e && !form.country ? inputErrCls : inputCls}>
              <option value="">Selecciona</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
            {e && !form.country && errMsg('Selecciona un país.')}
          </Field>
          <Field label="Ciudad">
            <input type="text" placeholder="Ej: Bogotá" value={form.city}
              onChange={(ev) => set('city', ev.target.value)} className={e && !form.city ? inputErrCls : inputCls} />
            {e && !form.city && errMsg('La ciudad es obligatoria.')}
          </Field>
        </div>
        <Field label="Barrio / Sector">
          <input type="text" placeholder="Ej: Chapinero Alto" value={form.neighborhood}
            onChange={(ev) => set('neighborhood', ev.target.value)} className={e && !form.neighborhood ? inputErrCls : inputCls} />
          {e && !form.neighborhood && errMsg('El barrio es obligatorio.')}
        </Field>
        <Field label="Dirección">
          <input type="text" placeholder="Ej: Calle 72 # 10-35, Apto 401" value={form.address}
            onChange={(ev) => set('address', ev.target.value)} className={e && !form.address ? inputErrCls : inputCls} />
          {e && !form.address && errMsg('La dirección es obligatoria.')}
        </Field>
      </Card>
    </div>
  )
}

// ── Step 3: Detalles ───────────────────────────────────────

const CATEGORY_ORDER = ['FEATURE', 'AMENITY', 'SERVICE'] as const
const CATEGORY_LABEL: Record<string, string> = {
  FEATURE: 'Características',
  AMENITY: 'Amenidades',
  SERVICE: 'Servicios incluidos',
}

function StepDetails({ form, set, cfg, showErrors, configs, setConfigs }: StepPropsWithCfg & {
  configs: PropertyAttributeConfig[]
  setConfigs: (c: PropertyAttributeConfig[]) => void
}) {
  useEffect(() => {
    if (!form.type) return
    propertyConfigsApi.listEnabled(form.type)
      .then(setConfigs)
      .catch(() => setConfigs([]))
  }, [form.type])

  const handleArea = (raw: string) => {
    const n = Number(raw)
    set('area', !raw || isNaN(n) || n < 0 ? 0 : n)
  }

  const switchUnit = (u: 'M2' | 'FT2') => set('areaUnit', u)

  const toggle = (name: string) =>
    set('amenities', form.amenities.includes(name)
      ? form.amenities.filter((x) => x !== name)
      : [...form.amenities, name])

  const grouped = configs.reduce<Record<string, PropertyAttributeConfig[]>>((acc, c) => {
    ;(acc[c.category] ??= []).push(c)
    return acc
  }, {})

  const hasDimensions = cfg.showBedrooms || cfg.showBathrooms || cfg.showFloor || cfg.showParkingSpots

  return (
    <>

      {/* Dimensions + Area */}
      <div className="mt-2">
      <Card title="Dimensiones">
        <div className="divide-y divide-g3 -mx-5 -mb-4">

          {/* Area row */}
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] font-medium text-navy">Área</span>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1}
                placeholder={form.areaUnit === 'M2' ? '65' : '700'}
                value={form.area || ''}
                onChange={(e) => handleArea(e.target.value)}
                className={`w-24 px-3 py-1.5 rounded-xl border text-[13px] text-navy text-right bg-white focus:outline-none focus:border-navy transition-colors ${showErrors && form.area <= 0 ? 'border-warm' : 'border-g3'}`}
              />
              <div className="flex rounded-xl border border-g3 overflow-hidden text-[12px] font-bold">
                {(['M2', 'FT2'] as const).map((u) => (
                  <button key={u} onClick={() => switchUnit(u)}
                    className={`px-2.5 py-1.5 border-none cursor-pointer transition-colors ${u === form.areaUnit ? 'bg-navy text-white' : 'bg-white text-g1 hover:text-navy'}`}>
                    {u === 'M2' ? 'm²' : 'ft²'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {showErrors && form.area <= 0 && (
            <div className="px-5 pb-2 -mt-1">
              {errMsg('El área debe ser mayor a 0.')}
            </div>
          )}

          {cfg.showBedrooms && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] font-medium text-navy">Habitaciones</span>
              <InlineCounter min={0} max={20} value={form.bedrooms} onChange={(v) => set('bedrooms', v)} />
            </div>
          )}
          {cfg.showBathrooms && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] font-medium text-navy">Baños</span>
              <InlineCounter min={0} max={10} value={form.bathrooms} onChange={(v) => set('bathrooms', v)} />
            </div>
          )}
          {cfg.showFloor && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] font-medium text-navy">{cfg.floorLabel}</span>
              <InlineCounter min={1} max={80} value={form.floors} onChange={(v) => set('floors', v)} />
            </div>
          )}
          {cfg.showParkingSpots && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-[13px] font-medium text-navy">Parqueaderos</span>
              <InlineCounter min={0} max={10} value={form.parkingSpots} onChange={(v) => set('parkingSpots', v)} />
            </div>
          )}
        </div>
      </Card>
      </div>

      {/* Attribute groups */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat]
        if (!items?.length) return null
        return (
          <Card key={cat} title={CATEGORY_LABEL[cat]}>
            <div className="flex flex-wrap gap-2">
              {items.map((c) => {
                const active = form.amenities.includes(c.display_name)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.display_name)}
                    className={`px-3.5 py-2 rounded-xl text-[13px] font-medium cursor-pointer border transition-all ${
                      active
                        ? 'bg-navy text-white border-navy'
                        : 'bg-white text-navy border-g3 hover:border-navy'
                    }`}
                  >
                    {active && <span className="mr-1.5 text-[11px]">✓</span>}
                    {c.display_name}
                  </button>
                )
              })}
            </div>
          </Card>
        )
      })}

      {/* Description */}
      <Card title="Descripción">
        <textarea
          rows={4}
          placeholder="Describe la propiedad: acabados, vista, zonas comunes, transporte cercano…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className={`${inputCls} resize-none`}
        />
        <p className="text-[11px] text-g2 mt-1 text-right">{form.description.length} / 500</p>
      </Card>
    </>
  )
}

// ── Step 4: Precio ─────────────────────────────────────────

function StepPrice({ form, set, cfg, showErrors }: StepPropsWithCfg) {
  const e = showErrors
  return (
    <>
      <StepHeader title="Precio y condiciones" subtitle="Define el valor del arriendo y las condiciones del contrato." />

      <Card title="Valor">
        {/* Currency selector */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-semibold text-g1 uppercase tracking-[.5px] mr-1">Moneda</span>
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => set('currency', c.code)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-none cursor-pointer transition-colors ${
                form.currency === c.code ? 'bg-navy text-white' : 'bg-g4 text-g1 hover:text-navy'
              }`}
            >
              {c.code}
            </button>
          ))}
        </div>

        <div className="h-px bg-g3 -mx-5 mb-4" />

        {/* Rent */}
        <div className="mb-1">
          <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-g1 mb-1.5">
            Arriendo mensual
          </label>
          <div className={`flex items-center gap-0 rounded-xl border-[1.5px] overflow-hidden ${e && !form.monthlyRent ? 'border-warm' : 'border-g3 focus-within:border-teal'}`}>
            <span className="px-3 py-3 text-[13px] font-semibold text-g1 bg-g4 border-r border-g3 select-none flex-shrink-0">
              {CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? form.currency}
            </span>
            <input
              type="text"
              placeholder={form.currency === 'COP' ? '2.800.000' : form.currency === 'USD' ? '700' : '650'}
              value={form.monthlyRent ? Number(form.monthlyRent).toLocaleString('es-CO') : ''}
              onChange={(ev) => set('monthlyRent', ev.target.value.replace(/[^0-9]/g, ''))}
              className="flex-1 px-3 py-3 text-[14px] font-semibold text-navy bg-white outline-none"
            />
            <span className="px-3 py-3 text-[11px] font-bold text-g2 bg-white flex-shrink-0 select-none">/ mes</span>
          </div>
          {e && !form.monthlyRent && errMsg('El arriendo mensual es obligatorio.')}
        </div>

        {/* Admin fee */}
        {cfg.showAdminFee && (
          <div className="mt-4">
            <label className="block text-[11px] font-bold uppercase tracking-[.5px] text-g1 mb-1.5">
              Administración
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { set('adminFeeIncluded', true); set('adminFee', '') }}
                className={`flex-1 py-2.5 rounded-xl border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors ${
                  form.adminFeeIncluded ? 'border-teal bg-teal/10 text-teal' : 'border-g3 text-g1 hover:border-navy'
                }`}
              >
                Incluida
              </button>
              <button
                type="button"
                onClick={() => set('adminFeeIncluded', false)}
                className={`flex-1 py-2.5 rounded-xl border-[1.5px] text-[13px] font-semibold cursor-pointer transition-colors ${
                  !form.adminFeeIncluded ? 'border-teal bg-teal/10 text-teal' : 'border-g3 text-g1 hover:border-navy'
                }`}
              >
                No incluida
              </button>
            </div>
            {!form.adminFeeIncluded && (
              <div className="flex items-center gap-0 rounded-xl border-[1.5px] border-g3 overflow-hidden focus-within:border-teal">
                <span className="px-3 py-3 text-[13px] font-semibold text-g1 bg-g4 border-r border-g3 select-none flex-shrink-0">
                  {CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? form.currency}
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={form.adminFee ? Number(form.adminFee).toLocaleString('es-CO') : ''}
                  onChange={(ev) => set('adminFee', ev.target.value.replace(/[^0-9]/g, ''))}
                  className="flex-1 px-3 py-3 text-[14px] font-semibold text-navy bg-white outline-none"
                />
                <span className="px-3 py-3 text-[11px] font-bold text-g2 bg-white flex-shrink-0 select-none">/ mes</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {cfg.showContractTerms && (
        <Card title="Condiciones">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-navy font-medium">Meses mínimos de contrato</span>
              <span className="text-[15px] font-bold text-navy">{form.minContractMonths}</span>
            </div>
            <input
              type="range" min={1} max={36} value={form.minContractMonths}
              onChange={(e) => set('minContractMonths', Number(e.target.value))}
              className="w-full accent-navy"
            />
            <div className="flex justify-between text-[11px] text-g2 mt-1">
              <span>1 mes</span><span>36 meses</span>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-g3 -mx-5">
            {([
              ['allowsPets',     '🐾', 'Mascotas',   'Se permiten mascotas',   'No se permiten mascotas'],
              ['allowsSmokers',  '🚬', 'Fumadores',  'Se permite fumar',       'No se permite fumar'],
              ['allowsChildren', '👶', 'Niños',      'Se permiten niños',      'No se permiten niños'],
            ] as [keyof Form, string, string, string, string][]).map(([key, icon, label, yes, no]) => (
              <div key={key} className="flex items-center gap-3 px-5 py-3.5">
                <span className="text-[18px] flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-navy">{label}</p>
                  <p className={`text-[11px] mt-0.5 font-medium ${form[key] ? 'text-teal' : 'text-warm'}`}>
                    {form[key] ? yes : no}
                  </p>
                </div>
                <button
                  onClick={() => set(key, !form[key])}
                  style={{ WebkitAppearance: 'none' }}
                  className={`relative inline-flex items-center w-11 h-6 rounded-full border-none cursor-pointer flex-shrink-0 transition-colors duration-200 p-0 ${
                    form[key] ? 'bg-teal' : 'bg-g3'
                  }`}
                >
                  <span
                    className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow transition-all duration-200"
                    style={{ left: form[key] ? '22px' : '2px' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}

// ── Step 5: Fotos ──────────────────────────────────────────

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

function StepPhotos({ form, set, cfg, photoUrls, appendPhoto, removePhoto }: StepPhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<string[]>([])
  const [dragOver,  setDragOver]  = useState(false)
  const [uploadErr, setUploadErr] = useState('')

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    setUploadErr('')
    const valid = Array.from(files).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) { setUploadErr('Solo JPG, PNG, WEBP o HEIC.'); return false }
      return true
    })
    for (const file of valid) {
      const id = `${file.name}-${Date.now()}`
      setUploading((u) => [...u, id])
      try {
        const uploaded = await filesApi.upload(file)
        await appendPhoto(uploaded.url, uploaded.key)
      } catch (err) {
        setUploadErr(apiErrorMessage(err, 'Error al subir una imagen.'))
      } finally {
        setUploading((u) => u.filter((x) => x !== id))
      }
    }
  }

  const remaining = cfg.minPhotos - form.photoKeys.length
  const met = remaining <= 0

  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        title="Fotos de la propiedad"
        subtitle="La primera foto será la portada del anuncio."
      />

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-semibold text-g1">
            {form.photoKeys.length} / {cfg.minPhotos} mínimo
          </span>
          {met
            ? <span className="text-[12px] font-semibold text-teal">✓ Listo</span>
            : <span className="text-[12px] font-semibold text-warm">Faltan {remaining}</span>
          }
        </div>
        <div className="h-1.5 bg-g3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((form.photoKeys.length / cfg.minPhotos) * 100, 100)}%`,
              background: met ? 'var(--color-teal, #1A7A6E)' : 'var(--color-warm, #F59E0B)',
            }}
          />
        </div>
      </div>

      {/* Grid: photos + upload tile */}
      <div className="grid grid-cols-3 gap-2.5">
        {photoUrls.map((url, i) => (
          <div key={url} className="relative group aspect-square rounded-2xl overflow-hidden bg-g3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-2xl" />
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-[12px] font-bold border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
            >✕</button>
            {i === 0 && (
              <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-white/90 text-navy px-2 py-0.5 rounded-full shadow-sm">
                Portada
              </span>
            )}
          </div>
        ))}

        {/* Uploading placeholders */}
        {uploading.map((id) => (
          <div key={id} className="aspect-square rounded-2xl bg-g4 border-2 border-dashed border-g3 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-teal border-t-transparent animate-spin" />
          </div>
        ))}

        {/* Add tile */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
            dragOver ? 'border-navy bg-navy/5 scale-[0.98]' : 'border-g3 bg-g4 hover:border-navy/40 hover:bg-white'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[10px] font-semibold text-g1">Agregar</span>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      <p className="text-[11px] text-g2">Máximo 10MB por foto.</p>

      {uploadErr && (
        <p className="text-[12px] text-danger font-semibold bg-danger-l px-4 py-2.5 rounded-xl">{uploadErr}</p>
      )}
    </div>
  )
}

// ── Step 6: Revisar ────────────────────────────────────────

function ReviewLightbox({ urls, initial, onClose }: { urls: string[]; initial: number; onClose: () => void }) {
  const [idx, setIdx] = React.useState(initial)
  const prev = () => setIdx((i) => (i - 1 + urls.length) % urls.length)
  const next = () => setIdx((i) => (i + 1) % urls.length)

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-0 z-[700] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button onClick={(e) => { e.stopPropagation(); prev() }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer flex items-center justify-center text-lg transition-colors">
        ‹
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={urls[idx]} alt="" onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
      <button onClick={(e) => { e.stopPropagation(); next() }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer flex items-center justify-center text-lg transition-colors">
        ›
      </button>
      <button onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border-none cursor-pointer flex items-center justify-center transition-colors">
        ✕
      </button>
      <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12px] text-white/60 font-medium">
        {idx + 1} / {urls.length}
      </span>
    </div>
  )
}

function StepReview({ form, cfg, photoUrls, allConfigs }: { form: Form; cfg: TypeConfig; photoUrls: string[]; allConfigs: PropertyAttributeConfig[] }) {
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null)
  const [breakdown, setBreakdown] = React.useState<PricingBreakdown | null>(null)
  const symbol = CURRENCIES.find((c) => c.code === form.currency)?.symbol ?? '$'

  React.useEffect(() => {
    const rent = Number(form.monthlyRent)
    if (!rent || !form.country) { setBreakdown(null); return }
    pricingApi.getBreakdown(rent, form.country)
      .then(setBreakdown)
      .catch(() => setBreakdown(null))
  }, [form.monthlyRent, form.country])

  const rows: [string, string][] = [
    ['Tipo',          cfg.label],
    ['Título',        form.title || '—'],
    ['Dirección',     [form.address, form.neighborhood, form.city, form.country].filter(Boolean).join(', ') || '—'],
    ['Área',          form.area > 0 ? `${form.area} ${form.areaUnit === 'FT2' ? 'ft²' : 'm²'}` : '—'],
    ...(cfg.showBedrooms    ? [['Habitaciones', String(form.bedrooms)]] as [string,string][] : []),
    ...(cfg.showBathrooms   ? [['Baños', String(form.bathrooms)]] as [string,string][] : []),
    ...(cfg.showFloor       ? [[cfg.floorLabel, String(form.floors)]] as [string,string][] : []),
    ...(cfg.showParkingSpots && form.parkingSpots > 0 ? [['Parqueaderos', String(form.parkingSpots)]] as [string,string][] : []),
    ['Arriendo',      form.monthlyRent ? `${symbol} ${Number(form.monthlyRent).toLocaleString('es-CO')} ${form.currency}` : '—'],
    ...(cfg.showAdminFee
      ? [['Administración', form.adminFeeIncluded
          ? 'Incluida'
          : form.adminFee ? `${symbol} ${Number(form.adminFee).toLocaleString('es-CO')} ${form.currency}` : '—'
        ]] as [string, string][]
      : []),
    ...(cfg.showContractTerms ? [['Contrato mínimo', `${form.minContractMonths} meses`]] as [string,string][] : []),
  ]

  return (
    <div className="flex flex-col gap-6">
      <StepHeader title="Revisa tu anuncio" subtitle="Verifica que todo esté correcto antes de publicar." />

      {/* Photos grid */}
      {photoUrls.length > 0 && (
        <Card title={`Fotos (${photoUrls.length})`}>
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url, i) => (
              <div key={url} onClick={() => setLightboxIdx(i)}
                className="relative group aspect-square rounded-xl overflow-hidden bg-g3 cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M8.5 1.5H12.5V5.5M5.5 12.5H1.5V8.5M12.5 1.5L8 6M1.5 12.5L6 8" stroke="#0D1B2A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-white/90 text-navy px-2 py-0.5 rounded-full shadow-sm">
                    Portada
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {lightboxIdx !== null && (
        <ReviewLightbox urls={photoUrls} initial={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* Property details */}
      <Card title="Información general">
        <div className="divide-y divide-g3 -mx-5 -mb-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between items-center px-5 py-3">
              <span className="text-[12px] text-g1">{label}</span>
              <span className="text-[13px] font-semibold text-navy text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Pricing breakdown */}
      {breakdown && (
        <Card title="Cuánto recibes">
          <div className="divide-y divide-g3 -mx-5 -mb-4">
            <div className="flex justify-between items-center px-5 py-3">
              <span className="text-[12px] text-g1">Precio del arriendo</span>
              <span className="text-[13px] font-semibold text-navy">
                {symbol} {breakdown.monthly_rent.toLocaleString('es-CO')} {form.currency}
              </span>
            </div>
            <div className="flex justify-between items-center px-5 py-3">
              <span className="text-[12px] text-g1">Comisión Pacta ({breakdown.commission_percentage}%)</span>
              <span className="text-[13px] font-semibold text-red-500">
                − {symbol} {breakdown.pacta_fee.toLocaleString('es-CO')} {form.currency}
              </span>
            </div>
            <div className="flex justify-between items-center px-5 py-3">
              <span className="text-[13px] font-bold text-navy">Recibes cada mes</span>
              <span className="text-[15px] font-bold text-teal">
                {symbol} {breakdown.landlord_receives.toLocaleString('es-CO')} {form.currency}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Description */}
      {form.description && (
        <Card title="Descripción">
          <p className="text-[13px] text-navy leading-relaxed">{form.description}</p>
        </Card>
      )}

      {/* Conditions */}
      {cfg.showContractTerms && (
        <Card title="Condiciones">
          <div className="divide-y divide-g3 -mx-5 -mb-4">
            {([
              ['Mascotas',  form.allowsPets,     '🐾'],
              ['Fumadores', form.allowsSmokers,  '🚬'],
              ['Niños',     form.allowsChildren, '👶'],
            ] as [string, boolean, string][]).map(([label, allowed, icon]) => (
              <div key={label} className="flex justify-between items-center px-5 py-3">
                <span className="text-[12px] text-g1">{icon} {label}</span>
                <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${allowed ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {allowed ? 'Permitido' : 'No permitido'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Attributes grouped by category */}
      {(() => {
        const grouped = allConfigs
          .filter((c) => form.amenities.includes(c.display_name))
          .reduce<Record<string, PropertyAttributeConfig[]>>((acc, c) => {
            ;(acc[c.category] ??= []).push(c)
            return acc
          }, {})
        const cats = Object.keys(grouped)
        return (
          <Card title="Atributos seleccionados">
            {cats.length === 0 ? (
              <p className="text-[13px] text-g2">Ningún atributo seleccionado.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {cats.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold uppercase tracking-[.6px] text-g2 mb-2">
                      {CATEGORY_LABEL[cat] ?? cat}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {grouped[cat].map((c) => (
                        <span key={c.id} className="text-[12px] font-medium px-3 py-1.5 rounded-full bg-navy/5 text-navy border border-navy/10">
                          {c.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })()}

      <div className="bg-teal/5 border border-teal/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5 6.5-6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-teal-d">Listo para publicar</p>
          <p className="text-[12px] text-teal-d/80 mt-0.5 leading-relaxed">Tu propiedad estará visible para inquilinos verificados en menos de 5 minutos una vez aprobada.</p>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────

type StepProps = { form: Form; set: <K extends keyof Form>(k: K, v: Form[K]) => void; setForm?: React.Dispatch<React.SetStateAction<Form>>; showErrors?: boolean }
type StepPropsWithCfg = StepProps & { cfg: TypeConfig }
type StepPhotosProps = StepPropsWithCfg & {
  photoUrls:   string[]
  appendPhoto: (url: string, key: string) => Promise<void>
  removePhoto: (index: number) => Promise<void>
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-g3 text-[13px] text-navy bg-white focus:outline-none focus:border-navy transition-colors placeholder:text-g2'
const inputErrCls = 'w-full px-3.5 py-2.5 rounded-xl border border-warm text-[13px] text-navy bg-white focus:outline-none focus:border-warm transition-colors placeholder:text-g2'
const errMsg = (msg: string) => <p className="text-[11px] text-warm font-semibold mt-1">{msg}</p>

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="font-serif text-[24px] text-navy leading-tight">{title}</h2>
      <p className="text-[13px] text-g1 mt-1">{subtitle}</p>
    </div>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-g3 p-5 flex flex-col gap-4">
      {title && <h3 className="text-[13px] font-bold text-navy">{title}</h3>}
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-g1 uppercase tracking-[.5px]">{label}</label>
      {children}
    </div>
  )
}

function InlineCounter({ min, max, value, onChange }: { min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-g3 text-navy bg-white cursor-pointer hover:border-navy transition-colors flex items-center justify-center text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
      >−</button>
      <span className="w-6 text-center text-[15px] font-bold text-navy tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-g3 text-navy bg-white cursor-pointer hover:border-navy transition-colors flex items-center justify-center text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed"
      >+</button>
    </div>
  )
}

function Counter({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-[#F8F9FB] rounded-xl p-4 flex flex-col items-center gap-2">
      <span className="text-[11px] font-semibold text-g1 uppercase tracking-[.4px] text-center">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 rounded-full border border-g3 text-navy text-base bg-white cursor-pointer hover:border-navy transition-colors flex items-center justify-center font-bold"
        >−</button>
        <span className="font-serif text-[22px] text-navy w-6 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 rounded-full border border-g3 text-navy text-base bg-white cursor-pointer hover:border-navy transition-colors flex items-center justify-center font-bold"
        >+</button>
      </div>
    </div>
  )
}
