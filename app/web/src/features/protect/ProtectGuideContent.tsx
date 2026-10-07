import type { ReactNode } from 'react'
import { CalloutCard } from '@/components/CalloutCard'
import { CodeBlock } from '@/components/CodeBlock'
import { useMessages } from '@/hooks/useMessages'

const GUARDIAN_SNIPPET = `pub struct Vault {
    pub paused: bool,
    pub guardian: Pubkey, // the SilentClaim bounty account
    // ...your existing state
}

fn pause(vault: &mut Vault, signer: &AccountInfo) -> ProgramResult {
    if !signer.is_signer || signer.key != &vault.guardian {
        return Err(ProgramError::MissingRequiredSignature);
    }
    vault.paused = true;
    Ok(())
}`

const BOUNTY_ACCOUNT_SNIPPET = `const [bountyAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from('bounty')],
  BOUNTY_PROGRAM_ID,
)
// pass bountyAccount as the guardian when you initialize the vault`

const REGISTER_SNIPPET = `register(
  threshold = 1 SOL,   // invariant: vault balance must stay ≥ threshold
  amount    = 10 SOL,  // locked in the bounty account until paid or cancelled
)`

function GuideStep({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="flex items-baseline gap-3 text-[22px] leading-8 font-semibold tracking-tight text-zinc-950">
        <span className="text-zinc-400">{index}</span>
        {title}
      </h2>
      <div className="mt-3 text-[16px] leading-[28px] text-zinc-700">{children}</div>
    </section>
  )
}

/** 文案里用反引号包住的片段渲染成行内代码。 */
function InlineCodeText({ text }: { text: string }) {
  return text.split('`').map((part, index) =>
    index % 2 === 1 ? (
      <code key={index} className="font-mono text-[14px]">
        {part}
      </code>
    ) : (
      part
    )
  )
}

/** 项目方接入指南：三步把程序接入 SilentClaim。 */
export function ProtectGuideContent() {
  const m = useMessages()
  const text = m.protect

  return (
    <div>
      <p className="text-[17px] leading-[30px] text-zinc-700">{text.intro}</p>

      <div className="mt-10">
        <GuideStep index={1} title={text.step1Title}>
          <p>
            <InlineCodeText text={text.step1Body} />
          </p>
          <CodeBlock caption="programs/your_vault/src/lib.rs" code={GUARDIAN_SNIPPET} />
          <CalloutCard type="requirement">
            <p className="text-[15px] leading-[26px] text-zinc-700">{text.step1Callout}</p>
          </CalloutCard>
        </GuideStep>

        <GuideStep index={2} title={text.step2Title}>
          <p>{text.step2Body}</p>
          <CodeBlock code={BOUNTY_ACCOUNT_SNIPPET} />
          <CalloutCard type="why">
            <p className="text-[15px] leading-[26px] text-zinc-700">{text.step2Callout}</p>
          </CalloutCard>
        </GuideStep>

        <GuideStep index={3} title={text.step3Title}>
          <p>
            <InlineCodeText text={text.step3Body} />
          </p>
          <CodeBlock code={REGISTER_SNIPPET} />
          <CalloutCard type="note">
            <p className="text-[15px] leading-[26px] text-zinc-700">{text.step3Callout}</p>
          </CalloutCard>
        </GuideStep>
      </div>
    </div>
  )
}
