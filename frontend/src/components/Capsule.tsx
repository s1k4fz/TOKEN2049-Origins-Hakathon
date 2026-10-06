import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CapsuleTone = 'neutral' | 'success' | 'danger'

const toneClassNames: Record<CapsuleTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700',
  success: 'bg-emerald-50 text-emerald-700',
  danger: 'bg-red-50 text-red-600',
}

/** 22px 高的小胶囊，用于结果项、字段值。 */
export function Capsule({
  children,
  tone = 'neutral',
  mono = false,
  href,
  className,
}: {
  children: ReactNode
  tone?: CapsuleTone
  mono?: boolean
  href?: string
  className?: string
}) {
  const classes = cn(
    'flex h-[22px] w-fit max-w-full items-center gap-1 rounded-full px-2 text-[12px] font-medium whitespace-nowrap',
    mono && 'font-mono text-[11.5px]',
    toneClassNames[tone],
    href && 'transition-colors hover:bg-zinc-200/80',
    className
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
      </a>
    )
  }

  return <span className={classes}>{children}</span>
}
