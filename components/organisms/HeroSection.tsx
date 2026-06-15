import Link from 'next/link'

export function HeroSection() {
  return (
    <section
      className="min-h-screen pt-[110px] pb-20 px-[5%] grid grid-cols-1 md:grid-cols-2 gap-20 items-center"
      style={{ background: 'linear-gradient(160deg,var(--sand) 0%,white 60%)' }}
    >
      {/* Left */}
      <div>
        <div className="inline-flex items-center gap-1.5 bg-[rgba(26,122,110,.1)] border border-[rgba(26,122,110,.2)] rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-teal mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal" />
          Arriendos sin burocracia · Colombia
        </div>

        <h1 className="font-serif text-[clamp(38px,5vw,58px)] leading-[1.1] mb-4 text-navy">
          Arrienda con<br />
          <em className="text-teal not-italic">confianza total.</em><br />
          Sin codeudor.
        </h1>

        <p className="text-[17px] text-g1 leading-[1.7] max-w-[480px] mb-8">
          Pacta conecta arrendadores y arrendatarios directamente. Scoring inteligente, contrato
          digital y pago unificado — el día 5, garantizado.
        </p>

        <div className="flex gap-3 flex-wrap mb-11">
          <Link href="/auth/register">
            <button className="px-7 py-3 rounded-full bg-teal text-white text-base font-bold border-none shadow-[0_4px_20px_rgba(26,122,110,.3)] hover:bg-teal-l hover:-translate-y-0.5 transition-all cursor-pointer">
              Buscar propiedades
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="px-6 py-3 rounded-full bg-transparent text-navy text-base font-semibold border-[1.5px] border-g3 hover:border-navy transition-all cursor-pointer">
              Publicar mi inmueble
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-8">
          {[
            { n: '2.400+', l: 'Propiedades activas' },
            { n: '98%',    l: 'Pagos a tiempo' },
            { n: '4 min',  l: 'Tiempo de scoring' },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-serif text-[26px] text-navy">{s.n}</div>
              <div className="text-xs text-g2">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — phone mockup */}
      <div className="hidden md:flex justify-center relative">
        <div className="w-[290px] bg-navy rounded-[38px] p-[44px_18px_24px] relative shadow-[0_40px_80px_rgba(13,27,42,.3)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[26px] bg-navy rounded-b-xl" />
          <div className="bg-white rounded-[22px] overflow-hidden">
            <div
              className="p-4 text-center"
              style={{ background: 'linear-gradient(135deg,var(--navy),var(--teal-d))' }}
            >
              <div className="font-serif text-base text-white mb-0.5">Score Pacta</div>
              <div className="text-[10px] text-white/50">Valentina Ruiz · Verificado ✓</div>
            </div>
            <div className="font-serif text-[44px] text-teal-l text-center py-3 border-b border-g3">94</div>
            <div className="p-3">
              {[['Ingresos','97%'],['Historial','92%'],['Crédito','88%'],['Estabilidad','94%']].map(([l,v]) => (
                <div key={l} className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] text-g1 w-16 flex-shrink-0">{l}</span>
                  <div className="flex-1 h-1 bg-g3 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: v, background: 'linear-gradient(90deg,var(--teal),var(--teal-l))' }} />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/auth/register">
              <button className="w-[calc(100%-22px)] mx-[11px] mb-3 bg-teal text-white border-none rounded-full py-2.5 text-xs font-bold cursor-pointer">
                Aplicar ahora →
              </button>
            </Link>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-[20%] -right-8 bg-white rounded-[13px] px-3 py-2 shadow-[0_8px_32px_rgba(13,27,42,.15)] flex items-center gap-2 whitespace-nowrap">
          <span className="text-[18px]">🏡</span>
          <div>
            <div className="text-[11px] font-bold text-navy">Pago garantizado</div>
            <div className="text-[10px] text-g2">Día 5 · Sin excepciones</div>
          </div>
        </div>
        <div className="absolute bottom-[22%] -left-11 bg-white rounded-[13px] px-3 py-2 shadow-[0_8px_32px_rgba(13,27,42,.15)] flex items-center gap-2 whitespace-nowrap">
          <span className="text-[18px]">⚡</span>
          <div>
            <div className="text-[11px] font-bold text-navy">Sin codeudor</div>
            <div className="text-[10px] text-g2">Open Banking + Biometría</div>
          </div>
        </div>
      </div>
    </section>
  )
}
