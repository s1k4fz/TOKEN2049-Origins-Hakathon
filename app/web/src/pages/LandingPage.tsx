import {
  LandingFooter,
  LandingHero,
  LandingHowItWorks,
  LandingNav,
  LandingProtocols,
  LandingVerdict,
} from '@/features/landing'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingVerdict />
        <LandingProtocols />
      </main>
      <LandingFooter />
    </div>
  )
}
