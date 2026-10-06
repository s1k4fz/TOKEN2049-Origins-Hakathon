import { useLayoutEffect, useRef, type ReactNode } from 'react'

/** 内容增长时平滑过渡高度（胶囊逐个出现、日志逐行追加）。 */
export function SmoothHeight({
  children,
  contentClassName,
}: {
  children: ReactNode
  contentClassName?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) {
      return undefined
    }
    const updateHeight = () => {
      container.style.height = `${content.getBoundingClientRect().height}px`
    }
    updateHeight()
    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(content)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-0 overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
    >
      <div ref={contentRef} className={contentClassName}>
        {children}
      </div>
    </div>
  )
}
