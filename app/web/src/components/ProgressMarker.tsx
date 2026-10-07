import { CircularProgress } from '@/components/CircularProgress'
import { cn } from '@/lib/utils'

/** 32px 进度环 + 中心标签，竖线时间轴上的节点。 */
export function ProgressMarker({
  label,
  progress,
  progressColor,
  className,
}: {
  label: string
  progress: number
  progressColor?: string
  className?: string
}) {
  return (
    <span className={cn('relative flex size-8 shrink-0 items-center justify-center', className)}>
      <CircularProgress
        value={progress}
        size={32}
        strokeWidth={2.5}
        progressColor={progressColor}
        className="pointer-events-none absolute inset-0 size-8"
      />
      <span className="text-[13px] font-medium text-zinc-700">{label}</span>
    </span>
  )
}
