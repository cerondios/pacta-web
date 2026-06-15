import { clsx } from 'clsx'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  initials: string
  gradient?: string
  size?: Size
  className?: string
  ring?: 'success' | 'warning' | 'danger' | 'none'
}

const sizes: Record<Size, string> = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const rings: Record<string, string> = {
  success: 'ring-2 ring-success ring-offset-2',
  warning: 'ring-2 ring-warning ring-offset-2',
  danger:  'ring-2 ring-danger ring-offset-2',
  none:    '',
}

export function Avatar({ initials, gradient, size = 'md', className, ring = 'none' }: Props) {
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0',
        sizes[size],
        rings[ring],
        className,
      )}
      style={{
        background: gradient ?? 'linear-gradient(135deg,var(--teal),var(--teal-d))',
      }}
    >
      {initials}
    </div>
  )
}
