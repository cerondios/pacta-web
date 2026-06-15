'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { CandidateRow } from '@/components/molecules'
import { Avatar, Badge } from '@/components/atoms'
import { CANDIDATES } from '@/lib/data/candidates'
import type { Candidate } from '@/lib/types'

type ViewTab = 'prop' | 'cand'

const scoreColor: Record<string, string> = { high: 'var(--success)', mid: 'var(--warning)', low: 'var(--danger)' }
const scoreBg:    Record<string, string> = { high: 'var(--success-l)', mid: 'var(--warning-l)', low: 'var(--danger-l)' }

export function DashboardView() {
  const router    = useRouter()
  const { user, showToast } = useAppStore()
  const initials  = (user?.fullName?.slice(0, 2) ?? 'CR').toUpperCase()

  const [view,        setView]        = useState<ViewTab>('cand')
  const [selected,    setSelected]    = useState<Candidate | null>(null)
  const [candidates,  setCandidates]  = useState<Candidate[]>(CANDIDATES)
  const [modal,       setModal]       = useState<'accept'|'reject'|null>(null)
  const [filterChip,  setFilterChip]  = useState('Todos')

  const reject = () => {
    if (!selected) return
    showToast(`Rechazo notificado a ${selected.name}`)
    setCandidates((prev) => prev.filter((c) => c.id !== selected.id))
    setSelected(null)
    setModal(null)
  }

  const accept = () => {
    if (!selected) return
    showToast(`🎉 Contrato generado para ${selected.name} · Pendiente de firma`)
    setModal(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-sand">
      {/* Sidebar */}
      <div className="w-[60px] flex-shrink-0 bg-navy flex flex-col items-center py-4 gap-1.5 z-50">
        <span className="font-serif text-[16px] text-teal-l mb-4">P<span className="text-white">.</span></span>
        {([['🏠','Inicio',()=>router.push('/home')],['📊','Dashboard',undefined],['💬','Mensajes',()=>router.push('/notifications')],['📄','Contratos',undefined],['💳','Pagos',undefined]] as [string,string,(()=>void)|undefined][]).map(([icon,label,fn],i) => (
          <button
            key={i}
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] border-none cursor-pointer transition-colors
              ${i===1 ? 'bg-[rgba(26,166,150,.2)] text-teal-l' : 'bg-transparent text-white/40 hover:bg-white/8 hover:text-white/80'}`}
            onClick={() => fn ? fn() : showToast(label)}
          >
            {icon}
          </button>
        ))}
        <div className="flex-1" />
        <button className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[18px] border-none cursor-pointer text-white/40 hover:text-white/80 bg-transparent" onClick={() => showToast('Configuración')}>⚙️</button>
        <Avatar initials={initials} size="sm" className="mt-1.5" />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex-shrink-0 h-[60px] bg-white border-b border-g3 flex items-center px-6 gap-3.5">
          <span className="font-serif text-[18px] text-navy">Mis Propiedades</span>
          <button className="flex items-center gap-2 bg-sand rounded-[9px] px-3 py-1.5 border border-g3 cursor-pointer hover:border-teal transition-colors" onClick={() => showToast('Cambiar propiedad')}>
            <span className="w-6 h-6 rounded-[5px] bg-[#4A90D9] flex items-center justify-center text-xs">🏢</span>
            <div><div className="text-xs font-semibold text-navy">Apto 501 – Rosales</div><div className="text-[10px] text-g1">Bogotá · $2.800.000/mes</div></div>
            <span className="text-[11px] text-g2 ml-1">⌄</span>
          </button>
          <div className="flex-1" />
          <button className="px-3.5 py-1.5 rounded-full border-[1.5px] border-g3 text-xs font-semibold text-navy bg-transparent cursor-pointer hover:border-navy" onClick={() => router.push('/home')}>← Inicio</button>
          <button className="px-4 py-1.5 rounded-full bg-teal text-white text-xs font-semibold border-none cursor-pointer" onClick={() => showToast('Publicado ✓')}>✓ Publicado</button>
        </div>

        {/* View tabs */}
        <div className="flex border-b border-g3 bg-g4 flex-shrink-0 px-6">
          {[['prop','📋 Resumen'],['cand','👥 Candidatos']].map(([v,l]) => (
            <button
              key={v}
              onClick={() => setView(v as ViewTab)}
              className={`px-4 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-all border-none bg-transparent cursor-pointer flex items-center gap-1.5
                ${view===v ? 'text-teal border-teal' : 'text-g1 border-transparent hover:text-navy'}`}
            >
              {l}
              {v === 'cand' && (
                <span className="bg-teal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{candidates.length}</span>
              )}
            </button>
          ))}
          <button className="px-4 py-3 text-[13px] font-semibold text-g1 bg-transparent border-none cursor-pointer hover:text-navy" onClick={() => showToast('Contrato')}>📄 Contrato</button>
          <button className="px-4 py-3 text-[13px] font-semibold text-g1 bg-transparent border-none cursor-pointer hover:text-navy" onClick={() => showToast('Pagos')}>💳 Pagos</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {view === 'prop' && <PropView candidates={candidates} onViewCandidates={() => setView('cand')} />}
          {view === 'cand' && (
            <div className="flex flex-1 overflow-hidden">
              {/* List panel */}
              <div className="w-[360px] flex-shrink-0 border-r border-g3 flex flex-col overflow-hidden bg-white">
                <div className="px-4 pt-4">
                  <div className="text-sm font-bold text-navy">{candidates.length} candidatos postulados</div>
                  <div className="text-[11px] text-g1 mb-2">Ordenados por Score · mayor a menor</div>
                </div>
                {/* Chip filters */}
                <div className="flex gap-1.5 px-4 py-2.5 border-b border-g3 overflow-x-auto scrollbar-none flex-shrink-0">
                  {['Todos','⚡ Alto score','✓ Verificados','🔔 Nuevos'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilterChip(c)}
                      className={`px-2.5 py-1 rounded-full border-[1.5px] text-[11px] font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 transition-all
                        ${filterChip===c ? 'bg-navy text-white border-navy' : 'border-g3 text-g1 bg-transparent hover:border-navy hover:text-navy'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto flex-1 scrollbar-thin">
                  {candidates.map((c, i) => (
                    <CandidateRow
                      key={c.id}
                      candidate={c}
                      rank={i}
                      isActive={selected?.id === c.id}
                      onClick={() => setSelected(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Detail */}
              <div className="flex-1 flex flex-col overflow-hidden bg-sand">
                {!selected ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-g2">
                    <span className="text-[42px] opacity-35">👥</span>
                    <span className="text-sm font-semibold text-g1">Selecciona un candidato</span>
                    <span className="text-xs">Haz clic en cualquier postulante</span>
                  </div>
                ) : (
                  <CandidateDetail c={selected} onAccept={() => setModal('accept')} onReject={() => setModal('reject')} onMsg={() => showToast('Chat con candidato')} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accept modal */}
      {modal === 'accept' && selected && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="text-[40px] text-center mb-3">🤝</div>
          <h2 className="font-serif text-[22px] text-center text-navy mb-1.5">Confirmar selección</h2>
          <p className="text-[13px] text-g1 text-center mb-5">Vas a aceptar a <strong>{selected.name}</strong>. Se generará automáticamente el contrato para firma.</p>
          <div className="bg-teal-xl rounded-[10px] px-4 py-3 mb-4">
            {[['Propiedad','Apto 501, El Rosales'],['Canon','$2.800.000/mes'],['Seguro colectivo','✓ Incluido']].map(([l,v]) => (
              <div key={l} className="flex justify-between py-0.5"><span className="text-xs text-teal-d">{l}</span><span className="text-xs font-bold text-teal-d">{v}</span></div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-full border-[1.5px] border-g3 text-[13px] font-semibold text-navy bg-transparent cursor-pointer hover:border-navy" onClick={() => setModal(null)}>Cancelar</button>
            <button className="flex-[2] py-2.5 rounded-full bg-teal text-white text-[13px] font-bold border-none cursor-pointer hover:bg-teal-l" onClick={accept}>Generar contrato →</button>
          </div>
        </ModalOverlay>
      )}

      {/* Reject modal */}
      {modal === 'reject' && selected && (
        <ModalOverlay onClose={() => setModal(null)}>
          <div className="text-[40px] text-center mb-3">✖</div>
          <h2 className="font-serif text-[22px] text-center text-danger mb-1.5">Rechazar candidato</h2>
          <p className="text-[13px] text-g1 text-center mb-5">El candidato recibirá una notificación de que no fue seleccionado.</p>
          <div className="bg-warm-l rounded-[10px] px-4 py-3 mb-4">
            {[['Candidato',selected.name],['Score',`${selected.score} / 100`]].map(([l,v]) => (
              <div key={l} className="flex justify-between py-0.5"><span className="text-xs text-warm">{l}</span><span className="text-xs font-bold text-warm">{v}</span></div>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-full border-[1.5px] border-g3 text-[13px] font-semibold text-navy bg-transparent cursor-pointer" onClick={() => setModal(null)}>Cancelar</button>
            <button className="flex-[2] py-2.5 rounded-full bg-danger text-white text-[13px] font-bold border-none cursor-pointer hover:bg-[#b91c1c]" onClick={reject}>Confirmar rechazo</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────
function PropView({ candidates, onViewCandidates }: { candidates: Candidate[]; onViewCandidates: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3.5">
      {/* Hero */}
      <div className="bg-white rounded-2xl overflow-hidden flex">
        <div className="w-[220px] bg-[linear-gradient(135deg,#4A90D9,#2E6DAD)] flex items-center justify-center text-5xl flex-shrink-0">🏢</div>
        <div className="p-5 flex-1">
          <div className="inline-flex items-center gap-1.5 bg-success-l text-success text-[10px] font-bold px-2.5 py-1 rounded-full mb-2.5">
            <span className="w-1 h-1 rounded-full bg-success" /> Activo · Recibiendo postulantes
          </div>
          <h2 className="font-serif text-xl text-navy mb-1">Apartamento 501, El Rosales</h2>
          <p className="text-xs text-g1 mb-3.5">📍 Cl. 72 #5-83, Chapinero, Bogotá</p>
          <div className="flex gap-4">
            {[['5','Candidatos'],[String(candidates.length>0?'94':'—'),'Visitas'],['4','Días activo']].map(([n,l]) => (
              <div key={l}><div className="font-serif text-xl text-navy">{n}</div><div className="text-[10px] text-g1">{l}</div></div>
            ))}
          </div>
        </div>
      </div>
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[['📊','94','Visitas','↑ +23 hoy','up'],['👥','5','Postulantes','↑ 2 nuevos','up'],['⭐','83','Score prom.','↑ Sobre media','up'],['📅','5','Días activo','Decidir: 7','down']].map(([i,v,l,t,dir]) => (
          <div key={l} className="bg-white rounded-[13px] p-3.5">
            <div className="text-[18px] mb-0.5">{i}</div>
            <div className="font-serif text-[22px] text-navy">{v}</div>
            <div className="text-[10px] text-g1">{l}</div>
            <div className={`text-[10px] font-semibold ${dir==='up'?'text-success':'text-danger'}`}>{t}</div>
          </div>
        ))}
      </div>
      {/* Activity */}
      <div className="bg-white rounded-[13px] overflow-hidden">
        <div className="px-4 py-3.5 border-b border-g4 flex items-center justify-between">
          <span className="text-[13px] font-bold text-navy">Actividad reciente</span>
          <button className="text-[11px] font-semibold text-teal bg-transparent border-none cursor-pointer" onClick={onViewCandidates}>Ver candidatos →</button>
        </div>
        {[['s','Valentina Ruiz completó verificación · Score: 94','Hace 20 min'],['i','Sebastián Gómez envió postulación · Score: 91','Hace 1h'],['w','Diego Martínez tiene ingresos en revisión','Hace 3h'],['s','Laura Pérez verificó historial – Sin incidentes','Hace 5h']].map(([dot,text,time],i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-g4 last:border-none">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot==='s'?'var(--success)':dot==='w'?'var(--warning)':'var(--teal)' }} />
            <span className="text-xs text-navy flex-1">{text}</span>
            <span className="text-[10px] text-g2">{time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CandidateDetail({ c, onAccept, onReject, onMsg }: { c: Candidate; onAccept: () => void; onReject: () => void; onMsg: () => void }) {
  const months = ['Nov','Dic','Ene','Feb','Mar','Abr','May']
  const maxOb  = Math.max(...c.obData)
  const sbColor = (cls: string) => cls==='high'?'linear-gradient(90deg,var(--teal),var(--teal-l))':cls==='mid'?'linear-gradient(90deg,var(--warning),#FCD34D)':'linear-gradient(90deg,var(--danger),#F87171)'

  return (
    <div className="flex flex-col h-full">
      {/* Hero header */}
      <div className="bg-white border-b border-g3 px-6 py-5 flex items-start gap-4 sticky top-0 z-10">
        <div className="relative">
          <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0" style={{ background: c.color }}>
            {c.initials}
            <div className="absolute inset-[-4px] rounded-full border-[3px]" style={{ borderColor: scoreColor[c.scoreClass] }} />
            <div className="absolute bottom-[-2px] right-[-2px] w-[18px] h-[18px] rounded-full bg-success border-2 border-white flex items-center justify-center text-[9px] text-white">✓</div>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-serif text-xl text-navy mb-0.5">{c.name}</h2>
          <div className="flex gap-1.5 flex-wrap mb-1.5">
            {c.badges.includes('verified') && <Badge variant="success">✓ Identidad</Badge>}
            {c.badges.includes('ob') && <Badge variant="teal">🏦 Open Banking</Badge>}
            {c.badges.includes('bio') && <Badge variant="purple">🔬 Biometría</Badge>}
            {c.isNew && <Badge variant="warm">NUEVO</Badge>}
          </div>
          <p className="text-[11px] text-g1">{c.meta}</p>
        </div>
        <div className="rounded-[13px] px-4 py-3 text-center flex-shrink-0" style={{ background: scoreBg[c.scoreClass] }}>
          <div className="font-serif text-[36px] leading-none" style={{ color: scoreColor[c.scoreClass] }}>{c.score}</div>
          <div className="text-[9px] font-bold uppercase tracking-[.5px] mt-0.5" style={{ color: scoreColor[c.scoreClass] }}>Score Pacta</div>
          <div className="text-[10px] text-g1 mt-1">{c.rankLabel}</div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {/* Score breakdown */}
        <Section title="Desglose del Score" icon="🏆" sub="Actualizado hoy">
          {c.scoreBreakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xs text-navy w-[120px] flex-shrink-0">{b.label}</span>
              <div className="flex-1 h-1.5 bg-g4 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.val}%`, background: sbColor(b.cls) }} />
              </div>
              <span className="text-[11px] font-bold text-navy w-[22px] text-right">{b.val}</span>
            </div>
          ))}
        </Section>

        {/* Financial info */}
        <Section title="Información Financiera · Open Banking" icon="🏦" sub="Verificado">
          <div className="grid grid-cols-2 gap-px bg-g3">
            {Object.entries({
              'Ingreso mensual': [c.fin.ingreso, c.fin.ingresoSub, parseFloat(c.fin.ingreso.replace(/\D/g,''))>3e6?'pos':''],
              'Relación ingreso/canon': [c.fin.relacion, c.fin.relacionSub, parseFloat(c.fin.relacion)<2?'warn':'pos'],
              'Cuentas conectadas': [c.fin.cuentas, c.fin.cuentasSub, ''],
              'Deudas activas': [c.fin.deudas, c.fin.deudasSub, c.fin.deudas==='$0'?'pos':''],
              'Ahorros promedio': [c.fin.ahorros, c.fin.ahorrosSub, ''],
              'Antigüedad laboral': [c.fin.antiguedad, c.fin.antiguedadSub, ''],
            }).map(([label, [val, sub, cls]]) => (
              <div key={label} className="bg-white p-3">
                <div className="text-[9px] font-semibold uppercase tracking-[.5px] text-g2 mb-0.5">{label}</div>
                <div className={`text-[13px] font-semibold ${cls==='pos'?'text-success':cls==='warn'?'text-warning':'text-navy'}`}>{val}</div>
                <div className="text-[9px] text-g1 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
          {/* OB chart */}
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[.5px] text-g1 mb-2">Ingresos mensuales · Open Banking</div>
            <div className="flex items-end gap-1 h-16 mb-1">
              {c.obData.map((v, i) => (
                <div key={i} className="flex-1 rounded-t-[3px] min-h-[3px]" style={{ height: `${Math.round((v/maxOb)*100)}%`, background: i===6?'var(--teal)':'var(--teal-xl)' }} />
              ))}
            </div>
            <div className="flex gap-1">{months.map((m) => <div key={m} className="flex-1 text-center text-[8px] text-g2">{m}</div>)}</div>
          </div>
        </Section>

        {/* Rent history */}
        <Section title="Historial de Arriendo" icon="🏠" sub={c.histSub}>
          {c.rentHist.length ? c.rentHist.map((r, i) => (
            <div key={i} className="flex items-center gap-2.5 mb-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.ok?'var(--success)':'var(--warning)' }} />
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-navy">{r.addr}</div>
                <div className="text-[10px] text-g1">{r.period}</div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.ok?'bg-success-l text-success':'bg-warning-l text-warning'}`}>{r.label}</span>
            </div>
          )) : <p className="text-xs text-g1 py-1">Sin arriendos previos registrados.</p>}
        </Section>

        {/* Verify steps */}
        <Section title="Proceso de Verificación" icon="🔍" sub="Completado">
          <div className="flex flex-col gap-0 pb-1">
            {c.verifySteps.map((s, i) => (
              <div key={i} className="flex gap-2.5 relative">
                {i < c.verifySteps.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-g3" />}
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] border-2 border-success bg-success-l text-success z-10 flex-shrink-0 mt-0.5">{s.icon}</div>
                <div className="pb-3">
                  <div className="text-[11px] font-semibold text-navy">{s.title}</div>
                  <div className="text-[9px] text-g1">{s.time}</div>
                  <div className="text-[10px] text-g1 mt-0.5 leading-[1.5]">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 bg-white border-t border-g3 px-4 py-3 flex items-center gap-2">
        <button className="px-4 py-2 rounded-full border-[1.5px] border-danger text-danger text-xs font-semibold bg-transparent cursor-pointer hover:bg-danger hover:text-white transition-all" onClick={onReject}>✕ Rechazar</button>
        <button className="px-4 py-2 rounded-full border-[1.5px] border-g3 text-navy text-xs font-semibold bg-transparent cursor-pointer hover:border-navy transition-all" onClick={onMsg}>💬 Mensaje</button>
        <button className="flex-1 py-2.5 rounded-full bg-teal text-white text-[13px] font-bold border-none cursor-pointer shadow-[0_4px_14px_rgba(26,122,110,.3)] hover:bg-teal-l hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5" onClick={onAccept}>✓ Aceptar candidato →</button>
      </div>
    </div>
  )
}

function Section({ title, icon, sub, children }: { title: string; icon: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[13px] mb-3 overflow-hidden">
      <div className="px-4 py-3 border-b border-g4 flex items-center gap-1.5">
        <span className="text-[15px]">{icon}</span>
        <span className="text-xs font-bold text-navy flex-1">{title}</span>
        <span className="text-[10px] text-g1">{sub}</span>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-[rgba(13,27,42,.5)] z-[600] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-[20px] p-8 max-w-[420px] w-[90%] animate-db-modal-in" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
