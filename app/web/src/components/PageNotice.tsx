/** 页面壳里的整屏提示（加载失败 / 不存在）。 */
export function PageNotice({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-zinc-200/80 bg-zinc-50 px-4 text-center text-sm text-zinc-400">
      {message}
    </div>
  )
}
