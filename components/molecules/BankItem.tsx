'use client'

interface Bank {
  id: string
  name: string
  desc: string
  icon: string
  bg: string
}

interface Props {
  bank: Bank
  selected: boolean
  onSelect: (id: string) => void
}

export function BankItem({ bank, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bank.id)}
      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[13px] border-2 transition-all duration-200 text-left
        ${selected ? 'border-teal bg-teal-xl' : 'border-g3 bg-white hover:border-teal'}`}
    >
      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: bank.bg }}
      >
        {bank.icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-navy">{bank.name}</div>
        <div className="text-[11px] text-g1">{bank.desc}</div>
      </div>
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] transition-all duration-200 flex-shrink-0"
        style={
          selected
            ? { background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff' }
            : { background: 'transparent', borderColor: 'var(--g3)' }
        }
      >
        {selected && '✓'}
      </div>
    </button>
  )
}

export const BANKS: Bank[] = [
  { id: 'bancolombia', name: 'Bancolombia', desc: 'Cuenta ahorros · •••• 4821', icon: '🔴', bg: '#FFE5E5' },
  { id: 'davivienda',  name: 'Davivienda',  desc: 'Cuenta corriente · •••• 2934', icon: '🔵', bg: '#E8F4FF' },
  { id: 'nequi',       name: 'Nequi',        desc: 'Billetera digital · •••• 7701', icon: '🟢', bg: '#E8FFE8' },
  { id: 'nu',          name: 'Nu Colombia',  desc: 'Cuenta Nu · •••• 3312', icon: '🟠', bg: '#FFF5E8' },
]
