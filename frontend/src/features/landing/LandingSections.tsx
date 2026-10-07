import type { ReactNode } from 'react'
import { ArrowRight, CircleCheckBig } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useMessages } from '@/hooks/useMessages'
import { DotMatrixText } from './DotMatrixText'
import { RedactionStream } from './RedactionStream'

const STEP_ART = [
  String.raw`  +-----------------+
  | AQABBz9f...k3Q= |
  | ############### |
  | ############### |
  +--------+--------+
           |
       [ sealed ]`,
  String.raw`  +--- enclave ----+
  | pre    1.001 ##|
  | sim    ::::::::|
  | post   0.001 ..|
  +----------------+
   invariant: vault
   >= 0.5  ->  false`,
  String.raw`  report (96 B)
       |
       v
   on_report --+-- pause()
               |
               +-- pay(0.1)
           [ settled ]`,
]

const STACK = ['Chainlink CRE', 'Solana', 'AWS Nitro TEE', 'Reown AppKit']

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="max-w-[40rem]">
      <p className="font-mono text-[12px] tracking-wider text-zinc-400 uppercase">{eyebrow}</p>
      <h2 className="mt-3 text-[34px] leading-[1.15] font-semibold tracking-[-0.025em] text-zinc-950">{title}</h2>
      {children ? <p className="mt-4 text-[16px] leading-[27px] text-zinc-600">{children}</p> : null}
    </div>
  )
}

export function LandingHowItWorks() {
  const m = useMessages()
  const text = m.landing.how

  return (
    <section id="how" className="mx-auto w-full max-w-[1200px] scroll-mt-20 px-6 py-24">
      <SectionHeading eyebrow={text.eyebrow} title={text.title} />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {text.steps.map((step, index) => (
          <article key={step.title} className="flex flex-col rounded-[22px] border border-zinc-200/80 bg-white p-6">
            <pre
              aria-hidden
              className="landing-dots h-[150px] overflow-hidden rounded-[14px] bg-zinc-50 p-4 font-mono text-[11.5px] leading-[17px] text-zinc-500"
            >
              {STEP_ART[index]}
            </pre>
            <p className="mt-6 font-mono text-[12px] text-zinc-400">0{index + 1}</p>
            <h3 className="mt-1 text-[20px] font-semibold tracking-tight text-zinc-950">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-[25px] text-zinc-600">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function LandingVerdict() {
  const m = useMessages()
  const text = m.landing.verdict

  return (
    <section id="privacy" className="scroll-mt-20 border-y border-zinc-200/70 bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-24">
        <SectionHeading eyebrow={text.eyebrow} title={text.title}>
          {text.body}
        </SectionHeading>
        <div className="mt-12">
          <RedactionStream />
        </div>
      </div>
    </section>
  )
}

export function LandingProtocols() {
  const m = useMessages()
  const text = m.landing.protocols

  return (
    <section id="protocols" className="mx-auto w-full max-w-[1200px] scroll-mt-20 px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading eyebrow={text.eyebrow} title={text.title}>
            {text.body}
          </SectionHeading>
          <ul className="mt-8 flex flex-col gap-4">
            {text.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[16px] leading-6 text-zinc-800">
                <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-zinc-950" />
                {point}
              </li>
            ))}
          </ul>
          <Button
            asChild
            variant="outline"
            className="mt-8 h-10 gap-2 rounded-full border-zinc-300 bg-transparent px-4 font-normal text-zinc-800 hover:bg-zinc-100"
          >
            <Link to="/protect">
              {text.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-[22px] border border-zinc-900 bg-zinc-950 p-6 font-mono text-[13px] leading-[22px] text-zinc-300">
          <span className="text-zinc-500">{'// your program: one guardian field, one pause hook\n'}</span>
          {'pub struct Vault {\n    pub paused: bool,\n    pub guardian: Pubkey, '}
          <span className="text-emerald-400">{'// = bounty PDA'}</span>
          {'\n}\n\n'}
          <span className="text-zinc-500">{'// lock the bounty\n'}</span>
          {'register(\n    threshold = 0.5 SOL,\n    amount    = 0.1 SOL,\n)'}
        </pre>
      </div>
    </section>
  )
}

export function LandingFooter() {
  const m = useMessages()
  const text = m.landing.footer

  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-[28rem] text-[34px] leading-[1.15] font-semibold tracking-[-0.025em] text-zinc-950">
            {text.title}
          </h2>
          <Button
            asChild
            className="h-11 gap-2 rounded-full bg-zinc-950 px-5 text-[15px] font-normal text-white hover:bg-zinc-800"
          >
            <Link to="/submit">
              {text.cta}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        <DotMatrixText text="SILENTCLAIM" className="mt-16" />
        <div className="mt-10 flex flex-col gap-4 border-t border-zinc-200 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] tracking-wider text-zinc-400 uppercase">{m.landing.stack}</span>
            {STACK.map((item) => (
              <span
                key={item}
                className="rounded-full border border-zinc-200 px-2.5 py-1 font-mono text-[12px] text-zinc-600"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="max-w-[34rem] text-[12.5px] leading-5 text-zinc-400">{text.note}</p>
        </div>
      </div>
    </footer>
  )
}
