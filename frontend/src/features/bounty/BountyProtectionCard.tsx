import { CircleCheckBig, ExternalLink } from 'lucide-react'
import { BacklogStatusIcon } from '@/components/BacklogStatusIcon'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { explorerAddressUrl } from '@/lib/explorer'
import type { ProtectionCondition, ProtectionRow } from './bountyStatus'

function ProtectionRowItem({ row }: { row: ProtectionRow }) {
  const m = useMessages()

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-4 shrink-0 items-center justify-center">
          {row.verified ? <CircleCheckBig className="size-4 text-zinc-950" /> : <BacklogStatusIcon />}
        </span>
        <p className="min-w-0 text-[16px] leading-6 font-normal text-zinc-800">{row.text}</p>
      </div>
      {row.explorerAddress ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 rounded-full border border-zinc-300 bg-transparent px-3 text-[13px] text-zinc-600 hover:border-zinc-400 hover:bg-transparent hover:text-zinc-900"
        >
          <a href={explorerAddressUrl(row.explorerAddress)} target="_blank" rel="noreferrer">
            <ExternalLink className="size-3.5" />
            {m.common.explorer}
          </a>
        </Button>
      ) : null}
    </div>
  )
}

export function BountyProtectionCard({ condition }: { condition: ProtectionCondition }) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-zinc-200 p-5">
      <h3 className="text-[17px] leading-6 font-semibold text-zinc-900">{condition.title}</h3>
      <p className="mt-2 text-[15px] leading-[24px] font-normal text-zinc-600">{condition.summary}</p>
      <div className="mt-6 flex flex-col gap-6">
        {condition.rows.map((row) => (
          <ProtectionRowItem key={row.id} row={row} />
        ))}
      </div>
    </div>
  )
}
