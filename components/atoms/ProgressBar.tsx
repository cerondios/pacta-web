import { clsx } from 'clsx'

interface Props {
  value: number   // 0-100
  variant?: 'teal' | 'success' | 'warning' | 'danger'
  height?: 'xs' | 'sm' | 'md'
  className?: string
  animated?: boolean
}

const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }

export function ProgressBar({ value, variant = 'teal', height = 'sm', className, animated }: Props) {
  const fills: Record<string, string> = {
    teal:    'linear-gradient(90deg,var(--teal),var(--teal-l))',
    success: 'linear-gradient(90deg,var(--success),#15803D)',
    warning: 'linear-gradient(90deg,var(--warning),#FCD34D)',
    danger:  'linear-gradient(90deg,var(--danger),#F87171)',
  }

  return (
    <div className={clsx('w-full bg-g3 rounded-full overflow-hidden', heights[height], className)}>
      <div
        className={clsx('h-full rounded-full', animated && 'transition-[width] duration-[1.2s] ease-[cubic-bezier(.4,0,.2,1)]')}
        style={{ width: `${value}%`, background: fills[variant] }}
      />
    </div>
  )
}
