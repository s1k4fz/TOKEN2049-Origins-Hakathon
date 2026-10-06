import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 项目封面占位：后端不下发封面图，统一用盾牌图标。 */
export function BountyCover({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div className={cn('flex shrink-0 items-center justify-center bg-zinc-200', className)}>
      <Shield className={cn('size-16 text-zinc-400', iconClassName)} strokeWidth={1.25} />
    </div>
  )
}
