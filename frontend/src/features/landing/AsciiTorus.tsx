import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const COLS = 68
const ROWS = 30
const SHADES = '.,-~:;=!*#$@'
const FRAME_MS = 1000 / 30

/** donut.c 的环面投影：按亮度从 SHADES 里取字符。 */
function renderFrame(a: number, b: number): string {
  const output = new Array<string>(COLS * ROWS).fill(' ')
  const depth = new Float32Array(COLS * ROWS)
  const [sinA, cosA, sinB, cosB] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b)]

  for (let theta = 0; theta < Math.PI * 2; theta += 0.07) {
    const [sinT, cosT] = [Math.sin(theta), Math.cos(theta)]
    for (let phi = 0; phi < Math.PI * 2; phi += 0.02) {
      const [sinP, cosP] = [Math.sin(phi), Math.cos(phi)]
      const circleX = cosT + 2
      const inverseZ = 1 / (sinP * circleX * sinA + sinT * cosA + 5)
      const t = sinP * circleX * cosA - sinT * sinA
      const x = Math.floor(COLS / 2 + 30 * inverseZ * (cosP * circleX * cosB - t * sinB))
      const y = Math.floor(ROWS / 2 + 15 * inverseZ * (cosP * circleX * sinB + t * cosB))
      const index = x + COLS * y
      const luminance = Math.floor(
        8 * ((sinT * sinA - sinP * cosT * cosA) * cosB - sinP * cosT * sinA - sinT * cosA - cosP * cosT * sinB)
      )
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS && inverseZ > depth[index]) {
        depth[index] = inverseZ
        output[index] = SHADES[Math.max(luminance, 0)] ?? '.'
      }
    }
  }

  let frame = ''
  for (let row = 0; row < ROWS; row += 1) frame += `${output.slice(row * COLS, (row + 1) * COLS).join('')}\n`
  return frame
}

export function AsciiTorus({ className }: { className?: string }) {
  const preRef = useRef<HTMLPreElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const pre = preRef.current
    if (!pre) return undefined
    pre.textContent = renderFrame(1, 0.6)
    if (reducedMotion) return undefined

    let visible = true
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(pre)

    let frameId = 0
    let last = 0
    let a = 1
    let b = 0.6
    const tick = (time: number) => {
      frameId = requestAnimationFrame(tick)
      if (!visible || time - last < FRAME_MS) return
      last = time
      a += 0.035
      b += 0.018
      pre.textContent = renderFrame(a, b)
    }
    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [reducedMotion])

  return (
    <pre
      ref={preRef}
      aria-hidden
      className={cn('font-mono text-[11.5px] leading-[12.5px] whitespace-pre select-none', className)}
    />
  )
}
