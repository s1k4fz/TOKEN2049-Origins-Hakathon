import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { BookOpen, Home, Languages, Shield, SquarePen } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarItem } from '@/components/SidebarItem'
import { BountySidebarList } from '@/features/bounty'
import { ClaimSidebarList } from '@/features/claim'
import { WalletSidebarItem } from '@/features/wallet'
import { useMessages } from '@/hooks/useMessages'
import { PRODUCT_NAME } from '@/lib/constants'
import { useLocaleStore } from '@/stores/localeStore'

function SidebarHeader({ children }: { children?: ReactNode }) {
  const m = useMessages()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-zinc-100 px-3">
      <Button variant="ghost" size="icon-sm" aria-label={m.nav.home} asChild>
        <Link to="/">
          <Home className="size-4" />
        </Link>
      </Button>
      {children}
    </header>
  )
}

export function AppLayout() {
  const m = useMessages()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)
  const navRef = useRef<HTMLElement>(null)
  const [isScrolledFromTop, setIsScrolledFromTop] = useState(false)
  const handleScroll = useCallback(() => {
    const el = navRef.current
    if (!el) return
    setIsScrolledFromTop(el.scrollTop > 0)
  }, [])

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    handleScroll()
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    document.documentElement.lang = m.meta.htmlLang
  }, [m.meta.htmlLang])

  const navigationSidebarContent = (
    <>
      <div className="sticky top-14 z-10 flex flex-col gap-0.5 bg-zinc-100">
        <SidebarItem icon={SquarePen} label={m.nav.submit} to="/" end />
        <SidebarItem icon={Shield} label={m.nav.bounties} to="/bounties" end />
        <SidebarItem icon={BookOpen} label={m.nav.protect} to="/protect" />
        <div
          className={cn(
            'pointer-events-none h-px w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] transition-opacity duration-150',
            isScrolledFromTop ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      <div className="mt-2 flex flex-col gap-1">
        <BountySidebarList />
        <ClaimSidebarList />
      </div>
    </>
  )

  return (
    <div className="flex h-screen gap-2 overflow-hidden bg-zinc-100 p-2 text-zinc-950 [--sidebar-width:240px]">
      <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col">
        <nav ref={navRef} className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
          <SidebarHeader>
            <span className="text-[13px] font-medium text-zinc-500">{PRODUCT_NAME}</span>
          </SidebarHeader>
          {navigationSidebarContent}
        </nav>
        <div className="flex shrink-0 flex-col gap-0.5 pt-2" title={m.meta.switchAria}>
          <WalletSidebarItem />
          <SidebarItem
            icon={Languages}
            label={m.meta.switchLabel}
            onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
          />
        </div>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
