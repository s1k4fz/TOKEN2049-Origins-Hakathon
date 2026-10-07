import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const CELL = 7
const FONT_SIZE = 18

/** 把文字栅格化成点阵：先画到离屏 canvas，再按像素取样决定每个点亮不亮。 */
function rasterize(text: string): { cols: number; rows: number; lit: boolean[] } {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return { cols: 0, rows: 0, lit: [] }
  context.font = `700 ${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`
  const cols = Math.ceil(context.measureText(text).width) + 2
  const rows = FONT_SIZE + 4
  canvas.width = cols
  canvas.height = rows
  context.font = `700 ${FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`
  context.textBaseline = 'middle'
  context.fillStyle = '#000'
  context.fillText(text, 1, rows / 2 + 1)
  const pixels = context.getImageData(0, 0, cols, rows).data
  const lit = Array.from({ length: cols * rows }, (_, index) => pixels[index * 4 + 3] > 110)
  return { cols, rows, lit }
}

export function DotMatrixText({ text, className }: { text: string; className?: string }) {
  const { cols, rows, lit } = useMemo(() => rasterize(text), [text])

  return (
    <svg
      role="img"
      aria-label={text}
      viewBox={`0 0 ${cols * CELL} ${rows * CELL}`}
      className={cn('h-auto w-full', className)}
    >
      {lit.map((on, index) => {
        const x = (index % cols) * CELL + CELL / 2
        const y = Math.floor(index / cols) * CELL + CELL / 2
        return on ? (
          <circle
            key={index}
            cx={x}
            cy={y}
            r={CELL * 0.36}
            className="landing-dot fill-zinc-900"
            style={{ animationDelay: `${(index * 37) % 4000}ms` }}
          />
        ) : (
          <circle key={index} cx={x} cy={y} r={CELL * 0.12} className="fill-zinc-300" />
        )
      })}
    </svg>
  )
}
