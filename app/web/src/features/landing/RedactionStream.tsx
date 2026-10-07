import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useMessages } from '@/hooks/useMessages'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const GLYPHS = '░▒▓█'
const LINE_LENGTH = 26
const LINES = 7
const TICK_MS = 90

function randomLine(): string {
  return Array.from({ length: LINE_LENGTH }, () => BASE64[Math.floor(Math.random() * BASE64.length)]).join('')
}

const REPORT_FIELDS = [
  ['pre', '1.001 SOL'],
  ['post', '0.001 SOL'],
  ['slot', '508,316,905'],
  ['threshold', '0.500 SOL'],
  ['payout', 'D43…WeS'],
  ['vault', 'GeB…A8c'],
]

/** 左边是攻击交易的 base64，进入飞地后逐字被抹掉，右边只剩 96 字节报告的六个字段。 */
export function RedactionStream() {
  const m = useMessages()
  const reducedMotion = usePrefersReducedMotion()
  const [lines, setLines] = useState(() => Array.from({ length: LINES }, randomLine))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (reducedMotion) return undefined
    const timer = setInterval(() => {
      setTick((value) => value + 1)
      setLines((current) => [...current.slice(1), randomLine()])
    }, TICK_MS * 6)
    return () => clearInterval(timer)
  }, [reducedMotion])

  return (
    <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
        <p className="font-mono text-[11px] tracking-wider text-zinc-400 uppercase">{m.landing.verdict.inputLabel}</p>
        <pre className="mt-3 font-mono text-[12px] leading-[20px] text-zinc-700">
          {lines.map((line, index) => (
            <div key={`${tick}-${index}`} className={index === LINES - 1 ? 'animate-in fade-in-0' : undefined}>
              {line}
            </div>
          ))}
        </pre>
      </div>

      <ArrowRight className="hidden size-4 self-center text-zinc-300 md:block" />

      <div className="landing-dot-grid relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-4 text-zinc-100">
        <p className="font-mono text-[11px] tracking-wider text-zinc-500 uppercase">{m.landing.verdict.enclaveLabel}</p>
        <pre className="mt-3 font-mono text-[12px] leading-[20px] text-zinc-500">
          {lines.map((line, row) => (
            <div key={`${tick}-${row}`}>
              {Array.from(line, (char, col) => {
                const covered = (col + row + tick) % 5 !== 0
                return covered ? GLYPHS[(col * 7 + row * 3 + tick) % GLYPHS.length] : char
              }).join('')}
            </div>
          ))}
        </pre>
        <p className="mt-3 font-mono text-[11px] text-emerald-400">{m.landing.verdict.enclaveStatus}</p>
      </div>

      <ArrowRight className="hidden size-4 self-center text-zinc-300 md:block" />

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4">
        <p className="font-mono text-[11px] tracking-wider text-zinc-400 uppercase">{m.landing.verdict.outputLabel}</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {REPORT_FIELDS.map(([label, value]) => (
            <div key={label} className="rounded-[10px] bg-zinc-100 px-2.5 py-1.5">
              <p className="text-[11px] leading-4 text-zinc-400">{label}</p>
              <p className="truncate font-mono text-[12px] leading-[18px] text-zinc-800">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
