export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="my-4">
      {caption ? <figcaption className="mb-1.5 text-[12.5px] text-zinc-400">{caption}</figcaption> : null}
      <pre className="overflow-x-auto rounded-xl bg-zinc-100 px-4 py-3 font-mono text-[13px] leading-6 text-zinc-800">
        <code>{code}</code>
      </pre>
    </figure>
  )
}
