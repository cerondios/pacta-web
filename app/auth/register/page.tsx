import { ClientOnly } from '@/components/ClientOnly'
import { Logo } from '@/components/atoms/Logo'
import { RegisterForm } from '@/components/organisms/RegisterForm'
import { Toast } from '@/components/atoms/Toast'

export default function RegisterPage() {
  return (
    <ClientOnly>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div
          className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg,var(--navy) 0%,#0a2540 55%,var(--teal-d) 100%)' }}
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle,rgba(26,122,110,.2) 0%,transparent 70%)' }} />

          <Logo variant="light" size="lg" className="relative z-10" />

          <div className="relative z-10">
            <h2 className="font-serif text-[38px] text-white leading-[1.15] mb-3">
              Crea tu perfil<br />
              <em className="text-teal-l not-italic">en 2 minutos.</em>
            </h2>
            <p className="text-sm text-white/55 leading-[1.7] mb-7">
              Gratis, sin tarjeta de crédito. Tu Score Pacta se construye automáticamente.
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                'Sin codeudor — tu score lo reemplaza',
                'Open Banking seguro (solo lectura)',
                'Verificación biométrica en 20 segundos',
                'Score visible al instante',
              ].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-l flex-shrink-0" />
                  <span className="text-[13px] text-white/70">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-white/30 relative z-10">© 2025 Pacta Technologies SAS</span>
        </div>

        <div className="bg-white flex items-center justify-center px-6 py-14 relative">
          <a href="/" className="absolute top-5 left-5 flex items-center gap-1 text-[13px] font-semibold text-g1 no-underline hover:text-navy transition-colors">
            ← Volver
          </a>
          <RegisterForm />
        </div>
      </div>
      <Toast />
    </ClientOnly>
  )
}
