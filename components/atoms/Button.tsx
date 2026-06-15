import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'solid' | 'ghost' | 'outline' | 'hero' | 'danger' | 'success'
type Size    = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const base = 'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none'

const variants: Record<Variant, string> = {
  solid:   'bg-teal text-white rounded-full shadow-[0_4px_14px_rgba(26,122,110,.3)] hover:bg-teal-l hover:-translate-y-0.5',
  ghost:   'border-[1.5px] border-teal text-teal rounded-full bg-transparent hover:bg-teal hover:text-white',
  outline: 'border-[1.5px] border-g3 text-navy rounded-full bg-transparent hover:border-navy',
  hero:    'bg-teal text-white rounded-full shadow-[0_4px_20px_rgba(26,122,110,.3)] hover:bg-teal-l hover:-translate-y-0.5',
  danger:  'border-[1.5px] border-danger text-danger rounded-full bg-transparent hover:bg-danger hover:text-white',
  success: 'rounded-full text-white shadow-[0_4px_18px_rgba(22,163,74,.32)] hover:-translate-y-0.5',
}

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-base px-7 py-3',
}

export function Button({ variant = 'solid', size = 'md', fullWidth, className, children, style, ...props }: Props) {
  return (
    <button
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      style={variant === 'success' ? { background: 'linear-gradient(135deg,var(--success),#15803D)', ...style } : style}
      {...props}
    >
      {children}
    </button>
  )
}
