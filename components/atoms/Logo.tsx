import { clsx } from 'clsx'

interface Props {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'text-[18px]', md: 'text-[22px]', lg: 'text-[26px]' }

export function Logo({ variant = 'dark', size = 'md', className }: Props) {
  const tealColor = variant === 'light' ? 'text-teal-l' : 'text-teal'
  const dotColor  = variant === 'light' ? 'text-white'  : 'text-navy'

  return (
    <span className={clsx('font-serif font-normal', sizes[size], tealColor, className)}>
      Pacta<span className={dotColor}>.</span>
    </span>
  )
}
