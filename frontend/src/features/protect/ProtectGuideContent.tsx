import type { ReactNode } from 'react'
import { CalloutCard } from '@/components/CalloutCard'
import { CodeBlock } from '@/components/CodeBlock'

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

/** 项目方接入指南：三步把程序接入 SilentClaim。 */
export function ProtectGuideContent() {
  return (
    <div>
      <p className="text-[17px] leading-[30px] text-zinc-700">
        Lock a bounty, define what counts as broken, and let whitehats prove it without ever touching your funds. A
        valid report pauses your program and pays the whitehat in the same transaction.
      </p>

      <div className="mt-10">
        <GuideStep index={1} title="Add a pause hook">
          <p>
            Your program needs a <code className="font-mono text-[14px]">guardian</code> field and a{' '}
            <code className="font-mono text-[14px]">pause</code> instruction that only the guardian can call. Every
            state-changing instruction should refuse to run while paused.
          </p>
          <CodeBlock caption="programs/your_vault/src/lib.rs" code={GUARDIAN_SNIPPET} />
          <CalloutCard type="requirement">
            <p className="text-[15px] leading-[26px] text-zinc-700">
              This is the only change to your program. SilentClaim never holds an upgrade key or an admin role.
            </p>
          </CalloutCard>
        </GuideStep>

        <GuideStep index={2} title="Make the bounty account your guardian">
          <p>The bounty account is a program-derived address, so no private key can sign for it.</p>
          <CodeBlock code={BOUNTY_ACCOUNT_SNIPPET} />
          <CalloutCard type="why">
            <p className="text-[15px] leading-[26px] text-zinc-700">
              Only a DON-signed report can make the bounty program pause you, and it can only do so while paying the
              whitehat. Nobody can pause your program for free.
            </p>
          </CalloutCard>
        </GuideStep>

        <GuideStep index={3} title="Register the bounty">
          <p>
            Call <code className="font-mono text-[14px]">register</code> from your admin key. The program checks that
            the guardian is the bounty account, the vault is live, and the current balance is above the threshold.
          </p>
          <CodeBlock code={REGISTER_SNIPPET} />
          <CalloutCard type="note">
            <p className="text-[15px] leading-[26px] text-zinc-700">
              To withdraw the bounty later, request a cancel and wait 7 days. The bounty stays claimable during that
              time, so whitehats can trust it is really there.
            </p>
          </CalloutCard>
        </GuideStep>
      </div>
    </div>
  )
}
