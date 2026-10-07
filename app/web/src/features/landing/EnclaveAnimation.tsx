import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const CELL_W = 9
const CELL_H = 15
const FONT = '600 13px ui-monospace, SFMono-Regular, Menlo, monospace'
const SHADES = '.,-~:;=!*#$@'
const SCRAMBLE = '!<>-_\\/[]{}=+*^?#ABCDEF0123456789'
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const FILL = '@#$8&%'
const LOOP_MS = 10_000
const FRAME_MS = 1000 / 30

// 一轮的时间线（毫秒）：交易飞入 → 模拟加速 → 冲击波解码成金额 → 停留 → 溶解回环面。
const INTAKE_END = 3200
const SIMULATE_END = 5200
const DECODE_END = 6300
const HOLD_END = 8600

interface Particle {
  fromX: number
  fromY: number
  bend: number
  start: number
  duration: number
  char: string
}

const random = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const easeIn = (t: number) => t * t * t
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

/** donut.c 投影：返回每格的亮度（-1 表示空）。 */
function renderTorus(cols: number, rows: number, a: number, b: number, out: Float32Array, depth: Float32Array) {
  out.fill(-1)
  depth.fill(0)
  const kx = Math.min(cols * 0.5, rows * (CELL_H / CELL_W) * 0.62)
  const ky = kx * (CELL_W / CELL_H)
  const [sinA, cosA, sinB, cosB] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b)]
  for (let theta = 0; theta < Math.PI * 2; theta += 0.045) {
    const [sinT, cosT] = [Math.sin(theta), Math.cos(theta)]
    for (let phi = 0; phi < Math.PI * 2; phi += 0.012) {
      const [sinP, cosP] = [Math.sin(phi), Math.cos(phi)]
      const circleX = cosT + 2
      const inverseZ = 1 / (sinP * circleX * sinA + sinT * cosA + 5)
      const t = sinP * circleX * cosA - sinT * sinA
      const x = Math.floor(cols / 2 + kx * inverseZ * (cosP * circleX * cosB - t * sinB))
      const y = Math.floor(rows / 2 + ky * inverseZ * (cosP * circleX * sinB + t * cosB))
      if (x < 0 || x >= cols || y < 0 || y >= rows) continue
      const index = x + cols * y
      if (inverseZ <= depth[index]) continue
      depth[index] = inverseZ
      const luminance =
        (sinT * sinA - sinP * cosT * cosA) * cosB - sinP * cosT * sinA - sinT * cosA - cosP * cosT * sinB
      out[index] = clamp01(luminance / 1.5)
    }
  }
}

/** 文字栅格化成格子掩码；格子是竖长的，所以先把字压扁再采样。 */
function rasterizeText(text: string, cols: number, rows: number): Uint8Array<ArrayBuffer> {
  const canvas = document.createElement('canvas')
  canvas.width = cols
  canvas.height = rows
  const context = canvas.getContext('2d')
  const mask = new Uint8Array(cols * rows)
  if (!context) return mask
  const squash = CELL_W / CELL_H
  const lines = text.split(' ')
  const font = (size: number) => `900 ${size}px Inter, ui-sans-serif, system-ui, sans-serif`
  context.font = font(100)
  const widest = Math.max(...lines.map((line) => context.measureText(line).width))
  const lineHeight = 0.92
  const size = Math.min((cols * 0.9 * 100) / widest, (rows * 0.86) / squash / (lines.length * lineHeight))
  context.setTransform(1, 0, 0, squash, 0, 0)
  context.font = font(size)
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#000'
  const top = rows / 2 / squash - ((lines.length - 1) * size * lineHeight) / 2
  lines.forEach((line, index) => context.fillText(line, cols / 2, top + index * size * lineHeight))
  const pixels = context.getImageData(0, 0, cols, rows).data
  for (let i = 0; i < mask.length; i += 1) mask[i] = pixels[i * 4 + 3] > 100 ? 1 : 0
  return mask
}

export function EnclaveAnimation({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!container || !canvas || !context) return undefined

    let cols = 0
    let rows = 0
    let torus = new Float32Array(0)
    let depth = new Float32Array(0)
    let mask: Uint8Array<ArrayBuffer> = new Uint8Array(0)
    let noise = new Float32Array(0)

    const resize = () => {
      const rect = container.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      cols = Math.max(20, Math.floor(rect.width / CELL_W))
      rows = Math.max(12, Math.floor(rect.height / CELL_H))
      canvas.width = cols * CELL_W * ratio
      canvas.height = rows * CELL_H * ratio
      canvas.style.width = `${cols * CELL_W}px`
      canvas.style.height = `${rows * CELL_H}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      torus = new Float32Array(cols * rows)
      depth = new Float32Array(cols * rows)
      mask = rasterizeText(text, cols, rows)
      noise = Float32Array.from({ length: cols * rows }, (_, i) => random(i + 1))
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    let particles: Particle[] = []
    let spawned = 0
    let lastLoop = -1

    const draw = (now: number) => {
      const time = now % LOOP_MS
      const loop = Math.floor(now / LOOP_MS)
      if (loop !== lastLoop) {
        lastLoop = loop
        particles = []
        spawned = 0
      }

      const simulating = clamp01((time - INTAKE_END) / (SIMULATE_END - INTAKE_END))
      const spin = now / 1000
      const speed = 1 + simulating * simulating * 6
      renderTorus(cols, rows, 1 + spin * 0.9 * speed, 0.6 + spin * 0.45 * speed, torus, depth)

      // 文字出现的进度：解码阶段 0→1，停留为 1，溶解阶段 1→0。
      const reveal =
        time < SIMULATE_END
          ? 0
          : time < DECODE_END
            ? clamp01((time - SIMULATE_END) / (DECODE_END - SIMULATE_END))
            : time < HOLD_END
              ? 1
              : 1 - clamp01((time - HOLD_END) / (LOOP_MS - HOLD_END))
      const centerX = cols / 2
      const centerY = rows / 2
      const maxRadius = Math.hypot(centerX, centerY * (CELL_H / CELL_W))
      const wave = time >= SIMULATE_END && time < DECODE_END + 300 ? clamp01((time - SIMULATE_END) / 900) * maxRadius : -1
      const scanRow = time >= INTAKE_END && time < SIMULATE_END ? Math.floor(((time - INTAKE_END) / 500) % 1 * rows) : -1

      context.clearRect(0, 0, cols * CELL_W, rows * CELL_H)
      context.font = FONT
      context.textBaseline = 'top'

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = x + y * cols
          const n = noise[index]
          const luminance = torus[index]
          const inText = mask[index] === 1
          const distance = Math.hypot(x - centerX, (y - centerY) * (CELL_H / CELL_W))
          const nearWave = wave >= 0 && Math.abs(distance - wave) < 2.2
          let char = ''
          let alpha = 0
          let accent = false

          if (nearWave) {
            char = SCRAMBLE[Math.floor(n * SCRAMBLE.length + now / 40) % SCRAMBLE.length]
            alpha = 0.9
            accent = true
          } else if (reveal > 0 && n < reveal) {
            if (inText) {
              const settling = reveal < 1 && n > reveal - 0.12
              char = settling
                ? SCRAMBLE[Math.floor(n * 97 + now / 50) % SCRAMBLE.length]
                : FILL[Math.floor(n * FILL.length)]
              alpha = 1
            } else if (n < 0.04) {
              char = '.'
              alpha = 0.25
            }
          } else if (luminance >= 0) {
            char = SHADES[Math.min(SHADES.length - 1, Math.floor(luminance * SHADES.length))]
            alpha = 0.28 + luminance * 0.72
            if (y === scanRow || y === scanRow - 1) {
              char = '▓▒░█'[Math.floor(n * 4)]
              alpha = 0.95
            }
          }
          if (!char) continue
          context.fillStyle = accent ? `rgba(16, 185, 129, ${alpha})` : `rgba(9, 9, 11, ${alpha})`
          context.fillText(char, x * CELL_W, y * CELL_H)
        }
      }

      if (time < INTAKE_END) {
        while (spawned < Math.floor(time / 28)) {
          spawned += 1
          const angle = random(spawned * 3.1 + loop) * Math.PI * 2
          const radius = Math.max(cols, rows * 2) * 0.62
          particles.push({
            fromX: centerX + Math.cos(angle) * radius,
            fromY: centerY + Math.sin(angle) * radius * (CELL_W / CELL_H),
            bend: (random(spawned * 7.7) - 0.5) * 0.9,
            start: time,
            duration: 900 + random(spawned * 1.3) * 700,
            char: BASE64[Math.floor(random(spawned * 5.9) * BASE64.length)],
          })
        }
      }
      for (const particle of particles) {
        const t = clamp01((time - particle.start) / particle.duration)
        if (t >= 1 || time >= SIMULATE_END) continue
        const eased = easeIn(t)
        const dx = centerX - particle.fromX
        const dy = centerY - particle.fromY
        const px = particle.fromX + dx * eased - dy * particle.bend * Math.sin(Math.PI * t)
        const py = particle.fromY + dy * eased + dx * particle.bend * Math.sin(Math.PI * t) * (CELL_W / CELL_H)
        context.fillStyle = `rgba(9, 9, 11, ${0.35 + 0.65 * (1 - t)})`
        context.fillText(particle.char, px * CELL_W, py * CELL_H)
      }
    }

    if (reducedMotion) {
      draw(HOLD_END - 1)
      return () => resizeObserver.disconnect()
    }

    let visible = true
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    intersection.observe(container)

    let frameId = 0
    let last = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick)
      if (!visible || now - last < FRAME_MS) return
      last = now
      draw(now - startedAt)
    }
    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      intersection.disconnect()
      resizeObserver.disconnect()
    }
  }, [reducedMotion, text])

  return (
    <div ref={containerRef} aria-hidden className={cn('relative flex items-center justify-center', className)}>
      <canvas ref={canvasRef} className="select-none" />
    </div>
  )
}
