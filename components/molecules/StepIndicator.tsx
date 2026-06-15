const STEP_LABELS = [
  { icon: '👤', name: 'Info',      desc: 'Datos básicos' },
  { icon: '🏦', name: 'Banco',     desc: 'Open Banking' },
  { icon: '🪪', name: 'Biometría', desc: 'Identidad' },
  { icon: '🤖', name: 'Análisis',  desc: 'Score IA' },
  { icon: '🏆', name: 'Score',     desc: 'Resultado' },
]

interface Props { currentStep: number }

export function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center px-4 py-3.5 gap-1.5 bg-white border-b border-g3 sticky top-0 z-10">
      {STEP_LABELS.map((l, i) => (
        <div key={i} className="flex items-center">
          {i > 0 && (
            <div
              className="w-6 h-0.5 rounded-full mx-1 transition-colors duration-300"
              style={{ background: i <= currentStep ? 'var(--success)' : 'var(--g3)' }}
            />
          )}
          <div className="flex flex-col items-center gap-[3px]">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 border-2"
              style={
                i < currentStep
                  ? { background: 'var(--success)', borderColor: 'var(--success)', color: '#fff' }
                  : i === currentStep
                  ? { background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff', boxShadow: '0 0 0 4px rgba(26,122,110,.15)' }
                  : { background: 'white', borderColor: 'var(--g3)', color: 'var(--g2)' }
              }
            >
              {i < currentStep ? '✓' : l.icon}
            </div>
            <span
              className="text-[8px] font-medium whitespace-nowrap"
              style={{
                color: i < currentStep ? 'var(--success)' : i === currentStep ? 'var(--teal)' : 'var(--g2)',
                fontWeight: i === currentStep ? 700 : 500,
              }}
            >
              {l.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
