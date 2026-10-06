import { CRE_MODE_LABEL, NETWORK_LABEL } from '@/lib/constants'

/** 页面右上角的网络与 CRE 运行模式胶囊。 */
export function NetworkStatus() {
  return (
    <div className="flex items-center gap-2">
      {[NETWORK_LABEL, CRE_MODE_LABEL].map((label) => (
        <span
          key={label}
          className="flex h-7 items-center rounded-full border border-zinc-200 bg-transparent px-2.5 text-[12.5px] font-medium text-zinc-600"
        >
          {label}
        </span>
      ))}
    </div>
  )
}
