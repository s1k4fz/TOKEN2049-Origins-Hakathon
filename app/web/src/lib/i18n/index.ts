import { en, type Messages } from './en'
import { zh } from './zh'

export type Locale = 'en' | 'zh'

export const messagesByLocale: Record<Locale, Messages> = { en, zh }

export function detectLocale(): Locale {
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export type { Messages }
