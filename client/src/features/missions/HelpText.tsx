import type { ReactNode } from 'react';
import type { Session } from '@/state/store';

const link = 'font-medium text-accent underline underline-offset-2';

function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
    </a>
  );
}

function Capsule({ src, ringed }: { src: string; ringed?: boolean }) {
  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className={`mx-0.5 inline-block size-5 align-text-bottom ${ringed ? 'rounded-full ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
    />
  );
}

/** What legacy showed in an empty Completed list, reworded for this layout. */
export function HelpText({ session }: { session: Session }) {
  const { title, mode, assets } = session;
  const capsule = assets.active(`shared/gacha/${mode === 'main' ? 'wood' : 'plastic'}.png`);

  return (
    <div className="space-y-3 px-4 pb-4 text-sm">
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Tap a <strong>Current</strong> mission to complete it.
        </li>
        <li>
          Tap a <strong>Completed</strong> mission to move it back to Current.
        </li>
        <li>
          Tap the capsule <Capsule src={capsule} /> beside a mission to open its <strong>calculator</strong>. A ringed capsule{' '}
          <Capsule src={capsule} ringed /> means the <strong>rewards are scripted</strong>.
        </li>
        <li>
          Use the arrow in the Completed header to <strong>hide</strong> this list.
        </li>
        <li>
          Questions? See the <External href={title.socialHelpUrls.faq}>Game Guide/FAQ</External>,{' '}
          <External href={title.socialHelpUrls.discord}>Discord</External> or{' '}
          <External href={title.socialHelpUrls.reddit}>Reddit</External>.
        </li>
      </ul>
      <p>
        For advanced offline calculations, try <External href="https://stiwen87.github.io">this page</External> (credit to Stiwen).
      </p>
      {!title.isAges && (
        <p>
          <External href="https://idlegametools.com/adcom-leaderboard/">Leaderboard tracker</External>: see your exact rank in events
          past and present and keep tabs on your division leaderboards.
        </p>
      )}
    </div>
  );
}
