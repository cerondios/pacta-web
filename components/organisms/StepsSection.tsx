const STEPS = [
  { n: 1, icon: '🔍', title: 'Busca o publica', desc: 'Explora propiedades sin registro. Solo crea cuenta cuando quieras aplicar.' },
  { n: 2, icon: '⚡', title: 'Score en 4 minutos', desc: 'Conecta tu banco y verifica tu identidad. Tu Score Pacta reemplaza al codeudor.' },
  { n: 3, icon: '💳', title: 'Firma y paga en un botón', desc: 'Contrato legal con firma electrónica. Pago unificado el día 5.' },
]

export function StepsSection() {
  return (
    <section id="steps" className="py-20 px-[5%] bg-sand">
      <div className="text-[11px] font-bold uppercase tracking-[1px] text-teal mb-2.5">Cómo funciona</div>
      <h2 className="font-serif text-[clamp(28px,4vw,40px)] text-navy mb-3">Simple para todos</h2>
      <p className="text-[15px] text-g1 leading-[1.7] max-w-[500px] mb-11">
        Tres pasos para arrendar o publicar. Sin filas, sin papeles, sin codeudor.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="bg-white rounded-[18px] p-6 border border-g3 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(13,27,42,.1)]"
          >
            <div className="w-[34px] h-[34px] rounded-full bg-teal-xl text-teal text-sm font-bold flex items-center justify-center mb-3">
              {s.n}
            </div>
            <div className="text-[26px] mb-2.5">{s.icon}</div>
            <h3 className="text-[15px] font-bold text-navy mb-1.5">{s.title}</h3>
            <p className="text-[13px] text-g1 leading-[1.6]">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
