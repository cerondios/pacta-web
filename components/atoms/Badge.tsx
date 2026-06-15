import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type Variant = 'teal' | 'navy' | 'warm' | 'success' | 'warning' | 'info' | 'purple' | 'muted'

interface Props {
  variant?: Variant
  children: ReactNode
  className?: string
}

const variants: Record<Variant, string> = {
  teal:    'bg-teal-xl text-teal',
  navy:    'bg-navy text-white',
  warm:    'bg-warm-l text-warm',
  success: 'bg-success-l text-success',
  warning: 'bg-warning-l text-warning',
  info:    'bg-[#E3F2FD] text-[#1565C0]',
  purple:  'bg-[#EDE9FE] text-[#5B21B6]',
  muted:   'bg-g4 text-g1',
}

export function Badge({ variant = 'teal', children, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
