'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/atoms'
import { useAppStore } from '@/store/useAppStore'
import { authApi, ApiError } from '@/lib/api'
import { setTokenCookie } from '@/lib/cookies'
import { useRedirectIfAuth } from '@/lib/hooks/useRedirectIfAuth'

type Step = 'form' | 'otp'

const COUNTRIES: { code: string; label: string }[] = [
  { code: 'CO', label: '🇨🇴 Colombia' },
  { code: 'MX', label: '🇲🇽 México' },
  { code: 'AR', label: '🇦🇷 Argentina' },
  { code: 'CL', label: '🇨🇱 Chile' },
  { code: 'PE', label: '🇵🇪 Perú' },
  { code: 'EC', label: '🇪🇨 Ecuador' },
  { code: 'VE', label: '🇻🇪 Venezuela' },
  { code: 'ES', label: '🇪🇸 España' },
  { code: 'US', label: '🇺🇸 Estados Unidos' },
]

export function RegisterForm() {
  useRedirectIfAuth()

  const router    = useRouter()
  const setUser   = useAppStore((s) => s.setUser)
  const showToast = useAppStore((s) => s.showToast)

  const [step,     setStep]    = useState<Step>('form')
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]   = useState('')
  const [phone,    setPhone]   = useState({ indicative: '+57', number: '' })
  const [country,  setCountry] = useState('')
  const [errors,   setErrors]  = useState<Record<string, string>>({})
  const [loading,  setLoading] = useState(false)

  const [otp,       setOtp]      = useState(['', '', '', '', '', ''])
  const [otpErr,    setOtpErr]   = useState('')
  const [resendSec, setResendSec] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Step 1: POST /api/auth/register ──────────────────
  const handleRegister = async () => {
    const errs: Record<string, string> = {}
    if (!fullName.trim())               errs.fullName = 'Ingresa tu nombre completo'
    if (!email || !email.includes('@')) errs.email    = 'Correo inválido'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await authApi.register({
        email:     email.trim().toLowerCase(),
        full_name: fullName.trim(),
        ...(phone.number.trim()
          ? { phone: { indicative: phone.indicative, number: phone.number.trim() } }
          : {}),
        ...(country ? { country } : {}),
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ email: 'Este correo ya tiene una cuenta. ¿Quieres iniciar sesión?' })
        setLoading(false)
        return
      }
    } finally {
      setLoading(false)
    }

    showToast('Cuenta creada · Revisa tu correo ✉️')
    setStep('otp')
    startResendTimer()
  }

  // ── Step 2: POST /api/auth/verify ────────────────────
  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { setOtpErr('Ingresa los 6 dígitos'); return }
    setOtpErr('')
    setLoading(true)
    try {
      const { access_token, expires_in } = await authApi.verifyOtp(email.trim().toLowerCase(), code)
      setTokenCookie(access_token, expires_in)

      const profile = await authApi.getProfile()
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

      showToast('¡Cuenta verificada! 🎉')
      router.push('/onboarding')
    } catch (err: unknown) {
      setOtpErr(err instanceof ApiError && err.status === 401 ? 'Código incorrecto o expirado.' : 'Algo salió mal.')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]; next[i] = value.slice(-1); setOtp(next); setOtpErr('')
    if (value && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    if (e.key === 'Enter') handleVerify()
  }
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!digits) return
    e.preventDefault()
    setOtp(digits.padEnd(6, '').split('').slice(0, 6))
    otpRefs.current[Math.min(digits.length, 5)]?.focus()
  }

  const startResendTimer = () => {
    setResendSec(60)
    const iv = setInterval(() =>
      setResendSec((s) => { if (s <= 1) { clearInterval(iv); return 0 } return s - 1 }), 1000)
  }

  const handleResend = async () => {
    if (resendSec > 0 || loading) return
    setLoading(true)
    try { await authApi.sendOtp(email.trim().toLowerCase()); showToast('Código reenviado ✉️') }
    catch { showToast('No pudimos reenviar') }
    finally {
      setLoading(false); setOtp(['','','','','','']); setOtpErr('')
      startResendTimer(); setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }

  // ── OTP screen ────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="w-full max-w-[390px]">
        <button type="button" onClick={() => { setStep('form'); setOtp(['','','','','','']); setOtpErr('') }}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-g1 bg-transparent border-none cursor-pointer mb-6 hover:text-navy p-0">
          ← Volver
        </button>

        <h1 className="font-serif text-[26px] text-navy mb-1">Verifica tu correo</h1>
        <p className="text-[13px] text-g1 mb-0.5">Enviamos un código de 6 dígitos a</p>
        <p className="text-[14px] font-semibold text-navy mb-7">{email}</p>

        <div className="flex gap-2.5 justify-center mb-2" onPaste={handleOtpPaste}>
          {otp.map((digit, i) => (
            <input key={i} ref={(el) => { otpRefs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={digit} autoFocus={i === 0}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className={`w-12 h-14 text-center text-[22px] font-bold rounded-[12px] border-[1.5px] outline-none transition-all
                focus:shadow-[0_0_0_3px_rgba(26,122,110,.12)]
                ${otpErr ? 'border-warm bg-warm-l text-warm' : digit ? 'border-teal bg-teal-xl text-teal' : 'border-g3 bg-g4 text-navy focus:border-teal'}`}
            />
          ))}
        </div>
        {otpErr && <p className="text-[12px] text-warm text-center mb-3 mt-1">{otpErr}</p>}

        <Button variant="solid" size="lg" fullWidth disabled={loading || otp.join('').length < 6}
          onClick={handleVerify} className="mt-4 mb-4">
          {loading ? 'Verificando…' : 'Activar mi cuenta →'}
        </Button>

        <p className="text-center text-[13px] text-g1">
          ¿No llegó?{' '}
          {resendSec > 0
            ? <span className="text-g2">Reenviar en {resendSec}s</span>
            : <button type="button" onClick={handleResend} disabled={loading}
                className="text-teal font-semibold bg-transparent border-none cursor-pointer p-0 disabled:opacity-50">
                Reenviar código
              </button>}
        </p>
        <p className="text-center text-[11px] text-g2 mt-3">El código expira en 10 minutos.</p>
      </div>
    )
  }

  // ── Registration form — minimal: name + email + optional phone/country ──
  return (
    <div className="w-full max-w-[390px]">
      <h1 className="font-serif text-[26px] text-navy mb-1">Crea tu cuenta</h1>
      <p className="text-[13px] text-g1 mb-6">Gratis · 2 minutos · Sin tarjeta</p>

      <label className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5">
        Nombre completo
      </label>
      <input type="text" placeholder="Valentina Ruiz Torres" value={fullName}
        onChange={(e) => { setFullName(e.target.value); setErrors({}) }}
        className={`w-full px-3.5 py-3 rounded-[10px] border-[1.5px] text-sm text-navy bg-g4 outline-none transition-all
          focus:border-teal focus:bg-white mb-1 ${errors.fullName ? 'border-warm' : 'border-g3'}`}
      />
      {errors.fullName && <p className="text-[11px] text-warm mb-2">{errors.fullName}</p>}

      <label className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5 mt-3">
        Correo electrónico
      </label>
      <input type="email" placeholder="tu@email.com" value={email}
        onChange={(e) => { setEmail(e.target.value); setErrors({}) }}
        onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
        className={`w-full px-3.5 py-3 rounded-[10px] border-[1.5px] text-sm text-navy bg-g4 outline-none transition-all
          focus:border-teal focus:bg-white mb-1 ${errors.email ? 'border-warm' : 'border-g3'}`}
      />
      {errors.email && <p className="text-[11px] text-warm mb-2">{errors.email}</p>}

      <label className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5 mt-3">
        Celular <span className="text-g2 normal-case font-normal">(opcional)</span>
      </label>
      <div className="flex gap-2">
        <input type="text" value={phone.indicative}
          onChange={(e) => setPhone((p) => ({ ...p, indicative: e.target.value }))}
          className="w-16 px-2 py-3 rounded-[10px] border-[1.5px] border-g3 text-sm text-navy bg-g4 outline-none focus:border-teal focus:bg-white text-center"
        />
        <input type="tel" placeholder="312 909 0045" value={phone.number}
          onChange={(e) => setPhone((p) => ({ ...p, number: e.target.value }))}
          className="flex-1 px-3.5 py-3 rounded-[10px] border-[1.5px] border-g3 text-sm text-navy bg-g4 outline-none focus:border-teal focus:bg-white"
        />
      </div>

      <label className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5 mt-3">
        País <span className="text-g2 normal-case font-normal">(opcional)</span>
      </label>
      <select value={country} onChange={(e) => setCountry(e.target.value)}
        className="w-full px-3.5 py-3 rounded-[10px] border-[1.5px] border-g3 text-sm text-navy bg-g4 outline-none focus:border-teal cursor-pointer">
        <option value="">Selecciona tu país</option>
        {COUNTRIES.map(({ code, label }) => (
          <option key={code} value={code}>{label}</option>
        ))}
      </select>

      <Button variant="solid" size="lg" fullWidth disabled={loading} onClick={handleRegister} className="mt-5 mb-3">
        {loading ? 'Creando cuenta…' : 'Crear cuenta →'}
      </Button>

      <p className="text-center text-[13px] text-g1 mb-2">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-teal font-semibold no-underline">Inicia sesión</Link>
      </p>
      <p className="text-center text-[11px] text-g2 leading-[1.5]">
        Al registrarte aceptas los <span className="text-teal cursor-pointer">Términos</span> y{' '}
        <span className="text-teal cursor-pointer">Privacidad</span>.
      </p>
    </div>
  )
}
