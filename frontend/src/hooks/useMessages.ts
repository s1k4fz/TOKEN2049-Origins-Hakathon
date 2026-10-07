import { messagesByLocale, type Messages } from '@/lib/i18n'
import { useLocaleStore } from '@/stores/localeStore'

export function useMessages(): Messages {
  return messagesByLocale[useLocaleStore((state) => state.locale)]
}
