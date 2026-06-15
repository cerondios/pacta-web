'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { authApi, apiErrorMessage } from '@/lib/api'

const DOTS = [0, 1]

const ROLES = [
  { value: 'TENANT',   emoji: '🔍', title: 'Arrendatario', sub: 'Busco una propiedad para arrendar' },
  { value: 'LANDLORD', emoji: '🏠', title: 'Arrendador',    sub: 'Tengo propiedades para arrendar' },
] as const

export function OnboardingFlow() {
  const router = useRouter()
  const { user, setUser, showToast } = useAppStore()
  const [step, setStep] = useState(0)
  const [city, setCity] = useState('')
  const [roles, setRoles] = useState<Set<'TENANT' | 'LANDLORD'>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleRole = (r: 'TENANT' | 'LANDLORD') => {
    setRoles((prev) => {
      const next = new Set(prev)
      next.has(r) ? next.delete(r) : next.add(r)
      return next
    })
  }

  const finish = async () => {
    setLoading(true)
    try {
      const profile = await authApi.completeOnboarding({
        city: city || 'Otra ciudad',
        roles: [...roles],
      })
      setUser({
        id:        profile.id,
        fullName:  profile.full_name,
        email:     profile.email,
        roles:     profile.roles,
        status:    profile.status,
        score:     profile.score,
        phone:     profile.phone,
        country:   profile.country,
        city:      profile.city,
        createdAt: profile.created_at,
      })
      showToast('¡Bienvenido a Pacta! 🎉')
      setTimeout(() => router.push('/home'), 700)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-68px)] bg-white flex flex-col items-center justify-center px-5 py-9">
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-10">
        {DOTS.map((i) => (
          <div
            key={i}
            className={`h-[7px] rounded-full transition-all duration-300 ${
              i === step ? 'bg-teal w-5 rounded-[4px]' : i < step ? 'bg-success w-[7px]' : 'bg-g3 w-[7px]'
            }`}
          />
        ))}
      </div>

      {/* Step 0 – City */}
      {step === 0 && (
        <div className="w-full max-w-[480px] text-center">
          <div className="text-[54px] mb-4">📍</div>
          <h2 className="font-serif text-[28px] text-navy mb-2 leading-[1.2]">¡Hola{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! ¿En qué ciudad estás?</h2>
          <p className="text-sm text-g1 leading-[1.7] mb-7 max-w-[360px] mx-auto">
            Te mostramos propiedades y arrendatarios cerca de ti.
          </p>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3.5 py-3 rounded-[11px] border-[1.5px] border-g3 text-sm text-navy bg-g4 outline-none cursor-pointer mb-6 font-[family-name:var(--font-dm-sans)] focus:border-teal"
          >
            <option value="">Selecciona tu ciudad</option>
            {['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Otra ciudad'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            disabled={!city}
            onClick={() => setStep(1)}
            className="w-full py-3.5 rounded-full bg-teal text-white text-[15px] font-bold border-none shadow-[0_4px_14px_rgba(26,122,110,.3)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-l hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Step 1 – Role */}
      {step === 1 && (
        <div className="w-full max-w-[480px] text-center">
          <div className="text-[54px] mb-4">🙋</div>
          <h2 className="font-serif text-[28px] text-navy mb-2 leading-[1.2]">¿Cuál es tu rol en Pacta?</h2>
          <p className="text-sm text-g1 leading-[1.7] mb-7 max-w-[360px] mx-auto">
            Elige cómo usarás la plataforma. Puedes actualizarlo después.
          </p>

          <div className="flex flex-col gap-3 mb-6 text-left">
            {ROLES.map((r) => {
              const selected = roles.has(r.value)
              return (
                <button
                  key={r.value}
                  onClick={() => toggleRole(r.value)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-[14px] border-[1.5px] transition-all cursor-pointer w-full bg-transparent ${
                    selected ? 'border-teal bg-teal/5' : 'border-g3 hover:border-g2'
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{r.emoji}</span>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-navy">{r.title}</div>
                    <div className="text-[12px] text-g1 mt-0.5">{r.sub}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-[5px] border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    selected ? 'border-teal bg-teal' : 'border-g3'
                  }`}>
                    {selected && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <button
            disabled={roles.size === 0 || loading}
            onClick={finish}
            className="w-full py-3.5 rounded-full bg-teal text-white text-[15px] font-bold border-none shadow-[0_4px_14px_rgba(26,122,110,.3)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal-l hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {loading ? 'Guardando…' : 'Empezar en Pacta →'}
          </button>
        </div>
      )}
    </div>
  )
}
