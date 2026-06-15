'use client'
import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/atoms'
import { useAppStore } from '@/store/useAppStore'
import { authApi, apiErrorMessage, ApiError } from '@/lib/api'
import { setTokenCookie } from '@/lib/cookies'
import { useRedirectIfAuth } from '@/lib/hooks/useRedirectIfAuth'

type Step = 'email' | 'otp'

export function LoginForm() {
  useRedirectIfAuth()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? '/home'
  const setUser    = useAppStore((s) => s.setUser)
  const showToast  = useAppStore((s) => s.showToast)

  const [step,       setStep]       = useState<Step>('email')
  const [email,      setEmail]      = useState('')
  const [otp,        setOtp]        = useState(['', '', '', '', '', ''])
  const [emailErr,   setEmailErr]   = useState('')
  const [otpErr,     setOtpErr]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [resendSec,  setResendSec]  = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Step 1: POST /api/auth/login ──────────────────────
  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      setEmailErr('Ingresa un correo válido')
      return
    }
    setEmailErr('')
    setLoading(true)
    try {
      await authApi.sendOtp(email)
      showToast('Código enviado a tu correo ✉️')
      setStep('otp')
      startResendTimer()
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setEmailErr('No encontramos una cuenta con ese correo')
      } else {
        setEmailErr(apiErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: POST /api/auth/verify ────────────────────
  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) {
      setOtpErr('Ingresa los 6 dígitos del código')
      return
    }
    setOtpErr('')
    setLoading(true)
    try {
      const { access_token, expires_in } = await authApi.verifyOtp(email, code)
      setTokenCookie(access_token, expires_in)

      // Fetch profile with the new token
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

      showToast('¡Bienvenido de vuelta! 👋')
      router.push(redirectTo)
    } catch (err: unknown) {
      setOtpErr(apiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  // ── OTP box helpers ───────────────────────────────────
  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[i] = value.slice(-1)
    setOtp(next)
    setOtpErr('')
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

  // ── Resend countdown ──────────────────────────────────
  const startResendTimer = () => {
    setResendSec(60)
    const iv = setInterval(() =>
      setResendSec((s) => { if (s <= 1) { clearInterval(iv); return 0 } return s - 1 }), 1000)
  }

  const handleResend = async () => {
    if (resendSec > 0 || loading) return
    setLoading(true)
    try {
      await authApi.sendOtp(email)
      showToast('Código reenviado ✉️')
    } catch (err) {
      showToast(apiErrorMessage(err, 'No pudimos reenviar el código'))
    } finally {
      setLoading(false)
      setOtp(['', '', '', '', '', ''])
      setOtpErr('')
      startResendTimer()
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    }
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="w-full max-w-[390px]">
      {step === 'email' ? (
        <>
          <h1 className="font-serif text-[26px] text-navy mb-1">Bienvenido de vuelta</h1>
          <p className="text-[13px] text-g1 mb-7">
            Ingresa tu correo y te enviamos un código de acceso de 6 dígitos.
          </p>

          <label className="block text-[10px] font-bold uppercase tracking-[.6px] text-navy mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            autoFocus
            onChange={(e) => { setEmail(e.target.value); setEmailErr('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
            className={`w-full px-3.5 py-3 rounded-[10px] border-[1.5px] text-sm text-navy bg-g4 outline-none transition-all
              focus:border-teal focus:bg-white focus:shadow-[0_0_0_3px_rgba(26,122,110,.1)]
              ${emailErr ? 'border-warm' : 'border-g3'}`}
          />
          {emailErr && <p className="text-[11px] text-warm mt-1.5 mb-0">{emailErr}</p>}

          <Button
            variant="solid" size="lg" fullWidth
            disabled={loading}
            onClick={handleSendOtp}
            className="mt-4 mb-3"
          >
            {loading ? 'Enviando…' : 'Enviar código →'}
          </Button>

          <p className="text-center text-[13px] text-g1">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="text-teal font-semibold no-underline">
              Regístrate gratis
            </Link>
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { setStep('email'); setOtp(['','','','','','']); setOtpErr('') }}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-g1 bg-transparent border-none cursor-pointer mb-6 hover:text-navy transition-colors p-0"
          >
            ← Cambiar correo
          </button>

          <h1 className="font-serif text-[26px] text-navy mb-1">Revisa tu correo</h1>
          <p className="text-[13px] text-g1 mb-0.5">Enviamos un código de 6 dígitos a</p>
          <p className="text-[14px] font-semibold text-navy mb-7">{email}</p>

          {/* OTP boxes */}
          <div className="flex gap-2.5 justify-center mb-2" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={i === 0}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`w-12 h-14 text-center text-[22px] font-bold rounded-[12px] border-[1.5px] outline-none transition-all
                  focus:shadow-[0_0_0_3px_rgba(26,122,110,.12)]
                  ${otpErr
                    ? 'border-warm bg-warm-l text-warm focus:border-warm'
                    : digit
                    ? 'border-teal bg-teal-xl text-teal focus:border-teal'
                    : 'border-g3 bg-g4 text-navy focus:border-teal'}`}
              />
            ))}
          </div>

          {otpErr && (
            <p className="text-[12px] text-warm text-center mb-3 mt-1">{otpErr}</p>
          )}

          <Button
            variant="solid" size="lg" fullWidth
            disabled={loading || otp.join('').length < 6}
            onClick={handleVerify}
            className="mt-4 mb-4"
          >
            {loading ? 'Verificando…' : 'Ingresar →'}
          </Button>

          <p className="text-center text-[13px] text-g1">
            ¿No llegó el código?{' '}
            {resendSec > 0 ? (
              <span className="text-g2">Reenviar en {resendSec}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-teal font-semibold bg-transparent border-none cursor-pointer p-0 disabled:opacity-50"
              >
                Reenviar código
              </button>
            )}
          </p>
          <p className="text-center text-[11px] text-g2 mt-3 leading-[1.5]">
            El código expira en 10 minutos.
          </p>
        </>
      )}
    </div>
  )
}
