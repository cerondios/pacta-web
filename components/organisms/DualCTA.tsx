import Link from 'next/link'

export function DualCTA() {
  return (
    <section id="dual" className="py-0 px-[5%] bg-navy grid grid-cols-1 md:grid-cols-2 gap-6 py-16">
      {/* Landlord */}
      <div className="rounded-[22px] p-9 bg-teal relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,255,255,.1) 0%,transparent 70%)' }} />
        <div className="text-[11px] font-bold uppercase tracking-[1px] text-white/60 mb-2.5 relative z-10">Para arrendadores</div>
        <h3 className="font-serif text-[28px] text-white leading-[1.2] mb-2.5 relative z-10">Tu pago llega el día 5. Siempre.</h3>
        <p className="text-sm text-white/70 leading-[1.6] mb-6 relative z-10">
          Selecciona inquilinos por score y recibe el pago garantizado cada mes.
        </p>
        <Link href="/auth/register">
          <button className="px-6 py-3 rounded-full bg-white text-teal text-sm font-bold border-none cursor-pointer hover:-translate-y-0.5 transition-all">
            Publicar mi propiedad →
          </button>
        </Link>
      </div>

      {/* Tenant */}
      <div className="rounded-[22px] p-9 relative overflow-hidden" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full" style={{ background: 'radial-gradient(circle,rgba(255,255,255,.1) 0%,transparent 70%)' }} />
        <div className="text-[11px] font-bold uppercase tracking-[1px] text-white/60 mb-2.5 relative z-10">Para arrendatarios</div>
        <h3 className="font-serif text-[28px] text-white leading-[1.2] mb-2.5 relative z-10">Arrienda sin codeudor ni papeleos.</h3>
        <p className="text-sm text-white/70 leading-[1.6] mb-6 relative z-10">
          Tu Score Pacta te abre puertas. Un solo pago mensual para todo.
        </p>
        <Link href="/auth/register">
          <button className="px-6 py-3 rounded-full bg-transparent text-white text-sm font-bold border-2 border-white/30 cursor-pointer hover:border-white/80 transition-all">
            Buscar mi próximo hogar →
          </button>
        </Link>
      </div>
    </section>
  )
}
