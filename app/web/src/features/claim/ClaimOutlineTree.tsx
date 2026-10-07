import { CircleCheckBig } from 'lucide-react'
import { BacklogStatusIcon } from '@/components/BacklogStatusIcon'
import { ProgressStatusIcon } from '@/components/ProgressStatusIcon'
import { Spinner } from '@/components/ui/spinner'
import { useMessages } from '@/hooks/useMessages'

export type OutlineStatus = 'done' | 'active' | 'failed' | 'pending'

export interface OutlineRow {
  id: string
  label: string
  meta?: string
  status: OutlineStatus
}

export interface OutlineModule {
  id: string
  title: string
  status: OutlineStatus
  rows: OutlineRow[]
}

function OutlineIcon({ status }: { status: OutlineStatus }) {
  const m = useMessages()
  if (status === 'done') return <CircleCheckBig className="size-4 text-zinc-950" />
  if (status === 'failed') return <ProgressStatusIcon status="failed" />
  if (status === 'active') return <Spinner aria-label={m.common.inProgress} className="size-[15px] text-zinc-900" />
  return <BacklogStatusIcon />
}

/** 两级树：模块 → 明细行，沿用课程编排卡片「章 → 单元」的版式。 */
export function ClaimOutlineTree({ modules }: { modules: OutlineModule[] }) {
  return (
    <div className="mt-4 flex flex-col gap-1">
      {modules.map((module) => (
        <section
          key={module.id}
          className="animate-in duration-500 fade-in-0 slide-in-from-top-1.5 motion-reduce:animate-none"
        >
          <div className="flex min-h-9 items-start gap-2 py-2 text-[16.5px] font-medium text-zinc-800">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
              <OutlineIcon status={module.status} />
            </span>
            <span className="min-w-0 flex-1 leading-5 break-words whitespace-normal">{module.title}</span>
          </div>

          <div className="relative ml-1 flex flex-col gap-0.5 pl-7">
            <div aria-hidden className="absolute top-1 bottom-1 left-[7px] w-px bg-zinc-200" />
            {module.rows.map((row) => (
              <div key={row.id} className="flex min-h-9 items-start gap-2 py-2 text-[15.5px] text-zinc-600">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  <OutlineIcon status={row.status} />
                </span>
                <span className="min-w-0 flex-1 leading-5 break-words whitespace-normal">{row.label}</span>
                {row.meta ? (
                  <span className="mt-0.5 shrink-0 font-mono text-[13px] leading-5 text-zinc-400">{row.meta}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
