import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Home, LayoutDashboard } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SidebarItem } from '@/components/SidebarItem'

function SidebarHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between bg-zinc-100 px-3">
      <Button variant="ghost" size="icon-sm" aria-label="Home" asChild>
        <Link to="/">
          <Home className="size-4" />
        </Link>
      </Button>
      {children}
    </header>
  )
}

export function AppLayout() {
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

  const navigationSidebarContent = (
    <div className="sticky top-14 z-10 flex flex-col gap-0.5 bg-zinc-100">
      <SidebarItem icon={LayoutDashboard} label="Overview" to="/" end />
      <div
        className={cn(
          'pointer-events-none h-px w-full shadow-[0_1px_2px_0_rgba(0,0,0,0.04)] transition-opacity duration-150',
          isScrolledFromTop ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  )

  return (
    <div className="flex h-screen gap-2 overflow-hidden bg-zinc-100 p-2 text-zinc-950 [--sidebar-width:240px]">
      <aside className="flex h-full w-[var(--sidebar-width)] shrink-0 flex-col">
        <nav ref={navRef} className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
          <SidebarHeader />
          {navigationSidebarContent}
        </nav>
      </aside>

      <main className="relative min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
