import { Info, ShieldCheck, Telescope, type LucideIcon } from 'lucide-react'

export type CalloutType = 'requirement' | 'why' | 'note'

interface CalloutTheme {
  icon: LucideIcon
  /** 强调色：竖条、图标、标签共用 */
  color: string
}

export const calloutThemes: Record<CalloutType, CalloutTheme> = {
  requirement: { icon: ShieldCheck, color: '#2F6F5E' },
  why: { icon: Telescope, color: '#0047BB' },
  note: { icon: Info, color: '#62558A' },
}
