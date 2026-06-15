import { ProgressBar } from '@/components/atoms'

interface Props {
  icon: string
  label: string
  value: number
  max?: number
}

export function ScoreBar({ icon, label, value, max = 100 }: Props) {
  const pct = Math.round((value / max) * 100)
  const variant = pct >= 80 ? 'teal' : pct >= 60 ? 'warning' : 'danger'

  return (
    <div className="flex items-center gap-2.5 mb-2">
      <span className="text-sm w-[22px] text-center flex-shrink-0">{icon}</span>
      <span className="text-xs text-g1 w-28 flex-shrink-0">{label}</span>
      <ProgressBar value={pct} variant={variant} height="xs" className="flex-1" animated />
      <span className="text-xs font-bold text-teal w-6 text-right flex-shrink-0">{value}</span>
    </div>
  )
}
