import { Fragment, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ProgressMarker } from '@/components/ProgressMarker'
import { cn } from '@/lib/utils'
import type { Bounty } from '@/types/bounty'
import { BountyCover } from './BountyCover'

// 240px 宽、15px 字号下约五行，末尾保留省略号和展开按钮。
const COLLAPSED_DESCRIPTION_LENGTH = 110

export type BountySection = 'protection' | 'submissions'

export interface BountySectionItem {
  id: BountySection
  label: string
  markerLabel: string
  progress: number
}

export function BountyDashboardSidebar({
  bounty,
  sections,
  activeSection,
  onSectionChange,
}: {
  bounty: Bounty
  sections: BountySectionItem[]
  activeSection: BountySection
  onSectionChange: (section: BountySection) => void
}) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const isDescriptionLong = bounty.description.length > COLLAPSED_DESCRIPTION_LENGTH

  return (
    <div className="w-60 shrink-0">
      <BountyCover className="size-60 rounded-2xl" />
      <h1 className="mt-5 text-center text-xl font-bold text-zinc-900">{bounty.name}</h1>
      <p className="mt-3 text-left text-[15px] leading-[21px] font-normal text-zinc-600">
        {descriptionExpanded || !isDescriptionLong
          ? bounty.description
          : `${bounty.description.slice(0, COLLAPSED_DESCRIPTION_LENGTH)}…`}
        {isDescriptionLong ? (
          <button
            type="button"
            aria-label={descriptionExpanded ? 'Collapse description' : 'Expand description'}
            onClick={() => setDescriptionExpanded((current) => !current)}
            className="float-right mt-[1.5px] ml-1 flex h-[18px] w-[26px] items-center justify-center rounded-full border border-zinc-300 text-zinc-500 hover:text-zinc-800"
          >
            {descriptionExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        ) : null}
      </p>
      <div className="mt-6 flex flex-col">
        {sections.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && <div className="ml-4 h-6 w-px -translate-x-1/2 bg-zinc-300" />}
            <div className="flex items-center gap-3">
              <ProgressMarker label={section.markerLabel} progress={section.progress} />
              <button
                type="button"
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'min-w-0 flex-1 -translate-y-px truncate rounded-full px-3 text-left text-[15px] leading-8 font-normal transition-colors',
                  activeSection === section.id
                    ? 'bg-zinc-200/55 text-zinc-900'
                    : 'text-zinc-800 hover:bg-zinc-200/30'
                )}
              >
                {section.label}
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
