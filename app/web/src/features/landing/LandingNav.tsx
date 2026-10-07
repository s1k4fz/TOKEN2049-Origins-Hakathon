import { Languages } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { PRODUCT_NAME } from '@/lib/constants'
import { useLocaleStore } from '@/stores/localeStore'

/** 3×3 点阵标志：中间一点是飞地。 */
export function LogoMark() {
  return (
    <span aria-hidden className="grid size-5 grid-cols-3 gap-[3px]">
      {Array.from({ length: 9 }, (_, index) => (
        <span key={index} className={index === 4 ? 'rounded-full bg-zinc-950' : 'rounded-full bg-zinc-300'} />
      ))}
    </span>
  )
}

export function LandingNav() {
  const m = useMessages()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const links = [
    { href: '#how', label: m.landing.nav.how },
    { href: '#privacy', label: m.landing.nav.privacy },
    { href: '#protocols', label: m.landing.nav.protocols },
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-zinc-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-6 px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight text-zinc-950">{PRODUCT_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-200/60 hover:text-zinc-950"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            aria-label={m.meta.switchAria}
            onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
            className="h-9 gap-1.5 rounded-full px-3 text-[14px] font-normal text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950"
          >
            <Languages className="size-4" />
            {m.meta.switchLabel}
          </Button>
          <Button asChild className="h-9 rounded-full bg-zinc-950 px-4 font-normal text-white hover:bg-zinc-800">
            <Link to="/submit">{m.landing.nav.launch}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
