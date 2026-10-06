import type { ReactNode } from 'react'
import { CircleCheckBig } from 'lucide-react'
import { ProgressStatusIcon } from '@/components/ProgressStatusIcon'
import { SmoothHeight } from '@/components/SmoothHeight'
import { Spinner } from '@/components/ui/spinner'
import type { ClaimStageStatus } from './claimProgress'

function StageIcon({ status }: { status: ClaimStageStatus }) {
  if (status === 'done') return <CircleCheckBig className="size-4 text-zinc-950" />
  if (status === 'failed') return <ProgressStatusIcon status="failed" />
  return <Spinner aria-label="In progress" className="size-[15px] text-zinc-900" />
}

/** 一个验证阶段：状态图标 + 标题，下方细竖线串起该阶段的产出。 */
export function ClaimStageBlock({
  status,
  title,
  children,
  contentClassName = 'flex min-h-7 flex-row flex-wrap content-center items-center gap-x-1.5 gap-y-2 pt-1 pb-2.5',
}: {
  status: ClaimStageStatus
  title: string
  children?: ReactNode
  contentClassName?: string
}) {
  return (
    <section className="animate-in duration-500 fade-in-0 slide-in-from-top-1.5 motion-reduce:animate-none">
      <div className="flex min-h-8 items-start gap-2 pt-2 pb-0.5 text-[16.5px] font-medium text-zinc-800">
        <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
          <StageIcon status={status} />
        </span>
        <span className="min-w-0 flex-1 leading-5 break-words whitespace-normal">{title}</span>
      </div>
      <div className="relative ml-1 flex flex-col gap-0.5 pl-7">
        <div aria-hidden className="absolute top-1 bottom-1 left-[7px] w-px bg-zinc-200" />
        <SmoothHeight contentClassName={contentClassName}>{children}</SmoothHeight>
      </div>
    </section>
  )
}
