import { useMessages } from '@/hooks/useMessages'

/** 页面右上角的网络与 CRE 运行模式胶囊。 */
export function NetworkStatus() {
  const m = useMessages()

  return (
    <div className="flex items-center gap-2">
      {[m.network.cluster, m.network.creMode].map((label) => (
        <span
          key={label}
          className="flex h-7 items-center rounded-full border border-zinc-200 bg-transparent px-2.5 text-[12.5px] font-medium whitespace-nowrap text-zinc-600"
        >
          {label}
        </span>
      ))}
    </div>
  )
}
